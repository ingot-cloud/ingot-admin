<template>
  <in-detail-drawer
    v-model="open"
    v-model:tab="tab"
    v-model:editing="editing"
    title="成员详情"
    edit-label="编辑基本信息"
    :saving="saving"
    :loading="loading"
    @edit="privateOnEdit"
    @cancel="privateOnCancel"
    @save="privateOnSave"
  >
    <template #identity>
      <in-detail-identity
        :name="displayName"
        :src="displayAvatar"
        v-model:avatar="editForm.avatar"
        :editable="editing"
        upload-dir="user/avatar"
      >
        <template #status>
          <in-account-status-tag :enabled="displayEnabled" :locked="displayLocked" />
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
                <el-dropdown-item command="toggle" :disabled="!canToggle">
                  {{ toggleLabel }}
                </el-dropdown-item>
                <el-dropdown-item command="delete">删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </in-detail-identity>
    </template>

    <in-biz-tab-panel title="基本信息" name="basic">
      <div class="member-detail-body">
        <in-description-list v-if="!editing">
          <in-description-item label="姓名" :value="editForm.nickname" />
          <in-description-item label="手机号" :value="editForm.phone" />
          <in-description-item label="email" :value="editForm.email" />
          <in-description-item label="部门" :value="deptNames" />
        </in-description-list>
        <el-form
          v-else
          ref="editFormRef"
          label-width="100px"
          label-position="top"
          :model="editForm"
          :rules="rules"
        >
          <el-form-item label="姓名" prop="nickname">
            <el-input v-model="editForm.nickname" clearable placeholder="请输入名称" />
          </el-form-item>
          <el-form-item label="手机号" prop="phone">
            <el-input v-model="editForm.phone" clearable placeholder="请输入手机号" />
          </el-form-item>
          <el-form-item label="email" prop="email">
            <el-input v-model="editForm.email" clearable placeholder="请输入email" />
          </el-form-item>
          <el-form-item label="部门" prop="deptIds">
            <BizDeptSelect w-full multiple v-model="editForm.deptIds" clearable />
          </el-form-item>
        </el-form>
      </div>
    </in-biz-tab-panel>
  </in-detail-drawer>
</template>
<script setup lang="ts">
import type { OrgUserProfileVO, UserDTO, UserPageItemVO } from "@/models";
import { RemoveUserAPI, UpdateUserAPI } from "@/api/org/user";
import { OrgUserProfileQueryOptions } from "@/api/org/user.query";
import { OrgDeptTreeQueryOptions } from "@/api/org/dept.query";
import { Confirm, Message, copyParamsWithKeys, getDiffWithIgnore } from "@ingot/admin-core";
import { useDetailEditSession } from "@ingot/admin-core";
import BizDeptSelect from "@/components/biz/dept-select/BizDeptSelect.vue";
import { useQuery } from "@tanstack/vue-query";
import { resolveDeptNames } from "../deptNames";

type MoreCommand = "toggle" | "delete";

const formKeys = ["deptIds", "nickname", "phone", "email", "avatar"] as const;

const emptyForm = {
  deptIds: [] as Array<string>,
  nickname: undefined as string | undefined,
  phone: undefined as string | undefined,
  email: undefined as string | undefined,
  avatar: undefined as string | undefined,
};

const emits = defineEmits<{
  success: [];
}>();

const open = ref(false);
const tab = ref("basic");
const userId = ref("");
const username = ref("");
const listRow = ref<UserPageItemVO>();
const editFormRef = ref();
const editForm = reactive({ ...emptyForm, deptIds: [] as Array<string> });
const rawEditForm = { ...emptyForm, deptIds: [] as Array<string> };
const profileMeta = reactive({
  enabled: true,
  locked: false,
});

const session = useDetailEditSession();
const { editing, saving, enterEdit, exitEdit } = session;

const profileQuery = useQuery(() => ({
  ...OrgUserProfileQueryOptions(() => userId.value),
  enabled: open.value && Boolean(userId.value),
}));
const deptQuery = useQuery(() => ({
  ...OrgDeptTreeQueryOptions(),
  enabled: open.value,
}));

const loading = computed(() => profileQuery.isFetching.value || saving.value);
const displayName = computed(() => editForm.nickname || listRow.value?.nickname || "");
const displayAvatar = computed(() => editForm.avatar || listRow.value?.avatar);
const displayEnabled = computed(() => profileMeta.enabled);
const displayLocked = computed(() => profileMeta.locked);
const canToggle = computed(() => Boolean(userId.value && typeof profileMeta.enabled === "boolean"));
const toggleLabel = computed(() => (profileMeta.enabled ? "暂停账号" : "恢复账号"));
const deptNames = computed(() => resolveDeptNames(editForm.deptIds, deptQuery.data.value ?? []));

const rules = {
  deptIds: [{ required: true, message: "请选择部门", trigger: "blur" }],
  phone: [{ required: true, message: "请输入手机号", trigger: "blur" }],
  nickname: [{ required: true, message: "请输入名称", trigger: "blur" }],
};

const privateApplyProfile = (value: OrgUserProfileVO): void => {
  copyParamsWithKeys(editForm, value, [...formKeys]);
  copyParamsWithKeys(rawEditForm, value, [...formKeys]);
  if (!editForm.avatar && listRow.value?.avatar) {
    editForm.avatar = listRow.value.avatar;
    rawEditForm.avatar = listRow.value.avatar;
  }
  username.value = value.username;
  profileMeta.enabled = value.enabled ?? listRow.value?.enabled ?? true;
  profileMeta.locked = value.locked ?? listRow.value?.locked ?? false;
};

const privateRestoreForm = (): void => {
  copyParamsWithKeys(editForm, rawEditForm, [...formKeys]);
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
    const diff = getDiffWithIgnore(rawEditForm, editForm);
    if (Object.keys(diff).length === 0) {
      Message.warning("未改变数据");
      return;
    }
    const params: UserDTO = { ...diff, id: userId.value };
    saving.value = true;
    UpdateUserAPI(params)
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

const privateOnToggleEnabled = (): void => {
  if (!canToggle.value) {
    return;
  }
  const nextEnabled = !profileMeta.enabled;
  void Confirm.warning(
    `是否${toggleLabel.value}(${username.value || listRow.value?.username})`,
  ).then(() => {
    UpdateUserAPI({ id: userId.value, enabled: nextEnabled }).then(() => {
      profileMeta.enabled = nextEnabled;
      Message.success("操作成功");
      emits("success");
    });
  });
};

const privateOnDelete = (): void => {
  void Confirm.warning(`是否删除用户(${username.value || listRow.value?.username})`).then(() => {
    RemoveUserAPI(userId.value).then(() => {
      Message.success("删除成功");
      open.value = false;
      exitEdit();
      emits("success");
    });
  });
};

const privateOnMoreCommand = (command: string | number | object): void => {
  const action = command as MoreCommand;
  if (action === "toggle") {
    privateOnToggleEnabled();
    return;
  }
  if (action === "delete") {
    privateOnDelete();
  }
};

watch(
  () => profileQuery.data.value,
  (value) => {
    if (!value || editing.value) {
      return;
    }
    privateApplyProfile(value);
  },
);

defineExpose({
  show(data: UserPageItemVO) {
    listRow.value = data;
    userId.value = data.userId;
    username.value = data.username;
    profileMeta.enabled = data.enabled ?? true;
    profileMeta.locked = data.locked ?? false;
    editForm.nickname = data.nickname;
    editForm.phone = data.phone;
    editForm.email = data.email;
    editForm.avatar = data.avatar;
    editForm.deptIds = [];
    copyParamsWithKeys(rawEditForm, editForm, [...formKeys]);
    tab.value = "basic";
    exitEdit();
    open.value = true;
  },
});
</script>
<style lang="postcss" scoped>
.member-detail-body {
  padding: var(--in-space-5);
}
</style>
