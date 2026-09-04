import { describe, expect, it } from "vitest";
import { InterceptorOrder } from "./order";

describe("InterceptorOrder", () => {
  it("请求与响应官方槽位按升序排列", () => {
    expect(InterceptorOrder.request.lifecycle).toBeLessThan(InterceptorOrder.request.header);
    expect(InterceptorOrder.request.header).toBeLessThan(InterceptorOrder.request.envelope);
    expect(InterceptorOrder.response.lifecycle).toBeLessThan(InterceptorOrder.response.envelope);
    expect(InterceptorOrder.response.envelope).toBeLessThan(InterceptorOrder.response.normalize);
    expect(InterceptorOrder.response.normalize).toBeLessThan(InterceptorOrder.response.challenge);
  });
});
