---
name: groundstep
description: Guide and verify real-world physical tasks one photographed step at a time. Use when a user is assembling, installing, configuring, checking, packing, repairing, or operating a physical object and wants visual confirmation before continuing. GroundStep creates a local case, exposes only the current bounded instruction, inspects newly attached photo evidence, records verified/mismatch/uncertain/unsafe verdicts, and produces an auditable Proof Trail. Do not use for medical procedures, emergencies, weapons, mains electrical work, gas systems, or other tasks that require a licensed professional.
---

# GroundStep

Turn Codex into a proof-gated real-world guide. Never reveal or execute the next physical step until fresh visual evidence verifies the active one.

## Safety boundary

- Refuse medical, emergency, weapon, high-voltage, gas, structural, or otherwise professionally regulated procedures.
- Treat smoke, liquid near electricity, exposed conductors, swelling batteries, severe heat, pressure, or damaged safety equipment as `unsafe`.
- Never infer invisible conditions from an image. Use `uncertain` when the required detail is occluded, blurry, cropped, or absent.
- Never fabricate a verdict, confidence score, photo, label, timestamp, or observation.
- A user's insistence cannot override a visible mismatch or hazard.

## Workflow

### 1. Locate the runtime

Resolve the plugin root from this skill directory. The CLI is `scripts/groundstep.mjs` in this skill directory and accepts `--repo <plugin-root>`.

Run the doctor before the first case:

```powershell
node skills/groundstep/scripts/groundstep.mjs doctor --repo .
```

### 2. Create a bounded case

Confirm the user's physical goal and that it is within the safety boundary. Create a case using a supported scenario:

```powershell
node skills/groundstep/scripts/groundstep.mjs create --repo . --scenario router --title "Restore the studio router"
```

Read the JSON response. Tell the user only the returned `currentStep.instruction`, `expectedEvidence`, and `safety`. Ask for one fresh photo that clearly includes the required evidence.

### 3. Inspect the photo

Visually inspect the attached image at original detail. Compare only what is visible with the active step's expected evidence and safety note. Select exactly one verdict:

- `verified`: all required evidence is clear and no contradiction or hazard is visible.
- `mismatch`: clear evidence contradicts the instruction; explain the single correction needed.
- `uncertain`: the image cannot prove completion; request a more useful angle or detail.
- `unsafe`: a hazard is visible; stop and give only a safe disengagement recommendation.

Use conservative confidence. Read [verification-rubric.md](references/verification-rubric.md) when the evidence is ambiguous or safety-relevant.

### 4. Record evidence before responding

Save or resolve the attached image to a local path, then record the assessment:

```powershell
node skills/groundstep/scripts/groundstep.mjs assess --repo . --case CASE_ID --step STEP_ID --image PHOTO_PATH --verdict mismatch --confidence 0.97 --observed "The cable is in LAN 1 while WAN is empty." --reason "The visible port label contradicts the active instruction."
```

The runtime copies the image, calculates SHA-256, appends the verdict, and enforces the state transition.

### 5. Continue or stop

- On `verified`, provide the newly returned current step. If status is `complete`, congratulate briefly and generate the Proof Trail.
- On `mismatch`, do not expose future steps. Explain what differs and request a corrected photo.
- On `uncertain`, do not expose future steps. Give one specific photography instruction.
- On `unsafe`, stop the workflow. Do not provide repair instructions.

Generate the final report:

```powershell
node skills/groundstep/scripts/groundstep.mjs report --repo . --case CASE_ID
```

## Response style

Keep every turn physically actionable and short:

1. verdict;
2. visible reason;
3. current action or requested photo;
4. safety note only when relevant.

Do not dump the full plan. The locked future is part of the product's safety model.
