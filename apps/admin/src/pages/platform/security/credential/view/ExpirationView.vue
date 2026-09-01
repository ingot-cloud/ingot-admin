<template>
  <in-form ref="editFormRef" class="policy-form" :model="editForm" :rules="rules" :disabled="disabled">
    <el-row :gutter="24">
      <el-col :span="8">
        <el-form-item label="最大有效天数" prop="maxDays">
          <el-input
            v-model="editForm.maxDays"
            type="number"
            clearable
            placeholder="请输入最大有效天数"
          />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="到期前提醒天数" prop="warningDaysBefore">
          <el-input
            v-model="editForm.warningDaysBefore"
            type="number"
            clearable
            placeholder="请输入到期前提醒天数"
          />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="宽限登录次数" prop="graceLoginCount">
          <el-input
            v-model="editForm.graceLoginCount"
            type="number"
            clearable
            placeholder="请输入宽限登录次数"
          />
        </el-form-item>
      </el-col>
    </el-row>
  </in-form>
</template>
<script setup lang="ts">
defineProps<{
  disabled?: boolean;
}>();

const defaultEditForm = {
  maxDays: undefined,
  warningDaysBefore: undefined,
  graceLoginCount: undefined,
};

const editFormRef = ref();
const editForm = reactive(Object.assign({}, defaultEditForm));

const rules = {
  maxDays: [{ required: true, message: "请输入最大有效天数", trigger: "blur" }],
  warningDaysBefore: [{ required: true, message: "请输入到期前提醒天数", trigger: "blur" }],
  graceLoginCount: [{ required: true, message: "请输入宽限登录次数", trigger: "blur" }],
};

defineExpose({
  setForm: (form: Partial<typeof defaultEditForm>) => {
    editFormRef.value.clearValidate();
    Object.assign(editForm, form);
  },
  resetFields: () => {
    editFormRef.value.resetFields();
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
