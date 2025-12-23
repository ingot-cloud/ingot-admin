<template>
  <in-drawer :title="title" v-model="visible">
    <in-form ref="editFormRef" label-width="80px" :model="editForm" :rules="rules">
      <el-form-item prop="pid" label="上级部门">
        <el-tree-select
          w-full
          v-model="editForm.pid"
          :data="selectData"
          :disabled="!canEditPid"
          :node-key="TreeKeyAndProps.nodeKey"
          :value-key="TreeKeyAndProps.nodeKey"
          :props="TreeKeyAndProps.props"
          :check-strictly="true"
        />
      </el-form-item>

      <el-form-item prop="name" label="部门名称">
        <el-input v-model="editForm.name" placeholder="请输入部门名称" clearable></el-input>
      </el-form-item>

      <el-form-item prop="" label="部门主管">
        <el-select
          v-model="editForm.managerUsers"
          multiple
          filterable
          remote
          reserve-keyword
          placeholder="部门主管"
          :remote-method="queryData"
          :loading="queryLoading"
        >
          <template #label="{ value }">
            <div flex flex-row items-center gap-2>
              <el-image v-if="value.avatar" class="w-20px h-20px" :src="value.avatar" fit="cover" />
              <span>{{ value.nickname }}</span>
            </div>
          </template>

          <el-option v-for="item in userList" :key="item.id" :label="item.nickname" :value="item">
            <div flex flex-row items-center gap-2>
              <el-image v-if="item.avatar" class="w-20px h-20px" :src="item.avatar" fit="cover" />
              <span>{{ item.nickname }}</span>
            </div>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item prop="status" label="状态" v-if="edit">
        <el-radio-group v-model="editForm.status">
          <el-radio-button :value="CommonStatus.Enable">
            {{ statusEnum.getTagText(CommonStatus.Enable).text }}
          </el-radio-button>
          <el-radio-button :value="CommonStatus.Lock">
            {{ statusEnum.getTagText(CommonStatus.Lock).text }}
          </el-radio-button>
        </el-radio-group>
      </el-form-item>
    </in-form>
    <template #footer>
      <in-button :loading="loading" type="primary" @click="handleConfirmClick"> 确定 </in-button>
    </template>
  </in-drawer>
</template>
<script setup lang="ts">
import { CommonStatus, CommonStatusEnumExtArray } from "@/models/enums";
import { TreeKeyAndProps } from "@/models";
import type { DeptTreeNodeWithManagerVO, SimpleUserVO, DeptWithManagerDTO } from "@/models";
import { useDeptStore } from "@/stores/modules/org/dept";
import { UserPageAPI } from "@/api/org/user";
import { Message } from "@/utils/message";
import { copyParams, getDiff } from "@/utils/object";
import type { TreeData } from "element-plus";

interface DeptWithManager extends DeptWithManagerDTO {
  managerUsers?: Array<SimpleUserVO>;
}

const defaultEditForm: DeptWithManager = {
  id: undefined,
  pid: undefined,
  name: undefined,
  sort: 999,
  status: CommonStatus.Enable,
  managerUsers: [],
  managerUserIds: [],
};

const rules = {
  pid: [{ required: true, message: "请选择上级菜单", trigger: "blur" }],
  name: [{ required: true, message: "请输入部门名称", trigger: "blur" }],
};

const emits = defineEmits(["success"]);
defineProps({
  selectData: {
    type: Array as PropType<TreeData>,
  },
});

const edit = ref(false);
const canEditPid = ref(false);
const visible = ref(false);
const loading = ref(false);
const queryLoading = ref(false);

const statusEnum = useEnum(CommonStatusEnumExtArray);
const deptStore = useDeptStore();
const editFormRef = ref();

const title = ref("");
const editForm = reactive(Object.assign({}, defaultEditForm));
const rawForm: DeptTreeNodeWithManagerVO = {};
const userList = ref<Array<SimpleUserVO>>([]);

const handleConfirmClick = () => {
  const form = unref(editFormRef);
  form.validate((valid: boolean) => {
    if (valid) {
      let request;
      if (edit.value) {
        const params = getDiff<DeptWithManagerDTO>(rawForm, editForm);
        params.id = rawForm.id;
        params.managerUserIds = editForm.managerUsers?.map((item) => item.id!);
        request = deptStore.updateDept(params);
      } else {
        const params = Object.assign({}, toRaw(editForm));
        params.managerUserIds = editForm.managerUsers?.map((item) => item.id!);
        request = deptStore.createDept(params);
      }

      loading.value = true;
      request
        .then(() => {
          loading.value = false;
          Message.success("操作成功");
          visible.value = false;
          emits("success");
        })
        .catch(() => {
          loading.value = false;
        });
    }
  });
};

const queryData = (nickname: string) => {
  if (!nickname || nickname.length == 0) {
    return;
  }
  queryLoading.value = true;
  UserPageAPI({ current: 1, size: 100 }, { nickname }).then((response) => {
    queryLoading.value = false;
    userList.value = response.data.records!.map((item) => {
      return {
        id: item.userId,
        nickname: item.nickname,
        avatar: item.avatar,
      };
    });
  });
};

const show = (data: DeptTreeNodeWithManagerVO | string) => {
  visible.value = true;

  // 重置数据
  copyParams(editForm, defaultEditForm);
  copyParams(rawForm, defaultEditForm);
  nextTick(() => {
    const form = unref(editFormRef);
    form.clearValidate();
  });

  if (typeof data === "string") {
    title.value = "添加部门";
    edit.value = false;
    canEditPid.value = false;
    editForm.pid = data;
  } else {
    copyParams(editForm, data);
    copyParams(rawForm, data);
    title.value = data.name!;
    edit.value = true;
    canEditPid.value = true;
  }
};

defineExpose({
  show,
});
</script>
