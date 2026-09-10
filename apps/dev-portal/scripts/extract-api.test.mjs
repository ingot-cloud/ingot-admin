import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { extractVueApi } from "./extract-api.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const core = (...segments) => path.resolve(here, "../../../packages/admin-core/src/components", ...segments);
const hasName = (list, name) => list.some((item) => (item.name ?? item) === name);

test("extractVueApi 读取 InButton 的节流事件与 Props", () => {
  const api = extractVueApi(core("button/InButton.vue"));
  assert.equal(api.inheritAttrs, false);
  assert.equal(api.rootTag, "el-button");
  assert.ok(hasName(api.propFields, "loading"));
  assert.ok(hasName(api.eventFields, "in-click"));
  assert.ok(api.summary.includes("1200ms"));
  assert.ok(hasName(api.slots, "icon"));
  assert.ok(hasName(api.slots, "default"));
});

test("extractVueApi 展开 InTableProps 并读取公开方法", () => {
  const api = extractVueApi(core("table/InTable.vue"));
  assert.ok(hasName(api.propFields, "headers"));
  assert.ok(hasName(api.propFields, "treeColumn"));
  assert.ok(hasName(api.methods, "clearSelection"));
  assert.ok(hasName(api.methods, "toggleRowSelection"));
  const toggle = api.methods.find((item) => item.name === "toggleRowSelection");
  assert.ok(toggle?.type.includes("row"));
  assert.ok(hasName(api.slots, "tools-start"));
  assert.ok(!hasName(api.slots, "header"));
  assert.ok(api.slotNotes.some((note) => note.includes("headers[]")));
  assert.ok(api.relatedTypes.some((item) => item.name === "TableHeaderRecord"));
});

test("extractVueApi 读取 defineModel 与运行时 Props", () => {
  const drawer = extractVueApi(core("drawer/InDetailDrawer.vue"));
  assert.ok(hasName(drawer.propFields, "modelValue"));
  assert.ok(hasName(drawer.propFields, "tab"));
  assert.ok(hasName(drawer.propFields, "editing"));
  assert.ok(hasName(drawer.eventFields, "update:modelValue"));
  assert.ok(hasName(drawer.eventFields, "update:tab"));
  assert.ok(hasName(drawer.slots, "identity"));

  const select = extractVueApi(core("select/InSelect.vue"));
  assert.ok(hasName(select.propFields, "modelValue"));
  assert.ok(hasName(select.propFields, "split"));
  assert.ok(hasName(select.propFields, "options"));
  assert.ok(hasName(select.eventFields, "onChanged"));
  assert.ok(hasName(select.eventFields, "update:modelValue"));
});

test("extractVueApi 读取 defineExpose 方法签名", () => {
  const api = extractVueApi(core("form/InForm.vue"));
  assert.ok(hasName(api.methods, "validate"));
  assert.ok(hasName(api.methods, "resetFields"));
  assert.ok(api.methods.find((item) => item.name === "validate")?.type.includes("fn"));
});

test("生成的参考 Markdown 不含会被 Vue 当成标签的 <Type>", async () => {
  const os = await import("node:os");
  const fs = await import("node:fs");
  const { createRequire } = await import("node:module");
  const { writeGeneratedReference, firstUnsafeVueTag } = await import("./generate-reference.mjs");
  const require = createRequire(import.meta.url);
  const sfc = require("../../../node_modules/.pnpm/@vue+compiler-sfc@3.5.42/node_modules/@vue/compiler-sfc/dist/compiler-sfc.cjs.js");
  const rootDir = path.resolve(here, "../../..");
  const generatedDir = fs.mkdtempSync(path.join(os.tmpdir(), "ingot-ref-"));
  try {
    writeGeneratedReference(rootDir, generatedDir);
    for (const name of ["components.md", "modules.md", "plugins.md"]) {
      const markdown = fs.readFileSync(path.join(generatedDir, "reference", name), "utf8");
      assert.equal(firstUnsafeVueTag(markdown), "", name);
      assert.ok(!markdown.includes("export function getDiff<T"), name);
      const wrapped = `<template><div>\n${markdown}\n</div></template>`;
      const { errors } = sfc.parse(wrapped, { filename: name });
      const fatal = errors.filter((error) => String(error.message).includes("missing end tag"));
      assert.equal(fatal.length, 0, `${name}: ${fatal[0]?.message ?? ""}`);
    }
    const modules = fs.readFileSync(path.join(generatedDir, "reference/modules.md"), "utf8");
    const getDiffSection = modules.split("### getDiff {#getdiff}")[1]?.split("### ")[0] ?? "";
    assert.ok(getDiffSection.includes("getDiff"), "getDiff 签名应出现");
    assert.ok(!getDiffSection.includes("export function equals"), "getDiff 说明不应吞掉同文件其它函数");
  } finally {
    fs.rmSync(generatedDir, { recursive: true, force: true });
  }
});
