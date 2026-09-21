<template>
  <in-drawer v-model="visible" title="开通应用" size="640px">
    <in-form-skeleton v-if="loading" />
    <template v-else>
    <el-alert
      class="mb-12px"
      type="info"
      :closable="false"
      title="应用可用不等于业务操作。人群只决定谁能看见该应用，不授予角色或操作。"
    />
    <in-form v-if="audience" :editing="true">
      <el-form-item label="应用">
        <span>{{ title }}</span>
      </el-form-item>
      <el-form-item label="可用人群">
        <el-radio-group v-model="kind">
          <el-radio v-for="option in kindOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <template v-if="kind === AudienceKind.SELECTED">
        <biz-iam-selection-editor
          v-model="selection"
          :load-members="loadMembers"
          :load-departments="loadDepartments"
        />
        <el-form-item label="用户组">
          <biz-iam-chip-page-select
            v-model="groupIds"
            :load-data="loadGroups"
            placeholder="远程分页添加组"
            empty-text="未选择组"
          />
        </el-form-item>
      </template>
      <div class="flex flex-wrap gap-8px">
        <in-button type="primary" :loading="saving" :disabled="!canUpdate" @in-click="privateSave">
          保存人群
        </in-button>
      </div>
    </in-form>
    <in-form class="mt-16px" :editing="false">
      <el-form-item label="角色操作候选">
        <el-table :data="actions" size="small">
          <el-table-column prop="record.name" label="名称" />
          <el-table-column prop="record.code" label="操作码" />
        </el-table>
      </el-form-item>
    </in-form>
    </template>
  </in-drawer>
</template>

<script setup lang="ts">
import { Message, createLoadGuard } from "@ingot/admin-core";
import {
  AudienceKind,
  BizIamChipPageSelect,
  BizIamSelectionEditor,
  IamAction,
  createIamListLoader,
  emptySelection,
  objectActionAllowed,
  toIamSelectRecords,
  useAudienceKindEnum,
  type AudienceDraft,
  type ActionRecord,
  type ResourceDetail,
} from "@ingot/admin-common";
import {
  TenantApplicationActionPageAPI,
  TenantApplicationAudienceAPI,
  TenantApplicationAudienceUpdateAPI,
  TenantDepartmentPageAPI,
  TenantGroupPageAPI,
  TenantMemberPageAPI,
} from "@/api/iam/directory";
import type { Row } from "../table";

defineOptions({ name: "ApplicationDetailDrawer" });

const visible = ref(false);
const loading = ref(false);
const saving = ref(false);
const title = ref("");
const applicationId = ref("");
const audience = ref<ResourceDetail<AudienceDraft>>();
const kind = ref<AudienceKind>(AudienceKind.ALL);
const selection = ref(emptySelection());
const groupIds = ref<string[]>([]);
const actions = ref<Array<ResourceDetail<ActionRecord>>>([]);
const kindOptions = useAudienceKindEnum().getOptions();
const loadGuard = createLoadGuard();

const loadMembers = createIamListLoader(async (page, condition) => {
  const response = await TenantMemberPageAPI(page, condition);
  return { data: toIamSelectRecords(response.data) };
});
const loadDepartments = createIamListLoader(async (page, condition) => {
  const response = await TenantDepartmentPageAPI(page, condition);
  return { data: toIamSelectRecords(response.data) };
});
const loadGroups = createIamListLoader(async (page, condition) => {
  const response = await TenantGroupPageAPI(page, condition);
  return { data: toIamSelectRecords(response.data) };
});

const canUpdate = computed(
  () => objectActionAllowed(audience.value?.capabilities, IamAction.TENANT_AUDIENCE_UPDATE).allowed,
);

const privateSave = (): void => {
  if (!audience.value) {
    return;
  }
  const next: AudienceDraft =
    kind.value === AudienceKind.ALL
      ? { kind: AudienceKind.ALL, groupIds: [] }
      : { kind: AudienceKind.SELECTED, selection: selection.value, groupIds: groupIds.value };
  saving.value = true;
  TenantApplicationAudienceUpdateAPI(applicationId.value, {
    expectedVersion: audience.value.version,
    audience: next,
  })
    .then((response) => {
      audience.value = response.data;
      Message.success("人群已保存");
    })
    .finally(() => {
      saving.value = false;
    });
};

defineExpose({
  show(row: Row) {
    const id = row.record.applicationId;
    const guard = loadGuard.begin();
    visible.value = true;
    applicationId.value = id;
    title.value = row.record.applicationName || id;
    audience.value = undefined;
    actions.value = [];
    loading.value = true;
    Promise.all([
      TenantApplicationAudienceAPI(id),
      TenantApplicationActionPageAPI(id, { current: 1, size: 20 }),
    ])
      .then(([audienceResponse, actionResponse]) => {
        if (!guard.isCurrent()) {
          return;
        }
        audience.value = audienceResponse.data;
        kind.value = audienceResponse.data.record.kind;
        selection.value = audienceResponse.data.record.selection ?? emptySelection();
        groupIds.value = [...audienceResponse.data.record.groupIds];
        actions.value = actionResponse.data.records ?? [];
      })
      .finally(() => {
        if (guard.isCurrent()) {
          loading.value = false;
        }
      });
  },
});
</script>
