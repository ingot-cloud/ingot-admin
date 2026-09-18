import { request } from "@/net";
import type { R } from "@/models";
import type { IamBootstrap, CurrentCapabilities } from "@/models/iam";

const PATH = "/api/iam/v1/me";

export function IamBootstrapAPI(): Promise<R<IamBootstrap>> {
  return request.get<IamBootstrap>(`${PATH}/bootstrap`);
}

export function IamCapabilitiesAPI(): Promise<R<CurrentCapabilities>> {
  return request.get<CurrentCapabilities>(`${PATH}/capabilities`);
}
