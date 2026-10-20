<template>
  <in-dialog v-model="visible" title="添加成员" width="820px" :loading="loading">
    <div class="mb-16px text-16px font-500 text-[#1f2329]">基础信息</div>
    <in-form label-position="top">
      <div class="grid grid-cols-2 gap-x-24px">
        <el-form-item label="姓名" required>
          <el-input
            v-model="displayName"
            clearable
            placeholder="请输入姓名"
            :disabled="!canEditName"
          />
        </el-form-item>
        <el-form-item label="部门">
          <member-department-field v-model="departments" />
        </el-form-item>
        <el-form-item label="手机号码" required>
          <el-input
            v-model="phone"
            clearable
            placeholder="成员可用手机号登录"
            :maxlength="MEMBER_PHONE_LENGTH"
          >
            <template #prepend>+86</template>
          </el-input>
        </el-form-item>
        <el-form-item v-if="canEditEmail" label="工作邮箱">
          <el-input v-model="email" clearable placeholder="请为成员分配工作邮箱" />
        </el-form-item>
      </div>
    </in-form>
    <template #footer>
      <in-button class="w-80px" @click="visible = false">取消</in-button>
      <in-button
        class="w-80px"
        type="primary"
        :loading="loading"
        :disabled="!fields.context.value"
        @in-click="privateSubmit"
      >
        完成
      </in-button>
    </template>
  </in-dialog>
  <biz-iam-account-secret-dialog ref="secretRef" />
</template>

<script setup lang="ts">
import { Message } from "@ingot/admin-core";
import {
  BizIamAccountSecretDialog,
  IamAction,
  useFieldContext,
  type MemberDepartmentView,
} from "@ingot/admin-common";
import { TenantMemberContextAPI, TenantMemberCreateAPI } from "@/api/iam/directory";
import MemberDepartmentField from "./MemberDepartmentField.vue";
import {
  MEMBER_JOINED_EXISTING,
  MEMBER_PHONE_INVALID,
  MEMBER_PHONE_LENGTH,
  MEMBER_PHONE_PATTERN,
  MEMBER_REJOINED,
} from "../memberTable";

defineOptions({ name: "MemberCreateDialog" });

const emits = defineEmits<{ success: [] }>();
const visible = ref(false);
const loading = ref(false);
const displayName = ref("");
const phone = ref("");
const email = ref("");
const departments = ref<MemberDepartmentView[]>([]);
const secretRef = ref<{ show: (password: string) => void }>();
const fields = useFieldContext(IamAction.TENANT_MEMBER_CREATE, TenantMemberContextAPI, visible);
const createFields = computed(
  () => fields.context.value?.fieldOperations[IamAction.TENANT_MEMBER_CREATE],
);
const canEditName = computed(() => createFields.value?.displayName?.editable === true);
const canEditEmail = computed(() => createFields.value?.email?.editable === true);

const privateReset = (department?: MemberDepartmentView): void => {
  displayName.value = "";
  phone.value = "";
  email.value = "";
  departments.value = department?.id ? [{ ...department, primary: true }] : [];
};

const privateSubmit = (): void => {
  const name = displayName.value.trim();
  const mobile = phone.value.trim();
  if (!name) {
    Message.warning("请输入姓名");
    return;
  }
  if (!MEMBER_PHONE_PATTERN.test(mobile)) {
    Message.warning(MEMBER_PHONE_INVALID);
    return;
  }
  loading.value = true;
  TenantMemberCreateAPI({
    displayName: name,
    phone: mobile,
    ...(canEditEmail.value && email.value.trim() ? { email: email.value.trim() } : {}),
    departments: departments.value.map((item, index) => ({ id: item.id, primary: index === 0 })),
  })
    .then((response) => {
      visible.value = false;
      emits("success");
      if (response.data.accountCreated && response.data.initialPassword) {
        secretRef.value?.show(response.data.initialPassword);
        return;
      }
      Message.success(response.data.rejoined ? MEMBER_REJOINED : MEMBER_JOINED_EXISTING);
    })
    .finally(() => {
      loading.value = false;
    });
};

defineExpose({
  show(department?: MemberDepartmentView) {
    privateReset(department);
    visible.value = true;
  },
});
</script>
