<template>
  <div class="contacts-tab-list">
    <div
      class="tab"
      v-for="tab in tabs"
      :key="tab.id"
      :class="{ 'tab-active': model === tab.id }"
      @click="onItemClick(tab.id)"
    >
      <div class="inner">
        {{ tab.title }}
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import type { TabItem } from "./types";
import type { PropType } from "vue";
const model = defineModel<string>({ required: true });
const emits = defineEmits(["change"]);
defineProps({
  tabs: {
    type: Array as PropType<Array<TabItem>>,
  },
});
const onItemClick = (id: string) => {
  if (model.value === id) {
    return;
  }
  model.value = id;
  emits("change", id);
};
</script>
<style scoped lang="postcss">
.contacts-tab-list {
  @apply flex flex-row;
  transition:
    transform 0.3s,
    -webkit-transform 0.3s;
  padding-left: 12px;
  padding-right: 12px;

  & .tab {
    @apply cursor-pointer;
    text-align: center;
    line-height: 24px;
    padding: 4px 0;
    margin: 0 4px 0 0;
    color: rgba(23, 26, 29, 0.6);
    background: transparent;
    border: 0;

    & .inner {
      padding: 8px 12px;
      border-radius: 4px;
      transition: all 0.3s;
      &:hover {
        background: rgba(126, 134, 142, 0.12);
      }
    }
  }

  & .tab-active {
    position: relative;

    & .inner {
      color: #171a1d;
      text-shadow: none;
      font-weight: 500;
    }

    &:after {
      content: "";
      height: 3px;
      width: 20px;
      background: #171a1d;
      margin: 0 auto;
      display: block;
      border-radius: 2px;
      position: absolute;
      bottom: 4px;
      left: 50%;
      transform: translate(-50%);
    }
  }
}
</style>
