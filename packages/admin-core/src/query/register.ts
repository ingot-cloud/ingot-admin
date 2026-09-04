import type { ApiError } from "@ingot/http-client";
import type { InMutationMeta, InQueryMeta } from "./types";

declare module "@tanstack/vue-query" {
  interface Register {
    defaultError: ApiError;
    queryMeta: InQueryMeta;
    mutationMeta: InMutationMeta;
  }
}

export {};
