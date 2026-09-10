import fs from "node:fs";
import path from "node:path";
import { fail } from "./errors.mjs";

const assertNotSymlink = (targetPath, label) => {
  if (!fs.existsSync(targetPath)) {
    return;
  }
  const stat = fs.lstatSync(targetPath);
  if (stat.isSymbolicLink()) {
    fail("VALIDATION_ERROR", `${label}不能是符号链接`, {
      fields: { targetDir: "拒绝通过符号链接绕过分类目录" },
    });
  }
};

export const resolveCategoryDir = (rootDir, kind) => {
  const folder = kind === "app" ? "apps" : kind === "plugin" ? "plugins" : "themes";
  const categoryDir = path.join(rootDir, folder);
  if (!fs.existsSync(categoryDir)) {
    fail("VALIDATION_ERROR", `仓库缺少 ${folder}/ 目录`);
  }
  assertNotSymlink(categoryDir, `${folder}/`);
  const realRoot = fs.realpathSync(rootDir);
  const realCategory = fs.realpathSync(categoryDir);
  if (realCategory !== path.join(realRoot, folder)) {
    fail("VALIDATION_ERROR", `${folder}/ 真实路径校验失败`, {
      fields: { targetDir: "分类目录不能通过符号链接逃逸" },
    });
  }
  return { folder, categoryDir: realCategory };
};

export const resolveTargetDir = (rootDir, kind, directoryName) => {
  if (
    !directoryName ||
    directoryName.includes("..") ||
    directoryName.includes(path.sep) ||
    directoryName.includes("/")
  ) {
    fail("VALIDATION_ERROR", "目标目录名不合法", { fields: { targetDir: "目录名不能包含路径分隔符" } });
  }
  const { folder, categoryDir } = resolveCategoryDir(rootDir, kind);
  const targetDir = path.join(categoryDir, directoryName);
  if (targetDir === categoryDir || !targetDir.startsWith(`${categoryDir}${path.sep}`)) {
    fail("VALIDATION_ERROR", `目标目录必须位于 ${folder}/ 下`, { fields: { targetDir: "路径逃逸" } });
  }
  assertNotSymlink(targetDir, "目标目录");
  return { folder, categoryDir, targetDir, relativeDir: `${folder}/${directoryName}` };
};

export const assertTargetFree = (targetDir) => {
  if (fs.existsSync(targetDir)) {
    fail("TARGET_EXISTS", "目标目录已存在，拒绝覆盖", { status: 409 });
  }
};
