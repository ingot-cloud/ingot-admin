import fs from "node:fs";
import path from "node:path";
import { fail } from "./errors.mjs";
import { assertTargetFree } from "./paths.mjs";

const inProgress = new Map();

export const withTargetLock = async (targetDir, task) => {
  const key = path.resolve(targetDir);
  if (inProgress.has(key)) {
    fail("CREATE_IN_PROGRESS", "相同目标正在生成", { status: 409 });
  }
  const pending = Promise.resolve()
    .then(task)
    .finally(() => {
      inProgress.delete(key);
    });
  inProgress.set(key, pending);
  return pending;
};

const writeFile = (root, file) => {
  const dest = path.resolve(root, file.path);
  const resolvedRoot = path.resolve(root);
  if (dest === resolvedRoot || !dest.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error("FILE_ESCAPE");
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (file.kind === "binary") {
    fs.writeFileSync(dest, file.buffer);
    return;
  }
  fs.writeFileSync(dest, file.content, "utf8");
};

export const writeExclusive = (targetDir, files) => {
  assertTargetFree(targetDir);
  let created = false;
  try {
    fs.mkdirSync(targetDir, { recursive: false });
    created = true;
    for (const file of files) {
      writeFile(targetDir, file);
    }
  } catch (error) {
    if (created) {
      fs.rmSync(targetDir, { recursive: true, force: true });
    }
    if (error && typeof error === "object" && "code" in error && error.code === "EEXIST") {
      fail("TARGET_EXISTS", "目标目录已存在，拒绝覆盖", { status: 409 });
    }
    fail("WRITE_FAILED", "写入失败，已回滚本次产物", { status: 500 });
  }
};
