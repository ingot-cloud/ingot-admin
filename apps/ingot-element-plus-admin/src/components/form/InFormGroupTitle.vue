<template>
  <div class="in-form-group-title">
    <div class="title">
      <slot name="title">
        {{ title }}
      </slot>
    </div>
    <slot v-if="!hideAction">
      <in-button
        text
        size="small"
        :class="{ edit: !editFlag, cancel: editFlag }"
        @click="editFlag = !editFlag"
      >
        {{ editFlag ? "取消" : "编辑" }}
      </in-button>
    </slot>
  </div>
</template>
<script lang="ts" setup>
const model = defineModel<boolean>();
defineProps({
  title: {
    type: String,
  },
  hideAction: {
    type: Boolean,
    default: false,
  },
});
const editFlag = computed({
  get() {
    return model.value;
  },
  set(value) {
    model.value = value;
  },
});
</script>
<style scoped lang="postcss">
.in-form-group-title {
  font-size: 12px;
  line-height: 22px;
  padding: 4px 20px;
  background: #f2f2f6;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;

  & .title {
    color: black;
    font-weight: 500;
  }

  & .edit {
    cursor: pointer;
    color: var(--in-color-primary);
  }
  & .cancel {
    cursor: pointer;
    color: var(--in-color-danger);
  }
}
</style>
