<template>
  <in-dialog v-model="visible" title="重新加入" width="820px" :loading="loading">
    <div class="pb-24px">
      <el-alert
        type="warning"
        :closable="false"
        title="重新加入后，该成员原有角色、用户组和负责人关系会被清除，部门以本次提交为准。"
      />
    </div>
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
            placeholder="请输入11位手机号"
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
</template>

<script setup lang="ts">
import { Message } from "@ingot/admin-core";
import { IamAction, useFieldContext, type MemberDepartmentView } from "@ingot/admin-common";
import { TenantMemberContextAPI, TenantMemberRejoinAPI } from "@/api/iam/directory";
import MemberDepartmentField from "./MemberDepartmentField.vue";
import {
  MEMBER_PHONE_INVALID,
  MEMBER_PHONE_LENGTH,
  MEMBER_PHONE_PATTERN,
  MEMBER_REJOINED,
  plainMemberEmail,
  plainMemberPhone,
  type Row,
} from "../memberTable";

defineOptions({ name: "MemberRejoinDialog" });

const emits = defineEmits<{ success: [] }>();
const visible = ref(false);
const loading = ref(false);
const memberId = ref("");
const expectedVersion = ref("");
const displayName = ref("");
const phone = ref("");
const email = ref("");
const departments = ref<MemberDepartmentView[]>([]);
const fields = useFieldContext(IamAction.TENANT_MEMBER_CREATE, TenantMemberContextAPI, visible);
const createFields = computed(
  () => fields.context.value?.fieldOperations[IamAction.TENANT_MEMBER_CREATE],
);
const canEditName = computed(() => createFields.value?.displayName?.editable === true);
const canEditEmail = computed(() => createFields.value?.email?.editable === true);

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
  TenantMemberRejoinAPI(memberId.value, {
    expectedVersion: expectedVersion.value,
    displayName: name,
    phone: mobile,
    ...(canEditEmail.value && email.value.trim() ? { email: email.value.trim() } : {}),
    departments: departments.value.map((item, index) => ({ id: item.id, primary: index === 0 })),
  })
    .then(() => {
      visible.value = false;
      Message.success(MEMBER_REJOINED);
      emits("success");
    })
    .finally(() => {
      loading.value = false;
    });
};

defineExpose({
  show(row: Row) {
    memberId.value = row.record.id;
    expectedVersion.value = row.version;
    displayName.value = row.record.displayName?.trim() || "";
    phone.value = plainMemberPhone(row.record.phone);
    email.value = plainMemberEmail(row.record.email);
    departments.value = (row.record.departments ?? []).map((item, index) => ({
      ...item,
      primary: index === 0,
    }));
    visible.value = true;
  },
});
</script>
