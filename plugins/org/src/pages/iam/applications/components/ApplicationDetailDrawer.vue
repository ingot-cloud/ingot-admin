<template>
  <in-detail-drawer
    v-model="visible"
    v-model:tab="tab"
    v-model:editing="editing"
    title="应用详情"
    edit-label="编辑可用人群"
    size="720px"
    :saving="session.saving.value"
    @edit="privateEnterEdit"
    @cancel="privateCancel"
    @save="privateSave"
  >
    <template #identity>
      <div class="app-detail-drawer__identity">
        <in-application-icon :icon="icon" class="app-detail-drawer__icon" />
        <span class="app-detail-drawer__name">{{ title }}</span>
      </div>
    </template>
    <in-biz-tab-panel title="权限" name="permissions" :editable="false" fill>
      <in-form-skeleton v-if="catalogLoading" />
      <div v-else-if="catalogError" class="app-detail-drawer__state">
        <el-alert title="权限加载失败" type="error" :closable="false" />
        <in-button @in-click="privateLoadCatalog">重试</in-button>
      </div>
      <div v-else class="permission-pane">
        <div class="permission-pane__toolbar">拥有 {{ actionCount }} 个权限</div>
        <div class="permission-pane__tree">
          <div v-if="!permissionNodes.length" class="app-detail-drawer__empty">暂无权限</div>
          <in-tree
            v-else
            :data="permissionNodes"
            node-key="id"
            :props="treeProps"
            default-expand-all
          />
        </div>
      </div>
    </in-biz-tab-panel>
    <in-biz-tab-panel title="可用人群" name="audience" :editable="canUpdate">
      <in-form-skeleton v-if="audienceLoading" />
      <div v-else-if="audienceError" class="app-detail-drawer__state">
        <el-alert title="可用人群加载失败" type="error" :closable="false" />
        <in-button @in-click="privateLoadAudience(true)">重试</in-button>
      </div>
      <template v-else-if="audience">
        <el-alert
          class="audience-form__note"
          type="info"
          :closable="false"
          title="应用可用不等于业务操作。人群只决定谁能看见该应用，不授予角色或操作。"
        />
        <in-form :editing="editing">
          <in-detail-field label="可用人群" :value="kindLabel">
            <el-radio-group v-model="kind">
              <el-radio v-for="option in kindOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </el-radio>
            </el-radio-group>
          </in-detail-field>
          <template v-if="kind === AudienceKind.SELECTED">
            <in-detail-field label="成员" :value="memberText">
              <biz-tenant-member-select
                v-model="memberIds"
                multiple
                :options="memberOptions"
                :load-members="loadMembers"
                placeholder="请选择成员"
              />
            </in-detail-field>
            <in-detail-field label="部门" :value="departmentText">
              <group-department-field v-model="departments" :default-include-descendants="false" />
            </in-detail-field>
            <in-detail-field label="用户组" :value="groupText">
              <group-picker-field v-model="groups" />
            </in-detail-field>
          </template>
        </in-form>
      </template>
    </in-biz-tab-panel>
  </in-detail-drawer>
</template>

<script setup lang="ts">
import { Message, createLoadGuard, useDetailEditSession } from "@ingot/admin-core";
import {
  AudienceKind,
  BizTenantMemberSelect,
  IamAction,
  iamEditorFailure,
  objectActionAllowed,
  useAudienceKindEnum,
  type AppActionCatalogView,
  type AudienceDraft,
  type AudienceView,
  type IamSelectOption,
  type ResourceDetail,
} from "@ingot/admin-common";
import {
  TenantApplicationActionCatalogAPI,
  TenantApplicationAudienceAPI,
  TenantApplicationAudienceUpdateAPI,
  TenantMemberPickerLoad,
} from "@/api/iam/directory";
import GroupDepartmentField, {
  type GroupDepartmentDraft,
} from "../../groups/components/GroupDepartmentField.vue";
import GroupPickerField from "../../groups/components/GroupPickerField.vue";
import type { Row } from "../table";

defineOptions({ name: "ApplicationDetailDrawer" });

interface PermissionNode {
  id: string;
  name: string;
  children?: PermissionNode[];
}

const PERMISSION_TAB = "permissions";
const AUDIENCE_TAB = "audience";
const treeProps = { label: "name", children: "children" };

const session = useDetailEditSession();
const { editing } = session;
const visible = ref(false);
const tab = ref(PERMISSION_TAB);
const title = ref("");
const icon = ref<string>();
const applicationId = ref("");
const catalogLoading = ref(false);
const catalogError = ref(false);
const catalog = ref<AppActionCatalogView>();
const audienceLoading = ref(false);
const audienceError = ref(false);
const audience = ref<ResourceDetail<AudienceView>>();
const loadedAudienceId = ref("");
const kind = ref<AudienceKind>(AudienceKind.ALL);
const memberIds = ref<string[]>([]);
const memberOptions = ref<IamSelectOption[]>([]);
const departments = ref<GroupDepartmentDraft[]>([]);
const groups = ref<IamSelectOption[]>([]);
const kindOptions = useAudienceKindEnum().getOptions();
const catalogGuard = createLoadGuard();
const audienceGuard = createLoadGuard();

const loadMembers = TenantMemberPickerLoad;

const permissionNodes = computed<PermissionNode[]>(() =>
  (catalog.value?.resources ?? []).map((resource) => ({
    id: `resource:${resource.id}`,
    name: resource.name,
    children: resource.actions.map((action) => ({
      id: `action:${action.id}`,
      name: action.name,
    })),
  })),
);
const actionCount = computed(() =>
  (catalog.value?.resources ?? []).reduce((sum, resource) => sum + resource.actions.length, 0),
);
const canUpdate = computed(
  () => objectActionAllowed(audience.value?.capabilities, IamAction.TENANT_AUDIENCE_UPDATE).allowed,
);
const kindLabel = computed(
  () => kindOptions.find((option) => option.value === kind.value)?.label ?? "",
);
const memberText = computed(() => memberOptions.value.map((item) => item.name).join("、"));
const departmentText = computed(() =>
  departments.value
    .map((item) => (item.includeDescendants ? `${item.name}（含下级）` : item.name))
    .join("、"),
);
const groupText = computed(() => groups.value.map((item) => item.name).join("、"));

const privateLoadCatalog = (): void => {
  const id = applicationId.value;
  const guard = catalogGuard.begin();
  catalogLoading.value = true;
  catalogError.value = false;
  TenantApplicationActionCatalogAPI(id)
    .then((response) => {
      if (!guard.isCurrent()) {
        return;
      }
      catalog.value = response.data;
    })
    .catch((error: unknown) => {
      if (!guard.isCurrent()) {
        return;
      }
      catalogError.value = true;
      void iamEditorFailure(error);
    })
    .finally(() => {
      if (guard.isCurrent()) {
        catalogLoading.value = false;
      }
    });
};

const privateApplyAudience = (detail: ResourceDetail<AudienceView>): void => {
  audience.value = detail;
  kind.value = detail.record.kind;
  memberIds.value = detail.record.members.map((item) => item.id);
  memberOptions.value = detail.record.members.map((item) => ({
    id: item.id,
    name: item.name,
    avatar: item.avatar,
  }));
  departments.value = detail.record.departments.map((item) => ({
    id: item.id,
    name: item.name,
    includeDescendants: item.includeDescendants,
  }));
  groups.value = detail.record.groups.map((item) => ({ id: item.id, name: item.name }));
};

const privateLoadAudience = (force = false): void => {
  const id = applicationId.value;
  if (!force && loadedAudienceId.value === id && audience.value) {
    return;
  }
  const guard = audienceGuard.begin();
  audienceLoading.value = true;
  audienceError.value = false;
  TenantApplicationAudienceAPI(id)
    .then((response) => {
      if (!guard.isCurrent()) {
        return;
      }
      privateApplyAudience(response.data);
      loadedAudienceId.value = id;
    })
    .catch((error: unknown) => {
      if (!guard.isCurrent()) {
        return;
      }
      audienceError.value = true;
      loadedAudienceId.value = "";
      void iamEditorFailure(error);
    })
    .finally(() => {
      if (guard.isCurrent()) {
        audienceLoading.value = false;
      }
    });
};

watch(tab, (value) => {
  if (value === AUDIENCE_TAB && applicationId.value) {
    privateLoadAudience();
  }
});

const privateEnterEdit = (): void => {
  if (!canUpdate.value || !audience.value) {
    session.exitEdit();
    return;
  }
  privateApplyAudience(audience.value);
  session.enterEdit();
};

const privateCancel = (): void => {
  session.exitEdit();
  if (audience.value) {
    privateApplyAudience(audience.value);
  }
};

const privateSave = (): void => {
  if (!audience.value || session.saving.value) {
    return;
  }
  const next: AudienceDraft =
    kind.value === AudienceKind.ALL
      ? { kind: AudienceKind.ALL, groupIds: [] }
      : {
          kind: AudienceKind.SELECTED,
          selection: {
            members: [...memberIds.value],
            departments: departments.value.map((item) => ({
              id: item.id,
              includeDescendants: item.includeDescendants,
            })),
          },
          groupIds: groups.value.map((item) => item.id),
        };
  session.saving.value = true;
  TenantApplicationAudienceUpdateAPI(applicationId.value, {
    expectedVersion: audience.value.version,
    audience: next,
  })
    .then((response) => {
      privateApplyAudience(response.data);
      session.exitEdit();
      Message.success("人群已保存");
    })
    .finally(() => {
      session.saving.value = false;
    });
};

defineExpose({
  async show(row: Row) {
    if (visible.value && !(await session.confirmLeave())) {
      return;
    }
    const id = row.record.applicationId;
    session.exitEdit();
    visible.value = true;
    tab.value = PERMISSION_TAB;
    applicationId.value = id;
    title.value = row.record.applicationName || id;
    icon.value = row.record.icon;
    catalog.value = undefined;
    catalogError.value = false;
    audience.value = undefined;
    audienceError.value = false;
    loadedAudienceId.value = "";
    memberIds.value = [];
    memberOptions.value = [];
    departments.value = [];
    groups.value = [];
    privateLoadCatalog();
  },
});
</script>

<style lang="postcss" scoped>
.app-detail-drawer__identity {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: var(--in-space-3);
  min-width: 0;
  padding: var(--in-space-5);
}

.app-detail-drawer__icon {
  flex: none;
  font-size: 32px;
}

.app-detail-drawer__name {
  min-width: 0;
  overflow: hidden;
  font-size: 18px;
  line-height: var(--in-line-height-body);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-detail-drawer__state {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--in-space-3);
}

.app-detail-drawer__empty {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.audience-form__note {
  margin-bottom: var(--in-space-5);
}

.permission-pane {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.permission-pane__toolbar {
  flex-shrink: 0;
  margin-bottom: var(--in-space-4);
}

.permission-pane__tree {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
</style>
