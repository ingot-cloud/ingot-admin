<template>
  <BizIamAuthorizationAudit
    :domain="AuthorizationDomain.PLATFORM"
    :read-action="IamAction.PLATFORM_AUDIT_READ"
    :query-options="AuthorizationAuditPageQueryOptions"
    :load-actor-members="loadPlatformMemberOptions"
    :locked-target="lockedTarget"
    @clear-target="privateClearTarget"
  />
</template>
<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { BizIamAuthorizationAudit, AuthorizationDomain, IamAction } from "@ingot/admin-common";
import { AuthorizationAuditPageQueryOptions } from "@/api/iam/authorization-audit";
import { loadPlatformMemberOptions } from "../personnel/iamMemberOptions";

const route = useRoute();
const router = useRouter();
const text = (value: unknown): string | undefined =>
  typeof value === "string" && value ? value : undefined;
const lockedTarget = computed(() => {
  const type = text(route.query.targetType);
  const id = text(route.query.targetId);
  return type && id ? { type, id } : undefined;
});
const privateClearTarget = (): void => {
  const query = { ...route.query };
  delete query.targetType;
  delete query.targetId;
  void router.replace({ query });
};
</script>
