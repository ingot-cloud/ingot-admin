<template>
  <section class="resource-field-list">
    <div class="flex items-center justify-between gap-12px">
      <span class="font-500 text-[var(--in-text-color)]"
        >字段能力
        <span class="text-12px text-[var(--in-text-color-secondary)]"
          >({{ fields.length }})</span
        ></span
      >
      <in-button text type="primary" @click="emits('add')">添加字段</in-button>
    </div>
    <div class="text-12px text-[var(--in-text-color-secondary)]">
      以下是资源支持的能力，实际授权由角色或策略决定。
    </div>
    <el-input
      v-if="fields.length"
      v-model="keyword"
      clearable
      :prefix-icon="Search"
      placeholder="搜索字段名称或字段键"
      aria-label="搜索字段"
    />
    <div v-if="bindingError" class="flex items-center gap-8px text-12px">
      <span class="text-[var(--in-color-warning)]">接入状态读取失败</span>
      <in-button text type="primary" @click="emits('retry')">重试</in-button>
    </div>
    <div ref="listRef" class="resource-field-list__body">
      <div v-if="!fields.length" class="resource-field-list__empty">
        暂未声明字段，点击「添加字段」配置。
      </div>
      <div v-else-if="!filtered.length" class="resource-field-list__empty">没有匹配的字段</div>
      <article
        v-for="{ field, index } in filtered"
        :key="field.key"
        class="resource-field-list__item"
        :class="{ 'is-highlighted': highlightedKey === field.key }"
        :data-field-key="field.key"
      >
        <div class="resource-field-list__header">
          <div class="min-w-0 flex flex-wrap items-center gap-8px">
            <span class="resource-field-list__name">{{ field.label }}</span>
            <code class="resource-field-list__key">{{ field.key }}</code>
          </div>
          <div class="flex shrink-0 gap-8px">
            <in-button
              text
              type="primary"
              :aria-label="`编辑字段 ${field.label}`"
              @click="emits('edit', index)"
              >编辑</in-button
            >
            <in-button
              text
              type="danger"
              :aria-label="`移除字段 ${field.label}`"
              @click="emits('remove', index)"
              >移除</in-button
            >
          </div>
        </div>
        <dl class="resource-field-list__details">
          <dt>可见性</dt>
          <dd>
            {{
              field.visibilities.map((value) => visibilityEnum.getTagText(value).text).join("、")
            }}
          </dd>
          <dt>操作能力</dt>
          <dd>
            {{
              [field.editable ? "支持编辑" : "", field.filterable ? "支持筛选" : ""]
                .filter(Boolean)
                .join("、") || "未声明操作能力"
            }}
          </dd>
          <template v-if="field.visibilities.includes(FieldVisibility.MASKED)"
            ><dt>脱敏规则</dt>
            <dd>{{ iamMaskLabel(field.mask) }}</dd></template
          >
        </dl>
        <ResourceFieldBinding
          :field="field"
          :manifest="manifest"
          :checkable="checkable"
          :failed="bindingError"
        />
      </article>
    </div>
  </section>
</template>
<script setup lang="ts">
import { Search } from "@element-plus/icons-vue";
import {
  FieldVisibility,
  iamMaskLabel,
  useFieldVisibilityEnum,
  type FieldCapability,
  type FieldBindingManifest,
} from "@ingot/admin-common";
import ResourceFieldBinding from "./ResourceFieldBinding.vue";
defineOptions({ name: "ResourceFieldList" });
const props = defineProps<{
  fields: FieldCapability[];
  manifest?: FieldBindingManifest;
  checkable: boolean;
  bindingError: boolean;
}>();
const emits = defineEmits<{ add: []; edit: [index: number]; remove: [index: number]; retry: [] }>();
const keyword = ref("");
const highlightedKey = ref("");
const listRef = ref<HTMLElement>();
const visibilityEnum = useFieldVisibilityEnum();
const filtered = computed(() => {
  const query = keyword.value.trim().toLocaleLowerCase();
  return props.fields
    .map((field, index) => ({ field, index }))
    .filter(
      ({ field }) =>
        !query ||
        field.key.toLocaleLowerCase().includes(query) ||
        field.label.toLocaleLowerCase().includes(query),
    );
});
watch(
  () => props.fields,
  () => {
    highlightedKey.value = "";
    keyword.value = "";
  },
);
defineExpose({
  async locate(key: string) {
    keyword.value = "";
    highlightedKey.value = key;
    await nextTick();
    Array.from(listRef.value?.querySelectorAll<HTMLElement>(".resource-field-list__item") ?? [])
      .find((item) => item.dataset.fieldKey === key)
      ?.scrollIntoView?.({ block: "nearest" });
  },
  reset() {
    keyword.value = "";
    highlightedKey.value = "";
  },
});
</script>
<style lang="postcss" scoped>
.resource-field-list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--in-space-3);
  min-height: 0;
  width: 100%;
  line-height: var(--in-line-height-body);
}
.resource-field-list__body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  gap: var(--in-space-3);
  overflow-y: auto;
  padding: 1px;
}
.resource-field-list__empty {
  color: var(--in-text-color-placeholder);
  padding: var(--in-space-4) 0;
}
.resource-field-list__item {
  flex: none;
  padding: var(--in-space-3);
  border: 1px solid transparent;
  border-radius: var(--in-radius-control);
  background: var(--in-permission-panel-bg);
  &.is-highlighted {
    border-color: var(--in-color-primary);
  }
}
.resource-field-list__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--in-space-2);
}
.resource-field-list__name {
  font-size: var(--in-font-size-body);
  font-weight: 600;
  color: var(--in-text-color);
  overflow-wrap: anywhere;
}
.resource-field-list__key {
  font-size: var(--in-font-size-caption);
  color: var(--in-text-color-secondary);
  overflow-wrap: anywhere;
}
.resource-field-list__details {
  display: grid;
  grid-template-columns: 5em minmax(0, 1fr);
  column-gap: var(--in-space-3);
  row-gap: var(--in-space-1);
  margin: var(--in-space-2) 0 var(--in-space-3);
  font-size: var(--in-font-size-caption);
  & dt {
    color: var(--in-text-color-secondary);
  }
  & dd {
    margin: 0;
    color: var(--in-text-color);
    overflow-wrap: anywhere;
  }
}
</style>
