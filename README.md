# GroundStep

> It never gives you the next step until reality proves the last one happened.

GroundStep is a Codex-native visual proof gate for physical tasks. Instead of producing a long checklist and hoping the user followed it, GroundStep reveals one bounded action, asks for a fresh photo, compares visible reality with explicit evidence criteria, and advances only after verification.

## The demo

The included router case shows the same internet cable submitted twice:

1. it is first connected to **LAN 1**;
2. GroundStep returns `mismatch` and keeps the final step locked;
3. the corrected photo shows the cable in **WAN**;
4. only then does GroundStep reveal the status-light verification.

Every photo is copied locally and hashed with SHA-256. Verdicts, confidence, reasons, timestamps, and state transitions become a portable Proof Trail.

## Real-photo validation

The workflow was also exercised with seven original smartphone photographs of a DIGI router. The live case verified the disconnected setup and readable port labels, blocked a cable visibly inserted into LAN1, returned `uncertain` for an angle that could not establish cable identity, verified the corrected WAN layout, rejected a red service indicator, and completed only after a green-state photograph. Original photos remain in local evidence storage and are excluded from Git; the submission screenshots contain no original camera metadata.

## Why it is different

Most assistants optimize the quality of an instruction. GroundStep verifies whether the instruction became true in the physical world. Its future-step lock is enforced in code, not merely requested in a prompt.

- **Codex supplies vision and dialogue.** The skill asks Codex to inspect attached photos conservatively.
- **The runtime supplies enforcement.** A deterministic state machine owns locks and transitions.
- **The Proof Trail supplies accountability.** Local evidence hashes detect later file changes.
- **Safety fails closed.** `uncertain`, `mismatch`, and `unsafe` never advance the case.

No API key, cloud account, or external database is required.

**Live demo:** [https://tomyasdesigner.github.io/GroundStep/](https://tomyasdesigner.github.io/GroundStep/)

## Quick start

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm run demo:seed
npm start
```

Open [http://127.0.0.1:4190](http://127.0.0.1:4190).

Run validation:

```bash
npm run check
```

## Judging video

The repository includes the finished English voice-over demo with burned captions at `video/output/GroundStep-judging-demo-subtitled.mp4` and a separate YouTube-ready subtitle file at `video/output/GroundStep-judging-demo.srt`.

On Windows, regenerate the complete video from the sanitized dashboard frames with:

```bash
npm run video:build
```

The build uses the installed Microsoft English desktop voice and FFmpeg. Raw speech files, intermediate segments, QA frames, and original camera photos are excluded from Git.

## Use from Codex

Install or load this repository as a Codex plugin, invoke `$groundstep`, and attach a photo when requested. The reusable workflow is in `skills/groundstep/SKILL.md`; its CLI lives beside it in `scripts/groundstep.mjs`.

Manual CLI example:

```bash
node skills/groundstep/scripts/groundstep.mjs create --scenario router --id my-router
node skills/groundstep/scripts/groundstep.mjs status --case my-router
```

After visually inspecting a submitted photo, Codex records the assessment:

```bash
node skills/groundstep/scripts/groundstep.mjs assess \
  --case my-router \
  --step wan \
  --image ./photo.jpg \
  --verdict verified \
  --confidence 0.94 \
  --observed "The cable is latched into the port labelled WAN." \
  --reason "The label and connector are both clearly visible."
```

## Architecture

```text
User + fresh photo
        │
        ▼
Codex vision assessment ──► verified / mismatch / uncertain / unsafe
        │
        ▼
Deterministic proof gate ──► unlock exactly one next step or remain locked
        │
        ├── local evidence copy + SHA-256
        ├── append-only decision events
        └── HTML + Markdown Proof Trail
```

## Safety scope

GroundStep is a prototype for low-risk household setup, simple assembly, inspection, packing, and similar tasks. The bundled skill refuses medical procedures, emergencies, weapons, mains electrical work, gas systems, structural work, and tasks that require a licensed professional.

## Project layout

- `.codex-plugin/plugin.json` — Codex plugin manifest
- `skills/groundstep/` — reusable proof-gated workflow
- `src/engine.mjs` — deterministic state machine
- `src/store.mjs` — local evidence storage and hashing
- `src/report.mjs` — Proof Trail generator
- `web/` — judge-facing evidence dashboard
- `demo/evidence/` — deterministic router demonstration
- `tests/` — state, integrity, and HTTP tests

## License

MIT
