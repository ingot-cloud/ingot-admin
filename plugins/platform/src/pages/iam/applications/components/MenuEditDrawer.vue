<template>
  <in-drawer
    v-model="visible"
    :title="title"
    :size="editing ? '100%' : 'min(560px, 100vw)'"
    layout="pinned"
    padding="0"
    :close-position="editing ? 'start' : 'end'"
    :loading="loading"
    :before-close="beforeClose"
  >
    <div v-if="editing" class="in-wizard-frame flex h-full min-h-0">
      <wizard-nav
        :steps="MENU_EDITOR_STEPS"
        :current="step"
        :interactive="!isCreate"
        :statuses="statuses"
        @change="step = $event"
      />
      <section
        ref="editorBody"
        class="menu-editor-body flex-1 min-w-0 min-h-0 px-32px py-24px overflow-auto"
      >
        <div class="text-18px mb-24px">{{ MENU_EDITOR_STEPS[step].title }}</div>
        <in-form label-position="top" class="max-w-640px">
          <template v-if="step === 0">
            <el-form-item label="类型"
              ><in-select
                v-model="draft.kind"
                :options="kindEnum.getOptions()"
                placeholder="请选择菜单类型"
            /></el-form-item>
            <el-form-item label="名称" required :error="fieldError('name')" data-field="name"
              ><el-input v-model="draft.name" placeholder="如订单详情"
            /></el-form-item>
            <el-form-item label="图标"><catalog-icon-field v-model="draft.icon" /></el-form-item>
            <el-form-item label="父菜单"
              ><el-select
                v-model="draft.parentId"
                clearable
                filterable
                class="w-full"
                placeholder="根节点为空"
                ><el-option
                  v-for="item in parentOptions"
                  :key="item.record.id"
                  :value="item.record.id"
                  :label="item.record.name" /></el-select
            ></el-form-item>
            <el-form-item label="基础路径" :error="fieldError('path')" data-field="path"
              ><el-input v-model="draft.path" placeholder="如 /orders，目录可空"
            /></el-form-item>
            <el-form-item label="绑定视图"
              ><el-select
                v-model="draft.viewPath"
                clearable
                filterable
                class="w-full"
                placeholder="请选择视图注册键"
                @change="onViewChange"
                ><el-option-group
                  v-for="group in viewGroups"
                  :key="group.label"
                  :label="group.label"
                  ><el-option
                    v-for="item in group.options"
                    :key="item.value"
                    :value="item.value"
                    :label="item.label" /></el-option-group></el-select
            ></el-form-item>
            <el-form-item label="排序"
              ><el-input-number v-model="draft.sortOrder" :min="0" placeholder="请输入排序"
            /></el-form-item>
          </template>
          <template v-else-if="step === 1">
            <el-alert
              v-if="directory"
              title="目录的导航显示由可访问的子页面决定，无需关联操作。"
              :closable="false"
            />
            <template v-else>
              <el-form-item label="准入方式"
                ><in-select
                  v-model="draft.accessMode"
                  :options="accessEnum.getOptions()"
                  placeholder="请选择准入方式"
              /></el-form-item>
              <template v-if="draft.accessMode === MenuAccessMode.ACTION">
                <el-form-item label="操作匹配"
                  ><in-select
                    v-model="draft.matchMode"
                    :options="matchEnum.getOptions()"
                    placeholder="请选择任一或全部匹配"
                /></el-form-item>
                <el-form-item
                  label="关联操作"
                  required
                  :error="fieldError('actions')"
                  data-field="actions"
                  ><div class="w-full">
                    <in-button type="primary" link @in-click="openPicker">配置操作</in-button
                    ><action-hierarchy :actions="selectedActions" /></div
                ></el-form-item>
              </template>
            </template>
          </template>
          <template v-else>
            <el-form-item label="隐藏菜单" :error="fieldError('hidden')" data-field="hidden">
              <div class="flex items-center gap-[var(--in-space-3)]">
                <el-switch v-model="draft.hidden" class="shrink-0" />
                <span class="text-[var(--in-text-color-secondary)]"
                  >在左侧菜单及搜索中隐藏，仍可通过授权路由访问</span
                >
              </div>
            </el-form-item>
            <el-form-item v-if="!directory" label="缓存页面"
              ><el-switch v-model="draft.isCache"
            /></el-form-item>
            <el-form-item label="路由名称"
              ><el-input v-model="draft.routeName" placeholder="留空使用菜单 ID 生成稳定名称"
            /></el-form-item>
            <template v-if="!directory">
              <el-form-item label="传递路由参数">
                <div class="flex items-center gap-[var(--in-space-3)]">
                  <el-switch v-model="draft.props" class="shrink-0" />
                  <span class="text-[var(--in-text-color-secondary)]"
                    >将匹配的必填路径参数传给页面</span
                  >
                </div>
              </el-form-item>
              <div
                v-if="draft.props"
                class="menu-parameters flex flex-col gap-[var(--in-space-4)]"
                data-field="params"
              >
                <el-alert
                  title="声明参数名，实际值由业务页面跳转提供；带参页面必须隐藏。"
                  :closable="false"
                />
                <div
                  v-for="(param, index) in draft.routeParams"
                  :key="index"
                  class="menu-parameter-row"
                >
                  <el-form-item
                    :label="`参数 ${index + 1}`"
                    :error="fieldError(`param-${index}`)"
                    :data-field="`param-${index}`"
                  >
                    <el-input v-model="param.name" placeholder="如 orderId" />
                  </el-form-item>
                  <el-form-item label="备注（选填）">
                    <el-input v-model="param.remark" placeholder="参数备注（选填）" />
                  </el-form-item>
                  <div
                    class="menu-parameter-actions flex flex-wrap justify-end gap-[var(--in-space-2)]"
                  >
                    <in-button :disabled="index === 0" @click="moveParam(index, -1)">上移</in-button
                    ><in-button
                      :disabled="index === (draft.routeParams?.length ?? 0) - 1"
                      @click="moveParam(index, 1)"
                      >下移</in-button
                    ><in-button type="danger" @click="draft.routeParams?.splice(index, 1)"
                      >删除</in-button
                    >
                  </div>
                </div>
                <div v-if="fieldError('params')" class="text-[var(--el-color-danger)]">
                  {{ fieldError("params") }}
                </div>
                <in-button class="self-start" @click="draft.routeParams?.push({ name: '' })"
                  >新增参数</in-button
                >
              </div>
            </template>
            <el-form-item label="完整路由模板" class="mt-[var(--in-space-6)]">
              <in-copy-tag v-if="resolvedPath" class="menu-route-template" :text="resolvedPath" />
              <span v-else>-</span>
            </el-form-item>
          </template>
        </in-form>
      </section>
    </div>
    <in-biz-tabs v-else v-model="detailTab" align-content>
      <in-biz-tab-panel name="0" title="基本信息"
        ><in-form :editing="false">
          <in-detail-field label="类型" :value="kindEnum.getTagText(draft.kind).text" />
          <in-detail-field label="名称" :value="draft.name" />
          <in-detail-field label="图标"
            ><template #view
              ><catalog-icon-preview v-if="draft.icon" :value="draft.icon" /><span v-else
                >-</span
              ></template
            ></in-detail-field
          >
          <in-detail-field label="父菜单" :value="parentName" /><in-detail-field
            label="基础路径"
            :value="draft.path"
          />
          <in-detail-field label="绑定视图" :value="draft.viewPath" /><in-detail-field
            label="排序"
            :value="draft.sortOrder"
          /> </in-form
      ></in-biz-tab-panel>
      <in-biz-tab-panel name="1" title="访问控制"
        ><el-alert
          v-if="directory"
          title="目录的导航显示由可访问的子页面决定，无需关联操作。"
          :closable="false" /><in-form v-else :editing="false">
          <in-detail-field label="准入方式" :value="accessEnum.getTagText(draft.accessMode).text" />
          <template v-if="draft.accessMode === MenuAccessMode.ACTION"
            ><in-detail-field
              label="操作匹配"
              :value="matchEnum.getTagText(draft.matchMode).text" /><in-detail-field
              label="关联操作"
              ><template #view
                ><action-hierarchy :actions="selectedActions" /></template></in-detail-field
          ></template> </in-form
      ></in-biz-tab-panel>
      <in-biz-tab-panel name="2" title="高级配置"
        ><in-form :editing="false">
          <in-detail-field label="隐藏菜单" :value="draft.hidden ? '是' : '否'" /><in-detail-field
            v-if="!directory"
            label="缓存页面"
            :value="draft.isCache ? '是' : '否'"
          />
          <in-detail-field
            label="路由名称"
            :value="draft.routeName || `iam-menu-${target?.record.id}`"
          /><in-detail-field
            v-if="!directory"
            label="传递路由参数"
            :value="draft.props ? '是' : '否'"
          />
          <in-detail-field label="完整路由模板" :value="resolvedPath" /><in-detail-field
            v-for="(param, index) in draft.routeParams"
            :key="param.name"
            :label="`参数 ${index + 1}：${param.name}`"
            :value="param.remark || '-'"
          /> </in-form
      ></in-biz-tab-panel>
    </in-biz-tabs>
    <template #footer>
      <template v-if="editing">
        <in-button @click="cancel">取消</in-button>
        <in-button v-if="step > 0" @click="step--">上一步</in-button>
        <in-button v-if="isCreate && step < 2" type="primary" @in-click="next">下一步</in-button>
        <in-button
          v-else
          type="primary"
          :disabled="conflicted"
          :loading="loading"
          @in-click="save"
          >{{ isCreate ? "创建" : "保存" }}</in-button
        >
        <in-button v-if="conflicted" @in-click="reload">重新加载</in-button>
      </template>
      <in-button v-else-if="canEdit" type="primary" @in-click="enterEdit">编辑当前分组</in-button>
    </template>
  </in-drawer>
  <action-picker-dialog
    ref="pickerRef"
    :resolve-catalog="resolveActionCatalog"
    @confirm="onPicked"
  />
</template>
<script setup lang="ts">
import {
  confirmUnsavedChanges,
  Message,
  toDefaultMenuPath,
  refreshSessionMenus,
  isApiError,
  useCapabilities,
} from "@ingot/admin-core";
import {
  flattenMenuTree,
  MenuAccessMode,
  MenuKind,
  MenuMatchMode,
  useMenuAccessModeEnum,
  useMenuKindEnum,
  useMenuMatchModeEnum,
  BizIamWizardNav as WizardNav,
  MENU_EDITOR_STEPS,
  resolveMenuPath,
  validateMenu,
  iamEditorFailure,
  IamAction,
  type AppMenuDraft,
  type MenuTreeRow,
} from "@ingot/admin-common";
import {
  PlatformMenuCreateAPI,
  PlatformMenuUpdateAPI,
  PlatformMenuTreeAPI,
} from "@/api/iam/catalog";
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
const visible = ref(false),
  editing = ref(false),
  loading = ref(false),
  conflicted = ref(false);
const checkedGroups = ref(new Set<number>());
const detailTab = ref("0"),
  step = ref(0),
  validated = ref(false);
const applicationId = ref(""),
  applicationName = ref("");
const menus = ref<MenuTreeRow[]>([]),
  target = ref<MenuTreeRow>();
const selectedActions = ref<MenuActionOption[]>([]),
  fullCatalog = ref<ActionCatalog>();
const pickerRef = ref<{ show: (current: MenuActionOption[]) => void }>();
const editorBody = ref<HTMLElement>();
const kindEnum = useMenuKindEnum(),
  accessEnum = useMenuAccessModeEnum(),
  matchEnum = useMenuMatchModeEnum();
const capabilities = useCapabilities();
const canEdit = computed(
  () => Boolean(props.submit) || capabilities.hasAction(IamAction.PLATFORM_MENU_UPDATE),
);
const viewGroups = computed(() => viewPathOptionGroups());
const draft = reactive<AppMenuDraft>({
  name: "",
  kind: MenuKind.PAGE,
  accessMode: MenuAccessMode.ACTION,
  matchMode: MenuMatchMode.ANY,
  actionIds: [],
  sortOrder: 0,
  hidden: false,
  isCache: false,
  props: false,
  routeParams: [],
});
const isCreate = computed(() => !target.value),
  directory = computed(() => draft.kind === MenuKind.DIRECTORY);
const title = computed(() =>
  editing.value ? (isCreate.value ? "创建菜单" : "编辑菜单") : "菜单详情",
);
const resolvedPath = computed(() =>
  resolveMenuPath(draft.path, !directory.value && draft.props ? draft.routeParams : []),
);
const errors = computed(() => validateMenu(asDraft()));
const statuses = computed(() =>
  MENU_EDITOR_STEPS.map((_, i) =>
    errors.value.some((e) => e.step === i)
      ? validated.value && checkedGroups.value.has(i)
        ? ("invalid" as const)
        : ("pending" as const)
      : ("valid" as const),
  ),
);
const fieldError = (field: string): string | undefined =>
  validated.value
    ? errors.value.find((e) => e.field === field && checkedGroups.value.has(e.step))?.message
    : undefined;
let baseline = "",
  lastAutoPath = "",
  requestEpoch = 0,
  hydrated = false;
const descendants = (rows: MenuTreeRow[], id: string): Set<string> => {
  const row = flattenMenuTree(rows).find((item) => item.record.id === id);
  return new Set(row ? flattenMenuTree([row]).map((item) => item.record.id) : []);
};
const parentOptions = computed(() => {
  const excluded = target.value
    ? descendants(menus.value, target.value.record.id)
    : new Set<string>();
  return flattenMenuTree(menus.value).filter((item) => !excluded.has(item.record.id));
});
const parentName = computed(
  () =>
    parentOptions.value.find((item) => item.record.id === draft.parentId)?.record.name ?? "根节点",
);
function asDraft(): AppMenuDraft {
  return {
    ...draft,
    name: draft.name.trim(),
    path: draft.path || undefined,
    routeName: draft.routeName || undefined,
    accessMode: directory.value ? MenuAccessMode.OPEN : draft.accessMode,
    matchMode: directory.value ? MenuMatchMode.ANY : draft.matchMode,
    actionIds:
      directory.value || draft.accessMode === MenuAccessMode.OPEN ? [] : [...draft.actionIds],
    isCache: !directory.value && Boolean(draft.isCache),
    props: !directory.value && Boolean(draft.props),
    routeParams:
      !directory.value && draft.props ? (draft.routeParams ?? []).map((p) => ({ ...p })) : [],
  };
}
function applyDraft(row?: MenuTreeRow): void {
  requestEpoch++;
  Object.assign(draft, {
    parentId: row?.record.parentId,
    name: row?.record.name ?? "",
    kind: row?.record.kind ?? MenuKind.PAGE,
    path: row?.record.path,
    viewPath: row?.record.viewPath,
    routeName: row?.record.routeName,
    icon: row?.record.icon,
    accessMode: row?.record.accessMode ?? MenuAccessMode.ACTION,
    matchMode: row?.record.matchMode ?? MenuMatchMode.ANY,
    actionIds: [...(row?.record.actionIds ?? [])],
    sortOrder: row?.record.sortOrder ?? 0,
    hidden: row?.record.hidden ?? false,
    isCache: row?.record.isCache ?? false,
    props: row?.record.props ?? false,
    routeParams: (row?.record.routeParams ?? []).map((p) => ({ ...p })),
  });
  selectedActions.value = [];
  hydrated = false;
  baseline = JSON.stringify(draft);
}
async function resolveActionCatalog(): Promise<ActionCatalog> {
  if (props.resolveCatalog) return props.resolveCatalog();
  if (fullCatalog.value) return fullCatalog.value;
  const catalog = await loadApplicationCatalog(applicationId.value);
  fullCatalog.value = catalog;
  return catalog;
}
async function hydrateActions(): Promise<void> {
  if (hydrated || !draft.actionIds.length || directory.value) return;
  const epoch = requestEpoch;
  try {
    const actions = props.resolveCatalog
      ? actionsOfCatalog(await props.resolveCatalog(), draft.actionIds)
      : target.value
        ? await loadMenuAssociatedActions(
            applicationId.value,
            target.value.record.id,
            applicationName.value,
          )
        : [];
    if (epoch === requestEpoch) {
      selectedActions.value = actions;
      hydrated = true;
    }
  } catch (error) {
    await iamEditorFailure(error);
  }
}
watch([detailTab, step, visible, editing], () => {
  if (visible.value && (editing.value ? step.value === 1 : detailTab.value === "1"))
    void hydrateActions();
});
function onViewChange(value?: string): void {
  if (value && (!draft.path || draft.path === lastAutoPath)) {
    lastAutoPath = toDefaultMenuPath(value);
    draft.path = lastAutoPath;
  }
}
async function openPicker(): Promise<void> {
  await hydrateActions();
  pickerRef.value?.show(selectedActions.value);
}
function onPicked(actions: MenuActionOption[]): void {
  requestEpoch++;
  selectedActions.value = actions;
  draft.actionIds = actions.map((a) => a.id);
  hydrated = true;
}
function moveParam(index: number, delta: number): void {
  const params = draft.routeParams ?? [];
  const [param] = params.splice(index, 1);
  if (param) params.splice(index + delta, 0, param);
}
function enterEdit(): void {
  if (!canEdit.value) return;
  step.value = Number(detailTab.value);
  baseline = JSON.stringify(draft);
  editing.value = true;
  validated.value = false;
  checkedGroups.value.clear();
}
async function leaveAllowed(): Promise<boolean> {
  return !loading.value && (JSON.stringify(draft) === baseline || (await confirmUnsavedChanges()));
}
async function cancel(): Promise<void> {
  if (!(await leaveAllowed())) return;
  if (isCreate.value) visible.value = false;
  else {
    applyDraft(target.value);
    editing.value = false;
  }
}
async function beforeClose(done: () => void): Promise<void> {
  if (!editing.value) done();
  else if (await leaveAllowed()) {
    if (isCreate.value) done();
    else {
      applyDraft(target.value);
      editing.value = false;
    }
  }
}
async function locateError(group?: number): Promise<boolean> {
  validated.value = true;
  for (const index of group === undefined ? [0, 1, 2] : [group]) checkedGroups.value.add(index);
  const error = errors.value.find((e) => group === undefined || e.step === group);
  if (!error) return false;
  step.value = error.step;
  Message.warning(error.message);
  await nextTick();
  const field = editorBody.value?.querySelector(`[data-field="${error.field}"]`);
  field?.scrollIntoView({ block: "center" });
  (field?.querySelector("input, button") as HTMLElement | null)?.focus();
  return true;
}
async function next(): Promise<void> {
  if (!(await locateError(step.value))) step.value++;
}
async function reload(): Promise<void> {
  if (!(await leaveAllowed())) return;
  loading.value = true;
  try {
    const response = await PlatformMenuTreeAPI(applicationId.value);
    menus.value = response.data;
    const latest = flattenMenuTree(response.data).find(
      (r) => r.record.id === target.value?.record.id,
    );
    if (!latest) {
      Message.warning("菜单已删除");
      visible.value = false;
      return;
    }
    target.value = latest;
    applyDraft(latest);
    conflicted.value = false;
    editing.value = false;
    emits("success");
  } catch (error) {
    await iamEditorFailure(error);
  } finally {
    loading.value = false;
  }
}
async function save(): Promise<void> {
  if (loading.value || conflicted.value || (await locateError())) return;
  loading.value = true;
  try {
    const payload = asDraft();
    if (props.submit) {
      await props.submit(payload, target.value);
      if (target.value)
        target.value = {
          ...target.value,
          record: {
            ...target.value.record,
            ...payload,
            resolvedPath: resolveMenuPath(payload.path, payload.routeParams),
          },
        };
    } else if (target.value) {
      const response = await PlatformMenuUpdateAPI(applicationId.value, target.value.record.id, {
        expectedVersion: target.value.version,
        menu: payload,
      });
      target.value = { ...target.value, ...response.data };
    } else await PlatformMenuCreateAPI(applicationId.value, payload);
    // 保存已经成功，刷新失败不能再次提交同一个创建请求。
    if (!props.submit) {
      try {
        await refreshSessionMenus();
      } catch {
        Message.warning("菜单已保存，当前会话刷新失败，请刷新页面");
      }
    }
    if (target.value) {
      applyDraft(target.value);
      editing.value = false;
    } else visible.value = false;
    Message.success("保存成功");
    emits("success");
  } catch (error) {
    conflicted.value = isApiError(error) && error.status === 409;
    await iamEditorFailure(error);
  } finally {
    loading.value = false;
  }
}
defineExpose({
  show(appId: string, menuList: MenuTreeRow[], current?: MenuTreeRow, appName = "") {
    requestEpoch++;
    applicationId.value = appId;
    applicationName.value = appName;
    menus.value = menuList;
    target.value = current;
    fullCatalog.value = undefined;
    lastAutoPath = current?.record.path ?? "";
    detailTab.value = "0";
    step.value = 0;
    validated.value = false;
    checkedGroups.value.clear();
    conflicted.value = false;
    applyDraft(current);
    editing.value = !current;
    visible.value = true;
  },
});
</script>
<style lang="postcss" scoped>
.menu-parameter-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: var(--in-space-3);
  padding: var(--in-space-4);
  border: 1px solid var(--in-border-color-light);
  border-radius: var(--in-radius-card);
}
.menu-parameters .menu-parameter-row :deep(.el-form-item) {
  min-width: 0;
  margin-bottom: 0;
}
.menu-parameter-row :deep(.el-form-item__error) {
  position: static;
  padding-top: var(--in-space-1);
}
.menu-parameter-actions {
  grid-column: 1 / -1;
}
.menu-parameter-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}
.menu-route-template {
  align-self: flex-start;
  max-width: 100%;
  height: auto;
  min-height: 32px;
  padding: var(--in-space-1) var(--in-space-3);
  color: var(--in-color-primary);
  background-color: color-mix(in srgb, var(--in-color-primary) 8%, var(--in-bg-color));
  border-color: color-mix(in srgb, var(--in-color-primary) 25%, var(--in-bg-color));
  line-height: var(--in-line-height-body);
  text-align: left;
  white-space: normal;
}
.menu-route-template :deep(.el-tag__content) {
  min-width: 0;
  overflow-wrap: anywhere;
}
@media (max-width: 700px) {
  .menu-editor-body {
    padding: var(--in-space-4);
  }
  .menu-parameter-row {
    grid-template-columns: 1fr;
  }
}
</style>
