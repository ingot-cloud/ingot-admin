import type { PostFilter, PreFilter } from "@ingot/http-client";
import type { InNetConfig } from "@/plugin";
import HeaderInterceptor from "./interceptor/request/header";
import EnvelopeRequestInterceptor from "./interceptor/request/envelope";
import EnvelopeResponseInterceptor from "./interceptor/response/envelope";
import ChallengeInterceptor from "./interceptor/response/challenge";

export const CORE_REQUEST_INTERCEPTORS: PreFilter[] = [
  HeaderInterceptor,
  EnvelopeRequestInterceptor,
];

export const CORE_RESPONSE_INTERCEPTORS: PostFilter[] = [
  EnvelopeResponseInterceptor,
  ChallengeInterceptor,
];

export const mergeAdminNetInterceptors = (
  extra?: InNetConfig["interceptors"],
): { request: PreFilter[]; response: PostFilter[] } => ({
  request: [...CORE_REQUEST_INTERCEPTORS, ...(extra?.request ?? [])],
  response: [...CORE_RESPONSE_INTERCEPTORS, ...(extra?.response ?? [])],
});
