<template>
  <in-drawer
    :title="title"
    v-model="visible"
    size="min(640px, 100vw)"
    layout="pinned"
    class="security-policy-drawer"
    :loading="loading"
  >
    <in-form :editing="false" class="session-detail">
      <in-detail-field label="会话 ID">
        <template #view>
          <in-copy-tag v-if="session.sid" :text="session.sid" />
          <span v-else>-</span>
        </template>
      </in-detail-field>
      <in-detail-field label="Token ID">
        <template #view>
          <in-copy-tag v-if="session.jti" :text="session.jti" />
          <span v-else>-</span>
        </template>
      </in-detail-field>
      <in-detail-field label="用户">
        <template #view>
          {{ displaySessionUser(session) }}
        </template>
      </in-detail-field>
      <in-detail-field label="账号">
        <template #view>
          {{ session.username || "-" }}
        </template>
      </in-detail-field>
      <in-detail-field label="组织">
        <template #view>
          {{ displaySessionTenant(session) }}
        </template>
      </in-detail-field>
      <in-detail-field label="客户端">
        <template #view>
          {{ session.clientId || "-" }}
        </template>
      </in-detail-field>
      <in-detail-field label="认证方式">
        <template #view>
          <in-tag-enum
            v-if="session.authType"
            :value="session.authType"
            :enumObj="tokenAuthMethodEnum"
          />
          <span v-else>-</span>
        </template>
      </in-detail-field>
      <in-detail-field label="用户类型">
        <template #view>
          <in-tag-enum
            v-if="session.userType"
            :value="session.userType"
            :enumObj="sessionUserTypeEnum"
          />
          <span v-else>-</span>
        </template>
      </in-detail-field>
      <in-detail-field label="登录 IP">
        <template #view>
          {{ session.ipAddress || "-" }}
        </template>
      </in-detail-field>
      <in-detail-field label="位置">
        <template #view>
          {{ session.location || "-" }}
        </template>
      </in-detail-field>
      <in-detail-field label="设备">
        <template #view>
          {{ session.deviceType || "-" }}
        </template>
      </in-detail-field>
      <in-detail-field label="操作系统">
        <template #view>
          {{ session.os || "-" }}
        </template>
      </in-detail-field>
      <in-detail-field label="浏览器">
        <template #view>
          {{ session.browser || "-" }}
        </template>
      </in-detail-field>
      <in-detail-field label="颁发时间">
        <template #view>
          {{ formatSessionTime(session.issuedAt) }}
        </template>
      </in-detail-field>
      <in-detail-field label="过期时间">
        <template #view>
          {{ formatSessionTime(session.expiresAt) }}
        </template>
      </in-detail-field>
      <in-detail-field label="最近凭据活动">
        <template #view>
          {{ formatSessionTime(session.lastAccessAt) }}
        </template>
      </in-detail-field>
      <in-detail-field label="User-Agent">
        <template #view>
          <span class="session-detail__ua">{{ session.userAgent || "-" }}</span>
        </template>
      </in-detail-field>
    </in-form>
  </in-drawer>
</template>

<script setup lang="ts">
import { useActiveSecurityRead, SecurityAction } from "@/hooks/useSecurityTabs";
const canRead = useActiveSecurityRead(SecurityAction.SESSION_READ, "session");
import type { PlatformSessionVO } from "@/models";
import { useSessionUserTypeEnum, useTokenAuthMethodEnum } from "@/models/enums";
import { SessionDetailQueryOptions } from "@/api/security/session.query";
import { displaySessionTenant, displaySessionUser, formatSessionTime } from "../sessionDisplay";
import { useQuery } from "@tanstack/vue-query";

const emits = defineEmits<{
  missing: [];
}>();

const title = "会话详情";
const visible = ref(false);
const activeSid = ref("");
const message = useMessage();
const tokenAuthMethodEnum = useTokenAuthMethodEnum();
const sessionUserTypeEnum = useSessionUserTypeEnum();

const detailQuery = useQuery(() => ({
  ...SessionDetailQueryOptions(activeSid),
  enabled: canRead.value && visible.value && Boolean(activeSid.value),
}));

const loading = computed(() => detailQuery.isFetching.value);
const session = computed<PlatformSessionVO>(() => detailQuery.data.value ?? {});

watch(
  () => [visible.value, detailQuery.isSuccess.value, detailQuery.data.value] as const,
  ([opened, success, data]) => {
    if (!opened || !success) {
      return;
    }
    if (!data) {
      message.warning("会话已不存在");
      visible.value = false;
      emits("missing");
    }
  },
);

defineExpose({
  show(sid: string) {
    activeSid.value = sid;
    visible.value = true;
  },
});
</script>

<style lang="postcss" scoped>
.session-detail {
  @apply flex flex-col gap-12px;

  & .session-detail__ua {
    @apply break-all text-13px;
  }
}
</style>
