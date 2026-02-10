<template>
  <in-form ref="editFormRef" class="form" :model="editForm" :rules="rules">
    <el-form-item label="最小长度" prop="minLength">
      <el-input
        v-model="editForm.minLength"
        type="number"
        clearable
        placeholder="请输入最小长度"
      ></el-input>
    </el-form-item>
    <el-form-item label="最大长度" prop="maxLength">
      <el-input
        v-model="editForm.maxLength"
        type="number"
        clearable
        placeholder="请输入最大长度"
      ></el-input>
    </el-form-item>
    <el-form-item label="包含大写字母" prop="requireUppercase">
      <el-switch
        v-model="editForm.requireUppercase"
        inline-prompt
        active-text="是"
        inactive-text="否"
      />
    </el-form-item>
    <el-form-item label="包含小写字母" prop="requireLowercase">
      <el-switch
        v-model="editForm.requireLowercase"
        inline-prompt
        active-text="是"
        inactive-text="否"
      />
    </el-form-item>
    <el-form-item label="包含数字" prop="requireDigit">
      <el-switch
        v-model="editForm.requireDigit"
        inline-prompt
        active-text="是"
        inactive-text="否"
      />
    </el-form-item>
    <el-form-item label="包含特殊字符" prop="requireSpecialChar">
      <el-switch
        v-model="editForm.requireSpecialChar"
        inline-prompt
        active-text="是"
        inactive-text="否"
      />
    </el-form-item>
    <el-form-item label="特殊字符集" prop="specialChars">
      <el-input v-model="editForm.specialChars" clearable placeholder="请输入特殊字符集"></el-input>
    </el-form-item>
    <el-form-item label="禁用弱密码" prop="forbiddenPatterns">
      <el-input-tag
        v-model="editForm.forbiddenPatterns"
        placeholder="请输入禁用弱密码"
        aria-label="请点击回车键输入禁用弱密码"
      />
    </el-form-item>
    <el-form-item label="禁止使用用户属性" prop="forbidUserAttributes">
      <el-switch
        v-model="editForm.forbidUserAttributes"
        inline-prompt
        active-text="是"
        inactive-text="否"
      />
    </el-form-item>
  </in-form>
</template>
<script setup lang="ts">
const defaultEditForm = {
  minLength: undefined,
  maxLength: undefined,
  requireUppercase: false,
  requireLowercase: false,
  requireDigit: false,
  requireSpecialChar: false,
  specialChars: "",
  forbiddenPatterns: [] as string[],
  forbidUserAttributes: false,
};

const editFormRef = ref();
const editForm = reactive<any>(Object.assign({}, defaultEditForm));

const rules = {
  minLength: [{ required: true, message: "请输入最小长度", trigger: "blur" }],
  maxLength: [{ required: true, message: "请输入最大长度", trigger: "blur" }],
  specialChars: [{ required: true, message: "请输入特殊字符集", trigger: "blur" }],
  forbiddenPatterns: [{ required: true, message: "请输入禁用弱密码", trigger: "blur" }],
};

defineExpose({
  setForm: (form: any) => {
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
