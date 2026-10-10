// @vitest-environment jsdom
import { mount } from "@vue/test-utils";
import { ElInput, ElInputNumber, ElSelect } from "element-plus";
import { describe, expect, it } from "vitest";
import { MaskKind } from "../models/iam/constants";
import BizIamMaskEditor from "./BizIamMaskEditor.vue";

describe("脱敏规则实时预览", () => {
  it("每种规则都有原文和结果，切换预设清理旧参数", async () => {
    const wrapper = mount(BizIamMaskEditor, {
      props: { modelValue: { kind: MaskKind.KEEP_EDGES, prefix: 1, suffix: 1 } },
    });
    expect(wrapper.get("output").text()).toBe("a****f");
    wrapper.getComponent(ElSelect).vm.$emit("change", MaskKind.PHONE);
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([{ kind: MaskKind.PHONE }]);
    expect(wrapper.get("output").text()).toBe("138****5678");
    wrapper.getComponent(ElInput).vm.$emit("update:modelValue", "123");
    await wrapper.vm.$nextTick();
    expect(wrapper.get("output").text()).toBe("***");
    wrapper.getComponent(ElSelect).vm.$emit("change", MaskKind.EMAIL);
    await wrapper.vm.$nextTick();
    expect(wrapper.get("output").text()).toBe("a***@example.com");
    wrapper.getComponent(ElSelect).vm.$emit("change", MaskKind.ALL);
    await wrapper.vm.$nextTick();
    expect(wrapper.get("output").text()).toBe("***");
  });
  it("自然编号转换为 API 区间，非法区间给出提示", async () => {
    const mask = { kind: MaskKind.RANGE, start: 1, end: 3 };
    const wrapper = mount(BizIamMaskEditor, { props: { modelValue: mask } });
    const controls = wrapper.findAllComponents(ElInputNumber);
    expect(controls[0].props("modelValue")).toBe(2);
    expect(controls[1].props("modelValue")).toBe(3);
    expect(wrapper.get("output").text()).toBe("a**def");
    controls[0].vm.$emit("update:modelValue", 4);
    await wrapper.vm.$nextTick();
    expect(mask.start).toBe(3);
    expect(wrapper.find("output").exists()).toBe(false);
    expect(wrapper.text()).toContain("请先填写有效的脱敏参数");
  });
});
