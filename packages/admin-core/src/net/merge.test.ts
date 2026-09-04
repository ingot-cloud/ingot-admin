import { describe, expect, it } from "vitest";
import {
  defineRequestInterceptor,
  defineResponseInterceptor,
  InterceptorOrder as AdminNetInterceptorOrder,
} from "@ingot/http-client";
import {
  CORE_REQUEST_INTERCEPTORS,
  CORE_RESPONSE_INTERCEPTORS,
  mergeAdminNetInterceptors,
} from "./core-interceptors";

describe("mergeAdminNetInterceptors", () => {
  it("App 拦截器追加在 core 之后，同 order 时 core 在前", () => {
    const appRequest = defineRequestInterceptor({
      name: "tenant-trace",
      order: AdminNetInterceptorOrder.request.header + 2,
      resolved: (config) => config,
    });
    const appResponse = defineResponseInterceptor({
      name: "audit",
      order: 8,
      resolved: (response) => response,
    });

    const merged = mergeAdminNetInterceptors({
      request: [appRequest],
      response: [appResponse],
    });

    expect(merged.request.map((item) => item.name)).toEqual([
      ...CORE_REQUEST_INTERCEPTORS.map((item) => item.name),
      "tenant-trace",
    ]);
    expect(merged.response.map((item) => item.name)).toEqual([
      ...CORE_RESPONSE_INTERCEPTORS.map((item) => item.name),
      "audit",
    ]);
    expect(merged.request.find((item) => item.name === "header")?.order).toBe(
      AdminNetInterceptorOrder.request.header,
    );
    expect(merged.request.find((item) => item.name === "tenant-trace")?.order).toBe(
      AdminNetInterceptorOrder.request.header + 2,
    );
    expect(merged.request.find((item) => item.name === "envelope")?.order).toBe(
      AdminNetInterceptorOrder.request.envelope,
    );
    expect(CORE_RESPONSE_INTERCEPTORS.find((item) => item.name === "envelope")?.order).toBe(
      AdminNetInterceptorOrder.response.envelope,
    );
    expect(CORE_RESPONSE_INTERCEPTORS.find((item) => item.name === "challenge")?.order).toBe(
      AdminNetInterceptorOrder.response.challenge,
    );
  });
});
