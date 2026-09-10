import fs from "node:fs";
import path from "node:path";
import {
  DEMO_IDS,
  assignModuleAnchors,
  extractComponentDocs,
  listOfficialPluginPages,
  listPackageValueExports,
  vitepressSlug,
} from "./extract-api.mjs";

const SAFE_TAGS = new Set(["DemoFrame"]);

export const escapeHtml = (text) =>
  String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

export const inlineCode = (text) => `\`${escapeHtml(text).replaceAll("`", "'")}\``;

const fence = (lang, text) => {
  const body = escapeHtml(String(text ?? "").trim());
  if (!body) {
    return "";
  }
  return ["````" + lang, body, "````"].join("\n");
};

const escapeProse = (text) => {
  const body = String(text ?? "").trim();
  if (!body) {
    return "";
  }
  return fence("txt", body);
};

const escapeCell = (text) =>
  escapeHtml(text)
    .replaceAll("|", "\\|")
    .replaceAll("\n", " ")
    .trim();

const renderFieldTable = (fields, kind) => {
  if (!fields.length) {
    return kind === "prop" ? "无独立 Props；未列出的属性按内部组件 / `$attrs` 透传。" : "无。";
  }
  const lines = [
    "| 名称 | 类型 | 必填 | 默认 | 说明 |",
    "| --- | --- | --- | --- | --- |",
  ];
  for (const field of fields) {
    const required = field.optional ? "否" : "是";
    lines.push(
      `| ${inlineCode(field.name)} | ${inlineCode(field.type || "—")} | ${required} | ${inlineCode(field.defaultValue || "—")} | ${escapeCell(field.comment)} |`,
    );
  }
  return lines.join("\n");
};

const renderEventTable = (fields) => {
  if (!fields.length) {
    return "无独立事件；原生事件按 `$attrs` 透传。";
  }
  const lines = ["| 事件 | 载荷 | 说明 |", "| --- | --- | --- |"];
  for (const field of fields) {
    lines.push(`| ${inlineCode(field.name)} | ${inlineCode(field.type || "—")} | ${escapeCell(field.comment)} |`);
  }
  return lines.join("\n");
};

const renderSlotTable = (slots, notes) => {
  if (!slots.length && !notes.length) {
    return "默认插槽。";
  }
  const lines = [];
  if (slots.length) {
    lines.push("| 插槽 | 作用域 | 说明 |", "| --- | --- | --- |");
    for (const slot of slots) {
      const name = typeof slot === "string" ? slot : slot.name;
      const props = typeof slot === "string" ? "" : (slot.props ?? []).join(", ");
      const type = typeof slot === "string" ? "" : slot.type;
      const comment = typeof slot === "string" ? "" : slot.comment;
      lines.push(
        `| ${inlineCode(name)} | ${inlineCode(props || type || "—")} | ${escapeCell(comment)} |`,
      );
    }
  }
  for (const note of notes ?? []) {
    lines.push("", escapeProse(note));
  }
  return lines.join("\n");
};

const renderMethodTable = (methods) => {
  if (!methods.length) {
    return "无 `defineExpose`。";
  }
  const lines = ["| 方法 | 签名 | 说明 |", "| --- | --- | --- |"];
  for (const method of methods) {
    const name = typeof method === "string" ? method : method.name;
    const type = typeof method === "string" ? "" : method.type;
    const comment = typeof method === "string" ? "" : method.comment;
    lines.push(`| ${inlineCode(name)} | ${inlineCode(type || "—")} | ${escapeCell(comment)} |`);
  }
  return lines.join("\n");
};

const relativeRepoPath = (rootDir, filePath) => {
  if (!filePath) {
    return "";
  }
  return path.relative(rootDir, filePath).replaceAll("\\", "/");
};

const renderComponentBody = (rootDir, item, { headingLevel = 3, showDemo = true } = {}) => {
  const lines = [];
  const source = relativeRepoPath(rootDir, item.sourcePath);
  if (item.summary) {
    lines.push(escapeProse(item.summary), "");
  }
  lines.push(
    `- **导入**：全局注册 ${inlineCode(item.name)}${source ? `；源码 ${inlineCode(source)}` : ""}。`,
  );
  if (item.rootTag) {
    lines.push(
      `- **根节点**：${inlineCode(item.rootTag)}${item.rootTag.startsWith("el-") ? "（Element Plus 通用属性见[官方文档](https://element-plus.org/zh-CN/)）" : ""}。`,
    );
  }
  if (!item.inheritAttrs) {
    lines.push("- **透传**：`inheritAttrs: false`，原生属性由组件内部挂到具体节点。");
  }
  lines.push("", `${"#".repeat(headingLevel)} Props`, "", renderFieldTable(item.propFields, "prop"), "");
  lines.push(`${"#".repeat(headingLevel)} 事件`, "", renderEventTable(item.eventFields), "");
  lines.push(`${"#".repeat(headingLevel)} 插槽`, "", renderSlotTable(item.slots, item.slotNotes), "");
  lines.push(`${"#".repeat(headingLevel)} 公开方法`, "", renderMethodTable(item.methods), "");
  if (item.relatedTypes?.length) {
    lines.push(`${"#".repeat(headingLevel)} 关联类型`, "");
    for (const related of item.relatedTypes) {
      const relatedSource = relativeRepoPath(rootDir, related.sourcePath);
      const extendsText = related.extendsClause ? ` ${inlineCode(related.extendsClause)}` : "";
      const sourceText = relatedSource ? `（${inlineCode(relatedSource)}）` : "";
      lines.push(`**${inlineCode(related.name)}**${extendsText}${sourceText}`, "");
      if (related.jsdoc) {
        lines.push(escapeProse(related.jsdoc), "");
      }
      if (related.fields?.length) {
        lines.push(renderFieldTable(related.fields, "type"), "");
      }
    }
  }
  if (showDemo) {
    const demoId = DEMO_IDS[item.name];
    if (demoId) {
      lines.push(`<DemoFrame demo-id="${demoId}" />`, "");
    } else {
      lines.push("- **限制**：需要完整 App / 网络 / 布局上下文时，不在文档 iframe 独立运行。", "");
    }
  }
  return lines;
};

const writeComponents = (rootDir, generatedDir) => {
  const components = extractComponentDocs(rootDir);
  const lines = [
    "# 组件参考",
    "",
    "公开 UI 组件由 `@ingot/admin-core` 的 `coreGlobalComponents` 注册为全局 `In*`（个别历史名为无前缀）。页面中可直接使用。",
    "",
    "下列 Props、事件、插槽、公开方法与关联类型从当前源码的 `defineProps` / `defineModel` / `defineEmits` / `defineSlots` / `defineExpose` 及同文件或相对导入的类型声明生成。第三方 Element Plus 通用 API 见 [官方文档](https://element-plus.org/zh-CN/)。",
    "",
    "可独立运行的组件在 [在线示例](/examples) 嵌入 iframe；依赖完整外壳、网络或上传的组件只给源码契约。",
    "",
  ];
  for (const item of components) {
    lines.push(`## ${item.name} {#${vitepressSlug(item.name)}}`, "");
    lines.push(...renderComponentBody(rootDir, item));
  }
  fs.mkdirSync(path.join(generatedDir, "reference"), { recursive: true });
  fs.writeFileSync(path.join(generatedDir, "reference/components.md"), `${lines.join("\n")}\n`);
  return components.map((item) => vitepressSlug(item.name));
};

const writeModules = (rootDir, generatedDir) => {
  const exports = listPackageValueExports(rootDir);
  const lines = [
    "# 公共能力",
    "",
    "下列符号来自各公共包 `package.json` `exports` 再导出链。说明优先使用源码 JSDoc；没有注释时给出从源码截取的签名。interface / type 会展开可分析的字段。",
    "",
    "第三方库（Vue、Element Plus、Pinia、Vue Router）只说明框架接入差异，通用 API 见其官方文档。",
    "",
    "- 运行时接入见 [运行时](/guide/runtime) 与 [App 开发](/guide/app)",
    "- 网络见 [网络](/guide/network)",
    "- 加密见 [加密](/guide/crypto)",
    "- 主题见 [主题开发](/guide/theme)",
    "",
  ];
  const grouped = new Map();
  for (const item of assignModuleAnchors(exports)) {
    const key = `${item.packageName} ${item.entry}`;
    const list = grouped.get(key) ?? [];
    list.push(item);
    grouped.set(key, list);
  }
  const usedHeadings = new Set();
  for (const [group, items] of grouped) {
    const [packageName, entry] = group.split(" ");
    const importPath = entry === "." ? packageName : `${packageName}/${entry.replace(/^\.\//, "")}`;
    lines.push(`## ${importPath} {#${vitepressSlug(importPath)}}`, "");
    usedHeadings.add(vitepressSlug(importPath));
    for (const item of items.sort((a, b) => a.name.localeCompare(b.name))) {
      usedHeadings.add(item.anchor);
      const source = relativeRepoPath(rootDir, item.filePath);
      lines.push(`### ${item.name} {#${item.anchor}}`, "");
      lines.push(`- **包**：${inlineCode(importPath)}`);
      lines.push(`- **种类**：${escapeHtml(item.kind)}`);
      if (source) {
        lines.push(`- **源码**：${inlineCode(source)}`);
      }
      lines.push("");
      if (item.jsdoc) {
        lines.push(escapeProse(item.jsdoc), "");
      }
      if (item.fields?.length) {
        lines.push(renderFieldTable(item.fields, "type"), "");
      }
      const skipSignature = item.kind === "interface" && item.fields?.length;
      if (item.signature && !skipSignature) {
        lines.push(fence("ts", item.signature), "");
      }
    }
  }
  fs.writeFileSync(path.join(generatedDir, "reference/modules.md"), `${lines.join("\n")}\n`);
  return [...usedHeadings];
};

const writePlugins = (rootDir, generatedDir) => {
  const plugins = listOfficialPluginPages(rootDir);
  const lines = [
    "# 官方插件",
    "",
    "四个官方源码插件默认由 `apps/admin` 全量注册。create 向导默认全选，可全部取消。未选择的插件不得进入 App 模块图。插件没有独立 production build。",
    "",
    "接入：宿主 `package.json` 依赖 + `src/plugins.ts` 导入 + `vite.config.ts` `officialPlugins`。官方插件不得互相依赖。页面说明取自各 `IndexPage` 的 `in-page-header`；域组件取自 `src/components/global.ts`。",
    "",
  ];
  for (const plugin of plugins) {
    lines.push(`## ${plugin.packageName} {#${vitepressSlug(plugin.packageName)}}`, "");
    lines.push(`- **导出名**：${inlineCode(plugin.exportName)}`);
    lines.push(`- **插件 id**：${inlineCode(plugin.pluginId)}`);
    lines.push(`- **目录**：${inlineCode(plugin.dir)}`);
    lines.push(`- **canonical prefix**：${inlineCode(plugin.canonicalPrefix ?? plugin.id)}`);
    if (plugin.apiVersion) {
      lines.push(`- **apiVersion**：${inlineCode(plugin.apiVersion)}`);
    }
    lines.push(
      `- **依赖**：${plugin.dependsOn.length ? plugin.dependsOn.map((item) => inlineCode(item)).join("、") : inlineCode("ingot-admin-core")}`,
    );
    lines.push("");
    lines.push("| 页面 | 标题 | canonical | 说明 |");
    lines.push("| --- | --- | --- | --- |");
    for (const page of plugin.pages) {
      lines.push(
        `| ${inlineCode(page.path)} | ${escapeCell(page.title || "—")} | ${inlineCode(page.canonical)} | ${escapeCell(page.description)} |`,
      );
    }
    lines.push("", "菜单 `view_path` 必须与 canonical 对齐。关闭 App Demo 不影响本插件页面。", "");
    if (plugin.components?.length) {
      lines.push("### 域内全局组件", "");
      for (const component of plugin.components) {
        lines.push(`#### ${component.name} {#${vitepressSlug(`${plugin.exportName}-${component.name}`)}}`, "");
        lines.push(...renderComponentBody(rootDir, component, { headingLevel: 5, showDemo: false }));
      }
    }
  }
  fs.writeFileSync(path.join(generatedDir, "reference/plugins.md"), `${lines.join("\n")}\n`);
  return plugins.map((item) => vitepressSlug(item.packageName));
};

export const firstUnsafeVueTag = (markdown) => {
  for (const match of markdown.matchAll(/<\/?([A-Za-z][\w:-]*)/g)) {
    if (!SAFE_TAGS.has(match[1])) {
      return match[0];
    }
  }
  return "";
};

export const writeGeneratedReference = (rootDir, generatedDir) => {
  fs.mkdirSync(path.join(generatedDir, "reference"), { recursive: true });
  return {
    componentAnchors: writeComponents(rootDir, generatedDir),
    moduleAnchors: writeModules(rootDir, generatedDir),
    pluginAnchors: writePlugins(rootDir, generatedDir),
  };
};
