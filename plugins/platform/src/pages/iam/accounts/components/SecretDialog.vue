<template>
  <in-dialog title="请妥善保管初始密码，登录后及时修改" v-model="visible">
    <div class="flex flex-col gap-8px">
      <div class="flex flex-row items-center gap-8px">
        <span>一次性口令</span>
        <in-copy-tag :text="password" />
      </div>
      <div class="text-12px text-[var(--el-text-color-secondary)]">关闭后无法再次读取明文。</div>
    </div>
    <template #footer>
      <in-button type="primary" @click="privateClose">确定</in-button>
    </template>
  </in-dialog>
</template>

<script setup lang="ts">
defineOptions({ name: "AccountSecretDialog" });

const visible = ref(false);
const password = ref("");

const privateClose = (): void => {
  visible.value = false;
  password.value = "";
};

defineExpose({
  show(value: string) {
    password.value = value;
    visible.value = true;
  },
});
</script>
