<template>
  <in-drawer :title="title" v-model="visible" width="720px">
    <div class="mb-12px text-12px text-[var(--in-text-color-secondary)]">
      整体替换当前角色的平台默认数据范围。全部仅消去该资源行过滤，不会扩大其它资源。
    </div>
    <in-table
      :data="items"
      :headers="headers"
      :table-id="DATA_RULE_TABLE_ID"
      density="compact"
      row-key="__key"
    >
      <template #tools-end>
        <in-button type="primary" @click="privateOnAdd">添加规则</in-button>
      </template>
      <template #permissionId="{ item }">
        <in-select
          w-full
          filterable
          v-model="item.permissionId"
          placeholder="选择操作权限"
          :options="permissionOptions"
          @onChanged="privateOnPermissionChange(item)"
        />
      </template>
      <template #resourceId="{ item }">
        <span>{{ resourceLabel(item.resourceId) }}</span>
      </template>
      <template #scopeType="{ item }">
        <in-select w-full v-model="item.scopeType" :options="scopeOptions" />
      </template>
      <template #actions="{ item }">
        <in-button text type="danger" @click="privateOnRemove(item.__key)">删除</in-button>
      </template>
    </in-table>
    <template #footer>
      <in-button @click="visible = false">取消</in-button>
      <in-button :loading="saving" type="primary" @click="privateOnSave">保存</in-button>
    </template>
  </in-drawer>
</template>

<script setup lang="ts">
import type { RoleDataRuleItemDTO, PermissionTreeNode } from "@/models";
import { DataScopeTypeEnum, PermissionNodeTypeEnum, useDataScopeTypeEnum } from "@/models/enums";
import { SetRoleDataRulesAPI } from "@/api/platform/config/role";
import {
  PlatformRoleBindAuthoritiesQueryOptions,
  PlatformRoleDataRulesQueryOptions,
  platformRoleQueryKeys,
} from "@/api/platform/config/role.query";
import { silentQueryRequest } from "@ingot/admin-core";
import { useQuery, useQueryClient } from "@tanstack/vue-query";

interface DraftItem extends RoleDataRuleItemDTO {
  __key: string;
}

const DATA_RULE_TABLE_ID = "platform-config-role-data-rules";

const headers = [
  { label: "操作权限", prop: "permissionId", minWidth: "240" },
  { label: "资源", prop: "resourceId", width: "160" },
  { label: "范围", prop: "scopeType", width: "160" },
  { label: "操作", prop: "actions", width: "90", fixed: "right" as const },
];

const visible = ref(false);
const title = ref("数据范围");
const roleId = ref("");
const items = ref<Array<DraftItem>>([]);
const saving = ref(false);
const message = useMessage();
const queryClient = useQueryClient();
const scopeEnum = useDataScopeTypeEnum();
const scopeOptions = computed(() =>
  scopeEnum.getOptions().filter((item) => item.value !== DataScopeTypeEnum.CUSTOM),
);

const permissionQuery = useQuery(() => ({
  ...PlatformRoleBindAuthoritiesQueryOptions(() => roleId.value),
  enabled: visible.value && Boolean(roleId.value),
}));
const rulesQuery = useQuery(() => ({
  ...PlatformRoleDataRulesQueryOptions(() => roleId.value),
  enabled: visible.value && Boolean(roleId.value),
}));

const flattenActions = (nodes: Array<PermissionTreeNode>): Array<{ label: string; value: string; resourceId?: string }> => {
  const result: Array<{ label: string; value: string; resourceId?: string }> = [];
  const walk = (list: Array<PermissionTreeNode>): void => {
    list.forEach((item) => {
      if (item.nodeType === PermissionNodeTypeEnum.Action && item.id && !item.code?.includes("*")) {
        result.push({
          label: item.code ? `${item.name}（${item.code}）` : (item.name ?? item.id),
          value: item.id,
          resourceId: item.resourceId,
        });
      }
      if (item.children?.length) {
        walk(item.children);
      }
    });
  };
  walk(nodes);
  return result;
};

const permissionOptions = computed(() => flattenActions(permissionQuery.data.value ?? []));

const resourceLabel = (resourceId?: string): string => {
  if (!resourceId) {
    return "未绑定资源";
  }
  const hit = permissionOptions.value.find((item) => item.resourceId === resourceId);
  return hit?.resourceId ?? resourceId;
};

const privateOnPermissionChange = (item: DraftItem): void => {
  const hit = permissionOptions.value.find((option) => option.value === item.permissionId);
  item.resourceId = hit?.resourceId;
};

const privateOnAdd = (): void => {
  items.value.push({
    __key: `${Date.now()}-${items.value.length}`,
    permissionId: undefined,
    resourceId: undefined,
    scopeType: DataScopeTypeEnum.DEPT,
    scopes: [],
  });
};

const privateOnRemove = (key: string): void => {
  items.value = items.value.filter((item) => item.__key !== key);
};

const privateOnSave = (): void => {
  const payload = items.value
    .filter((item) => item.permissionId && item.resourceId && item.scopeType !== undefined)
    .map((item) => ({
      permissionId: item.permissionId,
      resourceId: item.resourceId,
      scopeType: item.scopeType,
      scopes: [],
    }));
  if (items.value.length > 0 && payload.length !== items.value.length) {
    message.warning("请为每条规则选择已绑定资源的操作权限和范围");
    return;
  }
  saving.value = true;
  SetRoleDataRulesAPI(roleId.value, { items: payload }, silentQueryRequest())
    .then(() => {
      message.success("保存成功");
      visible.value = false;
      void queryClient.invalidateQueries({ queryKey: platformRoleQueryKeys.dataRules(roleId.value) });
    })
    .finally(() => {
      saving.value = false;
    });
};

watch(
  () => rulesQuery.data.value,
  (data) => {
    items.value = (data ?? []).map((item, index) => ({
      ...item,
      __key: item.id ?? `${index}`,
      scopes: [],
    }));
  },
);

defineExpose({
  show(id: string, name?: string): void {
    roleId.value = id;
    title.value = name ? `数据范围 · ${name}` : "数据范围";
    visible.value = true;
  },
});
</script>
