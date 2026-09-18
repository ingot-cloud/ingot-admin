<template>
  <in-drawer :title="title" v-model="visible" :loading="loading" size="560px">
    <el-form label-position="top">
      <el-form-item label="名称" required>
        <el-input v-model="draft.name" />
      </el-form-item>
      <el-form-item label="类型">
        <in-select v-model="draft.kind" :options="kindEnum.getOptions()" />
      </el-form-item>
      <el-form-item label="父菜单">
        <el-select v-model="draft.parentId" clearable filterable placeholder="根节点为空">
          <el-option
            v-for="item in parentOptions"
            :key="item.record.id"
            :label="item.record.name"
            :value="item.record.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="路径">
        <el-input v-model="draft.path" placeholder="可空" />
      </el-form-item>
      <el-form-item label="视图注册键">
        <el-input v-model="draft.viewPath" placeholder="可空" />
      </el-form-item>
      <el-form-item label="准入方式">
        <in-select v-model="draft.accessMode" :options="accessEnum.getOptions()" />
      </el-form-item>
      <el-form-item label="操作匹配">
        <in-select v-model="draft.matchMode" :options="matchEnum.getOptions()" />
      </el-form-item>
      <el-form-item label="关联操作">
        <el-select v-model="draft.actionIds" multiple filterable>
          <el-option
            v-for="item in actions"
            :key="item.record.id"
            :label="`${item.record.name} (${item.record.code})`"
            :value="item.record.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="排序">
        <el-input-number v-model="draft.sortOrder" :min="0" />
      </el-form-item>
    </el-form>
    <template #footer>
      <in-button @click="visible = false">取消</in-button>
      <in-button type="primary" :loading="loading" @in-click="privateSubmit">保存</in-button>
    </template>
  </in-drawer>
</template>

<script setup lang="ts">
import { Message } from "@ingot/admin-core";
import {
  MenuAccessMode,
  MenuKind,
  MenuMatchMode,
  useMenuAccessModeEnum,
  useMenuKindEnum,
  useMenuMatchModeEnum,
  type AppActionRecord,
  type AppMenuDraft,
  type AppMenuRecord,
  type ResourceDetail,
} from "@ingot/admin-common";
import { PlatformMenuCreateAPI, PlatformMenuUpdateAPI } from "@/api/iam/catalog";

defineOptions({ name: "MenuEditDrawer" });

const emits = defineEmits<{ success: [] }>();
const kindEnum = useMenuKindEnum();
const accessEnum = useMenuAccessModeEnum();
const matchEnum = useMenuMatchModeEnum();
const visible = ref(false);
const loading = ref(false);
const applicationId = ref("");
const actions = ref<Array<ResourceDetail<AppActionRecord>>>([]);
const menus = ref<Array<ResourceDetail<AppMenuRecord>>>([]);
const editing = ref<ResourceDetail<AppMenuRecord>>();
const draft = reactive<AppMenuDraft>({
  name: "",
  kind: MenuKind.PAGE,
  accessMode: MenuAccessMode.ACTION,
  matchMode: MenuMatchMode.ANY,
  actionIds: [],
  sortOrder: 0,
});

const title = computed(() => (editing.value ? "编辑菜单" : "创建菜单"));
const parentOptions = computed(() =>
  menus.value.filter((item) => item.record.id !== editing.value?.record.id),
);

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

const privateSubmit = (): void => {
  if (!draft.name.trim()) {
    Message.warning("请输入菜单名称");
    return;
  }
  loading.value = true;
  const done = (): void => {
    Message.success("保存成功");
    visible.value = false;
    emits("success");
  };
  if (editing.value) {
    PlatformMenuUpdateAPI(applicationId.value, editing.value.record.id, {
      expectedVersion: editing.value.version,
      menu: asDraft(),
    })
      .then(done)
      .finally(() => {
        loading.value = false;
      });
    return;
  }
  PlatformMenuCreateAPI(applicationId.value, asDraft())
    .then(done)
    .finally(() => {
      loading.value = false;
    });
};

defineExpose({
  show(
    appId: string,
    actionList: Array<ResourceDetail<AppActionRecord>>,
    menuList: Array<ResourceDetail<AppMenuRecord>>,
    target?: ResourceDetail<AppMenuRecord>,
  ) {
    applicationId.value = appId;
    actions.value = actionList;
    menus.value = menuList;
    editing.value = target;
    draft.parentId = target?.record.parentId;
    draft.name = target?.record.name ?? "";
    draft.kind = target?.record.kind ?? MenuKind.PAGE;
    draft.path = target?.record.path;
    draft.viewPath = target?.record.viewPath;
    draft.routeName = target?.record.routeName;
    draft.icon = target?.record.icon;
    draft.accessMode = target?.record.accessMode ?? MenuAccessMode.ACTION;
    draft.matchMode = target?.record.matchMode ?? MenuMatchMode.ANY;
    draft.actionIds = [...(target?.record.actionIds ?? [])];
    draft.sortOrder = target?.record.sortOrder ?? 0;
    visible.value = true;
  },
});
</script>
