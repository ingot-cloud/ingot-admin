<template>
  <in-container>
    <div w-full h-full flex flex-col items-center justify-center>
      <!-- <div class="logo-wrapper"><in-logo /></div> -->
      <div class="wrapper">
        <div class="content">
          <h1>即将离开{{ appStore.app.title }}</h1>
          <p class="info">您即将离开{{ appStore.app.title }}，请注意您的帐号和财产安全。</p>
          <p class="link">{{ targetUrl }}</p>
        </div>
        <div class="actions">
          <in-button type="primary" round @click="privateOnGoTargetPage">
            <template #icon>
              <in-icon name="tdesign:link" />
            </template>
            继续访问
          </in-button>
        </div>
      </div>
    </div>
  </in-container>
</template>
<script setup lang="ts">
import { useAppStore } from "@/stores/modules/app";

const route = useRoute();
const appStore = useAppStore();

const targetUrl = ref("");
const privateOnGoTargetPage = () => {
  window.open(targetUrl.value);
};

watch(
  () => route.fullPath,
  () => {
    targetUrl.value = route.meta.linkURL!;
  },
  {
    immediate: true,
  },
);
</script>
<style lang="postcss" setup>
.logo-wrapper {
  background: var(--in-app-bar-bg);
  padding: 5px;
  border-radius: 2px;
}
.wrapper {
  color: #222;
  font-size: 13px;
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  line-height: 1.5;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);

  margin-top: 5px;
  padding-top: 25px;
  padding-bottom: 25px;
  padding-left: 30px;
  padding-right: 30px;
  max-width: 540px;
  background-color: #f7f7f7;
  border: 1px solid #babbbc;
  border-radius: 5px;

  & h1 {
    margin-bottom: 12px;
    font-size: 16px;
    font-weight: 700;
    line-height: 1;
  }

  & p {
    display: block;
    margin-block-start: 1em;
    margin-block-end: 1em;
    margin-inline-start: 0px;
    margin-inline-end: 0px;
    unicode-bidi: isolate;
  }

  & .link {
    margin-top: 12px;
    word-wrap: normal;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: pointer;
  }

  & .actions {
    margin-top: 15px;
    padding-top: 30px;
    text-align: right;
    border-top: 1px solid #d8d8d8;
  }
}
</style>
