import { request, type RequestOptions } from "@/net";
import type { R } from "@/models";
import type {
  AccountSelfProfile,
  AccountSelfProfileInput,
  CurrentCapabilities,
  IamBootstrap,
} from "@/models/iam";

const PATH = "/api/iam/v1/me";

export function IamBootstrapAPI(options?: RequestOptions): Promise<R<IamBootstrap>> {
  return request.get<IamBootstrap>(`${PATH}/bootstrap`, undefined, options);
}

export function IamCapabilitiesAPI(): Promise<R<CurrentCapabilities>> {
  return request.get<CurrentCapabilities>(`${PATH}/capabilities`);
}

export function IamProfileAPI(): Promise<R<AccountSelfProfile>> {
  return request.get<AccountSelfProfile>(`${PATH}/profile`);
}

export function IamProfileUpdateAPI(
  params: AccountSelfProfileInput,
): Promise<R<AccountSelfProfile>> {
  return request.patch<AccountSelfProfile>(`${PATH}/profile`, params);
}
