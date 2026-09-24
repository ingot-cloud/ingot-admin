<template>
  <in-drawer
    :title="title"
    v-model="visible"
    :loading="loading"
    size="560px"
    layout="pinned"
    :before-close="privateOnBeforeClose"
  >
    <in-form :editing="isCreate || session.editing.value">
      <in-detail-field label="名称" :value="draft.name" required>
        <el-input v-model="draft.name" placeholder="如组织与成员" />
      </in-detail-field>
      <in-detail-field label="图标">
        <template #view>
          <catalog-icon-preview v-if="draft.icon" :value="draft.icon" />
          <span v-else>-</span>
        </template>
        <catalog-icon-field v-model="draft.icon" />
      </in-detail-field>
      <in-detail-field label="类型">
        <template #view>{{ kindEnum.getTagText(draft.kind).text }}</template>
        <in-select v-model="draft.kind" :options="kindEnum.getOptions()" placeholder="请选择菜单类型" />
      </in-detail-field>
      <in-detail-field label="父菜单" :value="parentName">
        <el-select v-model="draft.parentId" class="w-full min-w-0" clearable filterable placeholder="根节点为空">
          <el-option
            v-for="item in parentOptions"
            :key="item.record.id"
            :label="item.record.name"
            :value="item.record.id"
          />
        </el-select>
      </in-detail-field>
      <in-detail-field label="路径">
        <template #view>
          <in-copy-tag v-if="draft.path" :text="draft.path" />
          <span v-else>-</span>
        </template>
        <el-input v-model="draft.path" placeholder="如 /iam/members，目录可空" />
      </in-detail-field>
      <in-detail-field label="视图注册键">
        <template #view>
          <in-copy-tag v-if="draft.viewPath" :text="draft.viewPath" />
          <span v-else>-</span>
        </template>
        <el-select
          v-model="draft.viewPath"
          class="w-full min-w-0"
          filterable
          clearable
          placeholder="请选择视图注册键"
          @change="privateOnViewPathChange"
        >
          <el-option-group v-for="group in viewGroups" :key="group.label" :label="group.label">
            <el-option
              v-for="item in group.options"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-option-group>
        </el-select>
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
      <in-detail-field v-if="showActionFields" label="操作匹配">
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
      <in-detail-field v-if="showActionFields" class="menu-actions-field" label="关联操作">
        <template #label>
          <div class="w-full flex items-center justify-between gap-8px">
            <span>关联操作</span>
            <in-button
              v-if="isCreate || session.editing.value"
              type="primary"
              link
              @in-click="privateOpenPicker"
            >
              配置操作
            </in-button>
          </div>
        </template>
        <template #view>
          <action-hierarchy :actions="selectedActions" />
        </template>
        <action-hierarchy :actions="selectedActions" />
      </in-detail-field>
      <in-detail-field label="排序" :value="draft.sortOrder">
        <el-input-number v-model="draft.sortOrder" class="w-full" :min="0" placeholder="请输入排序" />
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
  <action-picker-dialog ref="pickerRef" :resolve-catalog="resolveCatalog" @confirm="privateOnPicked" />
</template>

<script setup lang="ts">
import { Message, toDefaultMenuPath, useDetailEditSession } from "@ingot/admin-core";
import {
  flattenMenuTree,
  MenuAccessMode,
  MenuKind,
  MenuMatchMode,
  useMenuAccessModeEnum,
  useMenuKindEnum,
  useMenuMatchModeEnum,
  type AppMenuDraft,
  type MenuTreeRow,
} from "@ingot/admin-common";
import { PlatformMenuCreateAPI, PlatformMenuUpdateAPI } from "@/api/iam/catalog";
import { loadApplicationCatalog, loadMenuAssociatedActions } from "../applicationCatalog";
import { actionsOfCatalog, type ActionCatalog, type MenuActionOption } from "../menuActions";
import { viewPathOptionGroups } from "../viewPaths";
import ActionHierarchy from "./ActionHierarchy.vue";
import ActionPickerDialog from "./ActionPickerDialog.vue";
import CatalogIconField from "./CatalogIconField.vue";
import CatalogIconPreview from "./CatalogIconPreview.vue";

defineOptions({ name: "MenuEditDrawer" });

const props = defineProps<{
  resolveCatalog?: () => Promise<ActionCatalog>;
  submit?: (draft: AppMenuDraft, target?: MenuTreeRow) => void | Promise<void>;
}>();

const emits = defineEmits<{ success: [] }>();
const session = useDetailEditSession();
const kindEnum = useMenuKindEnum();
const accessEnum = useMenuAccessModeEnum();
const matchEnum = useMenuMatchModeEnum();
const visible = ref(false);
const loading = ref(false);
const applicationId = ref("");
const applicationName = ref("");
const menus = ref<MenuTreeRow[]>([]);
const target = ref<MenuTreeRow>();
const selectedActions = ref<MenuActionOption[]>([]);
const pickerRef = ref<{ show: (current: MenuActionOption[]) => void }>();
const fullCatalog = ref<ActionCatalog>();
const lastAutoPath = ref("");
const viewGroups = computed(() => viewPathOptionGroups());
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
const showActionFields = computed(() => draft.accessMode !== MenuAccessMode.OPEN);
const parentOptions = computed(() =>
  flattenMenuTree(menus.value).filter((item) => item.record.id !== target.value?.record.id),
);
const parentName = computed(() => {
  if (!draft.parentId) {
    return "根节点";
  }
  return parentOptions.value.find((item) => item.record.id === draft.parentId)?.record.name || draft.parentId;
});

const resolveCatalog = async (): Promise<ActionCatalog> => {
  if (props.resolveCatalog) {
    return props.resolveCatalog();
  }
  if (fullCatalog.value) {
    return fullCatalog.value;
  }
  const catalog = await loadApplicationCatalog(applicationId.value);
  fullCatalog.value = catalog;
  return catalog;
};

const hydrateActions = (ids: string[]): void => {
  if (!ids.length) {
    selectedActions.value = [];
    return;
  }
  if (props.resolveCatalog) {
    void props.resolveCatalog().then((catalog) => {
      selectedActions.value = actionsOfCatalog(catalog, ids);
    });
    return;
  }
  if (!target.value) {
    selectedActions.value = [];
    return;
  }
  void loadMenuAssociatedActions(applicationId.value, target.value.record.id, applicationName.value).then(
    (actions) => {
      selectedActions.value = actions;
    },
  );
};

const privateOnViewPathChange = (value?: string): void => {
  if (!value) {
    return;
  }
  if (!draft.path || draft.path === lastAutoPath.value) {
    const nextPath = toDefaultMenuPath(value);
    lastAutoPath.value = nextPath;
    draft.path = nextPath;
  }
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

const asDraft = (): AppMenuDraft => {
  const open = draft.accessMode === MenuAccessMode.OPEN;
  return {
    parentId: draft.parentId || undefined,
    name: draft.name.trim(),
    kind: draft.kind,
    path: draft.path || undefined,
    viewPath: draft.viewPath || undefined,
    routeName: draft.routeName || undefined,
    icon: draft.icon || undefined,
    accessMode: draft.accessMode,
    matchMode: draft.matchMode,
    actionIds: open ? [] : selectedActions.value.map((item) => item.id),
    sortOrder: draft.sortOrder,
  };
};

const privateOpenPicker = (): void => {
  pickerRef.value?.show(selectedActions.value);
};

const privateOnPicked = (actions: MenuActionOption[]): void => {
  selectedActions.value = actions;
  draft.actionIds = actions.map((item) => item.id);
};

const privateCancel = (): void => {
  if (isCreate.value) {
    visible.value = false;
    return;
  }
  session.exitEdit();
  applyDraft(target.value);
  hydrateActions(draft.actionIds);
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
    hydrateActions(draft.actionIds);
    done();
  });
};

const finishLocal = (): void => {
  Message.success("保存成功");
  if (isCreate.value) {
    visible.value = false;
  } else {
    session.exitEdit();
  }
  emits("success");
};

const privateSubmit = (): void => {
  if (!draft.name.trim()) {
    Message.warning("请输入菜单名称");
    return;
  }
  loading.value = true;
  const payload = asDraft();
  if (props.submit) {
    Promise.resolve(props.submit(payload, target.value))
      .then(finishLocal)
      .finally(() => {
        loading.value = false;
      });
    return;
  }
  if (target.value) {
    PlatformMenuUpdateAPI(applicationId.value, target.value.record.id, {
      expectedVersion: target.value.version,
      menu: payload,
    })
      .then((response) => {
        target.value = {
          ...target.value!,
          record: response.data.record,
          version: response.data.version,
        };
        applyDraft(target.value);
        hydrateActions(draft.actionIds);
        session.exitEdit();
        Message.success("保存成功");
        emits("success");
      })
      .finally(() => {
        loading.value = false;
      });
    return;
  }
  PlatformMenuCreateAPI(applicationId.value, payload)
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
  show(appId: string, menuList: MenuTreeRow[], current?: MenuTreeRow, appName = "") {
    applicationId.value = appId;
    applicationName.value = appName;
    menus.value = menuList;
    fullCatalog.value = undefined;
    lastAutoPath.value = current?.record.path ?? "";
    target.value = current;
    applyDraft(current);
    hydrateActions(draft.actionIds);
    if (current) {
      session.exitEdit();
    } else {
      session.enterEdit();
    }
    visible.value = true;
  },
});
</script>

<style lang="postcss" scoped>
.menu-actions-field :deep(.el-form-item__label) {
  display: flex;
  width: 100% !important;
  max-width: none;
}
</style>
