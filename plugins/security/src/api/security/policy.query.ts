import { securityQueryContext } from "./context";
import { queryOptions } from "@tanstack/vue-query";
import { createResourceQueryKeys, silentQueryRequest } from "@ingot/admin-core";
import type {
  GatewayBlacklistEvent,
  GatewayChallengePolicy,
  GatewayEndpointGroup,
  GatewayIpList,
  GatewayRateLimitRule,
  ViolationEscalationConfig,
} from "@/models";
import {
  GetBlockEventsAPI,
  GetChallengePoliciesAPI,
  GetEndpointGroupsAPI,
  GetIpListAPI,
  GetRateLimitRulesAPI,
  GetViolationEscalationAPI,
} from "./policy";

export const endpointGroupQueryKeys = createResourceQueryKeys("security", "endpoint-group");
export const rateLimitRuleQueryKeys = createResourceQueryKeys("security", "rate-limit-rule");
export const ipListQueryKeys = createResourceQueryKeys("security", "ip-list");
export const challengePolicyQueryKeys = createResourceQueryKeys("security", "challenge-policy");
export const violationEscalationQueryKeys = createResourceQueryKeys(
  "security",
  "violation-escalation",
);
export const blockEventQueryKeys = createResourceQueryKeys("security", "block-event");

export function EndpointGroupListQueryOptions() {
  return queryOptions({
    queryKey: [...endpointGroupQueryKeys.lists(), securityQueryContext()],
    queryFn: ({ signal }): Promise<Array<GatewayEndpointGroup>> =>
      GetEndpointGroupsAPI(silentQueryRequest(signal)).then(({ data }) => data ?? []),
  });
}

export function RateLimitRuleListQueryOptions() {
  return queryOptions({
    queryKey: [...rateLimitRuleQueryKeys.lists(), securityQueryContext()],
    queryFn: ({ signal }): Promise<Array<GatewayRateLimitRule>> =>
      GetRateLimitRulesAPI(silentQueryRequest(signal)).then(({ data }) => data ?? []),
  });
}

export function IpListQueryOptions() {
  return queryOptions({
    queryKey: [...ipListQueryKeys.lists(), securityQueryContext()],
    queryFn: ({ signal }): Promise<Array<GatewayIpList>> =>
      GetIpListAPI(silentQueryRequest(signal)).then(({ data }) => data ?? []),
  });
}

export function ChallengePolicyListQueryOptions() {
  return queryOptions({
    queryKey: [...challengePolicyQueryKeys.lists(), securityQueryContext()],
    queryFn: ({ signal }): Promise<Array<GatewayChallengePolicy>> =>
      GetChallengePoliciesAPI(silentQueryRequest(signal)).then(({ data }) => data ?? []),
  });
}

export function ViolationEscalationQueryOptions() {
  return queryOptions({
    queryKey: [...violationEscalationQueryKeys.detail("current"), securityQueryContext()],
    queryFn: ({ signal }): Promise<ViolationEscalationConfig> =>
      GetViolationEscalationAPI(silentQueryRequest(signal)).then(({ data }) => data),
  });
}

export function BlockEventListQueryOptions(limit = 100) {
  return queryOptions({
    queryKey: blockEventQueryKeys.list({ limit, ...securityQueryContext() }),
    queryFn: ({ signal }): Promise<Array<GatewayBlacklistEvent>> =>
      GetBlockEventsAPI(limit, silentQueryRequest(signal)).then(({ data }) => data ?? []),
  });
}
