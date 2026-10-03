<template>
  <div class="flex flex-col gap-6px w-full">
    <button
      type="button"
      :disabled="disabled"
      aria-label="请选择角色"
      class="flex items-center gap-8px box-border w-full h-[var(--in-control-height)] px-11px border border-solid border-[var(--el-border-color)] rounded-[var(--el-border-radius-base)] bg-[var(--el-fill-color-blank)] text-left outline-none"
      :class="
        disabled
          ? 'cursor-not-allowed opacity-60'
          : 'cursor-pointer hover:border-[var(--el-color-primary)] focus-visible:border-[var(--el-color-primary)]'
      "
      @click="picker.show"
    >
      <span
        class="flex-1 min-w-0 truncate"
        :class="
          model ? 'text-[var(--el-text-color-regular)]' : 'text-[var(--in-text-color-placeholder)]'
        "
      >
        {{ model ? `${model.roleName} · v${model.revisionNumber}` : "请选择角色" }}
      </span>
      <in-icon name="ep:edit" class="shrink-0 text-[var(--el-text-color-secondary)]" />
    </button>
  </div>
  <in-dialog
    v-model="picker.visible.value"
    title="选择角色"
    width="640px"
    layout="pinned"
    append-to-body
  >
    <div class="h-420px flex flex-col min-w-0">
      <div class="pb-12px">
        <el-input
          v-model="picker.keyword.value"
          clearable
          :disabled="picker.saving.value || picker.restoring.value"
          placeholder="搜索角色名称"
          @input="picker.search"
        >
          <template #prefix><in-icon name="ep:search" /></template>
        </el-input>
      </div>
      <in-loading :loading="picker.loading.value" class="flex-1 min-h-0 overflow-auto">
        <div v-if="picker.failed.value" class="flex items-center gap-8px py-16px">
          <span class="text-[var(--el-text-color-secondary)]">加载失败</span>
          <in-button type="primary" link @in-click="picker.loadRoots(picker.page.value)"
            >重试</in-button
          >
        </div>
        <div v-else role="tree" aria-label="可分配角色与版本">
          <div
            v-for="role in picker.displayedRoots.value"
            :key="`ROLE:${role.id}`"
            role="treeitem"
            :aria-expanded="picker.expanded.value.includes(role.id)"
          >
            <button
              type="button"
              :disabled="picker.saving.value || picker.restoring.value"
              class="flex items-center gap-8px w-full py-10px px-8px text-left border-none rounded-[var(--el-border-radius-base)] bg-transparent cursor-pointer text-[var(--el-text-color-regular)] hover:bg-[var(--el-fill-color-light)]"
              @click="picker.toggle(role)"
            >
              <in-icon
                :name="picker.expanded.value.includes(role.id) ? 'ep:arrow-down' : 'ep:arrow-right'"
                class="shrink-0"
              />
              <span class="truncate">{{ role.name }}</span>
            </button>
            <div v-if="picker.expanded.value.includes(role.id)" role="group" class="pl-28px pr-8px">
              <el-radio-group
                :model-value="picker.draft.value?.id"
                :disabled="picker.saving.value || picker.restoring.value"
                class="flex flex-col items-start w-full"
                @change="privateSelectVersion(role.id, $event)"
              >
                <div
                  v-for="revision in picker.branches.value[role.id]?.items || []"
                  :key="`REVISION:${revision.id}`"
                  role="treeitem"
                  :aria-selected="picker.draft.value?.id === revision.id"
                  class="w-full"
                >
                  <el-radio :value="revision.id">{{ revision.name }}</el-radio>
                </div>
              </el-radio-group>
              <in-loading v-if="picker.branches.value[role.id]?.loading" loading class="h-80px" />
              <in-button
                v-else-if="picker.branches.value[role.id]?.failed"
                type="primary"
                link
                @in-click="
                  picker.loadVersions(role.id, (picker.branches.value[role.id]?.page || 0) + 1)
                "
                >加载失败，重试</in-button
              >
              <template v-else>
                <span
                  v-if="!picker.branches.value[role.id]?.items.length"
                  class="py-8px text-[var(--el-text-color-secondary)]"
                  >暂无可分配版本</span
                >
                <in-button
                  v-if="privateHasMore(role.id)"
                  type="primary"
                  link
                  :disabled="picker.saving.value"
                  @in-click="picker.loadVersions(role.id, picker.branches.value[role.id].page + 1)"
                  >加载更多版本</in-button
                >
              </template>
            </div>
          </div>
          <div
            v-if="!picker.displayedRoots.value.length && !picker.loading.value"
            class="py-16px text-[var(--el-text-color-secondary)]"
          >
            暂无可分配角色
          </div>
        </div>
      </in-loading>
      <el-pagination
        v-if="picker.total.value > IAM_DEFAULT_PAGE_SIZE"
        class="shrink-0 justify-end pt-12px"
        :current-page="picker.page.value"
        :page-size="IAM_DEFAULT_PAGE_SIZE"
        :total="picker.total.value"
        :disabled="picker.loading.value || picker.saving.value || picker.restoring.value"
        layout="prev, pager, next"
        small
        @current-change="privateOnPageChange"
      />
      <div class="shrink-0 pt-12px text-12px text-[var(--el-text-color-secondary)]">
        {{
          picker.draft.value
            ? `当前选择：${picker.draft.value.roleName} · v${picker.draft.value.revisionNumber}`
            : "展开角色后选择一个版本"
        }}
      </div>
    </div>
    <template #footer>
      <in-button @in-click="picker.visible.value = false">取消</in-button>
      <in-button
        type="primary"
        :loading="picker.saving.value"
        :disabled="!picker.canConfirm.value"
        @in-click="picker.confirm"
        >确定</in-button
      >
    </template>
  </in-dialog>
</template>
<script setup lang="ts">
import { useIamRolePicker } from "../hooks/useIamRolePicker";
import {
  IAM_DEFAULT_PAGE_SIZE,
  type AuthorizationCandidatesApi,
  type AuthorizationOption,
  type AuthorizationRoleCandidatesApi,
  type AuthorizationRoleNode,
} from "../models/iam";

defineOptions({ name: "BizIamAuthorizationRolePicker" });
const props = defineProps<{
  treeApi: AuthorizationRoleCandidatesApi;
  detailApi: AuthorizationCandidatesApi;
  delegationGrantId?: string;
  disabled?: boolean;
  resetKey: string | number;
}>();
const model = defineModel<AuthorizationRoleNode>();
const emits = defineEmits<{
  change: [node: AuthorizationRoleNode, option: AuthorizationOption];
  invalidated: [];
}>();
const picker = useIamRolePicker({
  treeApi: () => props.treeApi,
  detailApi: () => props.detailApi,
  basis: () => props.delegationGrantId,
  disabled: () => props.disabled,
  resetKey: () => props.resetKey,
  selection: () => model.value,
  confirm: (node, option) => {
    model.value = node;
    emits("change", node, option);
  },
  invalidate: () => {
    model.value = undefined;
    emits("invalidated");
  },
});
const privateHasMore = (roleId: string): boolean => {
  const state = picker.branches.value[roleId];
  return !!state && state.page * IAM_DEFAULT_PAGE_SIZE < state.total;
};
const privateOnPageChange = (page: number): void => {
  if (page !== picker.page.value) void picker.loadRoots(page);
};
const privateSelectVersion = (roleId: string, value: unknown): void => {
  const node = picker.branches.value[roleId]?.items.find(({ id }) => id === value);
  if (node) picker.select(node);
};
</script>
