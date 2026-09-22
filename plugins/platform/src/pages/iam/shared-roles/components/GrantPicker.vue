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
          没有可用的组织应用
        </div>
        <div v-if="appHasMore" class="flex justify-center py-8px">
          <in-button text type="primary" :loading="appLoading" @in-click="privateLoadMoreApps">加载更多</in-button>
        </div>
      </div>
    </aside>
    <section class="flex-1 min-w-0 flex flex-col min-h-0 b-l b-l-solid b-[var(--in-border-color)] pl-16px">
      <div class="mb-12px text-[var(--in-text-color)]">{{ currentApp?.name || "请选择应用" }}</div>
      <div class="flex-1 min-h-0 overflow-auto">
        <div v-if="!applicationId" class="text-12px text-[var(--el-text-color-secondary)]">先从左侧选择组织应用</div>
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
            <div class="flex items-center gap-8px w-full min-w-0">
              <span class="truncate">{{ data.name }}</span>
              <in-button
                v-if="data.kind === 'resource'"
                text
                type="primary"
                class="shrink-0"
                :disabled="isReadDisabled(data.resourceId)"
                @click.stop="privateSelectRead(data.resourceId)"
              >
                仅选查看
              </in-button>
            </div>
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
import { Message } from "@ingot/admin-core";
import {
  AuthorizationDomain,
  ConfigurationStatus,
  IAM_DEFAULT_PAGE_SIZE,
  collectIamPageRecords,
  type AppActionRecord,
  type AppResourceRecord,
  type ApplicationRecord,
  type ResourceDetail,
} from "@ingot/admin-common";
import { PlatformActionPageAPI, PlatformApplicationPageAPI, PlatformResourcePageAPI } from "@/api/iam/catalog";
import { defaultScope, isReadAction, type SelectedGrant } from "../wizard";

defineOptions({ name: "GrantPicker" });

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

const resourceHasRead = (resourceId: string): boolean =>
  Boolean(resourceOf(resourceId)?.actions.some((item) => isReadAction(item.code)));

const isReadDisabled = (resourceId: string): boolean => {
  const resource = resourceOf(resourceId);
  return Boolean(resource?.loaded && !resourceHasRead(resourceId));
};

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
    while (true) {
      const response = await PlatformApplicationPageAPI(
        { current: appPage.value, size: IAM_DEFAULT_PAGE_SIZE },
        {
          name: appliedAppQuery.value || undefined,
          status: ConfigurationStatus.ENABLED,
        },
      );
      appTotal.value = response.data.total ?? 0;
      const next = (response.data.records ?? [])
        .filter((item) => item.record.domain === AuthorizationDomain.TENANT)
        .map((item: ResourceDetail<ApplicationRecord>) => ({
          id: item.record.id,
          name: item.record.name,
        }));
      applications.value = [...applications.value, ...next];
      const exhausted = appPage.value * IAM_DEFAULT_PAGE_SIZE >= appTotal.value || !response.data.records?.length;
      if (next.length || exhausted) {
        break;
      }
      appPage.value += 1;
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
    const records = await collectIamPageRecords((page) =>
      PlatformActionPageAPI(applicationId.value, page, { resourceId: resource.id }),
    );
    resource.actions = records
      .filter((item: ResourceDetail<AppActionRecord>) => asEnabled(item))
      .map((item) => ({
        id: item.record.id,
        code: item.record.code,
        name: item.record.name || item.record.code,
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

const privateSelectRead = (resourceId: string): void => {
  const resource = resourceOf(resourceId);
  if (!resource) {
    return;
  }
  void privateEnsureActions(resource).then(() => {
    const reads = resource.actions.filter((item) => isReadAction(item.code));
    if (!reads.length) {
      Message.warning("该资源没有查看操作");
      return;
    }
    replaceResourceGrants(resource, reads);
    nextTick(() => {
      treeRef.value?.getNode(`r:${resource.id}`)?.expand();
      applyTreeChecks();
    });
  });
};

onMounted(() => {
  void privateLoadApps();
});
</script>
