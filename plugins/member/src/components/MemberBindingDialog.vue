<template>
  <in-dialog
    v-model="open"
    :title="title"
    :show-close="!saving"
    layout="pinned"
    append-to-body
    width="min(720px, 96vw)"
  >
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <section class="min-w-0">
        <el-input
          v-model="keyword"
          clearable
          :placeholder="searchPlaceholder"
          :prefix-icon="Search"
        />
        <in-loading
          :loading="loading"
          class="mt-2 min-h-32 max-h-[32vh] overflow-y-auto rounded"
          style="background: var(--in-permission-panel-bg)"
        >
          <div v-if="failed" class="p-3">
            <p>候选加载失败</p>
            <in-button text @click="emit('retry')">重试</in-button>
          </div>
          <p v-else-if="!nodes.length && !loading" class="p-3">暂无可选项</p>
          <in-tree
            v-else-if="open && nodes.length"
            ref="tree"
            :data="nodes"
            :props="treeProps"
            node-key="id"
            show-checkbox
            :check-strictly="independent"
            :default-checked-keys="initialIds"
            :default-expanded-keys="initialIds"
            :filter-node-method="matches"
            @check="refreshSelection"
          />
        </in-loading>
      </section>
      <section
        class="min-w-0 max-h-[36vh] overflow-y-auto rounded p-3"
        style="background: var(--in-permission-panel-bg)"
      >
        <p class="m-0 mb-2">已选 {{ selection.length }} 项</p>
        <div class="flex flex-wrap gap-2">
          <in-selection-tag
            v-for="item in selection"
            :key="item.id"
            :name="item.name"
            :show-avatar="false"
            :closable="item.closable"
            :disabled="saving || loading"
            @close="remove(item.id)"
          />
        </div>
      </section>
    </div>
    <template #footer>
      <in-button :disabled="saving" @click="open = false">取消</in-button>
      <in-button type="primary" :disabled="!canSave" :loading="saving" @click="submit">
        保存
      </in-button>
    </template>
  </in-dialog>
</template>

<script setup lang="ts">
import { Search } from "@element-plus/icons-vue";
import type { ElTree } from "element-plus";
import type { InSelectionItem } from "@ingot/admin-core";

interface BindingNode {
  id?: string;
  pid?: string;
  name?: string;
  code?: string;
  builtIn?: boolean;
  children?: BindingNode[];
}

const open = defineModel<boolean>({ required: true });
const props = defineProps<{
  title: string;
  searchPlaceholder: string;
  nodes: BindingNode[];
  bound: BindingNode[];
  loading: boolean;
  failed: boolean;
  allowed: boolean;
  independent?: boolean;
  save: (ids: string[]) => Promise<unknown>;
}>();
const emit = defineEmits<{ success: []; retry: [] }>();
const tree = ref<InstanceType<typeof ElTree>>();
const keyword = ref("");
const saving = ref(false);
const changed = ref(false);
const checked = ref<BindingNode[]>([]);
const treeProps = { label: "name", children: "children", disabled: "builtIn" };

function flatten(nodes: BindingNode[]): BindingNode[] {
  return nodes.flatMap((node) => [node, ...flatten(node.children ?? [])]);
}

const availableIds = computed(() => new Set(flatten(props.nodes).map(({ id }) => id)));
const initial = computed(() => flatten(props.bound));
const initialIds = computed(() => initial.value.flatMap(({ id }) => (id ? [id] : [])));
const selected = computed(() =>
  changed.value
    ? [...checked.value, ...initial.value.filter(({ id }) => !availableIds.value.has(id))]
    : initial.value,
);
const selection = computed<InSelectionItem[]>(() =>
  selected.value.flatMap((node) =>
    node.id
      ? [
          {
            id: node.id,
            name: node.name || node.code || node.id,
            closable: !node.builtIn && availableIds.value.has(node.id),
          },
        ]
      : [],
  ),
);
const canSave = computed(() => props.allowed && changed.value && !props.loading && !props.failed);

watch(open, () => {
  keyword.value = "";
  changed.value = false;
  checked.value = [];
});
watch(keyword, (value) => tree.value?.filter(value.trim().toLowerCase()));

function matches(value: string, node: BindingNode): boolean {
  return !value || [node.name, node.code].some((item) => item?.toLowerCase().includes(value));
}

function refreshSelection(): void {
  checked.value = (tree.value?.getCheckedNodes() ?? []) as BindingNode[];
  changed.value = true;
}

function remove(id: string): void {
  if (!props.allowed || saving.value || props.loading) return;
  tree.value?.setChecked(id, false, !props.independent);
  refreshSelection();
}

async function submit(): Promise<void> {
  if (!canSave.value || saving.value) return;
  const nodes = selected.value.filter((node) => !node.builtIn);
  const checkedIds = new Set(nodes.map(({ id }) => id));
  const ids = nodes.flatMap(({ id, pid }) =>
    id && (props.independent || !checkedIds.has(pid)) ? [id] : [],
  );
  saving.value = true;
  try {
    await props.save(ids);
    if (open.value) {
      open.value = false;
      emit("success");
    }
  } catch {
    // 请求层展示失败，保留当前选择以便重试。
  } finally {
    saving.value = false;
  }
}
</script>
