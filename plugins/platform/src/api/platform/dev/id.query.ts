import { createPageQueryOptions, createResourceQueryKeys } from "@ingot/admin-core";
import type { BizLeafAlloc } from "@/models";
import { IdPageAPI } from "./id";

export const idQueryKeys = createResourceQueryKeys("platform", "id");

export const IdPageQueryOptions = createPageQueryOptions<BizLeafAlloc, BizLeafAlloc>(
  idQueryKeys,
  IdPageAPI,
);
