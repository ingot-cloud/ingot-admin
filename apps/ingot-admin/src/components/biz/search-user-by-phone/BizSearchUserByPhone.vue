<template>
  <el-select-v2
    remote
    filterable
    :remote-method="remoteMethod"
    :loading="loading"
    :options="options"
    placeholder="请输入手机号"
    no-data-text="未搜索相关用户"
    :props="props"
    clearable
    @change="privateOnChanged"
  >
    <template #default="{ item }">
      <div class="custom-option-item">
        <div class="avatar" v-if="item.avatar">
          <el-image :src="item.avatar" class="h-full w-full" fit="cover" />
        </div>
        <div class="name">
          {{ item.nickname }}
        </div>
        <div class="phone">
          {{ item.phone }}
        </div>
      </div>
    </template>

    <template #label="{ value }">
      <div class="custom-option-item">
        <div class="avatar" v-if="options.find((item) => item.phone == value)?.avatar">
          <el-image
            :src="options.find((item) => item.phone == value)?.avatar"
            class="h-full w-full"
            fit="cover"
          />
        </div>
        <div class="name">
          {{ options.find((item) => item.phone == value)?.nickname }}
        </div>
        <div class="phone">
          {{ options.find((item) => item.phone == value)?.phone }}
        </div>
      </div>
    </template>
  </el-select-v2>
</template>
<script lang="ts" setup>
import { SearchByPhone } from "@/api/basic/user";
import type { SimpleUserWithPhoneVO } from "@/models";

const loading = ref(false);
const options = ref<Array<SimpleUserWithPhoneVO>>([]);
const props = {
  value: "phone",
  label: "phone",
};

const emits = defineEmits(["onChanged"]);

const remoteMethod = (query: string) => {
  if (!query) {
    options.value = [];
    return;
  }

  // 如果是以1开头的手机号，长度大于等于7位的时候才进行查询
  if ((query.startsWith("1") && query.length >= 7) || !query.startsWith("1")) {
    loading.value = true;
    SearchByPhone(query)
      .then((response) => {
        loading.value = false;
        options.value = response.data;
        if (options.value.length === 0) {
          options.value = [
            {
              phone: query,
              nickname: query,
            },
          ];
        }
      })
      .catch(() => {
        loading.value = false;
        options.value = [
          {
            phone: query,
            nickname: query,
          },
        ];
      });
  } else {
    options.value = [
      {
        phone: query,
        nickname: query,
      },
    ];
  }
};

const privateOnChanged = (value: string) => {
  console.log("a", value);
  emits("onChanged", value);
};
</script>
<style lang="postcss" scoped>
.custom-option-item {
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
    display: -webkit-box;
    word-break: break-all;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 14px;
    font-weight: 500;
    color: #171a1d;
  }

  & .phone {
    font-size: 12px;
    color: #999999;
  }
}
</style>
