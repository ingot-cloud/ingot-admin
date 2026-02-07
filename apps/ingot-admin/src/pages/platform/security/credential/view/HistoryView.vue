<template>
  <in-form ref="editFormRef" class="form" :model="editForm" :rules="rules">
    <el-form-item label="历史密码数量" prop="checkCount">
      <el-input
        v-model="editForm.checkCount"
        type="number"
        clearable
        placeholder="请输入保存的近期密码数量"
      ></el-input>
    </el-form-item>
  </in-form>
</template>
<script setup lang="ts">
const defaultEditForm = {
  checkCount: undefined,
};

const editFormRef = ref();
const editForm = reactive<any>(Object.assign({}, defaultEditForm));

const rules = {
  checkCount: [{ required: true, message: "请输入保存的近期密码数量", trigger: "blur" }],
};

defineExpose({
  setForm: (form: any) => {
    nextTick(() => {
      editFormRef.value.resetFields();
      Object.assign(editForm, defaultEditForm, form);
    });
  },
  getForm: () => {
    return new Promise((resolve, reject) => {
      editFormRef.value.validate((valid: boolean) => {
        if (valid) {
          resolve(editForm);
        } else {
          reject();
        }
      });
    });
  },
});
</script>
