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
        <in-detail-field label="最小长度" prop="minLength" :value="editForm.minLength">
          <el-input-number
            v-if="editing"
            v-model="editForm.minLength"
            class="w-full"
            placeholder="请输入最小长度"
          />
        </in-detail-field>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="12">
        <in-detail-field label="最大长度" prop="maxLength" :value="editForm.maxLength">
          <el-input-number
            v-if="editing"
            v-model="editForm.maxLength"
            class="w-full"
            placeholder="请输入最大长度"
          />
        </in-detail-field>
      </el-col>
      <el-col :span="24">
        <in-detail-field label="特殊字符集" prop="specialChars" :value="editForm.specialChars">
          <el-input
            v-if="editing"
            v-model="editForm.specialChars"
            clearable
            placeholder="请输入特殊字符集"
          />
        </in-detail-field>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="8">
        <in-detail-field
          label="包含大写字母"
          prop="requireUppercase"
          :value="editForm.requireUppercase ? '是' : '否'"
        >
          <el-switch
            v-if="editing"
            v-model="editForm.requireUppercase"
            inline-prompt
            active-text="是"
            inactive-text="否"
          />
        </in-detail-field>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="8">
        <in-detail-field
          label="包含小写字母"
          prop="requireLowercase"
          :value="editForm.requireLowercase ? '是' : '否'"
        >
          <el-switch
            v-if="editing"
            v-model="editForm.requireLowercase"
            inline-prompt
            active-text="是"
            inactive-text="否"
          />
        </in-detail-field>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="8">
        <in-detail-field
          label="包含数字"
          prop="requireDigit"
          :value="editForm.requireDigit ? '是' : '否'"
        >
          <el-switch
            v-if="editing"
            v-model="editForm.requireDigit"
            inline-prompt
            active-text="是"
            inactive-text="否"
          />
        </in-detail-field>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="8">
        <in-detail-field
          label="包含特殊字符"
          prop="requireSpecialChar"
          :value="editForm.requireSpecialChar ? '是' : '否'"
        >
          <el-switch
            v-if="editing"
            v-model="editForm.requireSpecialChar"
            inline-prompt
            active-text="是"
            inactive-text="否"
          />
        </in-detail-field>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="8">
        <in-detail-field
          label="禁止使用用户属性"
          prop="forbidUserAttributes"
          :value="editForm.forbidUserAttributes ? '是' : '否'"
        >
          <el-switch
            v-if="editing"
            v-model="editForm.forbidUserAttributes"
            inline-prompt
            active-text="是"
            inactive-text="否"
          />
        </in-detail-field>
      </el-col>
      <el-col :span="24">
        <in-detail-field
          label="禁用弱密码"
          prop="forbiddenPatterns"
          :value="editForm.forbiddenPatterns"
        >
          <el-input-tag
            v-if="editing"
            v-model="editForm.forbiddenPatterns"
            placeholder="请输入禁用弱密码"
            aria-label="请点击回车键输入禁用弱密码"
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
  minLength: undefined as number | undefined,
  maxLength: undefined as number | undefined,
  requireUppercase: false,
  requireLowercase: false,
  requireDigit: false,
  requireSpecialChar: false,
  specialChars: "",
  forbiddenPatterns: [] as string[],
  forbidUserAttributes: false,
};

const editFormRef = ref<FormInstance>();
const editForm = reactive(Object.assign({}, defaultEditForm));

const rules = {
  minLength: [{ required: true, message: "请输入最小长度", trigger: "blur" }],
  maxLength: [{ required: true, message: "请输入最大长度", trigger: "blur" }],
  specialChars: [{ required: true, message: "请输入特殊字符集", trigger: "blur" }],
  forbiddenPatterns: [{ required: true, message: "请输入禁用弱密码", trigger: "blur" }],
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
