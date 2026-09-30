import { computed, onBeforeUnmount, ref, watch } from "vue";
import { Message } from "@ingot/admin-core";
import { iamEditorFailure } from "./iamEditorFailure";
import {
  IAM_DEFAULT_PAGE_SIZE,
  type AuthorizationCandidatesApi,
  type AuthorizationOption,
  type AuthorizationRoleCandidateQuery,
  type AuthorizationRoleCandidatesApi,
  type AuthorizationRoleNode,
} from "../models/iam";

interface RolePickerOptions {
  treeApi: () => AuthorizationRoleCandidatesApi;
  detailApi: () => AuthorizationCandidatesApi;
  basis: () => string | undefined;
  resetKey: () => string | number;
  disabled: () => boolean | undefined;
  selection: () => AuthorizationRoleNode | undefined;
  confirm: (node: AuthorizationRoleNode, option: AuthorizationOption) => void;
  invalidate: () => void;
}

interface RoleBranch {
  items: AuthorizationRoleNode[];
  page: number;
  total: number;
  loading: boolean;
  failed: boolean;
}

type RoleResponse = Awaited<ReturnType<AuthorizationRoleCandidatesApi>>;
const SEARCH_DEBOUNCE_MS = 300;

/** 分配专用角色树；分别分页加载两层，选中路径仅按少量 ID 回显。 */
export function useIamRolePicker(options: RolePickerOptions) {
  const visible = ref(false);
  const keyword = ref("");
  const roots = ref<AuthorizationRoleNode[]>([]);
  const pinnedRole = ref<AuthorizationRoleNode>();
  const branches = ref<Record<string, RoleBranch>>({});
  const expanded = ref<string[]>([]);
  const draft = ref<AuthorizationRoleNode>();
  const page = ref(1);
  const total = ref(0);
  const loading = ref(false);
  const failed = ref(false);
  const restoring = ref(false);
  const saving = ref(false);
  const pending = new Map<string, Promise<RoleResponse>>();
  const completed = new Map<string, RoleResponse>();
  let epoch = 0;
  let rootRequest = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let revalidatePending = false;
  let searchValue = "";

  const displayedRoots = computed(() => {
    const selected = pinnedRole.value;
    if (keyword.value.trim() || !selected || roots.value.some(({ id }) => id === selected.id)) {
      return roots.value;
    }
    return [selected, ...roots.value];
  });
  const canConfirm = computed(
    () =>
      !!draft.value?.roleRevisionRef &&
      !options.disabled() &&
      !loading.value &&
      !failed.value &&
      !restoring.value &&
      !saving.value,
  );
  const current = (scope: number): boolean => epoch === scope;
  const merge = (nodes: AuthorizationRoleNode[]): AuthorizationRoleNode[] =>
    [...new Map(nodes.map((node) => [node.id, node])).values()].sort(
      (left, right) =>
        (right.revisionNumber || 0) - (left.revisionNumber || 0) ||
        right.id.length - left.id.length ||
        right.id.localeCompare(left.id),
    );
  const branch = (roleId: string): RoleBranch => {
    if (!branches.value[roleId])
      branches.value[roleId] = {
        items: [],
        page: 0,
        total: 0,
        loading: false,
        failed: false,
      };
    return branches.value[roleId];
  };
  const request = (query: AuthorizationRoleCandidateQuery): Promise<RoleResponse> => {
    const normalized = {
      delegationGrantId: options.basis() || undefined,
      roleId: query.roleId || undefined,
      keyword: query.keyword?.trim() || "",
      ids: query.ids ? [...new Set(query.ids)].sort() : undefined,
      page: query.page ?? 1,
      pageSize: IAM_DEFAULT_PAGE_SIZE,
    };
    const key = JSON.stringify(normalized);
    const cached = completed.get(key);
    if (cached) return Promise.resolve(cached);
    const running = pending.get(key);
    if (running) return running;
    const scope = epoch;
    const promise: Promise<RoleResponse> = Promise.resolve()
      .then(() => options.treeApi()(normalized))
      .then((response) => {
        if (current(scope)) completed.set(key, response);
        return response;
      })
      .finally(() => {
        if (pending.get(key) === promise) pending.delete(key);
      });
    pending.set(key, promise);
    return promise;
  };
  const reset = (): void => {
    epoch += 1;
    rootRequest += 1;
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    pending.clear();
    completed.clear();
    roots.value = [];
    pinnedRole.value = undefined;
    branches.value = {};
    expanded.value = [];
    page.value = 1;
    total.value = 0;
    loading.value = false;
    failed.value = false;
    restoring.value = false;
    saving.value = false;
  };
  const loadRoots = async (nextPage: number): Promise<void> => {
    const scope = epoch;
    const id = ++rootRequest;
    loading.value = true;
    page.value = nextPage;
    failed.value = false;
    try {
      const response = await request({ keyword: keyword.value, page: nextPage });
      if (!current(scope) || id !== rootRequest) return;
      roots.value = response.data.items;
      page.value = nextPage;
      total.value = response.data.total;
    } catch (error) {
      if (current(scope) && id === rootRequest) {
        failed.value = true;
        await iamEditorFailure(error);
      }
    } finally {
      if (current(scope) && id === rootRequest) loading.value = false;
    }
  };
  const loadVersions = async (roleId: string, nextPage: number): Promise<void> => {
    const state = branch(roleId);
    if (state.loading) return;
    const scope = epoch;
    state.loading = true;
    state.failed = false;
    try {
      const response = await request({ roleId, page: nextPage });
      if (!current(scope)) return;
      const selected = draft.value?.roleId === roleId ? [draft.value] : [];
      state.items = merge(
        nextPage === 1
          ? [...selected, ...response.data.items]
          : [...state.items, ...response.data.items],
      );
      state.page = nextPage;
      state.total = response.data.total;
    } catch (error) {
      if (current(scope)) {
        state.failed = true;
        await iamEditorFailure(error);
      }
    } finally {
      if (current(scope)) state.loading = false;
    }
  };
  const restorePath = async (selected: AuthorizationRoleNode, scope: number): Promise<void> => {
    restoring.value = true;
    try {
      const response = await request({ roleId: selected.roleId, ids: [selected.id] });
      if (!current(scope)) return;
      const leaf = response.data.items.find(({ id }) => id === selected.id);
      if (!leaf) {
        draft.value = undefined;
        options.invalidate();
        Message.warning("原选角色版本已不可分配，请重新选择");
        return;
      }
      const existing = roots.value.find(({ id }) => id === leaf.roleId);
      const parent = existing || (await request({ ids: [leaf.roleId] })).data.items[0];
      if (!current(scope)) return;
      if (!parent) {
        draft.value = undefined;
        options.invalidate();
        return;
      }
      draft.value = leaf;
      pinnedRole.value = parent;
      branch(leaf.roleId).items = [leaf];
      expanded.value = [leaf.roleId];
      await loadVersions(leaf.roleId, 1);
    } catch (error) {
      if (current(scope)) {
        failed.value = true;
        await iamEditorFailure(error);
      }
    } finally {
      if (current(scope)) restoring.value = false;
    }
  };
  const show = async (): Promise<void> => {
    if (options.disabled() || visible.value) return;
    reset();
    keyword.value = "";
    searchValue = "";
    visible.value = true;
    draft.value = options.selection();
    const scope = epoch;
    restoring.value = !!draft.value;
    await loadRoots(1);
    if (!current(scope)) return;
    if (draft.value) await restorePath(draft.value, scope);
    else restoring.value = false;
  };
  const toggle = (role: AuthorizationRoleNode): void => {
    if (saving.value) return;
    if (expanded.value.includes(role.id)) {
      expanded.value = expanded.value.filter((id) => id !== role.id);
      return;
    }
    expanded.value = [...expanded.value, role.id];
    if (!branch(role.id).page) void loadVersions(role.id, 1);
  };
  const select = (node: AuthorizationRoleNode): void => {
    if (!saving.value && !restoring.value && node.nodeType === "REVISION") draft.value = node;
  };
  const confirm = async (): Promise<void> => {
    const node = draft.value;
    if (!canConfirm.value || !node?.roleRevisionRef) return;
    const scope = epoch;
    saving.value = true;
    try {
      const response = await options.detailApi()({
        kind: "ROLE_REVISION",
        delegationGrantId: options.basis(),
        ids: [node.id],
        page: 1,
        pageSize: IAM_DEFAULT_PAGE_SIZE,
      });
      if (!current(scope)) return;
      const option = response.data.items.find(
        (item) =>
          item.roleRevisionRef?.id === node.id &&
          item.roleRevisionRef.kind === node.roleRevisionRef?.kind,
      );
      if (!option) {
        draft.value = undefined;
        if (options.selection()?.id === node.id) options.invalidate();
        Message.warning("该角色版本已不可分配，请重新选择");
        return;
      }
      options.confirm(node, option);
      visible.value = false;
    } catch (error) {
      if (current(scope)) await iamEditorFailure(error);
    } finally {
      if (current(scope)) saving.value = false;
    }
  };
  const revalidate = async (): Promise<void> => {
    if (!revalidatePending || options.disabled()) return;
    revalidatePending = false;
    const node = options.selection();
    if (!node) return;
    const scope = epoch;
    try {
      const response = await request({ roleId: node.roleId, ids: [node.id] });
      const available = response.data.items.some(
        (item) => item.id === node.id && item.roleRevisionRef?.kind === node.roleRevisionRef?.kind,
      );
      if (current(scope) && options.selection()?.id === node.id && !available) {
        options.invalidate();
      }
    } catch {
      if (current(scope)) Message.warning("角色资格暂无法确认，请重新选择并预览；草稿已保留");
    }
  };
  const search = (): void => {
    if (!visible.value || saving.value) return;
    const value = keyword.value.trim();
    if (value === searchValue) return;
    searchValue = value;
    reset();
    loading.value = true;
    timer = setTimeout(() => {
      timer = undefined;
      void loadRoots(1);
    }, SEARCH_DEBOUNCE_MS);
  };
  watch(
    () => [options.basis(), options.resetKey()],
    () => {
      visible.value = false;
      reset();
      revalidatePending = true;
      void revalidate();
    },
  );
  watch(options.disabled, (disabled) => {
    if (disabled) visible.value = false;
    else void revalidate();
  });
  watch(
    visible,
    (value) => {
      if (!value) reset();
    },
    { flush: "sync" },
  );
  onBeforeUnmount(reset);

  return {
    visible,
    keyword,
    displayedRoots,
    branches,
    expanded,
    draft,
    page,
    total,
    loading,
    failed,
    restoring,
    saving,
    canConfirm,
    show,
    toggle,
    select,
    loadRoots,
    loadVersions,
    confirm,
    search,
  };
}
