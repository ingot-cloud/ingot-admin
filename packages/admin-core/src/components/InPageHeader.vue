<template>
  <div class="in-page-header" :class="{ 'has-description': hasDescription }">
    <div class="in-page-header__row">
      <div v-if="showBack" class="in-page-header__nav">
        <button
          type="button"
          class="in-icon-button in-page-header__back"
          aria-label="返回"
          @click="privateOnBack"
        >
          <svg
            class="in-page-header__back-icon"
            width="1em"
            height="1em"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M1.293 11.293a1 1 0 0 0 0 1.414l7 7a1 1 0 0 0 1.414-1.414L4.414 13H21a1 1 0 1 0 0-2H4.414l5.293-5.293a1 1 0 0 0-1.414-1.414l-7 7Z"
              fill="currentColor"
            />
          </svg>
        </button>
        <span class="in-page-header__divider" aria-hidden="true" />
      </div>
      <div class="in-page-header__titles">
        <h1 class="in-page-header__title">
          <slot name="title">{{ resolvedTitle }}</slot>
        </h1>
        <p v-if="hasDescription" class="in-page-header__description">
          <slot name="description">{{ resolvedDescription }}</slot>
        </p>
      </div>
      <div v-if="slots.action" class="in-page-header__actions">
        <slot name="action" />
      </div>
    </div>
    <div v-if="slots.tabs" class="in-page-header__tabs">
      <slot name="tabs" />
    </div>
    <slot />
  </div>
</template>
<script lang="ts" setup>
defineOptions({
  name: "InPageHeader",
});

const props = withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    subtitle?: string;
    showBack?: boolean;
  }>(),
  {
    showBack: false,
  },
);

const slots = defineSlots<{
  title?: () => unknown;
  description?: () => unknown;
  action?: () => unknown;
  tabs?: () => unknown;
  default?: () => unknown;
}>();

const emits = defineEmits<{
  back: [];
}>();

const route = useRoute();
const resolvedTitle = computed(() => props.title || route.meta.title || "");
const resolvedDescription = computed(() => props.description || props.subtitle);
const hasDescription = computed(
  () => Boolean(resolvedDescription.value) || Boolean(slots.description),
);

const privateOnBack = () => {
  emits("back");
};
</script>
<style lang="postcss" scoped>
.in-page-header {
  @apply flex flex-col min-w-0;
  gap: var(--in-space-3);
  padding: var(--in-space-4) var(--in-space-5);
  background: var(--in-bg-color-surface);
  border-bottom: 1px solid var(--in-border-color);
  box-sizing: border-box;
}

.in-page-header.has-description {
  min-height: var(--in-page-header-min-height);
}

.in-page-header__row {
  @apply flex items-center min-w-0;
  gap: var(--in-space-3);
}

.in-page-header.has-description .in-page-header__row {
  align-items: flex-start;
}

.in-page-header.has-description .in-page-header__nav {
  margin-top: 2px;
}

.in-page-header__nav {
  display: inline-flex;
  align-items: center;
  flex: none;
  gap: var(--in-space-2);
}

.in-page-header__back-icon {
  display: block;
  width: 20px;
  height: 20px;
}

.in-page-header__divider {
  flex: none;
  width: 1px;
  height: 16px;
  background: var(--in-border-color);
}

.in-page-header__titles {
  @apply flex flex-col min-w-0 flex-1;
  gap: var(--in-space-1);
}

.in-page-header__title,
.in-page-header__description {
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-all;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  line-clamp: 1;
}

.in-page-header__title {
  margin: 0;
  color: var(--in-text-color);
  font-size: var(--in-font-size-section-title);
  line-height: var(--in-line-height-section-title);
  font-weight: var(--in-font-weight-section-title);
}

.in-page-header__description {
  margin: 0;
  color: var(--in-text-color-secondary);
  font-size: var(--in-font-size-body);
  line-height: var(--in-line-height-body);
  font-weight: var(--in-font-weight-body);
}

.in-page-header__actions {
  @apply flex items-center flex-shrink-0;
  gap: var(--in-space-2);
}

.in-page-header:has(.in-page-header__tabs) {
  gap: 0;
  padding-bottom: 0;
  border-bottom: 0;
}

.in-page-header__tabs {
  min-width: 0;
  margin-inline: calc(var(--in-space-5) * -1);
}
</style>
