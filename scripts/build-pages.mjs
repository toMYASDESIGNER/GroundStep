import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { assessCurrentStep, createCase } from "../src/engine.mjs";
import { getScenario } from "../src/templates.mjs";

const root = path.resolve(import.meta.dirname, "..");
const output = path.join(root, "docs");
const evidenceOutput = path.join(output, "evidence");
await mkdir(evidenceOutput, { recursive: true });

for (const file of ["index.html", "styles.css", "app.js"]) {
  await copyFile(path.join(root, "web", file), path.join(output, file));
}

let tick = 0;
const clock = () => new Date(Date.UTC(2026, 6, 18, 18, 0, tick++ * 40));
const data = createCase({
  id: "router-proof-demo",
  title: "Restore the studio router",
  scenario: getScenario("router"),
  clock
});

async function evidence(file) {
  const source = path.join(root, "demo", "evidence", file);
  const bytes = await readFile(source);
  await copyFile(source, path.join(evidenceOutput, file));
  return {
    filename: file,
    originalName: file,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    bytes: bytes.length,
    publicUrl: `./evidence/${file}`
  };
}

async function assess({ file, verdict, confidence, observed, reason }) {
  assessCurrentStep(data, { verdict, confidence, observed, reason, evidence: await evidence(file) }, { clock });
}

await assess({ file: "01-inspection.svg", verdict: "verified", confidence: 0.97, observed: "Router, adapter, and connectors are visible on a dry surface with no visible damage.", reason: "The safety preconditions and required objects are all visible." });
await assess({ file: "02-power.svg", verdict: "verified", confidence: 0.98, observed: "The matching barrel connector is fully seated in the socket labelled DC-IN.", reason: "Connector geometry, label, and cable position match the expected proof." });
await assess({ file: "03-wrong-port.svg", verdict: "mismatch", confidence: 0.99, observed: "The yellow internet cable is inserted into LAN 1 while the blue WAN port is empty.", reason: "The physical state contradicts the current instruction. The next step remains locked." });
await assess({ file: "04-correct-port.svg", verdict: "verified", confidence: 0.99, observed: "The internet cable is now latched into the port labelled WAN.", reason: "The corrected photo clearly shows the WAN label and empty numbered LAN port." });
await assess({ file: "05-lights.svg", verdict: "verified", confidence: 0.96, observed: "Power, Internet, and Wi-Fi indicators are stable in their connected state.", reason: "The final status panel provides visible completion evidence." });

await writeFile(path.join(output, "demo-case.json"), `${JSON.stringify(data, null, 2)}\n`, "utf8");
await writeFile(path.join(output, ".nojekyll"), "", "utf8");
process.stdout.write(`Built GitHub Pages demo in ${output}\n`);
