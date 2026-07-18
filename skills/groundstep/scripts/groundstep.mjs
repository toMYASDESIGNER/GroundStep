#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assessCurrentStep, caseSummary, createCase } from "../../../src/engine.mjs";
import { writeReports } from "../../../src/report.mjs";
import { startServer } from "../../../src/server.mjs";
import { getScenario } from "../../../src/templates.mjs";
import { listCases, loadCase, resolveGroundStepRoot, saveCase, storeEvidence } from "../../../src/store.mjs";

const fileDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(fileDir, "..", "..", "..");

function parseArgs(values) {
  const result = { _: [] };
  for (let i = 0; i < values.length; i += 1) {
    const value = values[i];
    if (!value.startsWith("--")) result._.push(value);
    else {
      const key = value.slice(2);
      const next = values[i + 1];
      if (!next || next.startsWith("--")) result[key] = true;
      else { result[key] = next; i += 1; }
    }
  }
  return result;
}

function required(args, name) {
  if (!args[name]) throw new Error(`Missing --${name}`);
  return args[name];
}

function print(value) {
  process.stdout.write(`${typeof value === "string" ? value : JSON.stringify(value, null, 2)}\n`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0] || "help";
  const repo = path.resolve(args.repo || process.cwd());
  const root = resolveGroundStepRoot(repo);

  if (command === "create") {
    const scenario = getScenario(args.scenario || "router");
    const data = createCase({ id: args.id, title: args.title, goal: args.goal, scenario });
    await saveCase(root, data);
    print(caseSummary(data));
    return;
  }
  if (command === "assess") {
    const caseId = required(args, "case");
    const data = await loadCase(root, caseId);
    const evidence = await storeEvidence(root, caseId, required(args, "image"));
    assessCurrentStep(data, {
      stepId: args.step,
      verdict: required(args, "verdict"),
      confidence: Number(required(args, "confidence")),
      observed: required(args, "observed"),
      reason: required(args, "reason"),
      evidence
    });
    await saveCase(root, data);
    await writeReports(root, data);
    print(caseSummary(data));
    return;
  }
  if (command === "status") {
    const caseId = args.case;
    print(caseId ? caseSummary(await loadCase(root, caseId)) : (await listCases(root)).map(caseSummary));
    return;
  }
  if (command === "report") {
    print(await writeReports(root, await loadCase(root, required(args, "case"))));
    return;
  }
  if (command === "serve") {
    const port = Number(args.port || 4190);
    await startServer({ root, port });
    print(`GroundStep is running at http://127.0.0.1:${port}`);
    return;
  }
  if (command === "doctor") {
    if (Number(process.versions.node.split(".")[0]) < 20) throw new Error("Node.js 20 or newer is required.");
    print({ ok: true, node: process.version, projectRoot, storageRoot: root, scenarios: ["router", "digi-router"] });
    return;
  }
  print(`GroundStep CLI\n\nCommands:\n  create --scenario router|digi-router [--id case-id]\n  assess --case ID --step STEP --image FILE --verdict VERDICT --confidence 0..1 --observed TEXT --reason TEXT\n  status [--case ID]\n  report --case ID\n  serve [--port 4190]\n  doctor`);
}

main().catch((error) => {
  process.stderr.write(`GroundStep: ${error.message}\n`);
  process.exitCode = 1;
});
