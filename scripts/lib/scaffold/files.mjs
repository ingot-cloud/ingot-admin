import fs from "node:fs";
import path from "node:path";

const BINARY_EXT = new Set([".ico", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".woff", ".woff2"]);

export const walkDir = (from, relative = "") => {
  const entries = [];
  if (!fs.existsSync(from)) {
    return entries;
  }
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const rel = relative ? `${relative}/${entry.name}` : entry.name;
    const full = path.join(from, entry.name);
    if (entry.isDirectory()) {
      entries.push(...walkDir(full, rel));
      continue;
    }
    entries.push({ relative: rel, full });
  }
  return entries;
};

export const applyTokens = (content, tokens) => {
  let result = content;
  for (const [key, value] of Object.entries(tokens)) {
    result = result.replaceAll(`{{${key}}}`, String(value));
  }
  return result;
};

export const loadTemplateFiles = (templateDir, tokens) => {
  const files = [];
  for (const entry of walkDir(templateDir)) {
    const dest = applyTokens(entry.relative.replaceAll("__APP__", tokens.appCode ?? ""), tokens);
    const ext = path.extname(entry.relative).toLowerCase();
    if (BINARY_EXT.has(ext)) {
      files.push({ path: dest, kind: "binary", buffer: fs.readFileSync(entry.full) });
      continue;
    }
    files.push({
      path: dest,
      kind: "text",
      content: applyTokens(fs.readFileSync(entry.full, "utf8"), tokens),
    });
  }
  return files;
};

export const upsertFile = (files, filePath, content, kind = "text") => {
  const next = files.filter((file) => file.path !== filePath);
  if (kind === "binary") {
    next.push({ path: filePath, kind, buffer: content });
  } else {
    next.push({ path: filePath, kind: "text", content });
  }
  return next.sort((left, right) => left.path.localeCompare(right.path));
};

export const removePrefix = (files, prefix) => files.filter((file) => !file.path.startsWith(prefix));

export const ensureGitkeep = (files, dir) => {
  const normalized = dir.endsWith("/") ? dir : `${dir}/`;
  const hasFile = files.some(
    (file) => file.path === `${dir}/.gitkeep` || (file.path.startsWith(normalized) && file.path !== `${dir}/.gitkeep`),
  );
  if (hasFile) {
    return files;
  }
  return upsertFile(files, `${dir}/.gitkeep`, "");
};
