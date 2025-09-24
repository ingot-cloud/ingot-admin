<template>
  <div v-loading="loading">
    <div class="back-btn" @click="handleBack">
      <i-ep:arrow-left />
      返回
    </div>
    <div class="select-tenant-box">
      <div class="title-box">
        <div class="title">选择你管理的组织</div>
        <div class="desc">你在以下组织中担任管理员</div>
      </div>
      <div class="tenant-scroll">
        <TenantItemView
          v-for="item in list"
          :key="item.id"
          :id="item.id"
          :name="item.name"
          :avatar="item.avatar"
          @click="handleItemClick(item)"
        />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { PropType } from "vue";
import type { TenantItem } from "@/models";
import TenantItemView from "./TenantItem.vue";
import { useLoginStore } from "@/stores/modules/login";

const loginStore = useLoginStore();
defineProps({
  list: {
    type: Array as PropType<Array<TenantItem>>,
  },
});

const emits = defineEmits(["back"]);
const loading = ref(false);

const handleBack = () => {
  emits("back");
};
const handleItemClick = (params: TenantItem) => {
  loading.value = true;
  loginStore.authorizeCodeRequest(params.id!).catch(() => {
    loading.value = false;
  });
};
</script>
<style scoped lang="postcss">
.back-btn {
  display: flex;
  flex-direction: row;
  align-items: center;
  position: absolute;
  width: 70px;
  height: 60px;
  left: 0;
  top: 0;
  padding-left: 16px;
  font-size: 14px;
  color: rgba(23, 26, 29, 0.6);
  cursor: pointer;
}
.select-tenant-box {
  --tenant-box-padding-tb: 70px;
  --title-box-height: 70px;
  --title-box-margin-bottom: 30px;
  --scroll-height: calc(
    var(--login-box-height) - var(--tenant-box-padding-tb) * 2 - var(--title-box-height) -
      var(--title-box-margin-bottom)
  );

  padding: var(--tenant-box-padding-tb) 80px;
  display: flex;
  flex-direction: column;

  & .title-box {
    height: var(--title-box-height);
    margin-bottom: var(--title-box-margin-bottom);

    & .title {
      display: block;
      margin: 0 auto 10px;
      line-height: 35px;
      font-size: 24px;
      color: #171a1d;
      text-align: left;
      font-weight: bold;
    }

    & .desc {
      display: block;
      margin: 0 auto;
      line-height: 25px;
      font-size: 14px;
      color: rgba(23, 26, 29, 0.6);
      text-align: left;
    }
  }

  & .tenant-scroll {
    height: var(--scroll-height);
    overflow-x: hidden;
    overflow-y: auto;
  }
}
</style>
