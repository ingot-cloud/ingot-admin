<template>
  <AuthPageLoading :loading="loading">
    <div class="back-btn" @click="privateHandleBack">
      <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 19l-7-7l7-7"
        />
      </svg>
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
          :id="item.id"
          :key="item.id"
          :name="item.name"
          @click="privateHandleItemClick(item)"
        />
      </div>
    </div>
  </AuthPageLoading>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import type { TenantCandidate } from "@ingot/auth-core";
import AuthPageLoading from "../../../components/AuthPageLoading.vue";
import { useAuthSession } from "../../../session";
import TenantItemView from "./TenantItem.vue";

defineProps<{
  list?: TenantCandidate[];
}>();

const emit = defineEmits<{ back: [] }>();
const session = useAuthSession();
const loading = ref(false);

const privateHandleBack = (): void => {
  emit("back");
};

const privateHandleItemClick = (params: TenantCandidate): void => {
  loading.value = true;
  session.selectTenant(params.id).catch(() => {
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
    var(--login-box-height, 600px) - var(--tenant-box-padding-tb) * 2 - var(--title-box-height) -
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
