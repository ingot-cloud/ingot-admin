<template>
  <BizIamAuthorizationAudit
    :domain="AuthorizationDomain.PLATFORM"
    :read-action="IamAction.PLATFORM_AUDIT_READ"
    :query-options="AuthorizationAuditPageQueryOptions"
  />
</template>
<script setup lang="ts">
import { BizIamAuthorizationAudit, AuthorizationDomain, IamAction } from "@ingot/admin-common";
import { AuthorizationAuditPageQueryOptions } from "@/api/iam/authorization-audit";
</script>
