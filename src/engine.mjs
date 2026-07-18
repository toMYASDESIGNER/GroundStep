import { randomUUID } from "node:crypto";

export const VERDICTS = Object.freeze(["verified", "mismatch", "uncertain", "unsafe"]);

function now(clock) {
  return (clock?.() ?? new Date()).toISOString();
}

function publicStep(step) {
  return {
    id: step.id,
    title: step.title,
    instruction: step.instruction,
    expectedEvidence: step.expectedEvidence,
    safety: step.safety,
    critical: step.critical,
    status: step.status,
    attempts: step.attempts
  };
}

export function createCase({ id, title, goal, scenario, clock }) {
  if (!scenario?.steps?.length) throw new Error("A scenario needs at least one step.");
  const createdAt = now(clock);
  const caseId = id || `case-${randomUUID().slice(0, 8)}`;
  const steps = scenario.steps.map((step, index) => ({
    ...structuredClone(step),
    status: index === 0 ? "active" : "locked",
    attempts: []
  }));
  return {
    schemaVersion: 1,
    id: caseId,
    title: title || scenario.name,
    goal: goal || scenario.goal,
    scenario: scenario.id,
    status: "active",
    createdAt,
    updatedAt: createdAt,
    currentStepId: steps[0].id,
    steps,
    events: [{ id: randomUUID(), type: "case.created", at: createdAt, stepId: steps[0].id }]
  };
}

export function currentStep(caseData) {
  return caseData.steps.find((step) => step.id === caseData.currentStepId) ?? null;
}

export function assessCurrentStep(caseData, assessment, { clock } = {}) {
  if (caseData.status === "complete") throw new Error("This case is already complete.");
  if (caseData.status === "unsafe") throw new Error("This case is safety-locked. Start a new case after the hazard is resolved.");
  if (!VERDICTS.includes(assessment.verdict)) {
    throw new Error(`Invalid verdict. Use one of: ${VERDICTS.join(", ")}`);
  }
  if (!Number.isFinite(assessment.confidence) || assessment.confidence < 0 || assessment.confidence > 1) {
    throw new Error("Confidence must be a number from 0 to 1.");
  }

  const step = currentStep(caseData);
  if (!step) throw new Error("The active step could not be found.");
  if (assessment.stepId && assessment.stepId !== step.id) {
    throw new Error(`Step ${assessment.stepId} is locked. Submit evidence for ${step.id}.`);
  }

  const at = now(clock);
  const attempt = {
    id: randomUUID(),
    at,
    verdict: assessment.verdict,
    confidence: assessment.confidence,
    observed: assessment.observed,
    reason: assessment.reason,
    evidence: assessment.evidence
  };
  step.attempts.push(attempt);

  if (assessment.verdict === "unsafe") {
    step.status = "unsafe";
    caseData.status = "unsafe";
  } else if (assessment.verdict === "verified") {
    step.status = "verified";
    const index = caseData.steps.indexOf(step);
    const next = caseData.steps[index + 1];
    if (next) {
      next.status = "active";
      caseData.currentStepId = next.id;
    } else {
      caseData.status = "complete";
      caseData.currentStepId = null;
    }
  } else {
    step.status = "active";
  }

  caseData.updatedAt = at;
  caseData.events.push({
    id: randomUUID(),
    type: `step.${assessment.verdict}`,
    at,
    stepId: step.id,
    attemptId: attempt.id,
    evidenceSha256: assessment.evidence?.sha256 ?? null
  });
  return caseData;
}

export function caseSummary(caseData) {
  const active = currentStep(caseData);
  return {
    id: caseData.id,
    title: caseData.title,
    goal: caseData.goal,
    scenario: caseData.scenario,
    status: caseData.status,
    createdAt: caseData.createdAt,
    updatedAt: caseData.updatedAt,
    progress: {
      verified: caseData.steps.filter((step) => step.status === "verified").length,
      total: caseData.steps.length
    },
    currentStep: active ? publicStep(active) : null
  };
}
