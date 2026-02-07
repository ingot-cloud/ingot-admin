<template>
  <div v-if="policyType === CredentialPolicyTypeEnum.STRENGTH">
    <div>最小长度: {{ policyConfig.minLength }}</div>
    <div>最大长度: {{ policyConfig.maxLength }}</div>
    <div>包含大写字母: {{ policyConfig.requireUppercase ? "是" : "否" }}</div>
    <div>包含小写字母: {{ policyConfig.requireLowercase ? "是" : "否" }}</div>
    <div>包含数字: {{ policyConfig.requireDigit ? "是" : "否" }}</div>
    <div>包含特殊字符: {{ policyConfig.requireSpecialChar ? "是" : "否" }}</div>
    <div>特殊字符集: {{ policyConfig.specialChars }}</div>
    <div>禁用弱密码: {{ policyConfig.forbiddenPatterns.join(",") }}</div>
    <div>禁止使用用户属性: {{ policyConfig.forbidUserAttributes ? "是" : "否" }}</div>
  </div>
  <div v-else-if="policyType === CredentialPolicyTypeEnum.HISTORY">
    <div>历史密码记录: 近{{ policyConfig.checkCount }}次密码</div>
  </div>
  <div v-else-if="policyType === CredentialPolicyTypeEnum.EXPIRATION">
    <div>最大有效天数: {{ policyConfig.maxDays }}天</div>
    <div>到期前提醒天数: {{ policyConfig.warningDaysBefore }}天</div>
    <div>宽限登录次数: {{ policyConfig.graceLoginCount }}次</div>
  </div>
</template>
<script setup lang="ts">
import { useCredentialPolicyTypeEnum, CredentialPolicyTypeEnum } from "@/models/enums";

const credentialPolicyTypeEnum = useCredentialPolicyTypeEnum();

defineProps({
  policyType: {
    type: String,
    required: true,
  },
  policyConfig: {
    type: Object,
    required: true,
  },
});
</script>
