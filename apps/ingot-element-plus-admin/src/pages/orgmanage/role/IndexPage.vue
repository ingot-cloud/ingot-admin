<template>
  <in-filter-container>
    <template #left>
      <div w-260px>
        <LeftContent @onNodeClick="handleTreeNodeClick" />
      </div>
    </template>

    <AuthorityView ref="AuthorityViewRef" v-if="StatusCanEditAuthority" />
    <div class="default-role-bg-container" v-else>
      <img class="default-role-bg" src="/resource/images/role_default_bg.jpg" alt="" />
    </div>
  </in-filter-container>
</template>
<script lang="ts" setup>
import LeftContent from "./components/LeftContent.vue";
import type { RoleGroupItemVO } from "@/models";
import AuthorityView from "./components/AuthorityView.vue";
import { isRoleManager } from "@/constants/role";

const id = ref("");
const AuthorityViewRef = ref();
const currentNode = ref<RoleGroupItemVO>({});
const handleTreeNodeClick = (node: RoleGroupItemVO): void => {
  id.value = node.id!;
  currentNode.value = node;

  nextTick(() => {
    if (StatusCanEditAuthority.value) {
      AuthorityViewRef.value.setCurrentNode(node);
    }
  });
};

const StatusCanEditAuthority = computed(() => {
  return currentNode.value.id && !isRoleManager(currentNode.value.code!);
});
</script>
<style scoped lang="postcss">
:deep(.in-filter-container-header) {
  padding: 0 !important;
}
.title {
  flex: 1;
  color: #171a1d;
  font-weight: 600;
  font-size: 17px;
}
.default-role-bg-container {
  display: flex;
  align-items: center;
  justify-content: center;
  & .default-role-bg {
    width: 80%;
    height: auto;
  }
}
</style>
