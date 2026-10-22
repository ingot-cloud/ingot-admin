<template>
  <in-drawer
    v-model="visible"
    :title="editingProfile ? '' : '角色详情'"
    size="720px"
    layout="pinned"
    padding="0"
  >
    <template v-if="editingProfile" #header>
      <div class="flex items-center gap-12px min-w-0">
        <button type="button" class="profile-back" aria-label="返回" @click="editingProfile = false">
          <in-icon name="ep:arrow-left" />
        </button>
        <span class="profile-title">编辑角色信息</span>
        <span class="text-[var(--el-text-color-secondary)]">角色详情</span>
      </div>
    </template>
    <div class="in-detail-drawer role-detail-drawer">
      <in-form-skeleton v-if="loading && !detail" />
      <div v-else-if="detailError && !detail" class="p-20px">
        <el-alert title="角色资料加载失败" type="error" :closable="false" />
        <in-button @in-click="privateLoad()">重试</in-button>
      </div>
      <div v-else-if="detail && !editingProfile" class="role-detail-drawer__body">
        <div class="role-detail-drawer__identity px-20px py-20px flex flex-col gap-8px">
          <div class="flex items-center gap-8px min-w-0 flex-wrap">
            <span class="text-18px truncate">{{ detail.record.name || "未命名角色" }}</span>
            <biz-iam-status-tag
              v-if="knownStatus(detail.record.status)"
              :status="detail.record.status"
            />
            <in-tag v-if="sharedReadonly" size="small" :value="SYSTEM_ROLE_TAG" />
            <button
              v-if="canProfile"
              type="button"
              class="in-icon-button shrink-0"
              aria-label="编辑基本信息"
              @click="privateEnterProfile"
            >
              <in-icon name="ep:edit" />
            </button>
          </div>
          <div class="text-12px text-[var(--el-text-color-secondary)]">
            {{ detail.record.description || "暂无说明" }}
          </div>
        </div>
        <in-biz-tabs v-model="tab" align-content>
          <in-biz-tab-panel title="权限" name="grants" :editable="false" fill>
            <in-form-skeleton v-if="grantLoading" />
            <div v-else-if="grantError" class="p-20px">
              <el-alert title="权限加载失败" type="error" :closable="false" />
              <in-button @in-click="privateLoadGrants()">重试</in-button>
            </div>
            <div v-else class="grant-pane">
              <div class="grant-pane__toolbar">
                <div>拥有 {{ grants.length }} 个权限</div>
                <in-button v-if="canUpdate" :loading="editingGrants" @in-click="privateEditGrants">
                  <template #icon><in-icon name="ep:edit" /></template>
                  编辑
                </in-button>
              </div>
              <div class="grant-pane__list">
                <grant-preview :grants="grants" />
              </div>
            </div>
          </in-biz-tab-panel>
        </in-biz-tabs>
      </div>
      <div v-else-if="detail" class="profile-form">
        <in-form>
          <el-form-item label="名称" required>
            <el-input v-model="profileDraft.name" placeholder="请输入角色名称" />
          </el-form-item>
          <el-form-item label="分组">
            <el-input v-model="profileDraft.groupName" placeholder="请输入分组，可空" />
          </el-form-item>
          <el-form-item label="状态">
            <in-select
              v-model="profileDraft.status"
              :options="statusOptions"
              placeholder="请选择状态"
            />
          </el-form-item>
          <el-form-item label="说明">
            <el-input
              v-model="profileDraft.description"
              type="textarea"
              :rows="3"
              placeholder="请输入角色说明"
            />
          </el-form-item>
        </in-form>
      </div>
    </div>
    <template v-if="editingProfile" #footer>
      <in-button @in-click="editingProfile = false">取消</in-button>
      <in-button
        type="primary"
        :loading="saving"
        :disabled="!profileDirty || !profileDraft.name.trim()"
        @in-click="privateSaveProfile"
        >保存</in-button
      >
    </template>
  </in-drawer>
  <grant-edit-wizard
    ref="grantWizardRef"
    :catalog-a-p-i="catalogAPI"
    :application-candidates="applicationCandidates"
    @success="privateOnGrantSaved"
  />
</template>

<script setup lang="ts">
import { Message, useCapabilities } from "@ingot/admin-core";
import {
  BizIamStatusTag,
  ConfigurationStatus,
  IamAction,
  RoleKind,
  createCurrentRoleApis,
  iamEditorFailure,
  objectActionAllowed,
  useConfigurationStatusEnum,
  type AuthorizationCandidatesApi,
  type CurrentGrantCatalogAPI,
  type ResourceDetail,
  type RoleSummary,
} from "@ingot/admin-common";
import GrantEditWizard from "./GrantEditWizard.vue";
import GrantPreview from "./GrantPreview.vue";
import { selectedGrantsOf, type SelectedGrant } from "../grants";
import { SYSTEM_ROLE_TAG } from "../table";

defineOptions({ name: "RoleDetailDrawer" });

defineProps<{
  catalogAPI: CurrentGrantCatalogAPI;
  applicationCandidates: AuthorizationCandidatesApi;
}>();

const emits = defineEmits<{ success: [] }>();
const apis = createCurrentRoleApis("tenant");
const { hasAction } = useCapabilities();
const statusEnum = useConfigurationStatusEnum();
const statusOptions = computed(() => statusEnum.getOptions());
const visible = ref(false);
const loading = ref(false);
const grantLoading = ref(false);
const saving = ref(false);
const editingGrants = ref(false);
const editingProfile = ref(false);
const detailError = ref(false);
const grantError = ref(false);
const tab = ref("grants");
const roleId = ref("");
const detail = ref<ResourceDetail<RoleSummary>>();
const grants = ref<SelectedGrant[]>([]);
const profileDraft = reactive({
  name: "",
  description: "",
  groupName: "",
  status: ConfigurationStatus.ENABLED,
});
const grantWizardRef = ref<InstanceType<typeof GrantEditWizard>>();
let request = 0;

const sharedReadonly = computed(() => detail.value?.record.kind === RoleKind.SHARED);
const canProfile = computed(
  () =>
    !sharedReadonly.value &&
    hasAction(IamAction.TENANT_ROLE_STATUS) &&
    objectActionAllowed(detail.value?.capabilities || {}, IamAction.TENANT_ROLE_STATUS).allowed,
);
const canUpdate = computed(
  () =>
    !sharedReadonly.value &&
    hasAction(IamAction.TENANT_ROLE_UPDATE) &&
    objectActionAllowed(detail.value?.capabilities || {}, IamAction.TENANT_ROLE_UPDATE).allowed,
);
const profileDirty = computed(() => {
  const current = detail.value?.record;
  if (!current) return false;
  return (
    profileDraft.name.trim() !== current.name ||
    profileDraft.description.trim() !== (current.description ?? "") ||
    profileDraft.groupName.trim() !== (current.groupName ?? "") ||
    profileDraft.status !== current.status
  );
});

const knownStatus = (status: string): status is ConfigurationStatus =>
  status === ConfigurationStatus.ENABLED || status === ConfigurationStatus.DISABLED;

const privateEnterProfile = (): void => {
  const current = detail.value?.record;
  if (!current || !knownStatus(current.status)) return;
  profileDraft.name = current.name;
  profileDraft.description = current.description ?? "";
  profileDraft.groupName = current.groupName ?? "";
  profileDraft.status = current.status;
  editingProfile.value = true;
};

const privateLoadGrants = async (current = request): Promise<void> => {
  grantLoading.value = true;
  grantError.value = false;
  try {
    const response = await apis.grantsAPI(roleId.value);
    if (current !== request) return;
    grants.value = selectedGrantsOf(response.data);
  } catch (error) {
    if (current === request) {
      grantError.value = true;
      void iamEditorFailure(error);
    }
  } finally {
    if (current === request) grantLoading.value = false;
  }
};

const privateLoad = async (): Promise<void> => {
  const current = ++request;
  loading.value = true;
  detailError.value = false;
  try {
    const response = await apis.detailAPI(roleId.value);
    if (current !== request) return;
    detail.value = response.data;
    void privateLoadGrants(current);
  } catch (error) {
    if (current === request) {
      detailError.value = true;
      void iamEditorFailure(error);
    }
  } finally {
    if (current === request) loading.value = false;
  }
};

const privateSaveProfile = (): void => {
  if (!detail.value || !profileDirty.value || !profileDraft.name.trim()) return;
  saving.value = true;
  apis
    .profileAPI(roleId.value, {
      expectedVersion: detail.value.version,
      name: profileDraft.name.trim(),
      description: profileDraft.description.trim() || undefined,
      groupName: profileDraft.groupName.trim() || undefined,
      status: profileDraft.status,
    })
    .then(() => {
      Message.success("基本信息已更新");
      editingProfile.value = false;
      emits("success");
      void privateLoad();
    })
    .catch((error: unknown) => {
      void iamEditorFailure(error);
    })
    .finally(() => {
      saving.value = false;
    });
};

const privateEditGrants = (): void => {
  const role = detail.value;
  if (!role) return;
  editingGrants.value = true;
  grantWizardRef.value?.show({
    roleId: roleId.value,
    version: role.version,
    grants: JSON.parse(JSON.stringify(grants.value)),
  });
  editingGrants.value = false;
};

const privateOnGrantSaved = (): void => {
  emits("success");
  void privateLoad();
};

defineExpose({
  show(id: string) {
    roleId.value = id;
    detail.value = undefined;
    grants.value = [];
    editingProfile.value = false;
    tab.value = "grants";
    visible.value = true;
    void privateLoad();
  },
});
</script>

<style lang="postcss" scoped>
.profile-back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--in-icon-button-size);
  height: var(--in-icon-button-size);
  padding: 0;
  border: 0;
  border-radius: var(--in-radius-control);
  background: transparent;
  font-size: 20px;
  color: #646a73;
  cursor: pointer;
}

.profile-title {
  color: #1f2329;
  font-size: 16px;
}

.profile-form {
  box-sizing: border-box;
  width: 100%;
  padding: var(--in-section-padding-relaxed);
}

.role-detail-drawer {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  height: 100%;
}

.role-detail-drawer__body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.role-detail-drawer__identity {
  flex-shrink: 0;
}

.grant-pane {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.grant-pane__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  margin-bottom: 16px;
}

.grant-pane__list {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
</style>
