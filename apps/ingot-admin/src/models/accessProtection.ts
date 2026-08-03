export interface GatewayEndpointPattern {
  path?: string;
  method?: string;
}

export interface GatewayEndpointGroup {
  id?: number;
  code?: string;
  name?: string;
  patternList?: Array<GatewayEndpointPattern>;
  enabled?: boolean;
  remark?: string;
}

export interface GatewayRateLimitRule {
  id?: number;
  code?: string;
  groupCode?: string;
  patternList?: Array<GatewayEndpointPattern>;
  dimension?: string;
  qps?: number;
  burst?: number;
  intervalSec?: number;
  controlBehavior?: string;
  enabled?: boolean;
  priority?: number;
  remark?: string;
}

export interface GatewayIpList {
  id?: number;
  listType?: string;
  keyType?: string;
  keyValue?: string;
  reason?: string;
  source?: string;
  effectiveAt?: string;
  expiresAt?: string;
  enabled?: boolean;
}

export interface ViolationEscalationConfig {
  id?: number;
  windowSec?: number;
  blockThreshold?: number;
  tempBlockTtlSec?: number;
  enabled?: boolean;
}

export interface LoginFailureProtectionPolicyVO {
  id?: number;
  dimension?: string;
  enabled?: boolean;
  maxAttempts?: number;
  windowMinutes?: number;
  blockTtlSec?: number;
  blockKeyType?: string;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GatewayBlacklistEvent {
  id?: number;
  keyType?: string;
  keyValue?: string;
  reason?: string;
  blockedAt?: string;
  expiresAt?: string;
  source?: string;
}
