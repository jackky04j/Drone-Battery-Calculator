import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { PATHS } from "../src/config.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("repository keeps a progressive two-phase layout", () => {
  const required = [
    "README.md",
    "LICENSE",
    "requirements.txt",
    "package.json",
    ".gitignore",
    "index.html",
    PATHS.styles,
    PATHS.ui,
    PATHS.calculator,
    "src/config.js",
    "tests/calculator.test.js",
    ".github/workflows/quality.yml",
  ];

  for (const relative of required) {
    assert.ok(fs.existsSync(path.join(repoRoot, relative)), `missing ${relative}`);
  }
});

test("config paths stay repository-relative", () => {
  for (const relative of Object.values(PATHS)) {
    assert.equal(path.isAbsolute(relative), false, relative);
    assert.equal(relative.includes("C:"), false, relative);
    assert.equal(relative.includes("/Users/"), false, relative);
  }
});
