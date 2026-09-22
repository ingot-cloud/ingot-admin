<template>
  <in-drawer
    :title="title"
    v-model="visible"
    :loading="loading"
    size="560px"
    :before-close="privateOnBeforeClose"
  >
    <in-form :editing="isCreate || session.editing.value">
      <in-detail-field label="名称" :value="draft.name" required>
        <el-input v-model="draft.name" placeholder="如组织与成员" />
      </in-detail-field>
      <in-detail-field label="类型">
        <template #view>{{ kindEnum.getTagText(draft.kind).text }}</template>
        <in-select v-model="draft.kind" :options="kindEnum.getOptions()" placeholder="请选择菜单类型" />
      </in-detail-field>
      <in-detail-field label="父菜单" :value="parentName">
        <el-select v-model="draft.parentId" clearable filterable placeholder="根节点为空">
          <el-option
            v-for="item in parentOptions"
            :key="item.record.id"
            :label="item.record.name"
            :value="item.record.id"
          />
        </el-select>
      </in-detail-field>
      <in-detail-field label="路径" :value="draft.path">
        <el-input v-model="draft.path" placeholder="如 /iam/members，目录可空" />
      </in-detail-field>
      <in-detail-field label="视图注册键" :value="draft.viewPath">
        <el-input v-model="draft.viewPath" placeholder="canonical viewPath，如 platform.iam.accounts" />
        <div class="text-12px text-[var(--el-text-color-secondary)]">
          必须与前端 definePluginPages 注册键一致，不能用浏览器 path 代替。
        </div>
      </in-detail-field>
      <in-detail-field label="准入方式">
        <template #view>{{ accessEnum.getTagText(draft.accessMode).text }}</template>
        <in-select
          v-model="draft.accessMode"
          :options="accessEnum.getOptions()"
          placeholder="请选择准入方式"
        />
        <div class="text-12px text-[var(--el-text-color-secondary)]">
          开放不校验操作；按操作时由下方匹配方式决定。
        </div>
      </in-detail-field>
      <in-detail-field label="操作匹配">
        <template #view>{{ matchEnum.getTagText(draft.matchMode).text }}</template>
        <in-select
          v-model="draft.matchMode"
          :options="matchEnum.getOptions()"
          placeholder="请选择操作匹配"
        />
        <div class="text-12px text-[var(--el-text-color-secondary)]">
          任一操作：具备列表中任一 ACTION 即可进入；全部操作：必须同时具备。
        </div>
      </in-detail-field>
      <in-detail-field label="关联操作" :value="actionSummary">
        <biz-iam-chip-page-select
          v-model="draft.actionIds"
          :load-data="loadActions"
          :initial-labels="actionLabels"
          placeholder="搜索操作名"
          empty-text="未关联操作"
        />
      </in-detail-field>
      <in-detail-field label="排序" :value="draft.sortOrder">
        <el-input-number v-model="draft.sortOrder" :min="0" placeholder="请输入排序" />
      </in-detail-field>
    </in-form>
    <template #footer>
      <template v-if="isCreate || session.editing.value">
        <in-button @click="privateCancel">取消</in-button>
        <in-button type="primary" :loading="loading" @in-click="privateSubmit">保存</in-button>
      </template>
      <in-button v-else type="primary" @in-click="session.enterEdit">编辑</in-button>
    </template>
  </in-drawer>
</template>

<script setup lang="ts">
import { Message, useDetailEditSession, type LoadDataParams, type Page } from "@ingot/admin-core";
import {
  BizIamChipPageSelect,
  collectIamPageRecords,
  flattenMenuTree,
  MenuAccessMode,
  MenuKind,
  MenuMatchMode,
  toIamSelectRecords,
  useMenuAccessModeEnum,
  useMenuKindEnum,
  useMenuMatchModeEnum,
  type AppMenuDraft,
  type IamSelectOption,
  type MenuTreeRow,
} from "@ingot/admin-common";
import { PlatformActionPageAPI, PlatformMenuCreateAPI, PlatformMenuUpdateAPI } from "@/api/iam/catalog";

defineOptions({ name: "MenuEditDrawer" });

const emits = defineEmits<{ success: [] }>();
const session = useDetailEditSession();
const kindEnum = useMenuKindEnum();
const accessEnum = useMenuAccessModeEnum();
const matchEnum = useMenuMatchModeEnum();
const visible = ref(false);
const loading = ref(false);
const applicationId = ref("");
const menus = ref<MenuTreeRow[]>([]);
const target = ref<MenuTreeRow>();
const actionLabels = ref<Record<string, string>>({});
const draft = reactive<AppMenuDraft>({
  name: "",
  kind: MenuKind.PAGE,
  accessMode: MenuAccessMode.ACTION,
  matchMode: MenuMatchMode.ANY,
  actionIds: [],
  sortOrder: 0,
});

const isCreate = computed(() => !target.value);
const title = computed(() => (isCreate.value ? "创建菜单" : "菜单详情"));
const parentOptions = computed(() =>
  flattenMenuTree(menus.value).filter((item) => item.record.id !== target.value?.record.id),
);
const parentName = computed(() => {
  if (!draft.parentId) {
    return "根节点";
  }
  return parentOptions.value.find((item) => item.record.id === draft.parentId)?.record.name || draft.parentId;
});
const actionSummary = computed(() => {
  if (!draft.actionIds.length) {
    return "未关联操作";
  }
  return draft.actionIds.map((id) => actionLabels.value[id] ?? id).join("、");
});

const loadActions = (params: LoadDataParams): Promise<Page<IamSelectOption>> => {
  return PlatformActionPageAPI(
    applicationId.value,
    {
      current: params.current,
      size: params.size,
    },
    { name: params.query },
  ).then((response) =>
    toIamSelectRecords({
      ...response.data,
      records: (response.data.records ?? []).map((item) => ({
        ...item,
        record: {
          ...item.record,
          name: `${item.record.name} (${item.record.code})`,
        },
      })),
    }),
  );
};

const hydrateActionLabels = (ids: string[]): void => {
  if (!ids.length || !applicationId.value) {
    actionLabels.value = {};
    return;
  }
  void collectIamPageRecords((page) =>
    PlatformActionPageAPI(applicationId.value, page, { ids: ids.join(",") }),
  ).then((records) => {
    const labels: Record<string, string> = {};
    for (const item of records) {
      labels[item.record.id] = `${item.record.name} (${item.record.code})`;
    }
    actionLabels.value = labels;
  });
};

const applyDraft = (row?: MenuTreeRow): void => {
  draft.parentId = row?.record.parentId;
  draft.name = row?.record.name ?? "";
  draft.kind = row?.record.kind ?? MenuKind.PAGE;
  draft.path = row?.record.path;
  draft.viewPath = row?.record.viewPath;
  draft.routeName = row?.record.routeName;
  draft.icon = row?.record.icon;
  draft.accessMode = row?.record.accessMode ?? MenuAccessMode.ACTION;
  draft.matchMode = row?.record.matchMode ?? MenuMatchMode.ANY;
  draft.actionIds = [...(row?.record.actionIds ?? [])];
  draft.sortOrder = row?.record.sortOrder ?? 0;
};

const asDraft = (): AppMenuDraft => ({
  parentId: draft.parentId || undefined,
  name: draft.name.trim(),
  kind: draft.kind,
  path: draft.path || undefined,
  viewPath: draft.viewPath || undefined,
  routeName: draft.routeName || undefined,
  icon: draft.icon || undefined,
  accessMode: draft.accessMode,
  matchMode: draft.matchMode,
  actionIds: [...draft.actionIds],
  sortOrder: draft.sortOrder,
});

const privateCancel = (): void => {
  if (isCreate.value) {
    visible.value = false;
    return;
  }
  session.exitEdit();
  applyDraft(target.value);
};

const privateOnBeforeClose = (done: () => void): void => {
  if (isCreate.value || !session.editing.value) {
    done();
    return;
  }
  void session.confirmLeave().then((allowed) => {
    if (!allowed) {
      return;
    }
    applyDraft(target.value);
    done();
  });
};

const privateSubmit = (): void => {
  if (!draft.name.trim()) {
    Message.warning("请输入菜单名称");
    return;
  }
  loading.value = true;
  if (target.value) {
    PlatformMenuUpdateAPI(applicationId.value, target.value.record.id, {
      expectedVersion: target.value.version,
      menu: asDraft(),
    })
      .then((response) => {
        target.value = {
          ...target.value!,
          record: response.data.record,
          version: response.data.version,
        };
        applyDraft(target.value);
        session.exitEdit();
        Message.success("保存成功");
        emits("success");
      })
      .finally(() => {
        loading.value = false;
      });
    return;
  }
  PlatformMenuCreateAPI(applicationId.value, asDraft())
    .then(() => {
      Message.success("保存成功");
      visible.value = false;
      emits("success");
    })
    .finally(() => {
      loading.value = false;
    });
};

defineExpose({
  show(appId: string, menuList: MenuTreeRow[], current?: MenuTreeRow) {
    applicationId.value = appId;
    menus.value = menuList;
    target.value = current;
    applyDraft(current);
    hydrateActionLabels(draft.actionIds);
    if (current) {
      session.exitEdit();
    } else {
      session.enterEdit();
    }
    visible.value = true;
  },
});
</script>
