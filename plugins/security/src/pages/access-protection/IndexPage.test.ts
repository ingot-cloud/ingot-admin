import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const dir = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(resolve(dir, "IndexPage.vue"), "utf8");
const panels = [
  "components/EndpointGroupPanel.vue",
  "components/RateLimitRulePanel.vue",
  "components/IpListPanel.vue",
  "components/ChallengePolicyPanel.vue",
  "components/BlockEventPanel.vue",
];

describe("security access-protection IndexPage", () => {
  it("使用 Settings 的 page 模式和局部 Tab 懒挂载", () => {
    expect(source).toContain('mode="page"');
    expect(source).toContain("in-page-header");
    expect(source).toContain('description="配置网关访问防护策略，未打开的页签不发请求。"');
    expect(source).toContain("in-biz-tabs-header");
    expect(source).toContain("visitedTabs");
    expect(source).not.toContain("@refresh");
  });

  it("各策略面板去掉 @refresh 并接入表格工具", () => {
    for (const panel of panels) {
      const panelSource = readFileSync(resolve(dir, panel), "utf8");
      expect(panelSource).not.toContain("@refresh");
      expect(panelSource).not.toContain("#toolbar");
      expect(panelSource).toContain('density="compact"');
      expect(panelSource).toContain("in-table-column-setting");
      expect(panelSource).toContain("applyColumnSelection");
    }
  });
});
