<template>
  <in-form
    ref="editFormRef"
    class="policy-form"
    :model="editForm"
    :rules="rules"
    :editing="editing"
  >
    <el-row :gutter="24">
      <el-col :xs="24" :sm="12" :lg="12">
        <in-detail-field label="历史密码数量" prop="checkCount" :value="editForm.checkCount">
          <el-input-number
            v-if="editing"
            v-model="editForm.checkCount"
            class="w-full"
            placeholder="请输入保存的近期密码数量"
          />
        </in-detail-field>
      </el-col>
    </el-row>
  </in-form>
</template>
<script setup lang="ts">
import type { FormInstance } from "element-plus";
defineProps<{
  editing?: boolean;
}>();

const defaultEditForm = {
  checkCount: undefined as number | undefined,
};

const editFormRef = ref<FormInstance>();
const editForm = reactive(Object.assign({}, defaultEditForm));

const rules = {
  checkCount: [{ required: true, message: "请输入保存的近期密码数量", trigger: "blur" }],
};

defineExpose({
  setForm: (form: Partial<typeof defaultEditForm>) => {
    editFormRef.value?.clearValidate();
    Object.assign(editForm, structuredClone(defaultEditForm), form);
  },
  resetFields: () => {
    editFormRef.value?.resetFields();
  },
  getForm: () => {
    return new Promise<Record<string, unknown>>((resolve, reject) => {
      editFormRef.value?.validate((valid: boolean) => {
        if (valid) {
          resolve({ ...toRaw(editForm) });
        } else {
          reject();
        }
      });
    });
  },
});
</script>
