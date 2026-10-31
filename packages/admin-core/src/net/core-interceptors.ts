import type { PostFilter, PreFilter } from "@ingot/http-client";
import type { InNetConfig } from "@/plugin";
import HeaderInterceptor from "./interceptor/request/header";
import IdentityRequestInterceptor from "./interceptor/request/identity";
import EnvelopeRequestInterceptor from "./interceptor/request/envelope";
import EnvelopeResponseInterceptor from "./interceptor/response/envelope";
import ChallengeInterceptor from "./interceptor/response/challenge";
import IdentityInterceptor from "./interceptor/response/identity";
import { createCsrfRequestInterceptor } from "@ingot/auth-core";
import { getAdminRuntimeConfig } from "@/runtime";

export const CORE_REQUEST_INTERCEPTORS: PreFilter[] = [
  HeaderInterceptor,
  createCsrfRequestInterceptor(() => getAdminRuntimeConfig().login.entry),
  EnvelopeRequestInterceptor,
  IdentityRequestInterceptor,
];

export const CORE_RESPONSE_INTERCEPTORS: PostFilter[] = [
  EnvelopeResponseInterceptor,
  IdentityInterceptor,
  ChallengeInterceptor,
];

export const mergeAdminNetInterceptors = (
  extra?: InNetConfig["interceptors"],
): { request: PreFilter[]; response: PostFilter[] } => ({
  request: [...CORE_REQUEST_INTERCEPTORS, ...(extra?.request ?? [])],
  response: [...CORE_RESPONSE_INTERCEPTORS, ...(extra?.response ?? [])],
});
