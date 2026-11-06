<template>
  <in-detail-drawer
    v-model="open"
    v-model:editing="editing"
    v-model:tab="tab"
    :title="record ? '角色详情' : '添加角色'"
    :editable="canEdit"
    :saving="saving"
    @edit="startEdit"
    @cancel="cancel"
    @save="validate"
  >
    <template v-if="record" #identity>
      <in-detail-identity :name="record.name" :show-avatar="false">
        <template #status><in-common-status-tag :status="record.status" /></template>
        <template #more><in-table-actions :actions="actions" :row="record" /></template>
      </in-detail-identity>
    </template>
    <in-biz-tab-panel title="基本信息" name="base" :editable="canEdit">
      <in-form ref="form" :editing="editing" :model="draft" :rules="rules">
        <el-form-item v-if="!record" label="上级角色">
          <el-input
            v-if="parent"
            :model-value="parent.name"
            disabled
            placeholder="上级角色已指定"
          />
          <el-tree-select
            v-else
            v-model="draft.pid"
            class="w-full"
            placeholder="请选择上级角色"
            :data="roleTree.data.value ?? []"
            :props="TreeKeyAndProps.props"
            node-key="id"
            check-strictly
            clearable
          />
        </el-form-item>
        <el-form-item v-if="!record" label="角色类型">
          <el-radio-group v-model="draft.builtIn">
            <el-radio :value="false">自定义</el-radio>
            <el-radio :value="true">内置</el-radio>
          </el-radio-group>
        </el-form-item>
        <in-detail-field label="角色名称" prop="name" :value="record?.name">
          <el-input v-model="draft.name" clearable placeholder="请输入角色名称" />
        </in-detail-field>
        <in-detail-field v-if="record" label="角色编码" :value="record.code" />
        <el-form-item v-else label="角色编码" prop="code">
          <el-input v-model="draft.code" clearable placeholder="请输入角色编码" />
        </el-form-item>
      </in-form>
    </in-biz-tab-panel>
    <in-biz-tab-panel
      v-if="record && canReadBindings"
      title="角色权限"
      name="permissions"
      :editable="false"
    >
      <in-loading :loading="bindingQuery.isFetching.value && !bindingQuery.data.value">
        <div v-if="bindingQuery.isError.value">
          <p>已绑定权限加载失败</p>
          <in-button text @click="bindingQuery.refetch()">重试</in-button>
        </div>
        <in-selection-field
          v-else
          :items="permissionItems"
          :show-avatar="false"
          :disabled="!canBind || !bindingQuery.isSuccess.value"
          :icon="canBind ? 'ep:edit' : false"
          :placeholder="canBind ? '请选择角色权限' : '暂无权限'"
          aria-label="配置角色权限"
          @click="bindingOpen = true"
        />
      </in-loading>
    </in-biz-tab-panel>
  </in-detail-drawer>

  <MemberBindingDialog
    v-model="bindingOpen"
    title="配置角色权限"
    search-placeholder="搜索权限名称或编码"
    :nodes="candidates.data.value ?? []"
    :bound="bound"
    :loading="candidates.isFetching.value"
    :failed="candidates.isError.value"
    :allowed="canBind && bindingQuery.isSuccess.value && candidates.isSuccess.value"
    :save="saveBindings"
    @retry="candidates.refetch()"
    @success="refreshBindings"
  />
</template>

<script setup lang="ts">
import {
  TreeKeyAndProps,
  type MemberRole,
  type MemberRoleTreeNodeVO,
  type PermissionTreeNode,
} from "@/models";
import { MemberAction } from "@/models/actions";
import { BindAuthorityAPI, CreateRoleAPI, DeleteRoleAPI, UpdateRoleAPI } from "@/api/member/role";
import {
  MemberRoleBindAuthoritiesQueryOptions,
  MemberRoleTreeQueryOptions,
  memberRoleQueryKeys,
} from "@/api/member/role.query";
import { MemberPermissionTreeQueryOptions } from "@/api/member/permission.query";
import MemberBindingDialog from "@/components/MemberBindingDialog.vue";
import {
  Message,
  getCommonStatusActionDesc,
  getCommonStatusToggle,
  useCapabilities,
  type InTableAction,
} from "@ingot/admin-core";
import { useQuery, useQueryClient } from "@tanstack/vue-query";

const emit = defineEmits<{ success: [] }>();
const { hasAction } = useCapabilities();
const queryClient = useQueryClient();
const open = ref(false);
const editing = ref(false);
const saving = ref(false);
const bindingOpen = ref(false);
const tab = ref("base");
const record = ref<MemberRoleTreeNodeVO>();
const parent = ref<MemberRoleTreeNodeVO>();
const draft = ref<MemberRole>({});
const form = ref<{ validate: (handler: (valid: boolean) => void) => void }>();
const rules = {
  name: [{ required: true, message: "请输入角色名称", trigger: "blur" }],
  code: [{ required: true, message: "请输入角色编码", trigger: "blur" }],
};

const canEdit = computed(() =>
  hasAction(record.value ? MemberAction.ROLE_UPDATE : MemberAction.ROLE_CREATE),
);
const canReadBindings = computed(() => hasAction(MemberAction.ROLE_PERMISSIONS_QUERY));
const canBind = computed(
  () =>
    open.value &&
    canReadBindings.value &&
    hasAction(MemberAction.ROLE_PERMISSIONS_SET) &&
    hasAction(MemberAction.PERMISSION_QUERY),
);
const roleTree = useQuery(() => ({
  ...MemberRoleTreeQueryOptions(undefined),
  enabled: open.value && !record.value && !parent.value && hasAction(MemberAction.ROLE_QUERY),
}));
const bindingQuery = useQuery(() => ({
  ...MemberRoleBindAuthoritiesQueryOptions(() => record.value?.id ?? ""),
  enabled:
    open.value && tab.value === "permissions" && Boolean(record.value?.id) && canReadBindings.value,
}));
const candidates = useQuery(() => ({
  ...MemberPermissionTreeQueryOptions(undefined),
  enabled: bindingOpen.value && canBind.value,
}));
const bound = computed(() => bindingQuery.data.value ?? []);
const toItems = (nodes: PermissionTreeNode[]): Array<{ id: string; name: string }> =>
  nodes.flatMap(({ id, name, code, children }) => [
    ...(id ? [{ id, name: name || code || id }] : []),
    ...toItems(children ?? []),
  ]);
const permissionItems = computed(() => toItems(bound.value));

const actions = computed<InTableAction<MemberRoleTreeNodeVO>[]>(() => {
  const status = record.value?.status;
  const next = status ? getCommonStatusToggle(status) : undefined;
  return [
    ...(next
      ? [
          {
            key: "status",
            label: getCommonStatusActionDesc(next),
            kind: "default" as const,
            overflow: "always" as const,
            permission: MemberAction.ROLE_UPDATE,
            confirm: "确定更改此角色的状态？",
            onSelect: (row: MemberRoleTreeNodeVO) => {
              if (row.id && hasAction(MemberAction.ROLE_UPDATE))
                void mutate(() => UpdateRoleAPI({ id: row.id, status: next }));
            },
          },
        ]
      : []),
    {
      key: "delete",
      label: "删除角色",
      kind: "danger",
      overflow: "always",
      permission: MemberAction.ROLE_DELETE,
      confirm: "确定删除此角色？",
      onSelect: (row) => {
        if (row.id && hasAction(MemberAction.ROLE_DELETE))
          void mutate(() => DeleteRoleAPI(row.id!));
      },
    },
  ];
});

watch(canBind, (allowed) => {
  if (!allowed) bindingOpen.value = false;
});

function startEdit(): void {
  if (record.value && canEdit.value) {
    draft.value = { name: record.value.name };
    editing.value = true;
  }
}

function cancel(): void {
  editing.value = false;
  if (!record.value) open.value = false;
}

function validate(): void {
  form.value?.validate((valid) => {
    if (!valid || !canEdit.value || !editing.value) return;
    const target = record.value;
    if (target && draft.value.name === target.name) {
      editing.value = false;
      return;
    }
    void mutate(() =>
      target
        ? UpdateRoleAPI({ id: target.id, name: draft.value.name })
        : CreateRoleAPI({ ...draft.value }),
    );
  });
}

async function mutate(request: () => Promise<unknown>): Promise<void> {
  if (saving.value) return;
  saving.value = true;
  const target = record.value;
  try {
    await request();
    if (record.value === target) {
      editing.value = false;
      open.value = false;
    }
    Message.success("操作成功");
    emit("success");
  } catch {
    // 请求层展示错误，保留当前编辑。
  } finally {
    saving.value = false;
  }
}

function saveBindings(ids: string[]): Promise<unknown> {
  const id = record.value?.id;
  if (!id || !canBind.value) return Promise.reject();
  return BindAuthorityAPI({ id, setIds: ids });
}

function refreshBindings(): void {
  const id = record.value?.id;
  if (id) void queryClient.invalidateQueries({ queryKey: memberRoleQueryKeys.permissions(id) });
  Message.success("已更新角色权限");
}

defineExpose({
  show(row?: MemberRoleTreeNodeVO, addChild = false) {
    record.value = addChild ? undefined : row;
    parent.value = addChild ? row : undefined;
    draft.value = { pid: parent.value?.id, builtIn: false };
    tab.value = "base";
    bindingOpen.value = false;
    editing.value = !record.value;
    open.value = true;
  },
});
</script>
