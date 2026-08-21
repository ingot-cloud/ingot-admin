<template>
  <in-drawer :title="title" v-model="visible" size="520px">
    <div v-loading="loading" class="session-detail">
      <in-with-label title="会话 ID">
        <in-copy-tag v-if="session.sid" :text="session.sid" />
        <span v-else>-</span>
      </in-with-label>
      <in-with-label title="Token ID">
        <in-copy-tag v-if="session.jti" :text="session.jti" />
        <span v-else>-</span>
      </in-with-label>
      <in-with-label title="用户">
        {{ displaySessionUser(session) }}
      </in-with-label>
      <in-with-label title="账号">
        {{ session.username || "-" }}
      </in-with-label>
      <in-with-label title="组织">
        {{ displaySessionTenant(session) }}
      </in-with-label>
      <in-with-label title="客户端">
        {{ session.clientId || "-" }}
      </in-with-label>
      <in-with-label title="客户端缺省">
        <in-tag-enum
          v-if="session.authType"
          :value="session.authType"
          :enumObj="tokenAuthMethodEnum"
        />
        <span v-else>-</span>
      </in-with-label>
      <in-with-label title="用户类型">
        <in-tag-enum
          v-if="session.userType"
          :value="session.userType"
          :enumObj="sessionUserTypeEnum"
        />
        <span v-else>-</span>
      </in-with-label>
      <in-with-label title="登录 IP">
        {{ session.ipAddress || "-" }}
      </in-with-label>
      <in-with-label title="位置">
        {{ session.location || "-" }}
      </in-with-label>
      <in-with-label title="设备">
        {{ session.deviceType || "-" }}
      </in-with-label>
      <in-with-label title="操作系统">
        {{ session.os || "-" }}
      </in-with-label>
      <in-with-label title="浏览器">
        {{ session.browser || "-" }}
      </in-with-label>
      <in-with-label title="颁发时间">
        {{ formatSessionTime(session.issuedAt) }}
      </in-with-label>
      <in-with-label title="过期时间">
        {{ formatSessionTime(session.expiresAt) }}
      </in-with-label>
      <in-with-label title="最近凭据活动">
        {{ formatSessionTime(session.lastAccessAt) }}
      </in-with-label>
      <in-with-label title="User-Agent">
        <span class="session-detail__ua">{{ session.userAgent || "-" }}</span>
      </in-with-label>
    </div>
  </in-drawer>
</template>

<script setup lang="ts">
import type { PlatformSessionVO } from "@/models";
import { useSessionUserTypeEnum, useTokenAuthMethodEnum } from "@/models/enums";
import { GetSessionAPI } from "@/api/platform/security/session";
import { displaySessionTenant, displaySessionUser, formatSessionTime } from "../sessionDisplay";

const emits = defineEmits<{
  missing: [];
}>();

const title = "会话详情";
const visible = ref(false);
const loading = ref(false);
const session = ref<PlatformSessionVO>({});
const message = useMessage();
const tokenAuthMethodEnum = useTokenAuthMethodEnum();
const sessionUserTypeEnum = useSessionUserTypeEnum();

defineExpose({
  show(sid: string) {
    visible.value = true;
    session.value = {};
    loading.value = true;
    GetSessionAPI(sid)
      .then((response) => {
        if (!response.data) {
          message.warning("会话已不存在");
          visible.value = false;
          emits("missing");
          return;
        }
        session.value = response.data;
      })
      .finally(() => {
        loading.value = false;
      });
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
