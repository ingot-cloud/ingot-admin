#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";
import { runScaffoldCli, log } from "./lib/scaffold/cli.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

runScaffoldCli({ kind: "plugin", argv: process.argv.slice(2), rootDir }).catch((error) => {
  log(String(error.message || error), "red");
  process.exitCode = 1;
});
