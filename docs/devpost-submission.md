# GroundStep — Devpost submission draft

## Tagline

It never gives you the next step until reality proves the last one happened.

## Inspiration

AI assistants are excellent at explaining how to do something, but once a user looks away from the screen and acts in the real world, the assistant loses ground truth. A confident checklist cannot see a cable in the wrong port, a part installed backwards, or a step that was skipped. GroundStep closes that gap by making visible reality the gate between instructions.

## What it does

GroundStep guides a physical task one bounded action at a time. After each action, the user attaches a fresh photo. Codex compares only what is visible with explicit expected evidence and returns one of four decisions:

- **verified** — unlock exactly one next step;
- **mismatch** — explain the visible difference and keep the future locked;
- **uncertain** — request a better photo without guessing;
- **unsafe** — stop the sequence.

The router demo uses seven real smartphone photographs. It intentionally connects the incoming cable to LAN 1. GroundStep detects that WAN is still empty, records the mismatch, and refuses to reveal the status-light check. A second angle is correctly marked `uncertain` because cable identity cannot be proven. A wider corrected photo proves the incoming cable is in WAN and unlocks the final step. The case then rejects a red service indicator and completes only after green-state evidence.

Every submission is copied locally and hashed with SHA-256. Verdicts, reasons, confidence, timestamps, and transitions become a human-readable Proof Trail.

## How we built it

GroundStep is a Codex plugin with a reusable `$groundstep` skill. Codex provides multimodal inspection and the conversational loop. A dependency-light Node.js runtime provides the security boundary: a deterministic state machine owns current-step locks and refuses invalid or out-of-order transitions. Local storage preserves evidence and cryptographic hashes. A responsive dashboard replays the complete before/mismatch/correction/after trail.

No external API key or cloud service is required. The user can attach photos directly in Codex.

## How Codex was used

Codex is both the development environment and the product surface. It helped turn the concept into a plugin manifest, safety-scoped skill, CLI, state engine, evidence store, tests, visual fixtures, dashboard, architecture asset, and submission materials. At runtime, Codex interprets the user's attached photo, while deterministic code—not the model—enforces whether the workflow can advance.

## Challenges

The hardest design choice was preventing conversational helpfulness from weakening the proof gate. The model must not reveal future steps just because a user insists. We separated interpretation from authorization: Codex can propose a verdict, but only the state engine can unlock the next step. We also designed `uncertain` as a first-class safe outcome so poor images do not become fabricated confidence.

## Accomplishments

- a working Codex plugin and reusable skill;
- four fail-closed visual verdicts;
- deterministic future-step locks;
- local evidence hashing and portable Proof Trails;
- an automated router attack/correction demo;
- a judge-facing replay dashboard;
- a seven-photo real-router proof trail;
- automated engine, integrity, and HTTP tests.

## What we learned

The most useful real-world agent is not always the one that knows the entire plan. It is the one that knows when the next instruction has not yet been earned. Multimodal reasoning becomes safer and more trustworthy when a small deterministic system controls progress.

## What's next

We will add scenario authoring, side-by-side reference overlays, photo freshness checks, and optional expert sign-off. The same proof-gated pattern can support accessible assembly, equipment inspection, travel packing, inventory handoff, and field maintenance while keeping high-risk regulated work out of scope.

## Built with

Codex, Codex plugins, Codex skills, multimodal vision, Node.js, HTML, CSS, JavaScript, SHA-256.
