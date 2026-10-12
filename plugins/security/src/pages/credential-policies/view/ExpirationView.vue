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
        <in-detail-field label="最大有效天数" prop="maxDays" :value="editForm.maxDays">
          <el-input-number
            v-if="editing"
            v-model="editForm.maxDays"
            class="w-full"
            placeholder="请输入最大有效天数"
          />
        </in-detail-field>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="12">
        <in-detail-field
          label="到期前提醒天数"
          prop="warningDaysBefore"
          :value="editForm.warningDaysBefore"
        >
          <el-input-number
            v-if="editing"
            v-model="editForm.warningDaysBefore"
            class="w-full"
            placeholder="请输入到期前提醒天数"
          />
        </in-detail-field>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="12">
        <in-detail-field
          label="宽限登录次数"
          prop="graceLoginCount"
          :value="editForm.graceLoginCount"
        >
          <el-input-number
            v-if="editing"
            v-model="editForm.graceLoginCount"
            class="w-full"
            placeholder="请输入宽限登录次数"
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
  maxDays: undefined as number | undefined,
  warningDaysBefore: undefined as number | undefined,
  graceLoginCount: undefined as number | undefined,
};

const editFormRef = ref<FormInstance>();
const editForm = reactive(Object.assign({}, defaultEditForm));

const rules = {
  maxDays: [{ required: true, message: "请输入最大有效天数", trigger: "blur" }],
  warningDaysBefore: [{ required: true, message: "请输入到期前提醒天数", trigger: "blur" }],
  graceLoginCount: [{ required: true, message: "请输入宽限登录次数", trigger: "blur" }],
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
