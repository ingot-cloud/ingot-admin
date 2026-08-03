import request from "@/net";
import type {
  R,
  GatewayEndpointGroup,
  GatewayRateLimitRule,
  GatewayIpList,
  ViolationEscalationConfig,
  GatewayBlacklistEvent,
} from "@/models";

const PATH = "/api/security/platform/security/policy";

export function GetEndpointGroupsAPI(): Promise<R<Array<GatewayEndpointGroup>>> {
  return request.get<Array<GatewayEndpointGroup>>(`${PATH}/groups`);
}

export function CreateEndpointGroupAPI(
  group: GatewayEndpointGroup,
): Promise<R<void>> {
  return request.post<void>(`${PATH}/groups`, group);
}

export function UpdateEndpointGroupAPI(
  group: GatewayEndpointGroup,
): Promise<R<void>> {
  return request.put<void>(`${PATH}/groups`, group);
}

export function DeleteEndpointGroupAPI(id: number): Promise<R<void>> {
  return request.delete<void>(`${PATH}/groups/${id}`);
}

export function GetRateLimitRulesAPI(): Promise<R<Array<GatewayRateLimitRule>>> {
  return request.get<Array<GatewayRateLimitRule>>(`${PATH}/rules`);
}

export function CreateRateLimitRuleAPI(rule: GatewayRateLimitRule): Promise<R<void>> {
  return request.post<void>(`${PATH}/rules`, rule);
}

export function UpdateRateLimitRuleAPI(rule: GatewayRateLimitRule): Promise<R<void>> {
  return request.put<void>(`${PATH}/rules`, rule);
}

export function DeleteRateLimitRuleAPI(id: number): Promise<R<void>> {
  return request.delete<void>(`${PATH}/rules/${id}`);
}

export function GetIpListAPI(): Promise<R<Array<GatewayIpList>>> {
  return request.get<Array<GatewayIpList>>(`${PATH}/ip-list`);
}

export function CreateIpListAPI(item: GatewayIpList): Promise<R<void>> {
  return request.post<void>(`${PATH}/ip-list`, item);
}

export function UpdateIpListAPI(item: GatewayIpList): Promise<R<void>> {
  return request.put<void>(`${PATH}/ip-list`, item);
}

export function DeleteIpListAPI(id: number): Promise<R<void>> {
  return request.delete<void>(`${PATH}/ip-list/${id}`);
}

export function GetViolationEscalationAPI(): Promise<R<ViolationEscalationConfig>> {
  return request.get<ViolationEscalationConfig>(`${PATH}/violation-escalation`);
}

export function UpdateViolationEscalationAPI(
  config: ViolationEscalationConfig,
): Promise<R<void>> {
  return request.put<void>(`${PATH}/violation-escalation`, config);
}

export function GetBlockEventsAPI(limit = 100): Promise<R<Array<GatewayBlacklistEvent>>> {
  return request.get<Array<GatewayBlacklistEvent>>(`${PATH}/events`, { params: { limit } });
}

export function BroadcastPolicyInvalidationAPI(): Promise<R<void>> {
  return request.post<void>(`${PATH}/broadcast-invalidation`);
}
