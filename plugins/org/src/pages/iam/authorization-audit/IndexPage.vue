<template>
  <BizIamAuthorizationAudit
    :domain="AuthorizationDomain.TENANT"
    :read-action="IamAction.TENANT_AUDIT_READ"
    :query-options="AuthorizationAuditPageQueryOptions"
  />
</template>
<script setup lang="ts">
import { BizIamAuthorizationAudit, AuthorizationDomain, IamAction } from "@ingot/admin-common";
import { AuthorizationAuditPageQueryOptions } from "@/api/iam/authorization-audit";
</script>
