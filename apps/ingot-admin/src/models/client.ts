import type { CommonStatus } from "./enums";

export interface OAuth2RegisteredClient {
  id?: string;
  clientId?: string;
  clientIdIssuedAt?: string;
  clientSecret?: string;
  clientName?: string;
  clientAuthenticationMethods?: string;
  authorizationGrantTypes?: string;
  redirectUris?: string;
  scopes?: string;
  requireProofKey?: boolean;
  requireAuthorizationConsent?: boolean;
  accessTokenTimeToLive?: string;
  reuseRefreshTokens?: boolean;
  refreshTokenTimeToLive?: string;
  idTokenSignatureAlgorithm?: string;
  tokenAuthType?: string;
  status?: CommonStatus;
}

export interface AppSecretVO {
  appId?: string;
  appSecret?: string;
}
