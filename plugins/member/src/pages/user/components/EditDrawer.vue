<template>
  <in-detail-drawer
    v-model="visible"
    v-model:tab="tab"
    v-model:editing="editing"
    title="App 用户详情"
    :editable="Boolean(profile) && hasAction(MemberAction.USER_UPDATE)"
    :loading="profileQuery.isFetching.value && !profile"
    :saving="saving"
    @edit="startEdit"
    @cancel="cancelEdit"
    @save="saveProfile"
  >
    <template #identity>
      <in-detail-identity
        v-if="profile"
        v-model:avatar="draft.avatar"
        :name="profile.nickname || profile.username"
        :src="profile.avatar"
        :editable="editing && hasAction(MemberAction.USER_UPDATE)"
        upload-dir="user/avatar"
      >
        <template #status>
          <in-account-status-tag :enabled="profile.enabled" :locked="profile.locked" />
        </template>
        <template #more>
          <in-table-actions :actions="actions" :row="profile" />
        </template>
      </in-detail-identity>
    </template>
    <in-biz-tab-panel
      title="基本资料"
      name="base"
      :editable="Boolean(profile) && hasAction(MemberAction.USER_UPDATE)"
    >
      <in-form v-if="profile" ref="form" :editing="editing" :model="draft" :rules="rules">
        <in-detail-field label="账号" :value="profile.username" />
        <in-detail-field label="姓名" prop="nickname" :value="profile.nickname">
          <el-input v-model="draft.nickname" clearable placeholder="请输入姓名" />
        </in-detail-field>
        <in-detail-field label="手机号" prop="phone" :value="profile.phone">
          <el-input v-model="draft.phone" clearable placeholder="请输入手机号" />
        </in-detail-field>
        <in-detail-field label="邮箱" :value="profile.email">
          <el-input v-model="draft.email" clearable placeholder="请输入邮箱" />
        </in-detail-field>
      </in-form>
      <div v-else-if="profileQuery.isError.value" class="py-4">
        <p>用户详情加载失败</p>
        <in-button text @click="profileQuery.refetch()">重试</in-button>
      </div>
    </in-biz-tab-panel>
    <in-biz-tab-panel v-if="canReadRoles" title="用户角色" name="roles" :editable="false">
      <in-loading :loading="rolesQuery.isFetching.value && !rolesQuery.data.value">
        <div v-if="rolesQuery.isError.value">
          <p>已分配角色加载失败</p>
          <in-button text @click="rolesQuery.refetch()">重试</in-button>
        </div>
        <in-selection-field
          v-else
          :items="roleItems"
          :show-avatar="false"
          :disabled="!canBind || !rolesQuery.isSuccess.value"
          :icon="canBind ? 'ep:edit' : false"
          :placeholder="canBind ? '请选择用户角色' : '暂无角色'"
          aria-label="配置用户角色"
          @click="bindingOpen = true"
        />
        <p class="mt-2 text-sm" style="color: var(--in-text-color-secondary)">内置角色自动分配。</p>
      </in-loading>
    </in-biz-tab-panel>
  </in-detail-drawer>

  <MemberBindingDialog
    v-model="bindingOpen"
    title="配置用户角色"
    search-placeholder="搜索角色名或编码"
    :nodes="candidates.data.value ?? []"
    :bound="roles"
    :loading="candidates.isFetching.value"
    :failed="candidates.isError.value"
    :allowed="canBind && rolesQuery.isSuccess.value && candidates.isSuccess.value"
    :save="saveRoles"
    independent
    @retry="candidates.refetch()"
    @success="refreshRoles"
  />
</template>

<script setup lang="ts">
import type { MemberUser, MemberUserDTO, MemberUserProfileVO } from "@/models";
import { MemberAction } from "@/models/actions";
import { RemoveUserAPI, SetUserRoleAPI, UpdateUserAPI } from "@/api/member/user";
import {
  MemberUserProfileQueryOptions,
  MemberUserRolesQueryOptions,
  memberUserQueryKeys,
} from "@/api/member/user.query";
import { MemberRoleTreeQueryOptions } from "@/api/member/role.query";
import MemberBindingDialog from "@/components/MemberBindingDialog.vue";
import { Message, useCapabilities, type InTableAction } from "@ingot/admin-core";
import { useQuery, useQueryClient } from "@tanstack/vue-query";

const emit = defineEmits<{ success: [] }>();
const { hasAction } = useCapabilities();
const queryClient = useQueryClient();
const visible = ref(false);
const editing = ref(false);
const saving = ref(false);
const bindingOpen = ref(false);
const tab = ref("base");
const id = ref("");
const draft = reactive<MemberUserDTO>({});
const form = ref<{ validate: (handler: (valid: boolean) => void) => void }>();
const rules = {
  phone: [{ required: true, message: "请输入手机号", trigger: "blur" }],
  nickname: [{ required: true, message: "请输入姓名", trigger: "blur" }],
};

const profileQuery = useQuery(() => ({
  ...MemberUserProfileQueryOptions(id),
  enabled: visible.value && Boolean(id.value) && hasAction(MemberAction.USER_DETAIL),
}));
const profile = computed(() => profileQuery.data.value);
const canReadRoles = computed(() => hasAction(MemberAction.USER_ROLES_QUERY));
const canBind = computed(
  () =>
    visible.value &&
    canReadRoles.value &&
    hasAction(MemberAction.USER_ROLES_SET) &&
    hasAction(MemberAction.ROLE_QUERY),
);
const rolesQuery = useQuery(() => ({
  ...MemberUserRolesQueryOptions(id.value),
  enabled: visible.value && tab.value === "roles" && Boolean(id.value) && canReadRoles.value,
}));
const candidates = useQuery(() => ({
  ...MemberRoleTreeQueryOptions(undefined),
  enabled: bindingOpen.value && canBind.value,
}));
const roles = computed(() => rolesQuery.data.value ?? []);
const roleItems = computed(() =>
  roles.value.flatMap((role) =>
    role.id ? [{ id: role.id, name: role.name || role.code || role.id }] : [],
  ),
);
const actions: InTableAction<MemberUserProfileVO>[] = [
  {
    key: "delete",
    label: "删除用户",
    kind: "danger",
    overflow: "always",
    permission: MemberAction.USER_DELETE,
    confirm: "确定删除此 App 用户？",
    onSelect: (row) => {
      void removeUser(row);
    },
  },
];

watch(canBind, (allowed) => {
  if (!allowed) bindingOpen.value = false;
});

function startEdit(): void {
  if (!profile.value || !hasAction(MemberAction.USER_UPDATE)) return;
  const { nickname, phone, email } = profile.value;
  Object.assign(draft, { nickname, phone, email, avatar: undefined });
  editing.value = true;
}

function cancelEdit(): void {
  draft.avatar = undefined;
  editing.value = false;
}

function saveProfile(): void {
  form.value?.validate((valid) => {
    if (valid) void updateProfile();
  });
}

async function updateProfile(): Promise<void> {
  const source = profile.value;
  if (!source || !editing.value || saving.value || !hasAction(MemberAction.USER_UPDATE)) return;
  const target = id.value;
  const patch: MemberUserDTO = { id: target };
  for (const field of ["nickname", "phone", "email", "avatar"] as const) {
    if (draft[field] !== undefined && draft[field] !== source[field]) patch[field] = draft[field];
  }
  if (Object.keys(patch).length === 1) {
    editing.value = false;
    return;
  }
  saving.value = true;
  try {
    await UpdateUserAPI(patch);
    await queryClient.invalidateQueries({
      queryKey: memberUserQueryKeys.detail(target),
      exact: true,
    });
    if (visible.value && id.value === target) editing.value = false;
    Message.success("已保存用户资料");
    emit("success");
  } catch {
    // 请求层展示错误，保留编辑内容。
  } finally {
    saving.value = false;
  }
}

async function removeUser(row: MemberUserProfileVO): Promise<void> {
  if (!row.id || !hasAction(MemberAction.USER_DELETE)) return;
  try {
    await RemoveUserAPI(row.id);
    if (id.value === row.id) visible.value = false;
    Message.success("已删除用户");
    emit("success");
  } catch {
    // 请求层展示错误。
  }
}

function saveRoles(ids: string[]): Promise<unknown> {
  if (!canBind.value || !id.value) return Promise.reject();
  return SetUserRoleAPI({ id: id.value, setIds: ids });
}

function refreshRoles(): void {
  void queryClient.invalidateQueries({ queryKey: memberUserQueryKeys.detail(id.value) });
  Message.success("已更新用户角色");
}

defineExpose({
  show(row: MemberUser) {
    if (!row.id || !hasAction(MemberAction.USER_DETAIL)) return;
    id.value = row.id;
    tab.value = "base";
    editing.value = false;
    bindingOpen.value = false;
    draft.avatar = undefined;
    visible.value = true;
  },
});
</script>
