<template>
  <div class="selection-demo">
    <button type="button" class="selection-demo__theme" @click="privateToggleTheme">
      切换明暗主题
    </button>
    <section>
      <p>基础标签：带头像 / 不带头像 / 只读 / 自定义背景</p>
      <div class="selection-demo__row">
        <InSelectionTag name="欧阳修" closable />
        <InSelectionTag name="研发部" :show-avatar="false" closable />
        <InSelectionTag name="王超" />
        <InSelectionTag name="李白" background="#fff1e6" closable />
      </div>
    </section>
    <section>
      <p>成员录入框（换行，可删除）点击次数：{{ clicks }}</p>
      <InSelectionField
        :items="members"
        closable
        placeholder="请选择成员"
        @click="clicks += 1"
        @remove="privateRemove"
      />
    </section>
    <section>
      <p>单行 +N（服务端总数 28）</p>
      <InSelectionField :items="allMembers" :max-visible="3" :total="28" :wrap="false" />
    </section>
    <section>
      <p>部门：不带头像 + suffix 插槽</p>
      <InSelectionField :items="departments" :show-avatar="false" closable>
        <template #tag-suffix="{ item }">
          <label class="selection-demo__suffix">
            <input v-model="descendants[item.id]" type="checkbox" />含下级
          </label>
        </template>
      </InSelectionField>
    </section>
    <section>
      <p>禁用与空状态</p>
      <div class="selection-demo__grid">
        <InSelectionField :items="allMembers.slice(0, 2)" closable disabled />
        <InSelectionField placeholder="请选择角色" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import InSelectionField from "../../../../packages/admin-core/src/components/selection/InSelectionField.vue";
import InSelectionTag from "../../../../packages/admin-core/src/components/selection/InSelectionTag.vue";
import type { InSelectionItem } from "../../../../packages/admin-core/src/components/selection/types";
import "../../../../packages/admin-core/src/styles/tokens.css";
import "../../../../packages/admin-core/src/styles/dark/tokens.css";

const allMembers: InSelectionItem[] = [
  { id: "1", name: "欧阳修" },
  { id: "2", name: "王超" },
  { id: "3", name: "李白" },
  { id: "4", name: "杜甫" },
  { id: "5", name: "苏轼" },
];
const members = ref<InSelectionItem[]>([...allMembers]);
const departments: InSelectionItem[] = [
  { id: "d1", name: "研发中心" },
  { id: "d2", name: "市场部" },
];
const descendants = reactive<Record<string, boolean>>({ d1: true, d2: false });
const clicks = ref(0);

const privateRemove = (item: InSelectionItem) => {
  members.value = members.value.filter((member) => member.id !== item.id);
};

const privateToggleTheme = () => {
  document.documentElement.classList.toggle("dark");
};
</script>

<style scoped>
.selection-demo {
  display: grid;
  gap: var(--in-space-3);
  max-width: 560px;
  color: var(--in-text-color);
}

.selection-demo p {
  margin: 0 0 var(--in-space-2);
  font-size: var(--in-font-size-body);
}

.selection-demo__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--in-space-2);
}

.selection-demo__grid {
  display: grid;
  gap: var(--in-space-2);
}

.selection-demo__suffix {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
}

.selection-demo__theme {
  justify-self: start;
  padding: var(--in-space-1) var(--in-space-2);
  border: 1px solid var(--in-border-color);
  border-radius: var(--in-radius-control);
  background: var(--in-bg-color-surface);
  color: var(--in-text-color);
  cursor: pointer;
}
</style>
