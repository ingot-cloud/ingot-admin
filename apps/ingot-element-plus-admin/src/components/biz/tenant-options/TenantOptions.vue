<template>
  <el-select
    remote
    filterable
    :remote-method="remoteMethod"
    :loading="loading"
    placeholder="请输入组织名称"
    no-data-text="未搜索到组织"
    clearable
    @change="privateOnTenantChanged"
  >
    <el-option v-for="item in options" :key="item.id" :label="item.name" :value="item.id!">
      <div class="tenant-item">
        <div class="avatar">
          <el-image v-if="item.avatar" :src="item.avatar" class="h-full w-full" fit="cover" />
        </div>
        <div class="name">
          {{ item.name }}
        </div>
      </div>
    </el-option>
  </el-select>
</template>
<script lang="ts" setup>
import { useTenantStore } from "@/stores/modules/tenant";
import type { SysTenant } from "@/models";

const tenantStore = useTenantStore();
const loading = ref(false);
const options = ref<Array<SysTenant>>([]);

const emits = defineEmits(["onChanged"]);

const remoteMethod = (query: string) => {
  if (query) {
    loading.value = true;
    tenantStore
      .search(query)
      .then((data) => {
        loading.value = false;
        options.value = data;
      })
      .catch(() => {
        loading.value = false;
      });
  } else {
    options.value = [];
  }
};

const privateOnTenantChanged = (value: string) => {
  emits("onChanged", value);
};
</script>
<style lang="postcss" scoped>
.tenant-item {
  @apply cursor-pointer;
  min-height: 24px;
  border-radius: 8px;
  transition: all 0.3s;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  grid-gap: 10px;

  & .avatar {
    width: 24px;
    height: 24px;
    border-radius: 8px;
    color: rgba(0, 137, 255, 0.48);
    background: #ffffff;
  }

  & .name {
    flex: 1;
    display: -webkit-box;
    word-break: break-all;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 14px;
    color: #171a1d;
  }
}
</style>
