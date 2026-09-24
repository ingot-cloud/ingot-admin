<template>
  <div class="flex h-full min-h-0">
    <aside class="w-240px shrink-0 flex flex-col min-h-0 pr-16px">
      <el-input
        v-model="appQuery"
        class="mb-12px"
        clearable
        placeholder="搜索应用"
        :prefix-icon="Search"
        @keyup.enter="privateSearchApps"
        @clear="privateSearchApps"
      />
      <div class="flex-1 min-h-0 overflow-auto">
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
    </aside>
    <section class="flex-1 min-w-0 flex flex-col min-h-0 b-l b-l-solid b-[var(--in-border-color)] pl-16px">
      <div class="mb-12px text-[var(--in-text-color)]">{{ currentApp?.name || "请选择应用" }}</div>
      <div class="flex-1 min-h-0 overflow-auto">
        <div v-if="!applicationId" class="text-12px text-[var(--el-text-color-secondary)]">
          先从左侧选择{{ appKindLabel }}
        </div>
        <in-tree
          v-else
          :key="applicationId"
          ref="treeRef"
          :data="treeData"
          node-key="id"
          lazy
          show-checkbox
          check-strictly
          :props="treeProps"
          :load="privateLoadNode"
          :default-checked-keys="checkedKeys"
          @check-change="privateOnCheckChange"
        >
          <template #default="{ data }">
            <span class="truncate">{{ data.name }}</span>
          </template>
        </in-tree>
        <div v-if="resourceHasMore" class="flex justify-center py-8px">
          <in-button text type="primary" :loading="resourceLoading" @in-click="privateLoadMoreResources">
            加载更多
          </in-button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { Search } from "@element-plus/icons-vue";
import {
  AuthorizationDomain,
  ConfigurationStatus,
  IAM_DEFAULT_PAGE_SIZE,
  type AppResourceRecord,
  type ApplicationRecord,
  type ResourceDetail,
} from "@ingot/admin-common";
import {
  PlatformActionLookupAPI,
  PlatformApplicationPageAPI,
  PlatformResourceActionsAPI,
  PlatformResourcePageAPI,
} from "@/api/iam/catalog";
import { defaultScope, type SelectedGrant } from "../wizard";

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

interface CatalogAction {
  id: string;
  code: string;
  name: string;
}

interface CatalogResource {
  id: string;
  name: string;
  scopeCapabilities: SelectedGrant["scopeCapabilities"];
  actions: CatalogAction[];
  loaded: boolean;
}

interface GrantTreeNode {
  id: string;
  name: string;
  kind: "resource" | "action";
  resourceId: string;
  loaded?: boolean;
  isLeaf: boolean;
  actionId?: string;
  actionCode?: string;
  children?: GrantTreeNode[];
}

interface TreeExpose {
  getCheckedNodes: (leafOnly?: boolean) => GrantTreeNode[];
  setCheckedKeys: (keys: string[]) => void;
  getNode: (key: string) => { expand: () => void } | undefined;
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
const resources = ref<CatalogResource[]>([]);
const resourcePage = ref(1);
const resourceTotal = ref(0);
const resourceLoading = ref(false);
const resourceCache = new Map<string, CatalogResource[]>();
const resourceTotals = new Map<string, number>();

const appHasMore = computed(() => applications.value.length < appTotal.value);
const resourceHasMore = computed(
  () => Boolean(applicationId.value) && resources.value.length < resourceTotal.value,
);

const applyingChecks = ref(false);
const treeData = ref<GrantTreeNode[]>([]);
const actionLoads = new Map<string, Promise<void>>();

const grantByAction = computed(() => new Map(grants.value.map((item) => [item.actionId, item])));

const keysFromGrants = (): string[] => {
  const keys = grants.value.map((item) => `a:${item.actionId}`);
  for (const resource of resources.value) {
    if (!resource.loaded || !resource.actions.length) {
      continue;
    }
    if (resource.actions.every((item) => grantByAction.value.has(item.id))) {
      keys.push(`r:${resource.id}`);
    }
  }
  return keys;
};

const checkedKeys = computed(() => keysFromGrants());

const applyTreeChecks = (): void => {
  applyingChecks.value = true;
  treeRef.value?.setCheckedKeys(keysFromGrants());
  nextTick(() => {
    applyingChecks.value = false;
  });
};

watch(
  () => resources.value.map((item) => item.id).join("|"),
  () => {
    treeData.value = resources.value.map((resource) => ({
      id: `r:${resource.id}`,
      name: resource.name,
      kind: "resource",
      resourceId: resource.id,
      isLeaf: false,
    }));
  },
);

const actionNodesOf = (resource: CatalogResource): GrantTreeNode[] =>
  resource.actions.map((action) => ({
    id: `a:${action.id}`,
    name: action.name,
    kind: "action",
    resourceId: resource.id,
    actionId: action.id,
    actionCode: action.code,
    isLeaf: true,
  }));

const resourceOf = (id: string): CatalogResource | undefined => resources.value.find((item) => item.id === id);

const asEnabled = <T extends { status: ConfigurationStatus }>(item: ResourceDetail<T>): boolean =>
  item.record.status === ConfigurationStatus.ENABLED;

const privateSearchApps = (): void => {
  appliedAppQuery.value = appQuery.value.trim();
  applications.value = [];
  appPage.value = 1;
  appTotal.value = 0;
  applicationId.value = "";
  resources.value = [];
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
  applicationId.value = app.id;
  const cached = resourceCache.get(app.id);
  if (cached) {
    resources.value = cached;
    resourcePage.value = Math.max(1, Math.ceil(cached.length / IAM_DEFAULT_PAGE_SIZE));
    resourceTotal.value = resourceTotals.get(app.id) ?? cached.length;
    void privateHydrateGrantedResources();
    return;
  }
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
    const response = await PlatformResourcePageAPI(appId, {
      current: resourcePage.value,
      size: IAM_DEFAULT_PAGE_SIZE,
    });
    resourceTotal.value = response.data.total ?? 0;
    const next = (response.data.records ?? []).filter(asEnabled).map((item: ResourceDetail<AppResourceRecord>) => ({
      id: item.record.id,
      name: item.record.name,
      scopeCapabilities: [...item.record.scopeCapabilities],
      actions: [] as CatalogAction[],
      loaded: false,
    }));
    resources.value = resourcePage.value === 1 ? next : [...resources.value, ...next];
    resourceCache.set(appId, resources.value);
    resourceTotals.set(appId, resourceTotal.value);
    await privateHydrateGrantedResources();
  } finally {
    resourceLoading.value = false;
  }
};

const privateLoadMoreResources = (): void => {
  resourcePage.value += 1;
  void privateLoadResources();
};

const privateEnsureActions = (resource: CatalogResource): Promise<void> => {
  if (resource.loaded) {
    return Promise.resolve();
  }
  const pending = actionLoads.get(resource.id);
  if (pending) {
    return pending;
  }
  const request = (async () => {
    if (!applicationId.value) {
      return;
    }
    const response = await PlatformResourceActionsAPI(applicationId.value, resource.id);
    resource.actions = (response.data ?? [])
      .filter((item) => item.status === ConfigurationStatus.ENABLED)
      .map((item) => ({
        id: item.id,
        code: item.code,
        name: item.name || item.code,
      }));
    resource.loaded = true;
  })();
  actionLoads.set(resource.id, request);
  return request;
};

const toGrant = (resource: CatalogResource, action: CatalogAction): SelectedGrant =>
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

const replaceResourceGrants = (resource: CatalogResource, actions: CatalogAction[]): void => {
  const keep = grants.value.filter((item) => item.resourceId !== resource.id);
  grants.value = [...keep, ...actions.map((action) => toGrant(resource, action))];
};

const privateLoadNode = (
  node: { level: number; data?: Partial<GrantTreeNode> },
  resolve: (data: GrantTreeNode[]) => void,
): void => {
  const data = node.data;
  if (node.level === 0 || data?.kind !== "resource" || !data.resourceId) {
    resolve([]);
    return;
  }
  const resource = resourceOf(data.resourceId);
  if (!resource) {
    resolve([]);
    return;
  }
  void privateEnsureActions(resource).then(() => {
    resolve(actionNodesOf(resource));
    nextTick(() => {
      treeRef.value?.getNode(`r:${resource.id}`)?.expand();
      applyTreeChecks();
    });
  });
};

const privateOnCheckChange = (data: GrantTreeNode, checked: boolean): void => {
  if (applyingChecks.value) {
    return;
  }
  const resource = resourceOf(data.resourceId);
  if (!resource) {
    return;
  }
  if (data.kind === "action" && data.actionId) {
    const action = resource.actions.find((item) => item.id === data.actionId);
    if (!action) {
      return;
    }
    if (checked) {
      replaceResourceGrants(resource, [
        ...resource.actions.filter((item) => grantByAction.value.has(item.id) && item.id !== action.id),
        action,
      ]);
    } else {
      grants.value = grants.value.filter((item) => item.actionId !== data.actionId);
    }
    nextTick(applyTreeChecks);
    return;
  }
  void privateEnsureActions(resource).then(() => {
    replaceResourceGrants(resource, checked ? resource.actions : []);
    nextTick(() => {
      treeRef.value?.getNode(`r:${resource.id}`)?.expand();
      applyTreeChecks();
    });
  });
};

const privateHydrateGrantedResources = async (): Promise<void> => {
  const selectedIds = grants.value
    .filter((item) => item.applicationId === applicationId.value)
    .map((item) => item.actionId);
  if (!selectedIds.length) {
    applyTreeChecks();
    return;
  }
  const response = await PlatformActionLookupAPI({ ids: selectedIds });
  const byResource = new Map<string, CatalogAction[]>();
  for (const item of (response.data ?? []).filter(
    (row) => row.applicationId === applicationId.value && row.status === ConfigurationStatus.ENABLED,
  )) {
    const list = byResource.get(item.resourceId) ?? [];
    list.push({
      id: item.id,
      code: item.code,
      name: item.name || item.code,
    });
    byResource.set(item.resourceId, list);
  }
  for (const resource of resources.value) {
    const actions = byResource.get(resource.id);
    if (!actions) {
      continue;
    }
    resource.actions = actions;
    resource.loaded = true;
  }
  await nextTick();
  await nextTick();
  for (const resource of resources.value) {
    if (resource.loaded) {
      treeRef.value?.getNode(`r:${resource.id}`)?.expand();
    }
  }
  applyTreeChecks();
};

onMounted(() => {
  void privateLoadApps();
});
</script>
