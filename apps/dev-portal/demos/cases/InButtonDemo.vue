<template>
  <div>
    <p>公开事件是 <code>in-click</code>（1200ms 节流）。原生 click 不节流。</p>
    <InButton type="primary" :loading="loading" @in-click="privateOnClick">演示按钮 {{ count }}</InButton>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import InButton from "../../../../packages/admin-core/src/components/button/InButton.vue";

const count = ref(0);
const loading = ref(false);

const privateOnClick = () => {
  count.value += 1;
};
</script>
