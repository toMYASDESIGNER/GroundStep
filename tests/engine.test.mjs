import assert from "node:assert/strict";
import test from "node:test";
import { assessCurrentStep, createCase } from "../src/engine.mjs";
import { getScenario } from "../src/templates.mjs";

const evidence = { filename: "proof.svg", sha256: "a".repeat(64), bytes: 100 };
const assessment = (verdict, stepId) => ({ stepId, verdict, confidence: 0.9, observed: "Visible state", reason: "Visible reason", evidence });

test("mismatch keeps the current step active and the future locked", () => {
  const data = createCase({ id: "test-case", scenario: getScenario("router") });
  assessCurrentStep(data, assessment("verified", "inspect"));
  assessCurrentStep(data, assessment("verified", "power"));
  assessCurrentStep(data, assessment("mismatch", "wan"));
  assert.equal(data.currentStepId, "wan");
  assert.equal(data.steps[2].status, "active");
  assert.equal(data.steps[3].status, "locked");
});

test("uncertain evidence also keeps the future locked", () => {
  const data = createCase({ id: "uncertain-case", scenario: getScenario("router") });
  assessCurrentStep(data, assessment("uncertain", "inspect"));
  assert.equal(data.currentStepId, "inspect");
  assert.equal(data.steps[0].status, "active");
  assert.equal(data.steps[1].status, "locked");
});

test("a future step cannot be assessed", () => {
  const data = createCase({ id: "future-lock", scenario: getScenario("router") });
  assert.throws(() => assessCurrentStep(data, assessment("verified", "wan")), /locked/);
});

test("unsafe verdict permanently safety-locks the case", () => {
  const data = createCase({ id: "unsafe-case", scenario: getScenario("router") });
  assessCurrentStep(data, assessment("unsafe", "inspect"));
  assert.equal(data.status, "unsafe");
  assert.throws(() => assessCurrentStep(data, assessment("verified", "inspect")), /safety-locked/);
});

test("only four verified steps complete the router case", () => {
  const data = createCase({ id: "complete-case", scenario: getScenario("router") });
  for (const step of ["inspect", "power", "wan", "lights"]) assessCurrentStep(data, assessment("verified", step));
  assert.equal(data.status, "complete");
  assert.equal(data.currentStepId, null);
});
