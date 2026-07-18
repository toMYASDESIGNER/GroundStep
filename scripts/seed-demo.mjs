import { rm } from "node:fs/promises";
import path from "node:path";
import { assessCurrentStep, createCase } from "../src/engine.mjs";
import { writeReports } from "../src/report.mjs";
import { getScenario } from "../src/templates.mjs";
import { caseDirectory, resolveGroundStepRoot, saveCase, storeEvidence } from "../src/store.mjs";

const repo = path.resolve(import.meta.dirname, "..");
const root = resolveGroundStepRoot(repo);
const id = "router-proof-demo";
const target = caseDirectory(root, id);
if (!target.startsWith(path.join(root, "cases") + path.sep)) throw new Error("Refusing to reset an unexpected path.");
await rm(target, { recursive: true, force: true });

let tick = 0;
const clock = () => new Date(Date.UTC(2026, 6, 18, 16, 0, tick++ * 42));
const data = createCase({ id, title: "Restore the studio router", scenario: getScenario("router"), clock });

async function assess({ file, verdict, confidence, observed, reason }) {
  const evidence = await storeEvidence(root, id, path.join(repo, "demo", "evidence", file), clock());
  assessCurrentStep(data, { verdict, confidence, observed, reason, evidence }, { clock });
}

await assess({ file: "01-inspection.svg", verdict: "verified", confidence: 0.97, observed: "Router, adapter, and connectors are visible on a dry surface with no visible damage.", reason: "The safety preconditions and required objects are all visible." });
await assess({ file: "02-power.svg", verdict: "verified", confidence: 0.98, observed: "The matching barrel connector is fully seated in the socket labelled DC-IN.", reason: "Connector geometry, label, and cable position match the expected proof." });
await assess({ file: "03-wrong-port.svg", verdict: "mismatch", confidence: 0.99, observed: "The yellow internet cable is inserted into LAN 1 while the blue WAN port is empty.", reason: "The physical state contradicts the current instruction. The next step remains locked." });
await assess({ file: "04-correct-port.svg", verdict: "verified", confidence: 0.99, observed: "The internet cable is now latched into the port labelled WAN.", reason: "The corrected photo clearly shows the WAN label and empty numbered LAN port." });
await assess({ file: "05-lights.svg", verdict: "verified", confidence: 0.96, observed: "Power, Internet, and Wi-Fi indicators are stable in their connected state.", reason: "The final status panel provides visible completion evidence." });

await saveCase(root, data);
const reports = await writeReports(root, data);
process.stdout.write(`Seeded ${id}\nProof Trail: ${reports.html}\n`);
