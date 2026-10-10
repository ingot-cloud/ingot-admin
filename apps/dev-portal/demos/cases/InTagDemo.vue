<template>
  <div class="tag-demo">
    <button type="button" class="tag-demo__theme" @click="privateToggleTheme">切换明暗主题</button>
    <section v-for="effect in effects" :key="effect">
      <p>{{ effect }} 效果</p>
      <div class="tag-demo__row">
        <InTag v-for="value in values" :key="value.tag" :value="value" :effect="effect" />
      </div>
    </section>
    <section>
      <p>尺寸与圆角</p>
      <div class="tag-demo__row">
        <InTag :value="values[0]" size="small" />
        <InTag :value="values[0]" />
        <InTag :value="values[0]" size="large" />
        <InTag :value="values[0]" round />
      </div>
    </section>
    <section>
      <p>业务状态</p>
      <div class="tag-demo__row">
        <StatusTag tone="info" label="正常" />
        <StatusTag tone="warning" label="已暂停" />
        <StatusTag tone="danger" label="已锁定" />
      </div>
    </section>
    <section>
      <p>原生标签与关闭交互</p>
      <div class="tag-demo__row">
        <ElTag type="success">原生已接入</ElTag>
        <InTag
          v-if="visible"
          :value="{ text: '已选择的部门', tag: 'info' }"
          closable
          @click="clicks += 1"
          @close="visible = false"
        />
        <span>点击次数：{{ clicks }}</span>
        <button v-if="!visible" type="button" @click="visible = true">恢复标签</button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElTag } from "element-plus";
import type { TagText } from "../../../../packages/admin-core/src/models/common";
import InTag from "../../../../packages/admin-core/src/components/tag/InTag.vue";
import StatusTag from "../../../../packages/admin-core/src/components/status/StatusTag.vue";
import "../../../../packages/admin-core/src/styles/tokens.css";
import "../../../../packages/admin-core/src/styles/dark/tokens.css";
import "../../../../packages/admin-core/src/styles/tag.css";

const values: TagText[] = [
  { text: "主要", tag: "primary" },
  { text: "成功", tag: "success" },
  { text: "信息", tag: "info" },
  { text: "警告", tag: "warning" },
  { text: "危险", tag: "danger" },
];
const effects = ["light", "plain", "dark"] as const;
const visible = ref(true);
const clicks = ref(0);

const privateToggleTheme = () => {
  document.documentElement.classList.toggle("dark");
};
</script>

<style scoped>
.tag-demo {
  display: grid;
  gap: var(--in-space-3);
  color: var(--in-text-color);
}

.tag-demo p {
  margin: 0 0 var(--in-space-2);
  font-size: var(--in-font-size-body);
}

.tag-demo__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--in-space-2);
}

.tag-demo__theme {
  justify-self: start;
  padding: var(--in-space-1) var(--in-space-2);
  border: 1px solid var(--in-border-color);
  border-radius: var(--in-radius-control);
  background: var(--in-bg-color-surface);
  color: var(--in-text-color);
  cursor: pointer;
}
</style>
