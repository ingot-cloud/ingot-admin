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
        <in-detail-field
          label="生成方式"
          prop="generation"
          :value="
            initialPasswordGenerationEnum
              .getOptions()
              .find((item) => item.value === editForm.generation)?.label ?? editForm.generation
          "
        >
          <in-select
            v-if="editing"
            v-model="editForm.generation"
            :options="initialPasswordGenerationEnum.getOptions()"
            placeholder="请选择初始密码生成方式"
          />
        </in-detail-field>
      </el-col>
      <el-col v-if="isRandom" :xs="24" :sm="12" :lg="12">
        <in-detail-field label="随机密码长度" prop="length" :value="editForm.length">
          <el-input-number
            v-if="editing"
            v-model="editForm.length"
            class="w-full"
            placeholder="请输入随机初始密码长度"
          />
        </in-detail-field>
      </el-col>
      <el-col v-if="isFixed" :xs="24" :sm="12" :lg="12">
        <in-detail-field
          label="统一默认密码"
          prop="fixedPassword"
          :value="editForm.fixedPassword ? '已设置' : '未设置'"
        >
          <el-input
            v-if="editing"
            v-model="editForm.fixedPassword"
            type="password"
            show-password
            placeholder="请输入统一默认密码"
          />
        </in-detail-field>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="12">
        <in-detail-field label="有效小时数" prop="validHours" :value="editForm.validHours">
          <el-input-number
            v-if="editing"
            v-model="editForm.validHours"
            class="w-full"
            placeholder="0 表示不限制"
          />
        </in-detail-field>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="12">
        <in-detail-field label="用后失效" prop="oneTime" :value="editForm.oneTime ? '是' : '否'">
          <el-switch
            v-if="editing"
            v-model="editForm.oneTime"
            inline-prompt
            active-text="是"
            inactive-text="否"
          />
        </in-detail-field>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="12">
        <in-detail-field
          label="首次登录强制修改密码"
          prop="forceChangeOnFirstLogin"
          :value="editForm.forceChangeOnFirstLogin ? '是' : '否'"
        >
          <el-switch
            v-if="editing"
            v-model="editForm.forceChangeOnFirstLogin"
            inline-prompt
            active-text="是"
            inactive-text="否"
          />
        </in-detail-field>
      </el-col>
    </el-row>
  </in-form>
</template>
<script setup lang="ts">
import type { FormInstance } from "element-plus";
import type { InitialPasswordPolicyConfig } from "@/models";
import { InitialPasswordGenerationEnum, useInitialPasswordGenerationEnum } from "@/models/enums";

defineProps<{
  editing?: boolean;
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

const editFormRef = ref<FormInstance>();
const editForm = reactive<InitialPasswordPolicyConfig>({ ...defaultEditForm });

const isRandom = computed(() => editForm.generation === InitialPasswordGenerationEnum.RANDOM);
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
      validator: (_rule: unknown, value: unknown, callback: (error?: Error) => void) => {
        if (!isRandom.value) {
          callback();
          return;
        }
        if (value === undefined || value === null || value === "") {
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
      validator: (_rule: unknown, value: unknown, callback: (error?: Error) => void) => {
        if (value === undefined || value === null || value === "") {
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
