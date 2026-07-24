<template>
  <in-form ref="editFormRef" class="policy-form" :model="editForm" :rules="rules" :disabled="disabled">
    <el-row :gutter="24">
      <el-col :span="8">
        <el-form-item label="生成方式" prop="generation">
          <in-select
            v-model="editForm.generation"
            :options="initialPasswordGenerationEnum.getOptions()"
            placeholder="请选择初始密码生成方式"
          />
        </el-form-item>
      </el-col>
      <el-col v-if="isRandom" :span="8">
        <el-form-item label="随机密码长度" prop="length">
          <el-input
            v-model="editForm.length"
            type="number"
            clearable
            placeholder="请输入随机初始密码长度"
          />
        </el-form-item>
      </el-col>
      <el-col v-if="isFixed" :span="8">
        <el-form-item label="统一默认密码" prop="fixedPassword">
          <el-input
            v-model="editForm.fixedPassword"
            type="password"
            show-password
            clearable
            placeholder="请输入统一默认密码"
          />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="有效小时数" prop="validHours">
          <el-input
            v-model="editForm.validHours"
            type="number"
            clearable
            placeholder="0 表示不限制"
          />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="用后失效" prop="oneTime">
          <el-switch v-model="editForm.oneTime" inline-prompt active-text="是" inactive-text="否" />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="首次登录强制修改密码" prop="forceChangeOnFirstLogin">
          <el-switch
            v-model="editForm.forceChangeOnFirstLogin"
            inline-prompt
            active-text="是"
            inactive-text="否"
          />
        </el-form-item>
      </el-col>
    </el-row>
  </in-form>
</template>
<script setup lang="ts">
import type { InitialPasswordPolicyConfig } from "@/models";
import {
  InitialPasswordGenerationEnum,
  useInitialPasswordGenerationEnum,
} from "@/models/enums";

defineProps<{
  disabled?: boolean;
}>();

const initialPasswordGenerationEnum = useInitialPasswordGenerationEnum();

const defaultEditForm: InitialPasswordPolicyConfig = {
  generation: InitialPasswordGenerationEnum.RANDOM,
  length: undefined,
  fixedPassword: "",
  validHours: 0,
  oneTime: true,
  forceChangeOnFirstLogin: true,
};

const editFormRef = ref();
const editForm = reactive<InitialPasswordPolicyConfig>({ ...defaultEditForm });

const isRandom = computed(
  () => editForm.generation === InitialPasswordGenerationEnum.RANDOM,
);
const isFixed = computed(() => editForm.generation === InitialPasswordGenerationEnum.FIXED);

watch(
  () => editForm.generation,
  (generation) => {
    if (generation === InitialPasswordGenerationEnum.RANDOM) {
      editForm.fixedPassword = "";
    } else if (generation === InitialPasswordGenerationEnum.FIXED) {
      editForm.length = undefined;
    }
    nextTick(() => {
      editFormRef.value?.clearValidate(["length", "fixedPassword"]);
    });
  },
);

const rules = computed(() => ({
  generation: [{ required: true, message: "请选择初始密码生成方式", trigger: "change" }],
  length: [
    {
      required: isRandom.value,
      message: "请输入随机初始密码长度",
      trigger: "blur",
    },
    {
      validator: (_rule: unknown, value: number | undefined, callback: (error?: Error) => void) => {
        if (!isRandom.value) {
          callback();
          return;
        }
        if (value === undefined || value === null || value === ("" as unknown as number)) {
          callback(new Error("请输入随机初始密码长度"));
          return;
        }
        if (!Number.isInteger(Number(value)) || Number(value) <= 0) {
          callback(new Error("随机初始密码长度需为正整数"));
          return;
        }
        callback();
      },
      trigger: "blur",
    },
  ],
  fixedPassword: [
    {
      required: isFixed.value,
      message: "请输入统一默认密码",
      trigger: "blur",
    },
  ],
  validHours: [
    { required: true, message: "请输入有效小时数", trigger: "blur" },
    {
      validator: (_rule: unknown, value: number | undefined, callback: (error?: Error) => void) => {
        if (value === undefined || value === null || value === ("" as unknown as number)) {
          callback(new Error("请输入有效小时数"));
          return;
        }
        if (!Number.isInteger(Number(value)) || Number(value) < 0) {
          callback(new Error("有效小时数需为非负整数"));
          return;
        }
        callback();
      },
      trigger: "blur",
    },
  ],
}));

const buildFormPayload = (): InitialPasswordPolicyConfig => {
  const payload: InitialPasswordPolicyConfig = {
    generation: editForm.generation,
    validHours: Number(editForm.validHours),
    oneTime: editForm.oneTime,
    forceChangeOnFirstLogin: editForm.forceChangeOnFirstLogin,
  };

  if (editForm.generation === InitialPasswordGenerationEnum.RANDOM) {
    payload.length = Number(editForm.length);
  } else {
    payload.fixedPassword = editForm.fixedPassword;
  }

  return payload;
};

defineExpose({
  setForm: (form: Partial<InitialPasswordPolicyConfig>) => {
    editFormRef.value?.clearValidate();
    Object.assign(editForm, { ...defaultEditForm, ...form });
  },
  resetFields: () => {
    Object.assign(editForm, { ...defaultEditForm });
    editFormRef.value?.resetFields();
  },
  getForm: () => {
    return new Promise<InitialPasswordPolicyConfig>((resolve, reject) => {
      editFormRef.value?.validate((valid: boolean) => {
        if (valid) {
          resolve(buildFormPayload());
        } else {
          reject();
        }
      });
    });
  },
});
</script>
