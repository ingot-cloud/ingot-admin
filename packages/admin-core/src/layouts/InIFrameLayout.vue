<template>
  <in-container ref="ContainerRef">
    <div class="in-frame-layout">
      <div w-full h-full v-for="item in urlArray" :key="item.path" class="in-frame-box">
        <iframe
          :src="item.url"
          :key="item.path"
          frameborder="0"
          :height="frameHeight"
          :width="frameWidth"
          :data-url="item.path"
          v-show="getRoutePath === item.path"
          ref="IFrameRef"
        />
      </div>
    </div>
  </in-container>
</template>
<script setup lang="ts">
interface PathURL {
  path: string;
  url: string;
  loading: boolean;
}

const urlArray = ref<Array<PathURL>>([]);
const route = useRoute();

const ContainerRef = ref();
const IFrameRef = ref();
const frameHeight = ref("0");
const frameWidth = ref("0");

const getRoutePath = computed(() => {
  return route.fullPath;
});

const setIFrameSize = () => {
  if (frameHeight.value == "0" || frameWidth.value == "0") {
    nextTick(() => {
      const size = ContainerRef.value.getContentSize();
      frameHeight.value = size.height;
      frameWidth.value = size.width;
    });
  }
};

onMounted(() => {
  setIFrameSize();
});

watch(
  () => route.fullPath,
  (fullPath) => {
    setIFrameSize();
    let current = urlArray.value.find((item) => {
      return item.path === route.fullPath;
    });
    if (!current) {
      current = {
        path: route.fullPath,
        url: route.meta.linkURL!,
        loading: true,
      };
      urlArray.value.push(current);
    }

    nextTick(() => {
      if (!IFrameRef.value) {
        return;
      }
      IFrameRef.value.forEach((v: HTMLElement) => {
        if (v.dataset.url === fullPath) {
          v.onload = () => {
            if (current && current.loading) {
              current.loading = false;
            }
          };
        }
      });
    });
  },
  {
    immediate: true,
  },
);
</script>
<style scoped lang="postcss">
.in-frame-layout {
  position: relative;

  & .in-frame-box {
    position: absolute;
    left: 0;
    top: 0;
  }
}
</style>
