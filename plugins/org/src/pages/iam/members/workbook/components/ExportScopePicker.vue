<template>
  <div class="export-scope">
    <div class="export-scope__pane">
    <in-loading :loading="loading" class="export-scope__body">
      <div class="export-scope__search">
        <el-input
          v-model="keyword"
          clearable
          placeholder="请输入姓名"
          @input="privateQueueSearch"
          @keyup.enter="privateSearch"
          @clear="privateSearch"
        >
          <template #prefix>
            <in-icon name="ep:search" />
          </template>
        </el-input>
      </div>
      <nav v-if="!searching" class="export-scope__path" aria-label="部门路径">
        <button
          type="button"
          :disabled="path.length === 0"
          :class="{ 'is-current': path.length === 0 }"
          @click="privateOpen()"
        >
          {{ organizationName }}
        </button>
        <template v-for="(item, index) in path" :key="item.id">
          <in-icon name="ep:arrow-right" class="text-12px" />
          <span v-if="index === path.length - 1" aria-current="location">{{ item.name }}</span>
          <button v-else type="button" @click="privateOpen(item.id)">{{ item.name }}</button>
        </template>
      </nav>
      <div class="export-scope__all">
        <el-checkbox
          :model-value="allLoaded"
          :indeterminate="someLoaded"
          :disabled="loading || loadedCount === 0"
          @change="privateToggleLoaded"
        >
          全选
        </el-checkbox>
      </div>
      <div class="export-scope__list">
        <div v-for="item in departments" v-show="!searching" :key="item.id" class="export-scope__row">
          <el-checkbox
            :model-value="departmentIds.has(item.id)"
            :aria-label="item.name"
            @change="(checked: boolean | string | number) => privateToggleDepartment(item, checked === true)"
          />
          <department-mark />
          <span class="export-scope__name">{{ item.name }}</span>
          <in-button link type="primary" @in-click="privateOpen(item.id, item.name)">展开</in-button>
        </div>
        <in-button
          v-if="!searching && departmentHasMore"
          link
          type="primary"
          @in-click="privateLoad(false, true)"
        >
          加载更多部门
        </in-button>
        <label v-for="item in members" :key="item.id" class="export-scope__row">
          <el-checkbox
            :model-value="memberIds.has(item.id)"
            :aria-label="item.name"
            @change="(checked: boolean | string | number) => privateToggleMember(item, checked === true)"
          />
          <in-avatar :src="item.avatar" :name="item.name" :show-name="false" :size="32" />
          <span class="export-scope__member">
            <span class="export-scope__name">{{ item.name }}</span>
            <span v-if="item.summary" class="export-scope__summary">{{ item.summary }}</span>
          </span>
        </label>
        <in-button v-if="memberHasMore" link type="primary" @in-click="privateLoad(true, false)">
          加载更多成员
        </in-button>
        <p v-if="failed" class="export-scope__empty">
          加载失败
          <in-button link type="primary" @in-click="privateLoad(false, false)">重试</in-button>
        </p>
        <p v-else-if="!loading && loadedCount === 0" class="export-scope__empty">暂无成员</p>
      </div>
    </in-loading>
    </div>
    <div class="export-scope__pane export-scope__selected">
      <div v-if="selectedCount > 0" class="export-scope__selected-head">
        <span>已选：{{ selectedCount }}</span>
        <in-button link type="primary" @in-click="privateClear">清空</in-button>
      </div>
      <div class="export-scope__list">
        <div v-for="item in model.departments" :key="`d-${item.id}`" class="export-scope__row">
          <department-mark />
          <span class="export-scope__name">{{ item.name }}</span>
          <in-button link @in-click="privateToggleDepartment(item, false)">
            <in-icon name="ep:close" />
          </in-button>
        </div>
        <div v-for="item in model.members" :key="`m-${item.id}`" class="export-scope__row">
          <in-avatar :src="item.avatar" :name="item.name" :show-name="false" :size="32" />
          <span class="export-scope__name">{{ item.name }}</span>
          <in-button link @in-click="privateToggleMember(item, false)">
            <in-icon name="ep:close" />
          </in-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  IAM_DEFAULT_PAGE_SIZE,
  OrganizationMemberScene,
  type IamSelectOption,
} from "@ingot/admin-common";
import { TenantOrganizationMemberBrowseAPI } from "@/api/iam/directory";
import DepartmentMark from "../../components/DepartmentMark.vue";
import {
  emptyExportScope,
  type ExportScopeDepartment,
  type ExportScopeMember,
  type ExportScopeSelection,
} from "../exportScope";

defineOptions({ name: "ExportScopePicker" });

const model = defineModel<ExportScopeSelection>({ required: true });

const loading = ref(false);
const failed = ref(false);
const keyword = ref("");
const searching = computed(() => keyword.value.trim().length > 0);
const departmentId = ref<string>();
const path = ref<ExportScopeDepartment[]>([]);
const organizationName = ref("当前组织");
const departments = ref<ExportScopeDepartment[]>([]);
const members = ref<ExportScopeMember[]>([]);
const departmentTotal = ref(0);
const memberTotal = ref(0);
const departmentPage = ref(0);
const memberPage = ref(0);
let requestId = 0;
let searchTimer = 0;

const departmentIds = computed(() => new Set(model.value.departments.map((item) => item.id)));
const memberIds = computed(() => new Set(model.value.members.map((item) => item.id)));
const departmentHasMore = computed(
  () => departments.value.length < departmentTotal.value && departmentPage.value > 0,
);
const memberHasMore = computed(() => members.value.length < memberTotal.value && memberPage.value > 0);
const loadedCount = computed(
  () => (searching.value ? 0 : departments.value.length) + members.value.length,
);
const selectedLoadedCount = computed(() => {
  const departmentCount = searching.value
    ? 0
    : departments.value.filter((item) => departmentIds.value.has(item.id)).length;
  const memberCount = members.value.filter((item) => memberIds.value.has(item.id)).length;
  return departmentCount + memberCount;
});
const allLoaded = computed(() => loadedCount.value > 0 && selectedLoadedCount.value === loadedCount.value);
const someLoaded = computed(() => selectedLoadedCount.value > 0 && !allLoaded.value);
const selectedCount = computed(() => model.value.departments.length + model.value.members.length);

onMounted(() => {
  void privateLoad(false, false);
});

onBeforeUnmount(() => {
  window.clearTimeout(searchTimer);
});

const privateQueueSearch = (): void => {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => {
    void privateLoad(false, false);
  }, 300);
};

const privateSearch = (): void => {
  window.clearTimeout(searchTimer);
  void privateLoad(false, false);
};

const privateOpen = (id?: string, name?: string): void => {
  keyword.value = "";
  if (!id) {
    departmentId.value = undefined;
    path.value = [];
  } else {
    departmentId.value = id;
    const index = path.value.findIndex((item) => item.id === id);
    if (index >= 0) {
      path.value = path.value.slice(0, index + 1);
    } else if (name) {
      path.value = [...path.value, { id, name }];
    }
  }
  void privateLoad(false, false);
};

const privateLoad = async (moreMembers: boolean, moreDepartments: boolean): Promise<void> => {
  const current = ++requestId;
  loading.value = true;
  failed.value = false;
  const nextMemberPage = moreMembers ? memberPage.value + 1 : 1;
  const nextDepartmentPage = moreDepartments ? departmentPage.value + 1 : 1;
  try {
    const response = await TenantOrganizationMemberBrowseAPI({
      scene: OrganizationMemberScene.MEMBER,
      departmentId: searching.value ? undefined : departmentId.value,
      query: keyword.value.trim() || undefined,
      current: nextMemberPage,
      size: IAM_DEFAULT_PAGE_SIZE,
      departmentPage: nextDepartmentPage,
    });
    if (current !== requestId) {
      return;
    }
    const navigation = response.data.navigation;
    organizationName.value = navigation.organization?.name || "当前组织";
    if (!searching.value && navigation.breadcrumbs.length > 0) {
      path.value = navigation.breadcrumbs;
    }
    departments.value = moreDepartments
      ? merge(departments.value, navigation.items)
      : navigation.items;
    const pageMembers = (response.data.members.records ?? []).map(toMember);
    members.value = moreMembers ? merge(members.value, pageMembers) : pageMembers;
    departmentTotal.value = navigation.total;
    memberTotal.value = Number(response.data.members.total ?? 0);
    departmentPage.value = navigation.page;
    memberPage.value = response.data.members.current ?? nextMemberPage;
  } catch {
    if (current === requestId) {
      failed.value = true;
    }
  } finally {
    if (current === requestId) {
      loading.value = false;
    }
  }
};

const privateToggleDepartment = (item: ExportScopeDepartment, checked: boolean): void => {
  const departments = model.value.departments.filter((current) => current.id !== item.id);
  model.value = {
    ...model.value,
    departments: checked ? [...departments, { id: item.id, name: item.name }] : departments,
  };
};

const privateToggleMember = (item: ExportScopeMember, checked: boolean): void => {
  const members = model.value.members.filter((current) => current.id !== item.id);
  model.value = {
    ...model.value,
    members: checked ? [...members, item] : members,
  };
};

const privateToggleLoaded = (checked: boolean | string | number): void => {
  const enabled = checked === true;
  const nextDepartments = new Map(model.value.departments.map((item) => [item.id, item]));
  const nextMembers = new Map(model.value.members.map((item) => [item.id, item]));
  if (!searching.value) {
    for (const item of departments.value) {
      if (enabled) {
        nextDepartments.set(item.id, item);
      } else {
        nextDepartments.delete(item.id);
      }
    }
  }
  for (const item of members.value) {
    if (enabled) {
      nextMembers.set(item.id, item);
    } else {
      nextMembers.delete(item.id);
    }
  }
  model.value = {
    departments: [...nextDepartments.values()],
    members: [...nextMembers.values()],
  };
};

const privateClear = (): void => {
  model.value = emptyExportScope();
};

function toMember(item: IamSelectOption): ExportScopeMember {
  return { id: item.id, name: item.name, avatar: item.avatar, summary: item.summary };
}

function merge<T extends { id: string }>(current: T[], next: T[]): T[] {
  return [...new Map([...current, ...next].map((item) => [item.id, item])).values()];
}
</script>

<style scoped lang="postcss">
.export-scope {
  display: flex;
  height: 420px;
  margin-top: 16px;
  border: 1px solid var(--in-border-color);
  border-radius: 6px;
  overflow: hidden;
}

.export-scope__pane,
.export-scope__body {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.export-scope__pane {
  width: 50%;
}

.export-scope__body {
  flex: 1;
}

.export-scope__pane + .export-scope__pane {
  border-left: 1px solid var(--in-border-color);
}

.export-scope__search,
.export-scope__path,
.export-scope__all,
.export-scope__selected-head {
  padding: 12px 12px 0;
}

.export-scope__all {
  padding-bottom: 8px;
}

.export-scope__path {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  color: var(--in-text-color-secondary);
  font-size: 14px;
}

.export-scope__path button {
  border: 0;
  background: transparent;
  padding: 0;
  color: var(--in-color-primary);
  cursor: pointer;
}

.export-scope__path button:disabled,
.export-scope__path .is-current {
  color: var(--in-text-color);
  cursor: default;
}

.export-scope__list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 0 12px 12px;
}

.export-scope__row {
  display: flex;
  height: 48px;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.export-scope__row > .export-scope__name,
.export-scope__member {
  flex: 1;
  min-width: 0;
}

.export-scope__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--in-text-color);
  font-size: 14px;
}

.export-scope__summary {
  display: block;
  overflow: hidden;
  color: var(--in-text-color-secondary);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.export-scope__selected-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--in-text-color);
  font-size: 14px;
}

.export-scope__empty {
  margin: 24px 0;
  color: var(--in-text-color-secondary);
  text-align: center;
}
</style>
