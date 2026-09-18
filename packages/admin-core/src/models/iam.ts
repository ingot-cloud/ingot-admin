export type AuthorizationDomain = "PLATFORM" | "TENANT";

export type IamMenuKind = "DIRECTORY" | "PAGE";

export interface AuthorizationContext {
  domain: AuthorizationDomain;
  tenantId?: string | null;
  accountId: string;
  memberId: string;
}

export interface CurrentProfile {
  memberId: string;
  displayName: string;
  avatar?: string;
}

export interface IamApplicationSummary {
  id: string;
  code: string;
  name: string;
  icon?: string;
  sortOrder: number;
}

export interface IamMenuNode {
  id: string;
  applicationId: string;
  name: string;
  kind: IamMenuKind;
  path?: string;
  viewPath?: string;
  routeName?: string;
  icon?: string;
  sortOrder: number;
  children: IamMenuNode[];
}

export interface IamBootstrap {
  context: AuthorizationContext;
  profile: CurrentProfile;
  applications: IamApplicationSummary[];
  menus: IamMenuNode[];
  actionCodes: string[];
  version: string;
  expiresAt: string;
}

export interface CurrentCapabilities {
  actionCodes: string[];
  version: string;
  expiresAt: string;
}
