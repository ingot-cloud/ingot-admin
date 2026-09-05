import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = dirname(fileURLToPath(import.meta.url));

describe("admin UI visual fixtures", () => {
  it("主布局不再使用框架级 overflow-x-hidden", () => {
    const layout = readFileSync(resolve(root, "../../layouts/main/IndexPage.vue"), "utf8");
    const container = readFileSync(resolve(root, "../container/InContainer.vue"), "utf8");
    const filter = readFileSync(resolve(root, "../container/InFilterContainer.vue"), "utf8");
    expect(layout).not.toContain("overflow-x-hidden");
    expect(container).not.toContain("overflow-x-hidden");
    expect(filter).not.toContain("overflow-x-hidden");
    expect(layout).toContain("in-content-viewport");
    expect(layout).toContain("has-breadcrumb");
    expect(layout).toContain("has-copyright");
    expect(layout).toContain("padding: 0 var(--in-page-gutter);");
    expect(layout).toContain("padding-top: var(--in-page-gutter);");
    expect(layout).not.toContain("padding: 0 var(--in-page-gutter) var(--in-page-gutter)");
    expect(layout).toContain("overflow: hidden");
    expect(layout).toContain("calc(var(--in-sidebar-gutter) + var(--in-sidebar-panel-expanded))");
    expect(layout).toContain("calc(var(--in-sidebar-gutter) + var(--in-sidebar-panel-collapsed))");
    expect(layout).not.toContain("border-right: 1px solid var(--in-border-color)");
    expect(filter).toContain("overflow: hidden");
    const table = readFileSync(resolve(root, "../table/InTable.vue"), "utf8");
    const pageFrame = readFileSync(resolve(root, "../InPageFrame.vue"), "utf8");
    expect(table).not.toContain('aria-label="刷新"');
    expect(table).toContain("tools-start");
    expect(table).toContain("tools-end");
    expect(table).toContain("is-compact");
    expect(table).not.toContain("h(ElTable");
    expect(table).toContain("element-plus/theme-chalk/el-table.css");
    expect(table).toMatch(/\.in-table__body \{[\s\S]*?overflow: hidden;/);
    expect(pageFrame).toMatch(/\.in-page-frame__body\.is-page \{[\s\S]*?padding-bottom: var\(--in-page-gutter\);/);
  });

  it("顶栏与侧栏尺寸 Token 已对齐验收值", () => {
    const tokens = readFileSync(resolve(root, "../../styles/tokens.css"), "utf8");
    expect(tokens).toContain("--in-app-bar-height: 56px");
    expect(tokens).toContain("--in-app-bar-nav-max: 560px");
    expect(tokens).toContain("--in-app-bar-actions-max: 360px");
    expect(tokens).toContain("--in-app-bar-search-width: 240px");
    expect(tokens).toContain("--in-sidebar-panel-expanded: 236px");
    expect(tokens).toContain("--in-sidebar-panel-collapsed: 52px");
    expect(tokens).toContain("--in-sidebar-gutter: 8px");
    expect(tokens).toContain("--in-split-left-width: 260px");
    expect(tokens).toContain("--in-table-header-height: 48px");
    expect(tokens).toContain("--in-control-height: 32px");
    expect(tokens).toContain("--in-bg-color-canvas");
    expect(tokens).toContain("--in-bg-color-sidebar");
    expect(tokens).toContain("--in-bg-color-surface");
    expect(tokens).toContain("--in-container-radius: 0px");
    expect(tokens).toContain("--in-container-bg: var(--in-bg-color-surface)");
    expect(tokens).toContain("--in-split-rail-width: 0px");
    expect(tokens).toContain("--in-split-collapse-width: 19px");
    expect(tokens).toContain("--in-split-collapse-height: 32px");
    expect(tokens).toContain("--in-table-row-height-compact: 44px");
    expect(tokens).toContain("--in-motion-duration-split: 180ms");
    expect(tokens).toContain("--in-bg-color-subtle: #fbfbfb");
    expect(tokens).toContain("--in-motion-ease-sidebar: cubic-bezier(0.25, 0.1, 0.05, 1)");
    expect(tokens).toContain("--in-menu-icon-size: 20px");
    expect(tokens).toContain("--in-menu-base-level-padding: 16px");
    expect(tokens).toContain("--in-menu-item-height: 40px");
    expect(tokens).toContain("--in-menu-footer-clearance: 18px");
    expect(tokens).toContain("--in-menu-divider-gap: var(--in-space-2)");
    expect(tokens).toContain("--in-menu-control-height: 44px");
    expect(tokens).toContain("--in-bg-color-menu-hover: rgba(31, 35, 41, 0.06)");
    expect(tokens).toContain("--in-bg-color-control-hover: rgba(31, 35, 41, 0.08)");
  });

  it("容器默认直角无边框，双栏折叠带宽度过渡", () => {
    const container = readFileSync(resolve(root, "../container/InContainer.vue"), "utf8");
    const filter = readFileSync(resolve(root, "../container/InFilterContainer.vue"), "utf8");
    expect(container).toContain("variant: \"plain\"");
    expect(container).toContain("background: var(--in-container-bg)");
    expect(container).toContain("border-radius: var(--in-container-radius)");
    expect(container).toContain("--in-container-bg: transparent");
    expect(container).toContain("borderColor");
    expect(filter).toContain("leftCollapsible: true");
    expect(filter).toContain("autoCollapse: true");
    expect(filter).toContain("minRightWidth: 680");
    expect(filter).toContain("width var(--in-motion-duration-split)");
    expect(filter).toContain("left var(--in-motion-duration-split)");
  });

  it("侧栏滚动视口与底部控制分离，无 collapse popper", () => {
    const menu = readFileSync(resolve(root, "../../layouts/widgets/InMenu.vue"), "utf8");
    const layout = readFileSync(resolve(root, "../../layouts/main/IndexPage.vue"), "utf8");
    const toggle = readFileSync(resolve(root, "../../layouts/widgets/InMenuToggle.vue"), "utf8");
    expect(menu).toContain("in-menu__scroll");
    expect(menu).toContain("in-menu__control");
    expect(menu).toContain(".el-scrollbar__bar");
    expect(menu).toContain("scrollbar-width: none");
    expect(menu.replace(/\s+/g, " ")).toContain(
      "grid-template-rows: minmax(0, 1fr) var(--in-menu-footer-clearance) 1px var(--in-menu-divider-gap) var(--in-menu-control-height) var(--in-sidebar-gutter)",
    );
    expect(menu).toContain("in-menu__divider");
    expect(menu).toContain("in-menu__divider-gap");
    expect(menu).toContain("select-none");
    expect(menu).toContain("user-select: none");
    expect(menu).toContain(':collapse="false"');
    expect(menu).toContain("收起导航");
    expect(menu).toContain("展开导航");
    expect(menu).not.toContain("收起菜单");
    expect(layout).toContain("padding-left: var(--in-sidebar-gutter)");
    expect(layout).toContain("var(--in-motion-ease-sidebar)");
    expect(toggle).toContain("v-if=\"isOverlay\"");
    expect(toggle).toContain("关闭导航");
  });

  it("顶栏按品牌/导航/搜索/操作四区划分，搜索靠右", () => {
    const bar = readFileSync(resolve(root, "../../layouts/widgets/InAppBar.vue"), "utf8");
    const search = readFileSync(resolve(root, "../../layouts/widgets/search/InAppBarSearch.vue"), "utf8");
    expect(bar).toContain("in-app-bar__brand");
    expect(bar).toContain("in-app-bar__nav");
    expect(bar).toContain("in-app-bar__search-pane");
    expect(bar).toContain("in-app-bar__actions");
    expect(bar).toContain("justify-content: flex-end");
    expect(bar).toContain("max-width: var(--in-app-bar-nav-max)");
    expect(bar).toContain("max-width: var(--in-app-bar-actions-max)");
    expect(bar).toMatch(/\.in-app-bar__actions \{[\s\S]*?flex: none;/);
    expect(search).toContain("var(--in-app-bar-search-width)");
  });
});
