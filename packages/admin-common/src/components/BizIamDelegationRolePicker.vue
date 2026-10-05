<template>
  <button
    type="button"
    :disabled="disabled"
    :aria-label="placeholder"
    class="flex items-center gap-8px box-border w-full min-h-[var(--in-control-height)] px-11px py-6px border border-solid border-[var(--el-border-color)] rounded-[var(--el-border-radius-base)] bg-[var(--el-fill-color-blank)] text-left"
    :class="
      disabled
        ? 'cursor-not-allowed opacity-60'
        : 'cursor-pointer hover:border-[var(--el-color-primary)]'
    "
    @click="privateOpen"
  >
    <span
      class="flex-1 min-w-0 truncate"
      :class="
        model.length
          ? 'text-[var(--el-text-color-regular)]'
          : 'text-[var(--in-text-color-placeholder)]'
      "
    >
      {{ model.length ? model.map((item) => item.name).join("、") : placeholder }}
    </span>
    <in-icon name="ep:edit" class="shrink-0 text-[var(--el-text-color-secondary)]" />
  </button>
  <in-dialog v-model="visible" :title="title" width="880px" layout="pinned" append-to-body>
    <div class="in-split-picker h-460px flex min-w-0">
      <div class="w-1/2 min-w-0 flex flex-col overflow-hidden">
        <div class="p-12px">
          <el-input v-model="keyword" clearable placeholder="搜索角色名称" @input="privateSearch">
            <template #prefix><in-icon name="ep:search" /></template>
          </el-input>
        </div>
        <in-loading :loading="loading" class="flex-1 min-h-0 overflow-auto px-12px">
          <div v-if="failed" class="py-12px">
            <in-button link type="primary" @in-click="privateLoadRoots">加载失败，重试</in-button>
          </div>
          <div
            v-for="role in roots"
            :key="role.id"
            role="treeitem"
            :aria-expanded="expanded.includes(role.id)"
          >
            <button
              type="button"
              class="flex items-center gap-8px w-full px-8px py-9px border-none bg-transparent cursor-pointer text-left"
              @click="privateToggle(role.id)"
            >
              <in-icon :name="expanded.includes(role.id) ? 'ep:arrow-down' : 'ep:arrow-right'" />
              <span class="truncate">{{ role.name }}</span>
            </button>
            <div v-if="expanded.includes(role.id)" class="pl-28px pr-8px">
              <label
                v-for="version in branches[role.id]?.items || []"
                :key="version.id"
                class="flex items-center gap-8px py-6px cursor-pointer"
              >
                <el-checkbox
                  :model-value="draftIds.includes(version.id)"
                  @change="privateToggleVersion(version)"
                />
                <span>{{ version.name }}</span>
              </label>
              <in-loading v-if="branches[role.id]?.loading" loading class="h-80px" />
              <in-button
                v-else-if="branches[role.id]?.failed"
                link
                type="primary"
                @in-click="privateLoadVersions(role.id, branches[role.id].page || 1)"
                >加载失败，重试</in-button
              >
              <in-button
                v-else-if="privateHasMore(role.id)"
                link
                type="primary"
                @in-click="privateLoadVersions(role.id, branches[role.id].page + 1)"
                >加载更多版本</in-button
              >
            </div>
          </div>
          <div
            v-if="!roots.length && !loading && !failed"
            class="py-16px text-[var(--el-text-color-secondary)]"
          >
            暂无可选角色
          </div>
        </in-loading>
        <el-pagination
          v-if="total > IAM_DEFAULT_PAGE_SIZE"
          class="shrink-0 justify-end p-12px"
          :current-page="page"
          :page-size="IAM_DEFAULT_PAGE_SIZE"
          :total="total"
          layout="prev, pager, next"
          size="small"
          @current-change="privatePage"
        />
      </div>
      <div class="w-1/2 min-w-0 flex flex-col overflow-hidden">
        <div class="flex items-center justify-between p-12px">
          <span>已选：{{ draftIds.length }} 个版本</span
          ><in-button link type="primary" @in-click="draftIds = []">清空</in-button>
        </div>
        <div class="flex-1 min-h-0 overflow-auto px-12px">
          <div v-for="id in draftIds" :key="id" class="flex items-center gap-8px py-8px">
            <span class="flex-1 truncate">{{ privateLabel(id) }}</span>
            <in-close-button
              size="sm"
              :label="`移除 ${privateLabel(id)}`"
              @click="privateRemove(id)"
            />
          </div>
          <div v-if="!draftIds.length" class="py-16px text-[var(--el-text-color-secondary)]">
            尚未选择角色版本
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <in-button @in-click="visible = false">取消</in-button>
      <in-button
        type="primary"
        :loading="confirming"
        :disabled="!draftIds.length || loading || confirming"
        @in-click="privateConfirm"
        >确定</in-button
      >
    </template>
  </in-dialog>
</template>

<script setup lang="ts">
import { Message } from "@ingot/admin-core";
import { iamEditorFailure } from "../hooks/iamEditorFailure";
import {
  IAM_DEFAULT_PAGE_SIZE,
  type AuthorizationCandidatesApi,
  type AuthorizationOption,
  type AuthorizationRoleCandidatesApi,
  type AuthorizationRoleNode,
} from "../models/iam";

defineOptions({ name: "BizIamDelegationRolePicker" });
const props = withDefaults(
  defineProps<{
    treeApi: AuthorizationRoleCandidatesApi;
    detailApi: AuthorizationCandidatesApi;
    disabled?: boolean;
    resetKey: string | number;
    oneVersionPerRole?: boolean;
    placeholder?: string;
    title?: string;
  }>(),
  {
    oneVersionPerRole: false,
    placeholder: "请选择允许分配的角色版本",
    title: "选择允许分配的角色版本",
  },
);
const model = defineModel<AuthorizationOption[]>({ default: () => [] });
const visible = ref(false);
const keyword = ref("");
const roots = ref<AuthorizationRoleNode[]>([]);
const branches = ref<
  Record<
    string,
    {
      items: AuthorizationRoleNode[];
      page: number;
      total: number;
      loading: boolean;
      failed: boolean;
    }
  >
>({});
const expanded = ref<string[]>([]);
const draftIds = ref<string[]>([]);
const pickedNodes = ref<Record<string, AuthorizationRoleNode>>({});
const page = ref(1);
const total = ref(0);
const loading = ref(false);
const failed = ref(false);
const confirming = ref(false);
let epoch = 0;
let rootRequest = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
const privateLabel = (id: string): string =>
  pickedNodes.value[id]
    ? `${pickedNodes.value[id].roleName} · ${pickedNodes.value[id].name}`
    : model.value.find((item) => item.id === id)?.name || "所选版本不可用";
const privateLoadRoots = async (): Promise<void> => {
  const current = epoch;
  const request = ++rootRequest;
  loading.value = true;
  failed.value = false;
  try {
    const response = await props.treeApi({
      keyword: keyword.value.trim(),
      page: page.value,
      pageSize: IAM_DEFAULT_PAGE_SIZE,
    });
    if (current !== epoch || request !== rootRequest) return;
    roots.value = response.data.items;
    total.value = response.data.total;
  } catch (error) {
    if (current === epoch && request === rootRequest) {
      failed.value = true;
      await iamEditorFailure(error);
    }
  } finally {
    if (current === epoch && request === rootRequest) loading.value = false;
  }
};
const privateLoadVersions = async (roleId: string, nextPage: number): Promise<void> => {
  const current = epoch;
  branches.value[roleId] ||= { items: [], page: 0, total: 0, loading: false, failed: false };
  const state = branches.value[roleId];
  if (state.loading) return;
  state.loading = true;
  state.failed = false;
  try {
    const response = await props.treeApi({
      roleId,
      page: nextPage,
      pageSize: IAM_DEFAULT_PAGE_SIZE,
    });
    if (current !== epoch) return;
    state.items = nextPage === 1 ? response.data.items : [...state.items, ...response.data.items];
    state.page = nextPage;
    state.total = response.data.total;
  } catch (error) {
    if (current === epoch) {
      state.failed = true;
      await iamEditorFailure(error);
    }
  } finally {
    if (current === epoch) state.loading = false;
  }
};
const privateHasMore = (roleId: string): boolean => {
  const state = branches.value[roleId];
  return !!state && state.page * IAM_DEFAULT_PAGE_SIZE < state.total;
};
const privateToggle = (roleId: string): void => {
  if (expanded.value.includes(roleId)) {
    expanded.value = expanded.value.filter((id) => id !== roleId);
    return;
  }
  expanded.value = [...expanded.value, roleId];
  if (!branches.value[roleId]?.page) void privateLoadVersions(roleId, 1);
};
const privateToggleVersion = (node: AuthorizationRoleNode): void => {
  if (!node.roleRevisionRef) return;
  pickedNodes.value[node.id] = node;
  if (draftIds.value.includes(node.id)) {
    draftIds.value = draftIds.value.filter((id) => id !== node.id);
    return;
  }
  const retained = props.oneVersionPerRole
    ? draftIds.value.filter((id) => pickedNodes.value[id]?.roleId !== node.roleId)
    : draftIds.value;
  draftIds.value = [...retained, node.id];
};
const privateRemove = (id: string): void => {
  draftIds.value = draftIds.value.filter((value) => value !== id);
};
const privateOpen = (): void => {
  if (props.disabled) return;
  epoch += 1;
  roots.value = [];
  branches.value = {};
  expanded.value = [];
  keyword.value = "";
  page.value = 1;
  draftIds.value = model.value.map((item) => item.id);
  pickedNodes.value = Object.fromEntries(
    model.value.flatMap((option) => (option.roleNode ? [[option.id, option.roleNode]] : [])),
  );
  visible.value = true;
  void privateLoadRoots();
};
const privateSearch = (): void => {
  if (timer) clearTimeout(timer);
  rootRequest += 1;
  roots.value = [];
  branches.value = {};
  expanded.value = [];
  page.value = 1;
  timer = setTimeout(() => void privateLoadRoots(), 300);
};
const privatePage = (next: number): void => {
  page.value = next;
  void privateLoadRoots();
};
const privateConfirm = async (): Promise<void> => {
  confirming.value = true;
  const current = epoch;
  try {
    const options: AuthorizationOption[] = model.value.filter(
      (item) => draftIds.value.includes(item.id) && item.actions && item.grants,
    );
    const missing = draftIds.value.filter((id) => !options.some((item) => item.id === id));
    for (let offset = 0; offset < missing.length; offset += IAM_DEFAULT_PAGE_SIZE) {
      const ids = missing.slice(offset, offset + IAM_DEFAULT_PAGE_SIZE);
      const response = await props.detailApi({
        kind: "ROLE_REVISION",
        ids,
        page: 1,
        pageSize: IAM_DEFAULT_PAGE_SIZE,
      });
      if (current !== epoch) return;
      options.push(...response.data.items);
    }
    if (options.length !== draftIds.value.length) {
      Message.warning("部分角色版本已不可用，请重新选择");
      return;
    }
    model.value = draftIds.value.map((id) => {
      const option = options.find((item) => item.id === id)!;
      const roleNode = pickedNodes.value[id] || option.roleNode;
      return roleNode ? { ...option, roleNode } : option;
    });
    visible.value = false;
  } catch (error) {
    if (current === epoch) await iamEditorFailure(error);
  } finally {
    if (current === epoch) confirming.value = false;
  }
};
watch(visible, (value) => {
  if (!value) {
    epoch += 1;
    confirming.value = false;
    if (timer) clearTimeout(timer);
  }
});
watch(
  () => props.resetKey,
  () => {
    epoch += 1;
    visible.value = false;
  },
);
watch(
  () => props.disabled,
  (value) => {
    if (value) {
      epoch += 1;
      visible.value = false;
    }
  },
);
onBeforeUnmount(() => {
  epoch += 1;
  if (timer) clearTimeout(timer);
});
</script>
