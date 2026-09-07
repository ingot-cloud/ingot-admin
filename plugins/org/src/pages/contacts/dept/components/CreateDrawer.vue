<template>
  <in-drawer title="新建部门" v-model="visible">
    <in-form ref="editFormRef" label-width="80px" :model="editForm" :rules="rules">
      <el-form-item prop="pid" label="上级部门">
        <el-tree-select
          w-full
          v-model="editForm.pid"
          :data="selectData"
          disabled
          :node-key="TreeKeyAndProps.nodeKey"
          :value-key="TreeKeyAndProps.nodeKey"
          :props="TreeKeyAndProps.props"
          :check-strictly="true"
        />
      </el-form-item>

      <el-form-item prop="name" label="部门名称">
        <el-input v-model="editForm.name" placeholder="请输入部门名称" clearable />
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
    </in-form>
    <template #footer>
      <in-button :loading="loading" type="primary" @click="privateOnConfirm">确定</in-button>
    </template>
  </in-drawer>
</template>
<script setup lang="ts">
import { CommonStatus } from "@/models/enums";
import {
  TreeKeyAndProps,
  type DeptTreeNodeWithManagerVO,
  type DeptWithManagerDTO,
  type SimpleUserVO,
} from "@/models";
import { CreateDeptAPI } from "@/api/org/dept";
import { UserPageAPI } from "@/api/org/user";
import { copyParams, Message } from "@ingot/admin-core";

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
  pid: [{ required: true, message: "请选择上级部门", trigger: "blur" }],
  name: [{ required: true, message: "请输入部门名称", trigger: "blur" }],
};

const emits = defineEmits<{
  success: [];
}>();

defineProps<{
  selectData?: Array<DeptTreeNodeWithManagerVO>;
}>();

const visible = ref(false);
const loading = ref(false);
const queryLoading = ref(false);
const editFormRef = ref();
const editForm = reactive({
  ...defaultEditForm,
  managerUsers: [] as Array<SimpleUserVO>,
});
const userList = ref<Array<SimpleUserVO>>([]);

const privateOnConfirm = (): void => {
  const form = unref(editFormRef);
  form.validate((valid: boolean) => {
    if (!valid) {
      return;
    }
    const params = Object.assign({}, toRaw(editForm));
    params.managerUserIds = editForm.managerUsers?.map((item) => item.id!);
    loading.value = true;
    CreateDeptAPI(params)
      .then(() => {
        loading.value = false;
        Message.success("操作成功");
        visible.value = false;
        emits("success");
      })
      .catch(() => {
        loading.value = false;
      });
  });
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

defineExpose({
  show(parentId: string) {
    visible.value = true;
    copyParams(editForm, defaultEditForm);
    editForm.pid = parentId;
    editForm.managerUsers = [];
    userList.value = [];
    nextTick(() => {
      const form = unref(editFormRef);
      form?.clearValidate();
    });
  },
});
</script>
