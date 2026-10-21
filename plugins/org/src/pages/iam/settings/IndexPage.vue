<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="维护组织 Logo 和名称，并查看已有组织资料。" />
    </template>
    <in-form-content>
      <section class="org-settings__section">
        <h2>基础信息</h2>
        <div class="org-settings__panel org-settings__banner">
          <span v-if="record?.avatar" class="org-settings__logo">
            <img :src="record.avatar" alt="" />
          </span>
          <span v-else class="org-settings__logo is-mark">{{ mark }}</span>
          <div class="org-settings__identity">
            <span class="org-settings__name">{{ record?.name }}</span>
            <button
              v-if="canUpdate"
              class="org-settings__edit"
              type="button"
              aria-label="编辑基础信息"
              @click="privateOnEdit"
            >
              <in-icon name="ep:edit" />
            </button>
          </div>
        </div>
      </section>

      <section class="org-settings__section">
        <h2>更多信息</h2>
        <dl class="org-settings__panel org-settings__facts">
          <div>
            <dt>组织编号</dt>
            <dd><in-copy-tag v-if="record" :text="record.id" /></dd>
          </div>
          <div>
            <dt>当前所有者</dt>
            <dd>{{ display(record?.ownerDisplayName) }}</dd>
          </div>
          <div>
            <dt>所有者手机</dt>
            <dd>{{ display(record?.ownerPhone) }}</dd>
          </div>
          <div>
            <dt>所有者邮箱</dt>
            <dd>{{ display(record?.ownerEmail) }}</dd>
          </div>
          <div>
            <dt>创建时间</dt>
            <dd>{{ record ? formatDateTime(record.createdAt) : "-" }}</dd>
          </div>
          <div>
            <dt>启停状态</dt>
            <dd><biz-iam-status-tag v-if="record" :status="record.status" /></dd>
          </div>
        </dl>
      </section>

      <section v-if="canTransfer" class="org-settings__section">
        <div class="org-settings__panel org-settings__transfer">
          <in-button type="danger" @click="privateOnOpenTransfer">转交所有者</in-button>
          <p>转交后当前账号失去组织所有权，已有普通角色保留。确认前需要验证登录密码。</p>
        </div>
      </section>
    </in-form-content>

    <org-basic-dialog ref="basicRef" :save="TenantSettingsUpdateAPI" @saved="privateOnSaved" />
    <biz-iam-member-picker-dialog
      ref="pickerRef"
      organization
      :multiple="false"
      title="选择新所有者"
      :load-members="TenantMemberPickerLoad"
      :load-browse="loadBrowse"
      @confirm="privateOnMember"
    />
    <org-transfer-password-dialog ref="passwordRef" @transferred="privateOnTransferred" />
  </in-page-frame>
</template>

<script setup lang="ts">
import { Message, refreshSessionPermissions, useCapabilities, usePermissions } from "@ingot/admin-core";
import {
  BizIamMemberPickerDialog,
  BizIamStatusTag,
  IamAction,
  OrganizationMemberScene,
  type IamSelectOption,
  type OrganizationMemberBrowseParams,
  type ResourceDetail,
  type TenantRecord,
} from "@ingot/admin-common";
import { formatDateTime } from "@ingot/shared";
import {
  TenantMemberPickerLoad,
  TenantOrganizationMemberBrowseAPI,
  TenantSettingsAPI,
  TenantSettingsUpdateAPI,
} from "@/api/iam/directory";
import OrgBasicDialog from "./components/OrgBasicDialog.vue";
import OrgTransferPasswordDialog from "./components/OrgTransferPasswordDialog.vue";

const { objectAllowed } = useCapabilities();
const permissions = usePermissions();

const detail = ref<ResourceDetail<TenantRecord>>();
const pickerRef = ref<{ show: () => void }>();
const basicRef = ref<{ show: (record: TenantRecord, version: string) => void }>();
const passwordRef = ref<{
  show: (member: { id: string; name: string }, version: string) => void;
}>();

const record = computed(() => detail.value?.record);
const mark = computed(() => record.value?.name.slice(0, 1) || "组");
const canUpdate = computed(
  () =>
    !!detail.value &&
    objectAllowed(detail.value.capabilities, IamAction.TENANT_SETTINGS_UPDATE).allowed,
);
const canTransfer = computed(
  () =>
    permissions.tenantOwner &&
    !!detail.value &&
    objectAllowed(detail.value.capabilities, IamAction.TENANT_SETTINGS_OWNER_TRANSFER).allowed,
);

const display = (value?: string): string => value || "-";

const load = (): void => {
  TenantSettingsAPI().then((response) => {
    detail.value = response.data;
  });
};

const loadBrowse = async (params: OrganizationMemberBrowseParams) => {
  const response = await TenantOrganizationMemberBrowseAPI({
    ...params,
    scene: OrganizationMemberScene.MEMBER,
  });
  return response.data;
};

const privateOnEdit = (): void => {
  if (!detail.value || !canUpdate.value) {
    return;
  }
  basicRef.value?.show(detail.value.record, detail.value.version);
};

const privateOnSaved = (next: ResourceDetail<TenantRecord>): void => {
  detail.value = next;
};

const privateOnOpenTransfer = (): void => {
  pickerRef.value?.show();
};

const privateOnMember = (members: IamSelectOption[]): void => {
  const picked = members[0];
  const current = detail.value;
  if (!picked || !current) {
    return;
  }
  if (picked.id === current.record.ownerMemberId) {
    Message.warning("不能转交给当前所有者");
    return;
  }
  passwordRef.value?.show(
    { id: picked.id, name: picked.name || picked.id },
    current.version,
  );
};

const privateOnTransferred = (): void => {
  load();
  void refreshSessionPermissions({ refreshMenusIfVersionChanged: true });
};

onMounted(load);
</script>

<style scoped lang="postcss">
.org-settings__section {
  margin-bottom: var(--in-space-6);
}

.org-settings__section > h2 {
  display: flex;
  align-items: center;
  gap: var(--in-space-2);
  margin: 0 0 var(--in-space-4);
  color: var(--in-text-color);
  font-size: var(--in-font-size-section-title);
  font-weight: var(--in-font-weight-section-title);
  line-height: var(--in-line-height-section-title);
}

.org-settings__section > h2::before {
  content: "";
  width: 3px;
  height: 16px;
  border-radius: 2px;
  background: var(--in-color-primary);
}

.org-settings__panel {
  border: 1px solid var(--in-border-color);
  border-radius: var(--in-radius-card);
  background: var(--in-bg-color-surface);
}

.org-settings__banner {
  display: flex;
  align-items: center;
  gap: var(--in-space-4);
  padding: var(--in-space-5);
  background: color-mix(in srgb, var(--in-color-primary) 8%, var(--in-bg-color-surface));
}

.org-settings__logo {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  overflow: hidden;
  border-radius: var(--in-radius-card);
}

.org-settings__logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.org-settings__logo.is-mark {
  background: var(--in-color-primary);
  color: var(--in-text-color-inverse);
  font-size: var(--in-font-size-section-title);
  font-weight: var(--in-font-weight-section-title);
}

.org-settings__identity {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: var(--in-space-2);
}

.org-settings__name {
  overflow: hidden;
  color: var(--in-text-color);
  font-size: var(--in-font-size-section-title);
  font-weight: var(--in-font-weight-section-title);
  line-height: var(--in-line-height-section-title);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.org-settings__edit {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--in-text-color-secondary);
  cursor: pointer;
}

.org-settings__edit:hover {
  color: var(--in-color-primary);
}

.org-settings__facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--in-space-4) var(--in-space-6);
  margin: 0;
  padding: var(--in-space-5);
}

.org-settings__facts div {
  min-width: 0;
}

.org-settings__facts dt {
  margin: 0 0 var(--in-space-1);
  color: var(--in-text-color-secondary);
}

.org-settings__facts dd {
  margin: 0;
  color: var(--in-text-color);
}

.org-settings__transfer {
  padding: var(--in-space-5);
}

.org-settings__transfer p {
  margin: var(--in-space-2) 0 0;
  color: var(--in-text-color-secondary);
  line-height: var(--in-line-height-body);
}

@media (max-width: 640px) {
  .org-settings__facts {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
