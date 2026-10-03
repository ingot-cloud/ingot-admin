<template>
  <in-dialog v-model="roleVisible" title="选择角色" width="640px" layout="pinned" append-to-body>
    <div class="h-420px flex flex-col min-h-0">
      <el-input v-model="keyword" clearable placeholder="搜索角色名称" @input="privateSearch">
        <template #prefix><in-icon name="ep:search" /></template>
      </el-input>
      <div v-loading="loading" class="flex-1 overflow-auto py-8px">
        <button
          v-for="role in roles"
          :key="role.id"
          type="button"
          class="block w-full p-10px text-left border-none rounded-[var(--el-border-radius-base)] bg-transparent hover:bg-[var(--el-fill-color-light)] cursor-pointer"
          :disabled="selectedRoleIds.includes(role.id)"
          @click="privateChoose(role)"
        >
          {{ role.name }} <span v-if="selectedRoleIds.includes(role.id)">（已添加）</span>
        </button>
        <div v-if="!roles.length && !loading" class="py-16px text-[var(--el-text-color-secondary)]">
          暂无可选角色
        </div>
      </div>
      <el-pagination
        v-if="total > IAM_DEFAULT_PAGE_SIZE"
        :current-page="page"
        :page-size="IAM_DEFAULT_PAGE_SIZE"
        :total="total"
        layout="prev, pager, next"
        small
        @current-change="privatePage"
      />
    </div>
    <template #footer><in-button @in-click="roleVisible = false">取消</in-button></template>
  </in-dialog>
  <in-dialog v-model="scopeVisible" title="配置角色范围" width="720px" layout="pinned" append-to-body>
    <div class="max-h-500px overflow-auto flex flex-col gap-16px">
      <div>{{ draftName }} · v{{ revisionNumber }}</div>
      <div v-for="parameter in parameters" :key="parameter.key">
        <div class="mb-6px">{{ privateParameterLabel(parameter.key) }}</div>
        <biz-iam-delegation-candidate-picker
          :model-value="bindings[parameter.key]?.ids || []"
          :api="PlatformAssignmentCandidatesAPI"
          :query="{ kind: 'OBJECT', revisionId: revisionRef?.id, parameterKey: parameter.key }"
          multiple
          title="选择指定对象"
          placeholder="请选择范围对象"
          search-placeholder="搜索范围对象"
          @update:model-value="(value: string | string[]) => privateSetBinding(parameter.key, value)"
        />
      </div>
    </div>
    <template #footer>
      <in-button @in-click="scopeVisible = false">取消</in-button>
      <in-button type="primary" :disabled="!privateConfigured()" @in-click="privateConfirm">确定</in-button>
    </template>
  </in-dialog>
</template>

<script setup lang="ts">
import { Message } from "@ingot/admin-core";
import {
  BizIamDelegationCandidatePicker,
  IAM_DEFAULT_PAGE_SIZE,
  ScopeBindingKind,
  type AuthorizationOption,
  type AuthorizationRoleNode,
  type MemberRoleAssignmentDraft,
  type RoleParameterDefinition,
  type RoleRevisionRef,
  type ScopeBinding,
} from "@ingot/admin-common";
import {
  PlatformAssignmentCandidatesAPI,
  PlatformAssignmentRoleCandidatesAPI,
} from "@/api/iam/authorization";

defineOptions({ name: "MemberRoleAssignDialog" });
const props = defineProps<{ selectedRoleIds: string[] }>();
const emits = defineEmits<{
  confirm: [draft: MemberRoleAssignmentDraft & { name: string; revisionNumber: number }];
}>();
const roleVisible = ref(false);
const scopeVisible = ref(false);
const keyword = ref("");
const page = ref(1);
const total = ref(0);
const loading = ref(false);
const roles = ref<AuthorizationRoleNode[]>([]);
const roleId = ref("");
const draftName = ref("");
const revisionNumber = ref(0);
const revisionRef = ref<RoleRevisionRef>();
const parameters = ref<RoleParameterDefinition[]>([]);
const option = ref<AuthorizationOption>();
const bindings = ref<Record<string, ScopeBinding>>({});
let request = 0;
let searchTimer: ReturnType<typeof setTimeout> | undefined;

const privateLoad = async (): Promise<void> => {
  const current = ++request;
  loading.value = true;
  try {
    const response = await PlatformAssignmentRoleCandidatesAPI({
      keyword: keyword.value.trim(), page: page.value, pageSize: IAM_DEFAULT_PAGE_SIZE,
    });
    if (current !== request || !roleVisible.value) return;
    roles.value = response.data.items;
    total.value = response.data.total;
  } catch {
    if (current === request) Message.warning("角色候选加载失败，请重试");
  } finally {
    if (current === request) loading.value = false;
  }
};
const privateSearch = (): void => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { page.value = 1; void privateLoad(); }, 250);
};
const privatePage = (value: number): void => {
  page.value = value;
  void privateLoad();
};
const privateChoose = async (role: AuthorizationRoleNode): Promise<void> => {
  if (props.selectedRoleIds.includes(role.id) || loading.value) return;
  loading.value = true;
  try {
    const versions = await PlatformAssignmentRoleCandidatesAPI({
      roleId: role.id, page: 1, pageSize: 1,
    });
    const latest = versions.data.items[0];
    if (!latest?.roleRevisionRef) throw new Error("角色尚无可用版本");
    const detail = await PlatformAssignmentCandidatesAPI({
      kind: "ROLE_REVISION", ids: [latest.id], page: 1, pageSize: 1,
    });
    const selected = detail.data.items[0];
    if (!selected?.roleRevisionRef) throw new Error("角色版本不可用");
    roleId.value = role.id;
    draftName.value = role.name;
    revisionNumber.value = latest.revisionNumber || 0;
    revisionRef.value = selected.roleRevisionRef;
    parameters.value = selected.parameterDefinitions || [];
    option.value = selected;
    bindings.value = Object.fromEntries(parameters.value.map((parameter) =>
      [parameter.key, { kind: parameter.kind, ids: [] }]));
    roleVisible.value = false;
    if (parameters.value.length) scopeVisible.value = true;
    else privateConfirm();
  } catch {
    Message.warning("角色版本已变化或不可用，请重新选择");
  } finally {
    loading.value = false;
  }
};
const privateParameterLabel = (key: string): string => {
  const actions = option.value?.actions || [];
  const grantActionIds = new Set((option.value?.grants || [])
    .filter((grant) => grant.scopes.some((scope) => scope.parameterKey === key))
    .map((grant) => grant.actionId));
  return [...new Set(actions.filter((action) => grantActionIds.has(action.id))
    .map((action) => action.resourceName))].join(" / ") || "指定对象";
};
const privateSetBinding = (key: string, value: string | string[]): void => {
  const binding = bindings.value[key];
  if (binding) bindings.value = {
    ...bindings.value,
    [key]: { ...binding, ids: Array.isArray(value) ? value : value ? [value] : [] },
  };
};
const privateConfigured = (): boolean =>
  parameters.value.every((parameter) =>
    bindings.value[parameter.key]?.kind === ScopeBindingKind.OBJECTS
      && bindings.value[parameter.key].ids.length > 0);
const privateConfirm = (): void => {
  if (!revisionRef.value || !privateConfigured()) return;
  emits("confirm", {
    roleId: roleId.value,
    roleRevisionRef: revisionRef.value,
    scopeBindings: bindings.value,
    name: draftName.value,
    revisionNumber: revisionNumber.value,
  });
  scopeVisible.value = false;
};
defineExpose({
  show() {
    keyword.value = "";
    page.value = 1;
    roleVisible.value = true;
    void privateLoad();
  },
});
onBeforeUnmount(() => { if (searchTimer) clearTimeout(searchTimer); });
</script>
