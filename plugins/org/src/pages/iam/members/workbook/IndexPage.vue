<template>
  <in-page-frame mode="page" surface="workspace">
    <template #header>
      <in-page-header
        class="member-workbook-header"
        :title="MEMBER_WORKBOOK_TITLE"
        show-back
        @back="privateBack"
      />
    </template>
    <in-form-content class="member-workbook-form">
      <in-loading :loading="busy">
        <div class="member-workbook-body">
          <div class="member-workbook-segment" role="tablist">
            <button
              v-if="canCreate"
              type="button"
              class="member-workbook-segment__item"
              :class="{ 'is-active': mode === MemberWorkbookMode.CREATE }"
              @click="privateSetMode(MemberWorkbookMode.CREATE)"
            >
              导入新成员
            </button>
            <button
              v-if="canExport"
              type="button"
              class="member-workbook-segment__item"
              :class="{ 'is-active': mode === MemberWorkbookMode.UPDATE }"
              @click="privateSetMode(MemberWorkbookMode.UPDATE)"
            >
              导出并修改成员信息
            </button>
          </div>

          <div v-if="mode === MemberWorkbookMode.CREATE" class="member-workbook-card">
            <div class="member-workbook-card__title">1. 下载导入模板</div>
            <p class="member-workbook-card__desc">下载模板并按提示填写</p>
            <in-button :loading="templateBusy" @in-click="privateDownloadTemplate">
              <in-icon name="ep:download" class="mr-4px" />
              下载空白模板
            </in-button>
          </div>
          <div v-else class="member-workbook-card">
            <div class="member-workbook-card__title">1. 导出通讯录</div>
            <p class="member-workbook-card__desc">
              导出后，可在本地批量修改成员信息，完成后在下方再次上传
            </p>
            <in-button :disabled="!canExport" @in-click="privateOpenScope">
              <in-icon name="ep:upload" class="mr-4px" />
              导出
            </in-button>
          </div>

          <div class="member-workbook-card">
            <div class="member-workbook-card__head">
              <div class="member-workbook-card__title">2. 上传完善后的模板</div>
              <in-button type="primary" link @in-click="privateOpenHistory">
                <in-icon name="ep:info-filled" class="mr-4px" />
                你的导入历史
              </in-button>
            </div>
            <p class="member-workbook-card__desc">
              更新信息的模板中，如有空的数据列，则相应字段信息会被清空，请谨慎填写
            </p>
            <div
              class="member-workbook-drop"
              :class="{ 'is-over': dragging }"
              @dragenter.prevent="dragging = true"
              @dragover.prevent="dragging = true"
              @dragleave.prevent="dragging = false"
              @drop.prevent="privateOnDrop"
            >
              <in-icon name="ep:tickets" class="text-32px text-[var(--in-text-color-secondary)]" />
              <in-button @in-click="privateChooseFile">选择文件</in-button>
              <input
                ref="fileRef"
                class="hidden"
                type="file"
                :accept="WORKBOOK_ACCEPT"
                @change="privateOnFileChange"
              />
              <div v-if="file" class="text-14px text-[var(--in-text-color)]">{{ file.name }}</div>
            </div>
            <p class="mt-12px text-14px text-[var(--in-text-color-secondary)]">
              在下载的模板填写信息后，可直接将文件拖拽到此处进行上传。支持格式：XLSX
            </p>
          </div>

          <div class="mt-16px flex justify-end gap-8px">
            <in-button class="member-workbook-btn" @in-click="privateBack">取消</in-button>
            <in-button
              class="member-workbook-btn"
              type="primary"
              :disabled="!file || !canImport"
              @in-click="privateImport"
            >
              导入
            </in-button>
          </div>
        </div>
      </in-loading>
    </in-form-content>
  </in-page-frame>

  <in-dialog
    v-model="scopeVisible"
    title="编辑管理范围"
    :width="scopeKind === 'partial' ? '840px' : '420px'"
    append-to-body
  >
    <el-radio-group v-model="scopeKind" class="flex gap-24px">
      <el-radio value="all">全部</el-radio>
      <el-radio value="partial">部分成员</el-radio>
    </el-radio-group>
    <export-scope-picker v-if="scopeKind === 'partial'" v-model="scopeSelection" />
    <template #footer>
      <in-button class="member-workbook-btn" @in-click="scopeVisible = false">取消</in-button>
      <in-button
        class="member-workbook-btn"
        type="primary"
        :loading="busy"
        :disabled="scopeKind === 'partial' && scopeSelection.departments.length + scopeSelection.members.length === 0"
        @in-click="privateConfirmScope"
      >
        确定
      </in-button>
    </template>
  </in-dialog>

  <in-dialog v-model="historyVisible" title="你的导入历史" width="640px" append-to-body>
    <el-table v-if="history.length" :data="history" size="small">
      <el-table-column label="模式" width="100">
        <template #default="{ row }">
          {{ row.mode === MemberWorkbookMode.CREATE ? "导入新成员" : "更新成员" }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">{{ row.status }}</template>
      </el-table-column>
      <el-table-column label="成功" width="80">
        <template #default="{ row }">{{ row.successCount ?? "-" }}</template>
      </el-table-column>
      <el-table-column label="失败" width="80">
        <template #default="{ row }">{{ row.failCount ?? "-" }}</template>
      </el-table-column>
      <el-table-column label="时间">
        <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
      </el-table-column>
    </el-table>
    <div v-else class="member-workbook-history-empty">
      <el-empty
        :image="noContentIllustration"
        :image-size="120"
        description="暂无数据"
      />
    </div>
    <template #footer>
      <in-button @in-click="historyVisible = false">我知道了</in-button>
    </template>
  </in-dialog>

  <in-dialog v-model="resultVisible" title="导入结果" width="480px" append-to-body>
    <p class="text-14px">成功 {{ result?.successCount ?? 0 }} 人，失败 {{ result?.failCount ?? 0 }} 人</p>
    <div class="mt-16px flex flex-wrap gap-8px">
      <in-button v-if="(result?.failCount ?? 0) > 0" @in-click="privateDownloadErrors">
        下载错误报告
      </in-button>
      <in-button v-if="result?.passwordAvailable" type="primary" @in-click="privateDownloadPasswords">
        下载初始密码
      </in-button>
    </div>
    <template #footer>
      <in-button class="member-workbook-btn" type="primary" @in-click="resultVisible = false">
        确定
      </in-button>
    </template>
  </in-dialog>
</template>

<script setup lang="ts">
import {
  Confirm,
  DOWNLOAD_CENTER_PATH,
  DOWNLOAD_CENTER_TITLE,
  Message,
  noContentIllustration,
  usePermissions,
} from "@ingot/admin-core";
import {
  IamAction,
  IAM_DEFAULT_PAGE_SIZE,
  MemberStatus,
  MemberWorkbookArtifact,
  MemberWorkbookMode,
  type MemberRecord,
  type MemberWorkbookHistoryItem,
  type MemberWorkbookTask,
  type ResourceDetail,
} from "@ingot/admin-common";
import { formatDateTime } from "@ingot/shared";
import {
  TenantDepartmentNavigationAPI,
  TenantMemberPageAPI,
  TenantMemberWorkbookExportAPI,
  TenantMemberWorkbookFileAPI,
  TenantMemberWorkbookHistoryAPI,
  TenantMemberWorkbookImportAPI,
  TenantMemberWorkbookTemplateAPI,
  TenantSettingsAPI,
} from "@/api/iam/directory";
import { MEMBER_LIST_PATH, MEMBER_WORKBOOK_TITLE } from "../memberTable";
import ExportScopePicker from "./components/ExportScopePicker.vue";
import { emptyExportScope, memberIdsForScope, type ExportScopeSelection } from "./exportScope";
import { pollWorkbookTask } from "./pollWorkbook";
import { downloadWorkbookFile, isWorkbookFile, WORKBOOK_ACCEPT } from "./workbookFile";

defineOptions({ name: "MemberWorkbookPage" });

const router = useRouter();
const permissions = usePermissions();
const canCreate = computed(() => permissions.permissions.includes(IamAction.TENANT_MEMBER_CREATE));
const canExport = computed(() => permissions.permissions.includes(IamAction.TENANT_MEMBER_EXPORT));
const canUpdate = computed(
  () =>
    permissions.permissions.includes(IamAction.TENANT_MEMBER_UPDATE) ||
    permissions.permissions.includes(IamAction.TENANT_MEMBER_DEPARTMENTS),
);
const mode = ref(
  canCreate.value ? MemberWorkbookMode.CREATE : MemberWorkbookMode.UPDATE,
);
const canImport = computed(() =>
  mode.value === MemberWorkbookMode.CREATE ? canCreate.value : canUpdate.value,
);
const busy = ref(false);
const templateBusy = ref(false);
const dragging = ref(false);
const file = ref<File>();
const fileRef = ref<HTMLInputElement>();
const scopeVisible = ref(false);
const scopeKind = ref<"all" | "partial">("all");
const scopeSelection = ref<ExportScopeSelection>(emptyExportScope());
const historyVisible = ref(false);
const history = ref<MemberWorkbookHistoryItem[]>([]);
const resultVisible = ref(false);
const result = ref<MemberWorkbookTask>();

const privateBack = (): void => {
  void router.push(MEMBER_LIST_PATH);
};

const privateSetMode = (next: MemberWorkbookMode): void => {
  mode.value = next;
  file.value = undefined;
};

const privateChooseFile = (): void => {
  fileRef.value?.click();
};

const privateAssignFile = (next?: File): void => {
  dragging.value = false;
  if (!next) {
    return;
  }
  if (!isWorkbookFile(next)) {
    Message.warning("仅支持 XLSX");
    return;
  }
  file.value = next;
};

const privateOnFileChange = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  privateAssignFile(target.files?.[0]);
  target.value = "";
};

const privateOnDrop = (event: DragEvent): void => {
  privateAssignFile(event.dataTransfer?.files[0]);
};

const privateDownloadTemplate = (): void => {
  templateBusy.value = true;
  TenantMemberWorkbookTemplateAPI()
    .then((response) => downloadWorkbookFile(response.data))
    .finally(() => {
      templateBusy.value = false;
    });
};

const privateOpenScope = (): void => {
  scopeKind.value = "all";
  scopeSelection.value = emptyExportScope();
  scopeVisible.value = true;
};

const privateConfirmScope = async (): Promise<void> => {
  busy.value = true;
  try {
    const memberIds =
      scopeKind.value === "all"
        ? []
        : await memberIdsForScope(scopeSelection.value, {
            loadMembers: async (departmentId, page) => {
              const result = await TenantMemberPageAPI(
                { current: page, size: IAM_DEFAULT_PAGE_SIZE },
                { departmentId },
              );
              return {
                records: (result.data.records || [])
                  .map((item: ResourceDetail<MemberRecord>) => item.record)
                  .filter((record: MemberRecord) => record.status !== MemberStatus.REMOVED)
                  .map((record: MemberRecord) => ({ id: record.id })),
                total: Number(result.data.total),
                size: result.data.size ?? IAM_DEFAULT_PAGE_SIZE,
              };
            },
            loadChildren: async (departmentId, page) => {
              const result = (await TenantDepartmentNavigationAPI(departmentId, page)).data;
              return { records: result.items, total: result.total, size: result.pageSize };
            },
          });
    if (scopeKind.value === "partial" && memberIds.length === 0) {
      Message.warning("所选范围内没有可导出的成员");
      return;
    }
    await privateExport(memberIds);
  } finally {
    busy.value = false;
  }
};

const privateExport = async (memberIds: string[]): Promise<void> => {
  const version = (await TenantSettingsAPI()).data.version;
  await TenantMemberWorkbookExportAPI({
    expectedVersion: version,
    memberIds,
  });
  scopeVisible.value = false;
  Confirm.success(`导出任务已提交，文件生成后可在「${DOWNLOAD_CENTER_TITLE}」中下载。`, {
    title: "已提交导出",
    confirmButtonText: `前往${DOWNLOAD_CENTER_TITLE}`,
    cancelButtonText: "知道了",
  })
    .then(() => router.push(DOWNLOAD_CENTER_PATH))
    .catch(() => undefined);
};

const privateImport = async (): Promise<void> => {
  if (!file.value) {
    return;
  }
  busy.value = true;
  try {
    const created = await TenantMemberWorkbookImportAPI(file.value, mode.value);
    const task = await pollWorkbookTask(created.data.id);
    result.value = task;
    resultVisible.value = true;
    if ((task.successCount ?? 0) > 0) {
      Message.success(`成功导入 ${task.successCount} 人`);
    }
  } finally {
    busy.value = false;
  }
};

const privateOpenHistory = (): void => {
  TenantMemberWorkbookHistoryAPI().then((response) => {
    history.value = response.data ?? [];
    historyVisible.value = true;
  });
};

const privateDownloadErrors = (): void => {
  if (!result.value) {
    return;
  }
  TenantMemberWorkbookFileAPI(result.value.id, MemberWorkbookArtifact.ERRORS).then((response) =>
    downloadWorkbookFile(response.data),
  );
};

const privateDownloadPasswords = (): void => {
  if (!result.value) {
    return;
  }
  TenantMemberWorkbookFileAPI(result.value.id, MemberWorkbookArtifact.PASSWORDS).then((response) => {
    downloadWorkbookFile(response.data);
    result.value = { ...result.value!, passwordAvailable: false };
  });
};
</script>

<style scoped lang="postcss">
.member-workbook-header {
  height: 53px;
  padding: 12px 20px;
}

.member-workbook-form {
  --in-form-content-max-width: 824px;
}

.member-workbook-history-empty {
  display: flex;
  min-height: 280px;
  align-items: center;
  justify-content: center;
}

.member-workbook-segment {
  display: inline-flex;
  width: max-content;
  height: 32px;
  margin-bottom: 16px;
  align-items: center;
  padding: 3px;
  border: 1px solid var(--in-border-color);
  border-radius: 6px;
}

.member-workbook-segment__item {
  height: 24px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  padding: 0 12px;
  color: var(--in-text-color);
  font-size: 14px;
  font-weight: 400;
  cursor: pointer;
}

.member-workbook-segment__item.is-active {
  background: color-mix(in srgb, var(--in-color-primary) 8%, transparent);
  color: var(--in-color-primary);
  font-weight: 500;
}

.member-workbook-card {
  margin-bottom: 12px;
  background: var(--in-bg-color-page);
  padding: 24px;
}

.member-workbook-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.member-workbook-card__title {
  font-size: 14px;
  font-weight: 400;
  color: var(--in-text-color);
}

.member-workbook-card__desc {
  margin: 8px 0 16px;
  font-size: 14px;
  color: var(--in-text-color-secondary);
}

.member-workbook-drop {
  display: flex;
  height: 210px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border: 1px dashed var(--in-border-color);
  border-radius: 5px;
  background: var(--in-bg-color-surface);
}

.member-workbook-drop.is-over {
  border-color: var(--in-color-primary);
}

.member-workbook-btn {
  width: 80px;
  height: 32px;
  border-radius: 6px;
}
</style>
