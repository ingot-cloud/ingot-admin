<template>
  <in-detail-drawer
    v-model="open"
    v-model:tab="tab"
    v-model:editing="editing"
    title="部门详情"
    edit-label="编辑基本信息"
    :saving="saving"
    :loading="saving"
    @edit="privateOnEdit"
    @cancel="privateOnCancel"
    @save="privateOnSave"
  >
    <template #identity>
      <in-detail-identity :name="displayName" :src="deptDrawerHeaderAvatar" :editable="false">
        <template #status>
          <in-common-status-tag :status="editForm.status" />
        </template>
        <template #more>
          <el-dropdown
            trigger="click"
            placement="bottom-end"
            popper-class="in-dropdown"
            @command="privateOnMoreCommand"
          >
            <in-button link type="primary">更多操作</in-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="delete">删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </in-detail-identity>
    </template>

    <in-biz-tab-panel title="基本信息" name="basic">
      <div class="dept-detail-body">
        <in-description-list v-if="!editing">
          <in-description-item label="部门名称" :value="editForm.name" />
          <in-description-item label="部门 ID" :value="deptId" />
          <in-description-item label="上级部门" :value="parentName" />
          <in-description-item label="部门主管" :value="managerNames" />
          <in-description-item label="状态">
            <in-common-status-tag :status="editForm.status" />
          </in-description-item>
        </in-description-list>
        <el-form
          v-else
          ref="editFormRef"
          label-width="100px"
          label-position="top"
          :model="editForm"
          :rules="rules"
        >
          <el-form-item label="部门名称" prop="name">
            <el-input v-model="editForm.name" clearable placeholder="请输入部门名称" />
          </el-form-item>
          <el-form-item label="部门 ID">
            <span>{{ deptId }}</span>
          </el-form-item>
          <el-form-item label="上级部门" prop="pid">
            <el-tree-select
              w-full
              v-model="editForm.pid"
              :data="selectData"
              :node-key="TreeKeyAndProps.nodeKey"
              :value-key="TreeKeyAndProps.nodeKey"
              :props="TreeKeyAndProps.props"
              :check-strictly="true"
            />
          </el-form-item>
          <el-form-item label="部门主管">
            <el-select
              v-model="editForm.managerUsers"
              multiple
              filterable
              remote
              reserve-keyword
              placeholder="部门主管"
              :remote-method="privateQueryUsers"
              :loading="queryLoading"
            >
              <template #label="{ value }">
                <div flex flex-row items-center gap-2>
                  <el-image
                    v-if="value.avatar"
                    class="w-20px h-20px"
                    :src="value.avatar"
                    fit="cover"
                  />
                  <span>{{ value.nickname }}</span>
                </div>
              </template>
              <el-option
                v-for="item in userList"
                :key="item.id"
                :label="item.nickname"
                :value="item"
              >
                <div flex flex-row items-center gap-2>
                  <el-image
                    v-if="item.avatar"
                    class="w-20px h-20px"
                    :src="item.avatar"
                    fit="cover"
                  />
                  <span>{{ item.nickname }}</span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-radio-group v-model="editForm.status">
              <el-radio-button :value="CommonStatus.Enable">
                {{ statusEnum.getTagText(CommonStatus.Enable).text }}
              </el-radio-button>
              <el-radio-button :value="CommonStatus.Lock">
                {{ statusEnum.getTagText(CommonStatus.Lock).text }}
              </el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </div>
    </in-biz-tab-panel>
  </in-detail-drawer>
</template>
<script setup lang="ts">
import {
  TreeKeyAndProps,
  type DeptTreeNode,
  type DeptTreeNodeWithManagerVO,
  type DeptWithManagerDTO,
  type SimpleUserVO,
} from "@/models";
import { CommonStatus, CommonStatusEnumExtArray } from "@/models/enums";
import { RemoveDeptAPI, UpdateDeptAPI } from "@/api/org/dept";
import { UserPageAPI } from "@/api/org/user";
import {
  Confirm,
  Message,
  copyParamsWithKeys,
  deptDrawerHeaderAvatar,
  getDiffWithIgnore,
  useDetailEditSession,
} from "@ingot/admin-core";

const formKeys = ["pid", "name", "status", "managerUsers"] as const;

const emptyForm = {
  pid: undefined as string | undefined,
  name: undefined as string | undefined,
  status: CommonStatus.Enable as CommonStatus | undefined,
  managerUsers: [] as Array<SimpleUserVO>,
};

const props = defineProps<{
  selectData?: Array<DeptTreeNodeWithManagerVO>;
}>();

const emits = defineEmits<{
  success: [];
}>();

const open = ref(false);
const tab = ref("basic");
const deptId = ref("");
const editFormRef = ref();
const editForm = reactive({ ...emptyForm, managerUsers: [] as Array<SimpleUserVO> });
const rawEditForm = { ...emptyForm, managerUsers: [] as Array<SimpleUserVO> };
const userList = ref<Array<SimpleUserVO>>([]);
const queryLoading = ref(false);
const statusEnum = useEnum(CommonStatusEnumExtArray);

const session = useDetailEditSession();
const { editing, saving, enterEdit, exitEdit } = session;

const displayName = computed(() => editForm.name || "");
const managerNames = computed(() =>
  (editForm.managerUsers ?? []).map((item) => item.nickname ?? ""),
);
const parentName = computed(() => privateFindDeptName(editForm.pid, props.selectData ?? []));

const rules = {
  pid: [{ required: true, message: "请选择上级部门", trigger: "blur" }],
  name: [{ required: true, message: "请输入部门名称", trigger: "blur" }],
};

const privateFindDeptName = (
  id: string | undefined,
  nodes: Array<DeptTreeNode>,
): string | undefined => {
  if (!id) {
    return undefined;
  }
  for (const node of nodes) {
    if (node.id === id) {
      return node.name;
    }
    const nested = privateFindDeptName(id, node.children ?? []);
    if (nested) {
      return nested;
    }
  }
  return undefined;
};

const privateFindDept = (
  id: string | undefined,
  nodes: Array<DeptTreeNodeWithManagerVO>,
): DeptTreeNodeWithManagerVO | undefined => {
  if (!id) {
    return undefined;
  }
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    const children = node.children as Array<DeptTreeNodeWithManagerVO> | undefined;
    const nested = privateFindDept(id, children ?? []);
    if (nested) {
      return nested;
    }
  }
  return undefined;
};

const privateManagerIds = (users?: Array<SimpleUserVO>): Array<string> =>
  (users ?? []).map((item) => item.id).filter((item): item is string => Boolean(item));

const privateApplyRow = (value: DeptTreeNodeWithManagerVO): void => {
  copyParamsWithKeys(editForm, value, [...formKeys]);
  if (!editForm.managerUsers) {
    editForm.managerUsers = [];
  }
  copyParamsWithKeys(rawEditForm, editForm, [...formKeys]);
  userList.value = [...(editForm.managerUsers ?? [])];
  deptId.value = value.id ?? "";
};

const privateRestoreForm = (): void => {
  copyParamsWithKeys(editForm, rawEditForm, [...formKeys]);
  userList.value = [...(editForm.managerUsers ?? [])];
};

const privateOnEdit = (): void => {
  enterEdit();
};

const privateOnCancel = (): void => {
  privateRestoreForm();
  exitEdit();
};

const privateOnSave = (): void => {
  const form = unref(editFormRef);
  form.validate((valid: boolean) => {
    if (!valid) {
      return;
    }
    const diff = getDiffWithIgnore(rawEditForm, editForm, ["managerUsers"]);
    const managerUserIds = privateManagerIds(editForm.managerUsers);
    const managersChanged =
      privateManagerIds(rawEditForm.managerUsers).join(",") !== managerUserIds.join(",");
    if (Object.keys(diff).length === 0 && !managersChanged) {
      Message.warning("未改变数据");
      return;
    }
    const params: DeptWithManagerDTO = { ...diff, id: deptId.value };
    if (managersChanged) {
      params.managerUserIds = managerUserIds;
    }
    saving.value = true;
    UpdateDeptAPI(params)
      .then(() => {
        Message.success("操作成功");
        copyParamsWithKeys(rawEditForm, editForm, [...formKeys]);
        exitEdit();
        emits("success");
        saving.value = false;
      })
      .catch(() => {
        saving.value = false;
      });
  });
};

const privateOnDelete = (): void => {
  void Confirm.warning(`是否删除部门(${editForm.name || deptId.value})`).then(() => {
    RemoveDeptAPI(deptId.value).then(() => {
      Message.success("删除成功");
      open.value = false;
      exitEdit();
      emits("success");
    });
  });
};

const privateOnMoreCommand = (command: string | number | object): void => {
  if (command === "delete") {
    privateOnDelete();
  }
};

const privateQueryUsers = (nickname: string): void => {
  if (!nickname) {
    return;
  }
  queryLoading.value = true;
  UserPageAPI({ current: 1, size: 100 }, { nickname })
    .then((response) => {
      userList.value = response.data.records!.map((item) => ({
        id: item.userId,
        nickname: item.nickname,
        avatar: item.avatar,
      }));
    })
    .finally(() => {
      queryLoading.value = false;
    });
};

watch(
  () => props.selectData,
  (tree) => {
    if (!open.value || editing.value || !deptId.value) {
      return;
    }
    const next = privateFindDept(deptId.value, tree ?? []);
    if (next) {
      privateApplyRow(next);
    }
  },
);

defineExpose({
  show(data: DeptTreeNodeWithManagerVO) {
    privateApplyRow(data);
    tab.value = "basic";
    exitEdit();
    open.value = true;
  },
});
</script>
<style lang="postcss" scoped>
.dept-detail-body {
  padding: var(--in-space-5);
}
</style>
