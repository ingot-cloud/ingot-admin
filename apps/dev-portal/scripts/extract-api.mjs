import fs from "node:fs";
import path from "node:path";

const CORE_COMPONENTS = "packages/admin-core/src/components/coreComponents.ts";
const SKIP_EXPORT_NAMES = new Set(["default"]);
const MAX_TYPE_CHARS = 8000;
const SKIP_RELATED_TYPES = new Set([
  "Array",
  "Record",
  "Partial",
  "Pick",
  "Omit",
  "Required",
  "Readonly",
  "Promise",
  "Map",
  "Set",
  "Date",
  "Function",
  "Boolean",
  "String",
  "Number",
  "Object",
  "Symbol",
  "Error",
  "RegExp",
  "Component",
  "PropType",
  "Ref",
  "ComputedRef",
  "VNode",
  "CSSProperties",
  "HTMLElement",
  "MouseEvent",
  "KeyboardEvent",
  "Event",
  "ComponentPublicInstance",
  "TableInstance",
  "TableColumnCtx",
  "Option",
  "Unknown",
]);

const compactText = (text, max = 500) => {
  const value = String(text ?? "")
    .replace(/\s+/g, " ")
    .trim();
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max)}…`;
};

export const vitepressSlug = (text) =>
  String(text)
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-");

export const DEMO_IDS = {
  InButton: "in-button",
  InButtonEdit: "in-button",
  InButtonDelete: "in-button",
  InTitle: "in-title",
  InTag: "in-tag",
  InTable: "in-table",
  InPicker: "in-table",
  InFilterPanel: "in-table",
  InTableActions: "in-table",
};

const isTestFile = (filePath) => /\.test\.(ts|js|mjs|tsx)$/.test(filePath);

const readIfFile = (filePath) => {
  if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return "";
  }
  return fs.readFileSync(filePath, "utf8");
};

const skipString = (source, start) => {
  const quote = source[start];
  let index = start + 1;
  while (index < source.length) {
    const char = source[index];
    if (char === "\\") {
      index += 2;
      continue;
    }
    if (char === quote) {
      return index + 1;
    }
    index += 1;
  }
  return source.length;
};

export const readBalanced = (source, openIndex) => {
  const pairs = { "{": "}", "(": ")", "[": "]", "<": ">" };
  const open = source[openIndex];
  const close = pairs[open];
  if (!close) {
    return "";
  }
  let depth = 0;
  let index = openIndex;
  while (index < source.length) {
    const char = source[index];
    if (char === "'" || char === '"' || char === "`") {
      index = skipString(source, index);
      continue;
    }
    if (char === "/" && source[index + 1] === "/") {
      const end = source.indexOf("\n", index);
      index = end === -1 ? source.length : end + 1;
      continue;
    }
    if (char === "/" && source[index + 1] === "*") {
      const end = source.indexOf("*/", index + 2);
      index = end === -1 ? source.length : end + 2;
      continue;
    }
    if (char === open) {
      depth += 1;
    } else if (char === close) {
      depth -= 1;
      if (depth === 0) {
        return source.slice(openIndex, index + 1);
      }
    }
    index += 1;
  }
  return source.slice(openIndex);
};

const extractJsDocBefore = (source, index) => {
  if (index < 0) {
    return "";
  }
  const before = source.slice(0, index).replace(/(?:export\s+)?(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*=\s*$/, "");
  const start = before.lastIndexOf("/**");
  if (start === -1) {
    return "";
  }
  const tail = before.slice(start);
  const match = tail.match(/^\/\*\*([\s\S]*?)\*\/\s*$/);
  if (!match) {
    return "";
  }
  return match[1]
    .split("\n")
    .map((line) => line.replace(/^\s*\*\s?/, "").trimEnd())
    .join("\n")
    .trim();
};

const splitSfc = (source) => {
  const template = source.match(/<template[\s\S]*?<\/template>/i)?.[0] ?? "";
  const script = [...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1]).join("\n");
  return { template, script };
};

const slotAttrProps = (attrs) => {
  const names = [];
  for (const match of attrs.matchAll(/(?:^|\s)(?::|v-bind:)?([A-Za-z_][\w-]*)=/g)) {
    const name = match[1];
    if (name === "name" || name.startsWith("v-") || name === "key") {
      continue;
    }
    names.push(name);
  }
  return [...new Set(names)];
};

const mergeSlot = (slots, next) => {
  const current = slots.get(next.name) ?? { name: next.name, type: "", comment: "", props: [] };
  current.type = current.type || next.type || "";
  current.comment = current.comment || next.comment || "";
  current.props = [...new Set([...(current.props ?? []), ...(next.props ?? [])])];
  slots.set(next.name, current);
};

const parseTypeFields = (body) => {
  const inner = body.trim().startsWith("{") ? body.trim().slice(1, -1) : body;
  const fields = [];
  let index = 0;
  let current = "";
  let comment = "";
  const flush = () => {
    const text = current.trim().replace(/[,;]$/, "");
    current = "";
    if (!text || text.startsWith("...") ) {
      comment = "";
      return;
    }
    const callEmit = text.match(
      /^\(\s*(?:e|event)\s*:\s*['"]([^'"]+)['"]\s*(?:,\s*([\s\S]*?))?\s*\)\s*(?::\s*([\s\S]+))?$/,
    );
    if (callEmit) {
      const payload = compactText(callEmit[2] ?? "");
      fields.push({
        name: callEmit[1],
        optional: false,
        type: payload ? `[${payload}]` : "[]",
        comment: comment.trim(),
      });
      comment = "";
      return;
    }
    const methodMatch = text.match(
      /^(?:async\s+)?(?:readonly\s+)?([A-Za-z_$][\w$]*)(\?)?\s*(\([\s\S]*\))\s*(?::\s*([\s\S]+))?$/,
    );
    if (methodMatch && !/^[A-Za-z_$][\w$]*\??\s*:/.test(text)) {
      const params = compactText(methodMatch[3]);
      const returns = compactText((methodMatch[4] ?? "void").replace(/\{[\s\S]*$/, "").trim() || "void");
      fields.push({
        name: methodMatch[1],
        optional: Boolean(methodMatch[2]),
        type: `${params} => ${returns}`,
        comment: comment.trim(),
      });
      comment = "";
      return;
    }
    const fieldMatch = text.match(/^(?:readonly\s+)?(?:'([^']+)'|"([^"]+)"|([A-Za-z_$][\w$]*))(\?)?\s*(?::([\s\S]+))?$/);
    if (!fieldMatch) {
      comment = "";
      return;
    }
    fields.push({
      name: fieldMatch[1] || fieldMatch[2] || fieldMatch[3],
      optional: Boolean(fieldMatch[4]),
      type: compactText(fieldMatch[5] ?? ""),
      comment: comment.trim(),
    });
    comment = "";
  };
  while (index < inner.length) {
    const char = inner[index];
    if (char === "/" && inner[index + 1] === "*") {
      const end = inner.indexOf("*/", index + 2);
      const block = inner.slice(index, end === -1 ? inner.length : end + 2);
      if (block.startsWith("/**")) {
        comment = block.replace(/^\/\*\*/, "").replace(/\*\/$/, "").replace(/^\s*\*\s?/gm, "").trim();
      }
      index = end === -1 ? inner.length : end + 2;
      continue;
    }
    if (char === "/" && inner[index + 1] === "/") {
      const end = inner.indexOf("\n", index);
      index = end === -1 ? inner.length : end + 1;
      continue;
    }
    if (char === "'" || char === '"' || char === "`") {
      const next = skipString(inner, index);
      current += inner.slice(index, next);
      index = next;
      continue;
    }
    if ("<{[(".includes(char)) {
      if (char === "{" && /(?:\)|=>)\s*$/.test(current)) {
        index += readBalanced(inner, index).length;
        flush();
        continue;
      }
      const block = readBalanced(inner, index);
      current += block;
      index += block.length;
      continue;
    }
    if (char === ";" || char === "," || char === "\n") {
      current += char === "\n" ? "" : "";
      if (char === ";" || char === "," || /[}\w?'"]\s*$/.test(current)) {
        flush();
      } else if (char === "\n") {
        current += char;
      }
      index += 1;
      continue;
    }
    current += char;
    index += 1;
  }
  flush();
  return fields;
};

const findTypeDeclaration = (source, typeName) => {
  const patterns = [
    new RegExp(`(?:export\\s+)?(?:type)\\s+${typeName}\\s*=\\s*`, "m"),
    new RegExp(`(?:export\\s+)?(?:interface)\\s+${typeName}\\b([^{]*)\\{`, "m"),
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(source);
    if (!match) {
      continue;
    }
    const start = match.index + match[0].length - (match[0].endsWith("{") ? 1 : 0);
    const extendsClause = String(match[1] ?? "");
    const extendsNames = [...extendsClause.matchAll(/\bextends\s+([\s\S]*)/g)]
      .flatMap((item) =>
        [...item[1].matchAll(/[A-Za-z_$][\w$]*/g)]
          .map((name) => name[0])
          .filter((name) => !SKIP_RELATED_TYPES.has(name)),
      );
    if (source[start] === "{") {
      const body = readBalanced(source, start);
      return {
        body,
        extendsNames,
        extendsClause: extendsClause.replace(/^\s*/, "").trim(),
        jsdoc: extractJsDocBefore(source, match.index),
      };
    }
    let index = start;
    let depth = 0;
    while (index < source.length) {
      const char = source[index];
      if (char === "'" || char === '"' || char === "`") {
        index = skipString(source, index);
        continue;
      }
      if ("<{[(".includes(char)) {
        const block = readBalanced(source, index);
        index += block.length;
        continue;
      }
      if (char === ";" && depth === 0) {
        break;
      }
      index += 1;
    }
    const alias = source.slice(start, index).trim();
    if (alias.startsWith("{")) {
      return {
        body: readBalanced(alias, 0),
        extendsNames,
        extendsClause: "",
        jsdoc: extractJsDocBefore(source, match.index),
      };
    }
    const aliasNames = [...alias.matchAll(/(?:^|&)\s*([A-Za-z_$][\w$]*)/g)]
      .map((item) => item[1])
      .filter((name) => !SKIP_RELATED_TYPES.has(name));
    return {
      body: alias.startsWith("{") ? alias : "{}",
      extendsNames: aliasNames,
      extendsClause: alias,
      jsdoc: extractJsDocBefore(source, match.index),
    };
  }
  return null;
};

const resolveImportedName = (filePath, source, typeName) => {
  const importMatch = source.match(
    new RegExp(`import\\s+type\\s*\\{([^}]*\\b${typeName}\\b[^}]*)\\}\\s*from\\s*["']([^"']+)["']`),
  ) || source.match(new RegExp(`import\\s*\\{([^}]*\\b${typeName}\\b[^}]*)\\}\\s*from\\s*["']([^"']+)["']`));
  if (!importMatch) {
    return null;
  }
  const specifier = importMatch[2];
  if (!specifier.startsWith(".")) {
    return null;
  }
  const resolved = resolveSourceFile(path.resolve(path.dirname(filePath), specifier));
  if (!resolved) {
    return null;
  }
  return { filePath: resolved, source: readIfFile(resolved) };
};

const collectTypeFields = (filePath, source, typeName, seen = new Set()) => {
  const key = `${filePath}:${typeName}`;
  if (!typeName || seen.has(key)) {
    return [];
  }
  seen.add(key);
  const local = findTypeDeclaration(source, typeName);
  if (local) {
    const fields = parseTypeFields(local.body);
    for (const parent of local.extendsNames) {
      fields.unshift(...collectTypeFields(filePath, source, parent, seen));
    }
    return fields;
  }
  const imported = resolveImportedName(filePath, source, typeName);
  if (!imported) {
    return [];
  }
  return collectTypeFields(imported.filePath, imported.source, typeName, seen);
};

const parseObjectDefaults = (text) => {
  const defaults = {};
  if (!text) {
    return defaults;
  }
  const body = text.trim().startsWith("{") ? text.trim() : `{${text}}`;
  for (const field of parseTypeFields(body)) {
    defaults[field.name] = field.type || field.comment;
  }
  return defaults;
};

const findConstObject = (source, name) => {
  const match = source.match(new RegExp(`(?:export\\s+)?const\\s+${name}\\s*=\\s*\\{`));
  if (!match || match.index === undefined) {
    return "";
  }
  return readBalanced(source, match.index + match[0].length - 1);
};

const collectSlots = (filePath, template, script) => {
  const slots = new Map();
  const notes = [];
  const slotsCall = extractCallGenericOrObject(script, "defineSlots");
  if (slotsCall.generic.startsWith("{")) {
    for (const field of parseTypeFields(slotsCall.generic)) {
      mergeSlot(slots, { ...field, props: [] });
    }
  } else if (slotsCall.generic) {
    const typeName = slotsCall.generic.match(/^([A-Za-z_$][\w$]*)/)?.[1];
    if (typeName) {
      for (const field of collectTypeFields(filePath, script, typeName)) {
        mergeSlot(slots, { ...field, props: [] });
      }
    }
  }
  for (const match of template.matchAll(/<slot\b([^>]*)>/g)) {
    const attrs = match[1];
    const staticName = attrs.match(/(?:^|\s)name=["']([^"']+)["']/);
    const dynamicName = attrs.match(/(?:^|\s):name=["']([^"']+)["']/) || attrs.match(/(?:^|\s):name="([^"]+)"/);
    const rawName = staticName?.[1] ?? "";
    const dynamicExpr = dynamicName?.[1] ?? "";
    const expr = dynamicExpr || (/[.`$]/.test(rawName) ? rawName : "");
    if (expr && (expr.includes("item.prop") || expr.includes("${") || expr.includes("`"))) {
      if (/item\.prop/.test(expr) && /header/.test(expr)) {
        notes.push("列头插槽名等于 `${headers[].prop}-header`，作用域含列配置 `item`。");
      } else if (/item\.prop/.test(expr)) {
        notes.push("单元格插槽名等于 `headers[].prop`，作用域含行数据 `item` 与 `index`。");
      } else {
        notes.push(`动态插槽：\`${compactText(expr, 120)}\``);
      }
      continue;
    }
    mergeSlot(slots, {
      name: rawName || "default",
      type: "",
      comment: "",
      props: slotAttrProps(attrs),
    });
  }
  return { slots: [...slots.values()], notes: [...new Set(notes)] };
};

const parseRuntimePropField = (field) => {
  const type = field.type || "";
  if (!type.startsWith("{") || !/\btype\s*:/.test(type)) {
    return field;
  }
  const propType = type.match(/PropType\s*<\s*([\s\S]+?)\s*>/);
  const runtimeType = type.match(/\btype\s*:\s*([^,}\n]+)/);
  const required = /\brequired\s*:\s*true\b/.test(type);
  let defaultValue = field.defaultValue ?? "";
  const defaultAssign = type.match(/\bdefault\s*:\s*([^,}\n]+)/);
  if (defaultAssign) {
    defaultValue = compactText(defaultAssign[1]);
  } else if (/\bdefault\s*\(/.test(type)) {
    defaultValue = "工厂函数";
  }
  return {
    ...field,
    type: compactText(propType?.[1] ?? runtimeType?.[1] ?? type),
    optional: required ? false : field.optional !== false,
    defaultValue,
  };
};

const extractDefineModels = (script) => {
  const models = [];
  const matcher = /\bdefineModel\b/g;
  let match = matcher.exec(script);
  while (match) {
    const call = extractCallGenericOrObject(script.slice(match.index), "defineModel");
    const args = call.object.startsWith("(") ? call.object.slice(1, -1).trim() : "";
    let name = "modelValue";
    let optionsText = "";
    const named = args.match(/^['"]([^'"]+)['"]/);
    if (named) {
      name = named[1];
      const comma = args.indexOf(",", named[0].length);
      if (comma !== -1) {
        optionsText = args.slice(comma + 1).trim();
      }
    } else if (args.startsWith("{")) {
      optionsText = args;
    }
    const optionMap = Object.fromEntries(
      (optionsText.startsWith("{") ? parseTypeFields(optionsText) : []).map((item) => [item.name, item.type]),
    );
    models.push({
      name,
      type: compactText(call.generic || optionMap.type || "unknown"),
      optional: !/^\s*true\s*$/.test(optionMap.required ?? ""),
      defaultValue: compactText(optionMap.default ?? ""),
      comment: `defineModel 双向绑定，事件 \`update:${name}\``,
    });
    const consumed = Math.max(call.object.length, 12);
    matcher.lastIndex = match.index + "defineModel".length + consumed;
    match = matcher.exec(script);
  }
  return models;
};

const collectRelatedTypes = (filePath, source, fields) => {
  const names = new Set();
  for (const field of fields) {
    for (const match of String(field.type ?? "").matchAll(/\b([A-Z][A-Za-z0-9]*)\b/g)) {
      if (!SKIP_RELATED_TYPES.has(match[1])) {
        names.add(match[1]);
      }
    }
  }
  const related = [];
  for (const name of names) {
    const fieldsOfType = collectTypeFields(filePath, source, name);
    const local = findTypeDeclaration(source, name);
    const imported = local ? null : resolveImportedName(filePath, source, name);
    const decl = local ?? (imported ? findTypeDeclaration(imported.source, name) : null);
    if (fieldsOfType.length === 0) {
      continue;
    }
    related.push({
      name,
      jsdoc: decl?.jsdoc ?? "",
      extendsClause: decl?.extendsClause ?? "",
      fields: fieldsOfType,
      sourcePath: imported?.filePath || filePath,
    });
    if (related.length >= 16) {
      break;
    }
  }
  return related;
};

const extractExposeMembers = (filePath, script) => {
  const call = extractCallGenericOrObject(script, "defineExpose");
  const members = new Map();
  const typeName = call.generic.match(/^([A-Za-z_$][\w$]*)/)?.[1];
  if (typeName) {
    for (const field of collectTypeFields(filePath, script, typeName)) {
      members.set(field.name, {
        name: field.name,
        type: field.type,
        comment: field.comment,
      });
    }
  }
  const object = call.object.startsWith("(") ? call.object.slice(1, -1).trim() : call.object;
  if (object.startsWith("{")) {
    for (const field of parseTypeFields(object)) {
      const current = members.get(field.name) ?? { name: field.name, type: "", comment: "" };
      members.set(field.name, {
        name: field.name,
        type: current.type || compactText(field.type, 240),
        comment: current.comment || field.comment,
      });
    }
  }
  return [...members.values()];
};

const collectRootTag = (template) => {
  const cleaned = template.replace(/<!--[\s\S]*?-->/g, "");
  return cleaned.match(/<template\b[^>]*>\s*<([A-Za-z][\w-]*)/)?.[1] ?? "";
};

const extractCallGenericOrObject = (script, callee) => {
  const match = script.match(new RegExp(`${callee}\\s*(<|\\()`));
  if (!match || match.index === undefined) {
    return { generic: "", object: "" };
  }
  const tokenIndex = match.index + callee.length;
  const next = script.slice(tokenIndex).match(/^\s*[<(]/);
  if (!next) {
    return { generic: "", object: "" };
  }
  const openIndex = tokenIndex + next[0].length - 1;
  if (script[openIndex] === "<") {
    const generic = readBalanced(script, openIndex);
    const after = script.slice(openIndex + generic.length).match(/^\s*\(/);
    const object = after ? readBalanced(script, openIndex + generic.length + after[0].length - 1) : "";
    return { generic: generic.slice(1, -1).trim(), object };
  }
  return { generic: "", object: readBalanced(script, openIndex) };
};

export const resolveSourceFile = (target) => {
  const normalized = target.replace(/\.js$/, "");
  const candidates = [
    target,
    normalized,
    `${normalized}.vue`,
    `${normalized}.ts`,
    `${normalized}.tsx`,
    `${normalized}.d.ts`,
    path.join(normalized, "index.ts"),
    path.join(normalized, "index.tsx"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return "";
};

export const listGlobalComponents = (rootDir) => {
  const source = fs.readFileSync(path.join(rootDir, CORE_COMPONENTS), "utf8");
  const names = [];
  const start = source.indexOf("export const coreGlobalComponents");
  const block = source.slice(start, source.indexOf("};", start));
  for (const match of block.matchAll(/^\s+([A-Z][A-Za-z0-9]+),/gm)) {
    names.push(match[1]);
  }
  return names;
};

export const componentFileMap = (rootDir) => {
  const source = fs.readFileSync(path.join(rootDir, CORE_COMPONENTS), "utf8");
  const map = new Map();
  for (const match of source.matchAll(/import\s+(\w+)\s+from\s+["']([^"']+)["']/g)) {
    map.set(match[1], path.resolve(path.join(rootDir, "packages/admin-core/src/components"), match[2]));
  }
  return map;
};

const unwrapCallArg = (object) => {
  let text = String(object ?? "").trim();
  if (text.startsWith("(") && text.endsWith(")")) {
    text = text.slice(1, -1).trim();
  }
  return text;
};

const collectPropFields = (filePath, script, propGeneric, propObject) => {
  if (propGeneric.startsWith("{")) {
    return parseTypeFields(propGeneric);
  }
  if (propGeneric) {
    const names = propGeneric.split("&").map((item) => item.trim().match(/^([A-Za-z_$][\w$]*)/)?.[1]).filter(Boolean);
    if (names.length) {
      return names.flatMap((name) => collectTypeFields(filePath, script, name));
    }
  }
  const runtime = unwrapCallArg(propObject);
  if (runtime.startsWith("{")) {
    return parseTypeFields(runtime).map((field) => parseRuntimePropField({ ...field, optional: true }));
  }
  return [];
};

export const extractVueApi = (filePath) => {
  const source = readIfFile(filePath);
  if (!source) {
    return {
      summary: "",
      inheritAttrs: true,
      rootTag: "",
      propFields: [],
      eventFields: [],
      slots: [],
      slotNotes: [],
      methods: [],
      relatedTypes: [],
      sourcePath: filePath,
    };
  }
  const { template, script } = splitSfc(source);
  const optionsMatch = script.match(/defineOptions\(\s*\{([\s\S]*?)\}\s*\)/);
  const inheritAttrs = !/inheritAttrs\s*:\s*false/.test(optionsMatch?.[1] ?? "");
  const jsdocs = [
    extractJsDocBefore(script, script.search(/\bdefineProps\b/)),
    extractJsDocBefore(script, script.search(/\bdefineEmits\b/)),
    extractJsDocBefore(script, script.search(/\bdefineOptions\b/)),
  ].filter(Boolean);
  const summary = [...new Set(jsdocs)].join("\n\n");
  const withDefaults = script.match(/withDefaults\s*\(\s*defineProps/);
  let propGeneric = "";
  let propObject = "";
  let defaultsText = "";
  if (withDefaults) {
    const propsCall = extractCallGenericOrObject(script.slice(withDefaults.index + "withDefaults".length), "defineProps");
    propGeneric = propsCall.generic;
    propObject = propsCall.object;
    const defaultsMatch = script.slice(withDefaults.index).match(/withDefaults\s*\([\s\S]*?,\s*([A-Za-z_$][\w$]*|\{)/);
    if (defaultsMatch?.[1] === "{") {
      const brace = script.indexOf("{", withDefaults.index + defaultsMatch.index + defaultsMatch[0].lastIndexOf("{"));
      defaultsText = readBalanced(script, brace);
    } else if (defaultsMatch?.[1]) {
      defaultsText = findConstObject(script, defaultsMatch[1]);
      if (!defaultsText) {
        const imported = resolveImportedName(filePath, script, defaultsMatch[1]);
        if (imported) {
          defaultsText = findConstObject(imported.source, defaultsMatch[1]);
        }
      }
    }
  } else {
    const propsCall = extractCallGenericOrObject(script, "defineProps");
    propGeneric = propsCall.generic;
    propObject = propsCall.object;
  }
  const defaults = parseObjectDefaults(defaultsText);
  const models = extractDefineModels(script);
  const propByName = new Map();
  for (const field of collectPropFields(filePath, script, propGeneric, propObject)) {
    propByName.set(field.name, {
      ...field,
      defaultValue: defaults[field.name] ?? field.defaultValue ?? "",
    });
  }
  for (const model of models) {
    const current = propByName.get(model.name);
    propByName.set(model.name, {
      name: model.name,
      optional: model.optional,
      type: current?.type || model.type,
      comment: current?.comment || model.comment,
      defaultValue: current?.defaultValue || model.defaultValue,
    });
  }
  const propFields = [...propByName.values()];
  const emitsCall = extractCallGenericOrObject(script, "defineEmits");
  const eventByName = new Map();
  const emitArg = unwrapCallArg(emitsCall.object);
  if (emitsCall.generic.startsWith("{")) {
    for (const field of parseTypeFields(emitsCall.generic)) {
      eventByName.set(field.name, field);
    }
  } else if (emitArg.startsWith("[")) {
    for (const match of emitArg.matchAll(/["']([^"']+)["']/g)) {
      eventByName.set(match[1], { name: match[1], type: "", optional: false, comment: "" });
    }
  }
  for (const model of models) {
    const eventName = `update:${model.name}`;
    if (!eventByName.has(eventName)) {
      eventByName.set(eventName, {
        name: eventName,
        type: `[value: ${model.type || "unknown"}]`,
        optional: false,
        comment: "defineModel 更新",
      });
    }
  }
  const { slots, notes: slotNotes } = collectSlots(filePath, template, script);
  const methods = extractExposeMembers(filePath, script);
  const relatedTypes = collectRelatedTypes(filePath, script, [
    ...propFields,
    ...eventByName.values(),
    ...slots,
    ...methods,
  ]);
  return {
    summary,
    inheritAttrs,
    rootTag: collectRootTag(template),
    propFields,
    eventFields: [...eventByName.values()],
    slots,
    slotNotes,
    methods,
    relatedTypes,
    sourcePath: filePath,
  };
};

export const extractComponentDocs = (rootDir) => {
  const files = componentFileMap(rootDir);
  return listGlobalComponents(rootDir).map((name) => ({
    name,
    demo: Boolean(DEMO_IDS[name]),
    demoId: DEMO_IDS[name] ?? "",
    ...extractVueApi(files.get(name) ?? ""),
  }));
};

const sourceFromExportTarget = (packageDir, target) => {
  if (!target || target.endsWith(".css")) {
    return "";
  }
  let relative = target.replace(/^\.\//, "");
  relative = relative.replace(/^dist\//, "src/").replace(/\.d\.ts$/, ".ts").replace(/\.js$/, ".ts");
  return resolveSourceFile(path.join(packageDir, relative));
};

const listPackageEntryFiles = (packageDir, pkg) => {
  const entries = [];
  const exportsField = pkg.exports;
  if (!exportsField || typeof exportsField === "string") {
    const fallback = resolveSourceFile(path.join(packageDir, "src/index.ts"));
    if (fallback) {
      entries.push({ entry: ".", filePath: fallback });
    }
    return entries;
  }
  for (const [entry, value] of Object.entries(exportsField)) {
    const target = typeof value === "string" ? value : value?.types || value?.import || value?.default;
    const filePath = sourceFromExportTarget(packageDir, target);
    if (filePath && !isTestFile(filePath)) {
      entries.push({ entry, filePath });
    }
  }
  return entries;
};

const parseExportList = (list) => {
  const items = [];
  for (const part of list.split(",")) {
    const cleaned = part.trim();
    if (!cleaned) {
      continue;
    }
    const isType = cleaned.startsWith("type ");
    const rest = cleaned.replace(/^type\s+/, "");
    const alias = rest.split(/\s+as\s+/);
    const local = alias[0].trim();
    const exported = (alias[1] ?? alias[0]).trim();
    if (!exported || SKIP_EXPORT_NAMES.has(exported)) {
      continue;
    }
    items.push({ local, exported, isType });
  }
  return items;
};

const indexOfTopLevel = (source, from, target) => {
  let index = from;
  while (index < source.length) {
    const char = source[index];
    if (char === "'" || char === '"' || char === "`") {
      index = skipString(source, index);
      continue;
    }
    if (char === "/" && source[index + 1] === "/") {
      const end = source.indexOf("\n", index);
      index = end === -1 ? source.length : end + 1;
      continue;
    }
    if (char === "/" && source[index + 1] === "*") {
      const end = source.indexOf("*/", index + 2);
      index = end === -1 ? source.length : end + 2;
      continue;
    }
    if (char === "<" && /[A-Za-z_$]/.test(source[index + 1] ?? "") && char !== target) {
      index += readBalanced(source, index).length;
      continue;
    }
    if ((char === "(" || char === "[") && char !== target) {
      index += readBalanced(source, index).length;
      continue;
    }
    if (char === target) {
      return index;
    }
    index += 1;
  }
  return -1;
};

const findLocalSymbol = (filePath, source, name) => {
  const patterns = [
    { kind: "function", regex: new RegExp(`export\\s+(?:async\\s+)?function\\s+${name}\\b`) },
    { kind: "class", regex: new RegExp(`export\\s+class\\s+${name}\\b`) },
    { kind: "const", regex: new RegExp(`export\\s+const\\s+${name}\\b`) },
    { kind: "type", regex: new RegExp(`export\\s+type\\s+${name}\\b`) },
    { kind: "interface", regex: new RegExp(`export\\s+interface\\s+${name}\\b`) },
    { kind: "enum", regex: new RegExp(`export\\s+enum\\s+${name}\\b`) },
    { kind: "const", regex: new RegExp(`(?:export\\s+)?const\\s+${name}\\b`) },
    { kind: "function", regex: new RegExp(`(?:export\\s+)?(?:async\\s+)?function\\s+${name}\\b`) },
    { kind: "class", regex: new RegExp(`(?:export\\s+)?class\\s+${name}\\b`) },
    { kind: "type", regex: new RegExp(`(?:export\\s+)?type\\s+${name}\\b`) },
    { kind: "interface", regex: new RegExp(`(?:export\\s+)?interface\\s+${name}\\b`) },
    { kind: "enum", regex: new RegExp(`(?:export\\s+)?enum\\s+${name}\\b`) },
  ];
  for (const pattern of patterns) {
    const match = pattern.regex.exec(source);
    if (!match || match.index === undefined) {
      continue;
    }
    const jsdoc = extractJsDocBefore(source, match.index);
    let signature = source.slice(match.index).split("\n")[0].trim();
    const brace = indexOfTopLevel(source, match.index, "{");
    const paren = indexOfTopLevel(source, match.index, "(");
    if (pattern.kind === "interface" || pattern.kind === "enum" || pattern.kind === "class") {
      if (brace !== -1) {
        signature = source.slice(match.index, brace).replace(/\s+/g, " ").trim();
      }
    } else if (pattern.kind === "type") {
      const eq = source.indexOf("=", match.index);
      if (eq !== -1) {
        const rest = source.slice(eq + 1).trimStart();
        if (rest.startsWith("{") || rest.startsWith("(") || rest.startsWith("<")) {
          signature = `${source.slice(match.index, eq + 1).trim()} ${readBalanced(rest, 0)}`;
        } else {
          const end = source.indexOf("\n", eq);
          signature = source.slice(match.index, end === -1 ? eq + 120 : end).trim();
        }
      }
    } else if (pattern.kind === "function" || pattern.kind === "const") {
      if (paren !== -1 && (brace === -1 || paren < brace)) {
        const args = readBalanced(source, paren);
        const afterArgs = source.slice(paren + args.length, paren + args.length + 160).split("{")[0].split("=>")[0];
        signature = `${source.slice(match.index, paren)}${args}${afterArgs}`.replace(/\s+/g, " ").trim();
      } else if (brace !== -1 && pattern.kind === "const") {
        signature = `${source.slice(match.index, brace).trim()} { /* … */ }`;
      }
    }
    if (signature.length > MAX_TYPE_CHARS) {
      signature = `${signature.slice(0, MAX_TYPE_CHARS)}\n/* … */`;
    }
    let fields = [];
    if (pattern.kind === "interface" || pattern.kind === "type" || pattern.kind === "enum") {
      const decl = findTypeDeclaration(source, name);
      if (decl?.body) {
        fields = parseTypeFields(decl.body);
      }
    }
    return { name, kind: pattern.kind, jsdoc, signature, filePath, fields };
  }
  return null;
};

const collectFileExports = (filePath, depth = 0, seen = new Set()) => {
  const resolved = resolveSourceFile(filePath);
  if (!resolved || isTestFile(resolved) || seen.has(resolved) || depth > 6) {
    return [];
  }
  seen.add(resolved);
  const source = readIfFile(resolved);
  const results = [];
  const pushUnique = (item) => {
    if (!item || SKIP_EXPORT_NAMES.has(item.name)) {
      return;
    }
    results.push(item);
  };
  for (const match of source.matchAll(/export\s+\*\s+from\s+["'](\.[^"']+)["']/g)) {
    const nested = resolveSourceFile(path.resolve(path.dirname(resolved), match[1]));
    for (const item of collectFileExports(nested, depth + 1, seen)) {
      pushUnique(item);
    }
  }
  for (const match of source.matchAll(/export\s+(type\s+)?\{([^}]+)\}\s+from\s+["'](\.[^"']+)["']/g)) {
    const nested = resolveSourceFile(path.resolve(path.dirname(resolved), match[3]));
    const nestedSource = readIfFile(nested);
    for (const item of parseExportList(match[2])) {
      pushUnique(findLocalSymbol(nested, nestedSource, item.local) ? { ...findLocalSymbol(nested, nestedSource, item.local), name: item.exported } : { name: item.exported, kind: item.isType ? "type" : "const", jsdoc: "", signature: item.exported, filePath: nested });
    }
  }
  for (const match of source.matchAll(/export\s+(type\s+)?\{([^}]+)\}(?!\s+from)/g)) {
    for (const item of parseExportList(match[2])) {
      pushUnique(findLocalSymbol(resolved, source, item.local) ? { ...findLocalSymbol(resolved, source, item.local), name: item.exported } : null);
    }
  }
  for (const match of source.matchAll(/^export\s+(?:async\s+)?(?:function|class|const|type|interface|enum)\s+([A-Za-z_$][\w$]*)/gm)) {
    pushUnique(findLocalSymbol(resolved, source, match[1]));
  }
  const unique = [];
  const names = new Set();
  for (const item of results) {
    if (names.has(item.name)) {
      continue;
    }
    names.add(item.name);
    unique.push(item);
  }
  return unique;
};

export const listPackageValueExports = (rootDir) => {
  const packagesDir = path.join(rootDir, "packages");
  const result = [];
  for (const name of fs.readdirSync(packagesDir)) {
    const packageDir = path.join(packagesDir, name);
    const pkgPath = path.join(packageDir, "package.json");
    if (!fs.existsSync(pkgPath)) {
      continue;
    }
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    for (const entry of listPackageEntryFiles(packageDir, pkg)) {
      for (const item of collectFileExports(entry.filePath)) {
        result.push({
          packageName: pkg.name,
          entry: entry.entry,
          ...item,
        });
      }
    }
  }
  return result;
};

const listPluginDomainComponents = (rootDir, pluginDir) => {
  const globalFile = path.join(rootDir, pluginDir, "src/components/global.ts");
  const globalSource = readIfFile(globalFile);
  if (!globalSource) {
    return [];
  }
  const names = new Set();
  const start = globalSource.indexOf("domainGlobalComponents");
  const block = start === -1 ? globalSource : globalSource.slice(start, globalSource.indexOf("};", start) + 2);
  for (const match of block.matchAll(/^\s+([A-Z][A-Za-z0-9]+),/gm)) {
    names.add(match[1]);
  }
  const components = [];
  for (const match of globalSource.matchAll(/import\s+(\w+)\s+from\s+["']([^"']+)["']/g)) {
    if (!names.has(match[1])) {
      continue;
    }
    const filePath = resolveSourceFile(path.resolve(path.dirname(globalFile), match[2]));
    components.push({
      name: match[1],
      ...extractVueApi(filePath),
    });
  }
  return components;
};

export const listOfficialPluginPages = (rootDir) => {
  const plugins = [
    { id: "platform", packageName: "@ingot/platform-plugin", exportName: "platformPlugin", dir: "plugins/platform" },
    { id: "security", packageName: "@ingot/security-plugin", exportName: "securityPlugin", dir: "plugins/security" },
    { id: "org", packageName: "@ingot/org-plugin", exportName: "orgPlugin", dir: "plugins/org" },
    { id: "member", packageName: "@ingot/member-plugin", exportName: "memberPlugin", dir: "plugins/member" },
  ];
  return plugins.map((plugin) => {
    const pluginSource = readIfFile(path.join(rootDir, plugin.dir, "src/plugin.ts"));
    const pluginId = pluginSource.match(/id:\s*["']([^"']+)["']/)?.[1] ?? `ingot-${plugin.id}`;
    const dependsOn = [...pluginSource.matchAll(/dependsOn:\s*\[([^\]]*)\]/g)].flatMap((match) =>
      [...match[1].matchAll(/["']([^"']+)["']/g)].map((item) => item[1]),
    );
    const canonicalPrefix =
      pluginSource.match(/canonicalPrefix:\s*["']([^"']+)["']/)?.[1] ?? plugin.id;
    const apiVersion = pluginSource.match(/apiVersion:\s*([A-Za-z_$][\w$]*|["'][^"']+["'])/)?.[1] ?? "";
    const pagesDir = path.join(rootDir, plugin.dir, "src/pages");
    const pages = [];
    const walk = (dir, prefix = "") => {
      if (!fs.existsSync(dir)) {
        return;
      }
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
          walk(path.join(dir, entry.name), `${prefix}${entry.name}/`);
          continue;
        }
        if (entry.name !== "IndexPage.vue") {
          continue;
        }
        const relative = prefix.replace(/\/$/, "");
        const pageSource = readIfFile(path.join(dir, entry.name));
        const header = pageSource.match(/<in-page-header\b[^>]*>/i)?.[0] ?? "";
        const description =
          header.match(/\bdescription=["']([^"']+)["']/)?.[1] ??
          pageSource.match(/\bdescription=["']([^"']+)["']/)?.[1] ??
          "";
        const title = header.match(/\btitle=["']([^"']+)["']/)?.[1] ?? "";
        pages.push({
          path: relative || "index",
          title,
          canonical: `${canonicalPrefix}.${relative.replaceAll("/", ".") || "index"}`.replace(/\.index$/, ""),
          description,
        });
      }
    };
    walk(pagesDir);
    return {
      ...plugin,
      pluginId,
      dependsOn,
      canonicalPrefix,
      apiVersion,
      pages,
      components: listPluginDomainComponents(rootDir, plugin.dir),
    };
  });
};

export const assignModuleAnchors = (items) => {
  const used = new Set();
  return items.map((item) => {
    let anchor = vitepressSlug(item.name);
    if (!anchor || used.has(anchor)) {
      anchor = vitepressSlug(`${item.packageName}-${item.entry}-${item.name}`);
    }
    used.add(anchor);
    return { ...item, anchor };
  });
};

export const buildCoverage = (rootDir) => {
  const entries = {};
  for (const name of listGlobalComponents(rootDir)) {
    const exampleId = DEMO_IDS[name] ?? "";
    entries[name] = {
      package: "@ingot/admin-core",
      doc: `/reference/components.html#${vitepressSlug(name)}`,
      exampleId,
      demo: Boolean(exampleId),
      reason: exampleId ? "" : "依赖完整管理台、网络或布局上下文，见组件页限制说明",
    };
  }
  for (const item of assignModuleAnchors(listPackageValueExports(rootDir))) {
    if (entries[item.name]) {
      continue;
    }
    entries[item.name] = {
      package: item.packageName,
      doc: `/reference/modules.html#${item.anchor}`,
      exampleId: "",
      demo: false,
      reason: "模块能力以源码签名与 JSDoc 为准，不在 iframe 启动完整管理台",
    };
  }
  for (const plugin of listOfficialPluginPages(rootDir)) {
    entries[plugin.exportName] = {
      package: plugin.packageName,
      doc: `/reference/plugins.html#${vitepressSlug(plugin.packageName)}`,
      exampleId: "",
      demo: false,
      reason: "业务插件在宿主 App 中运行，不在文档 iframe 启动",
    };
  }
  return { version: 1, entries };
};
