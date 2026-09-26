<template>
  <div class="flex h-full min-h-0">
    <aside class="w-220px shrink-0 flex flex-col min-h-0 pr-16px">
      <el-input
        v-model="appQuery"
        class="mb-12px"
        clearable
        placeholder="搜索应用"
        :prefix-icon="Search"
        @keyup.enter="privateSearchApps"
        @clear="privateSearchApps"
      />
      <in-loading :loading="appLoading" class="flex-1 min-h-0">
        <div class="h-full overflow-auto">
          <in-tree
            :data="applications"
            node-key="id"
            :props="{ label: 'name' }"
            :current-node-key="applicationId"
            highlight-current
            @node-click="privateSelectApp"
          />
          <div v-if="!applications.length && !appLoading" class="text-12px text-[var(--el-text-color-secondary)] px-8px">
            没有可用的{{ appKindLabel }}
          </div>
          <div v-if="appHasMore" class="flex justify-center py-8px">
            <in-button text type="primary" :loading="appLoading" @in-click="privateLoadMoreApps">加载更多</in-button>
          </div>
        </div>
      </in-loading>
    </aside>
    <section class="flex-1 min-w-0 flex flex-col min-h-0 b-l b-l-solid b-[var(--in-border-color)] px-16px">
      <div class="mb-12px text-[var(--in-text-color)]">{{ currentApp?.name || "请选择应用" }}</div>
      <in-loading :loading="resourceLoading" class="flex-1 min-h-0">
        <div class="h-full overflow-auto">
          <div v-if="!applicationId" class="text-12px text-[var(--el-text-color-secondary)]">
            先从左侧选择{{ appKindLabel }}
          </div>
          <in-tree
            v-else-if="resourceReady"
            :key="resourceTreeKey"
            ref="treeRef"
            :data="treeData"
            node-key="id"
            show-checkbox
            :props="treeProps"
            :default-checked-keys="checkedKeys"
            @check="privateOnCheck"
          >
            <template #default="{ data }">
              <span class="truncate">{{ data.name }}</span>
              <span
                v-if="resourceCheckHint(data)"
                class="ml-8px shrink-0 text-12px text-[var(--el-text-color-secondary)]"
              >
                {{ resourceCheckHint(data) }}
              </span>
            </template>
          </in-tree>
          <div v-if="resourceHasMore" class="flex justify-center py-8px">
            <in-button text type="primary" :loading="resourceLoading" @in-click="privateLoadMoreResources">
              加载更多
            </in-button>
          </div>
        </div>
      </in-loading>
    </section>
    <aside class="w-280px shrink-0 flex flex-col min-h-0 min-w-0 b-l b-l-solid b-[var(--in-border-color)] pl-16px">
      <div class="mb-12px">已选 {{ grants.length }} 个权限</div>
      <div class="flex-1 min-h-0 overflow-auto">
        <div v-if="!selectedGroups.length" class="text-12px text-[var(--el-text-color-secondary)]">
          尚未选择权限
        </div>
        <div v-for="app in selectedGroups" :key="app.applicationId" class="flex flex-col gap-12px mb-16px">
          <div>{{ app.applicationName }}</div>
          <div class="h-1px bg-[var(--in-border-color)]" />
          <div v-for="resource in app.resources" :key="resource.resourceId" class="flex flex-col gap-8px">
            <div class="truncate">{{ resource.resourceName }}</div>
            <div
              v-for="grant in resource.grants"
              :key="grant.actionId"
              class="pl-12px flex items-center gap-8px min-w-0"
            >
              <span class="truncate flex-1 min-w-0">{{ grant.actionName }}</span>
              <in-close-button size="sm" :label="`移除 ${grant.actionName}`" @click="privateRemoveGrant(grant.actionId)" />
            </div>
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { Search } from "@element-plus/icons-vue";
import {
  AuthorizationDomain,
  ConfigurationStatus,
  IAM_DEFAULT_PAGE_SIZE,
  type ApplicationRecord,
  type GrantCatalogAction,
  type GrantCatalogResource,
  type ResourceDetail,
} from "@ingot/admin-common";
import { InCloseButton } from "@ingot/admin-core";
import { PlatformApplicationPageAPI, PlatformGrantCatalogAPI } from "@/api/iam/catalog";
import { defaultScope, groupGrants, type SelectedGrant } from "../wizard";

defineOptions({ name: "GrantPicker" });

const props = withDefaults(
  defineProps<{
    domain?: AuthorizationDomain;
  }>(),
  {
    domain: AuthorizationDomain.TENANT,
  },
);

interface CatalogApp {
  id: string;
  name: string;
}

interface GrantTreeNode {
  id: string;
  name: string;
  kind: "resource" | "action";
  resourceId: string;
  isLeaf: boolean;
  actionId?: string;
  actionCode?: string;
  children?: GrantTreeNode[];
}

interface TreeExpose {
  getCheckedKeys: (leafOnly?: boolean) => string[];
  setCheckedKeys: (keys: string[]) => void;
}

const grants = defineModel<SelectedGrant[]>({ default: () => [] });
const treeRef = ref<TreeExpose>();
const treeProps = { label: "name", children: "children", isLeaf: "isLeaf" };

const appQuery = ref("");
const appliedAppQuery = ref("");
const applications = ref<CatalogApp[]>([]);
const appPage = ref(1);
const appTotal = ref(0);
const appLoading = ref(false);
const applicationId = ref("");
const currentApp = computed(() => applications.value.find((item) => item.id === applicationId.value));
const appKindLabel = computed(() =>
  props.domain === AuthorizationDomain.PLATFORM ? "平台应用" : "组织应用",
);
const resources = ref<GrantCatalogResource[]>([]);
const resourcePage = ref(1);
const resourceTotal = ref(0);
const resourceLoading = ref(false);
const resourceReady = ref(false);
const resourceCache = new Map<string, GrantCatalogResource[]>();
const resourceTotals = new Map<string, number>();
const resourceTreeKey = computed(
  () => `${applicationId.value}:${resources.value.map((item) => item.id).join("|")}`,
);

const cloneResources = (rows: GrantCatalogResource[]): GrantCatalogResource[] =>
  rows.map((item) => ({
    ...item,
    scopeCapabilities: [...item.scopeCapabilities],
    actions: item.actions.map((action) => ({ ...action })),
  }));

const actionNodesOf = (resource: GrantCatalogResource): GrantTreeNode[] =>
  resource.actions.map((action) => ({
    id: `a:${action.id}`,
    name: action.name,
    kind: "action",
    resourceId: resource.id,
    actionId: action.id,
    actionCode: action.code,
    isLeaf: true,
  }));

const resourceNodesOf = (): GrantTreeNode[] =>
  resources.value.map((resource) => ({
    id: `r:${resource.id}`,
    name: resource.name,
    kind: "resource",
    resourceId: resource.id,
    isLeaf: resource.actions.length === 0,
    children: actionNodesOf(resource),
  }));

const appHasMore = computed(() => applications.value.length < appTotal.value);
const resourceHasMore = computed(
  () => Boolean(applicationId.value) && resources.value.length < resourceTotal.value,
);

const applyingChecks = ref(false);
let treeSyncGeneration = 0;
const treeData = ref<GrantTreeNode[]>([]);

const grantByAction = computed(() => new Map(grants.value.map((item) => [item.actionId, item])));
const selectedGroups = computed(() => groupGrants(grants.value));

const selectedCountOf = (resourceId: string): number =>
  grants.value.filter((item) => item.resourceId === resourceId).length;

const resourceCheckHint = (data: GrantTreeNode): string => {
  if (data.kind !== "resource") {
    return "";
  }
  const resource = resourceOf(data.resourceId);
  if (!resource?.actions.length) {
    return "";
  }
  const selected = selectedCountOf(data.resourceId);
  if (!selected) {
    return "";
  }
  return selected === resource.actions.length ? "全部" : `已选 ${selected}`;
};

const keysFromGrants = (): string[] =>
  grants.value
    .filter((item) => resources.value.some((resource) => resource.actions.some((action) => action.id === item.actionId)))
    .map((item) => `a:${item.actionId}`);

const checkedKeys = computed(() => keysFromGrants());

const beginTreeSync = (): void => {
  treeSyncGeneration += 1;
  applyingChecks.value = true;
};

const endTreeSync = (): void => {
  const generation = treeSyncGeneration;
  nextTick(() => {
    nextTick(() => {
      if (generation === treeSyncGeneration) {
        applyingChecks.value = false;
      }
    });
  });
};

const applyTreeChecks = (): void => {
  beginTreeSync();
  treeRef.value?.setCheckedKeys(keysFromGrants());
  endTreeSync();
};

watch(
  () => resources.value.map((item) => item.id).join("|"),
  () => {
    treeData.value = resourceNodesOf();
  },
);

const resourceOf = (id: string): GrantCatalogResource | undefined => resources.value.find((item) => item.id === id);

const privateSearchApps = (): void => {
  beginTreeSync();
  appliedAppQuery.value = appQuery.value.trim();
  applications.value = [];
  appPage.value = 1;
  appTotal.value = 0;
  applicationId.value = "";
  resources.value = [];
  resourceReady.value = false;
  void privateLoadApps();
};

const privateLoadApps = async (): Promise<void> => {
  appLoading.value = true;
  try {
    const response = await PlatformApplicationPageAPI(
      { current: appPage.value, size: IAM_DEFAULT_PAGE_SIZE },
      {
        domain: props.domain,
        name: appliedAppQuery.value || undefined,
        status: ConfigurationStatus.ENABLED,
      },
    );
    appTotal.value = response.data.total ?? 0;
    const next = (response.data.records ?? []).map((item: ResourceDetail<ApplicationRecord>) => ({
      id: item.record.id,
      name: item.record.name,
    }));
    applications.value = appPage.value === 1 ? next : [...applications.value, ...next];
    const preferredId = grants.value[0]?.applicationId;
    const preferred = preferredId
      ? applications.value.find((item) => item.id === preferredId)
      : undefined;
    if (preferred) {
      if (!applicationId.value) {
        privateSelectApp(preferred);
      }
      return;
    }
    if (!applicationId.value && applications.value[0]) {
      privateSelectApp(applications.value[0]);
    }
  } finally {
    appLoading.value = false;
  }
};

const privateLoadMoreApps = (): void => {
  appPage.value += 1;
  void privateLoadApps();
};

const privateSelectApp = (app: CatalogApp): void => {
  beginTreeSync();
  applicationId.value = app.id;
  const cached = resourceCache.get(app.id);
  if (cached) {
    resourceLoading.value = true;
    resources.value = cloneResources(cached);
    resourcePage.value = Math.max(1, Math.ceil(cached.length / IAM_DEFAULT_PAGE_SIZE));
    resourceTotal.value = resourceTotals.get(app.id) ?? cached.length;
    resourceReady.value = true;
    nextTick(applyTreeChecks);
    resourceLoading.value = false;
    return;
  }
  resourceReady.value = false;
  resources.value = [];
  resourcePage.value = 1;
  resourceTotal.value = 0;
  void privateLoadResources();
};

const privateLoadResources = async (): Promise<void> => {
  const appId = applicationId.value;
  if (!appId) {
    return;
  }
  resourceLoading.value = true;
  try {
    const response = await PlatformGrantCatalogAPI(appId, {
      current: resourcePage.value,
      size: IAM_DEFAULT_PAGE_SIZE,
    });
    if (applicationId.value !== appId) {
      return;
    }
    resourceTotal.value = response.data.total ?? 0;
    const next = cloneResources(response.data.records ?? []);
    resources.value = resourcePage.value === 1 ? next : [...resources.value, ...next];
    resourceCache.set(appId, cloneResources(resources.value));
    resourceTotals.set(appId, resourceTotal.value);
    resourceReady.value = true;
    nextTick(applyTreeChecks);
  } finally {
    if (applicationId.value === appId) {
      resourceLoading.value = false;
    }
  }
};

const privateLoadMoreResources = (): void => {
  resourcePage.value += 1;
  void privateLoadResources();
};

const toGrant = (resource: GrantCatalogResource, action: GrantCatalogAction): SelectedGrant =>
  grantByAction.value.get(action.id) ?? {
    actionId: action.id,
    actionCode: action.code,
    actionName: action.name,
    resourceId: resource.id,
    resourceName: resource.name,
    applicationId: applicationId.value,
    applicationName: currentApp.value?.name ?? "",
    scopes: [defaultScope(resource.scopeCapabilities)],
    scopeCapabilities: [...resource.scopeCapabilities],
  };

const replaceLoadedGrants = (actionIds: Set<string>): void => {
  const loaded = new Set(resources.value.map((item) => item.id));
  const keep = grants.value.filter(
    (item) => item.applicationId !== applicationId.value || !loaded.has(item.resourceId),
  );
  const next = [...keep];
  for (const resource of resources.value) {
    for (const action of resource.actions) {
      if (actionIds.has(action.id)) {
        next.push(toGrant(resource, action));
      }
    }
  }
  grants.value = next;
};

const privateOnCheck = (): void => {
  if (applyingChecks.value) {
    return;
  }
  const keys = treeRef.value?.getCheckedKeys(true) ?? [];
  replaceLoadedGrants(
    new Set(keys.filter((key) => key.startsWith("a:")).map((key) => key.slice(2))),
  );
};

const privateRemoveGrant = (actionId: string): void => {
  grants.value = grants.value.filter((item) => item.actionId !== actionId);
  nextTick(applyTreeChecks);
};

onMounted(() => {
  void privateLoadApps();
});
</script>
