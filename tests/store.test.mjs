import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { createCase } from "../src/engine.mjs";
import { getScenario } from "../src/templates.mjs";
import { listCases, loadCase, saveCase, storeEvidence } from "../src/store.mjs";

test("evidence is copied and hashed while cases round-trip", async (t) => {
  const temp = await mkdtemp(path.join(tmpdir(), "groundstep-"));
  t.after(() => rm(temp, { recursive: true, force: true }));
  const source = path.join(temp, "photo.txt");
  await writeFile(source, "visible reality", "utf8");
  const data = createCase({ id: "round-trip", scenario: getScenario("router") });
  await saveCase(temp, data);
  assert.deepEqual(await loadCase(temp, data.id), data);
  assert.equal((await listCases(temp)).length, 1);
  const proof = await storeEvidence(temp, data.id, source);
  assert.equal(proof.sha256.length, 64);
  assert.equal(await readFile(path.join(temp, "cases", data.id, proof.relativePath), "utf8"), "visible reality");
});
