import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { createCase } from "../src/engine.mjs";
import { startServer } from "../src/server.mjs";
import { getScenario } from "../src/templates.mjs";
import { saveCase } from "../src/store.mjs";

test("HTTP dashboard exposes case summaries and details", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "groundstep-http-"));
  const data = createCase({ id: "http-case", scenario: getScenario("router") });
  await saveCase(root, data);
  const server = await startServer({ root, port: 0 });
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await rm(root, { recursive: true, force: true });
  });
  const port = server.address().port;
  const cases = await fetch(`http://127.0.0.1:${port}/api/cases`).then((response) => response.json());
  assert.equal(cases[0].id, "http-case");
  assert.equal(cases[0].currentStep.id, "inspect");
  const detail = await fetch(`http://127.0.0.1:${port}/api/cases/http-case`).then((response) => response.json());
  assert.equal(detail.steps.length, 4);
  const html = await fetch(`http://127.0.0.1:${port}/`).then((response) => response.text());
  assert.match(html, /Do the step/);
});
