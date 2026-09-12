<template>
  <in-drawer :title="title" v-model="visible" width="760px">
    <div class="mb-12px text-12px text-[var(--in-text-color-secondary)]">
      此处仅维护本租户追加规则，不能修改平台默认层。空列表表示清空本租户追加层。
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
        <span>{{ item.resourceId || "未绑定资源" }}</span>
      </template>
      <template #scopeType="{ item }">
        <in-select w-full v-model="item.scopeType" :options="scopeEnum.getOptions()" />
      </template>
      <template #scopes="{ item }">
        <BizDeptSelect
          v-if="item.scopeType === DataScopeTypeEnum.CUSTOM"
          w-full
          multiple
          v-model="item.scopes"
          clearable
        />
        <span v-else>-</span>
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
import type { BizPermissionTreeNodeVO, RoleDataRuleItemDTO } from "@/models";
import { DataScopeTypeEnum, useDataScopeTypeEnum } from "@/models/enums";
import { SetRoleDataRulesAPI } from "@/api/org/role";
import {
  OrgRoleBindAuthoritiesQueryOptions,
  OrgRoleDataRulesQueryOptions,
  orgRoleQueryKeys,
} from "@/api/org/role.query";
import { silentQueryRequest } from "@ingot/admin-core";
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import BizDeptSelect from "@/components/biz/dept-select/BizDeptSelect.vue";

const ACTION_NODE_TYPE = "2";

interface DraftItem extends RoleDataRuleItemDTO {
  __key: string;
}

const DATA_RULE_TABLE_ID = "org-contacts-role-data-rules";

const headers = [
  { label: "操作权限", prop: "permissionId", minWidth: "220" },
  { label: "资源", prop: "resourceId", width: "140" },
  { label: "范围", prop: "scopeType", width: "140" },
  { label: "部门", prop: "scopes", minWidth: "180" },
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

const permissionQuery = useQuery(() => ({
  ...OrgRoleBindAuthoritiesQueryOptions(() => roleId.value),
  enabled: visible.value && Boolean(roleId.value),
}));
const rulesQuery = useQuery(() => ({
  ...OrgRoleDataRulesQueryOptions(() => roleId.value),
  enabled: visible.value && Boolean(roleId.value),
}));

const flattenActions = (
  nodes: Array<BizPermissionTreeNodeVO>,
): Array<{ label: string; value: string; resourceId?: string }> => {
  const result: Array<{ label: string; value: string; resourceId?: string }> = [];
  const walk = (list: Array<BizPermissionTreeNodeVO>): void => {
    list.forEach((item) => {
      if (item.nodeType === ACTION_NODE_TYPE && item.id && !item.code?.includes("*")) {
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
  const payload: Array<RoleDataRuleItemDTO> = [];
  for (const item of items.value) {
    if (!item.permissionId || !item.resourceId || item.scopeType === undefined) {
      message.warning("请为每条规则选择已绑定资源的操作权限和范围");
      return;
    }
    if (item.scopeType === DataScopeTypeEnum.CUSTOM && !item.scopes?.length) {
      message.warning("指定部门时请选择部门");
      return;
    }
    payload.push({
      permissionId: item.permissionId,
      resourceId: item.resourceId,
      scopeType: item.scopeType,
      scopes: item.scopeType === DataScopeTypeEnum.CUSTOM ? item.scopes : [],
    });
  }
  saving.value = true;
  SetRoleDataRulesAPI(roleId.value, { items: payload }, silentQueryRequest())
    .then(() => {
      message.success("保存成功");
      visible.value = false;
      void queryClient.invalidateQueries({ queryKey: orgRoleQueryKeys.dataRules(roleId.value) });
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
      scopes: item.scopes ?? [],
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
