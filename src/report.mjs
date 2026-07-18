import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { caseDirectory } from "./store.mjs";

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

function attemptsMarkdown(step) {
  if (!step.attempts.length) return "  - No evidence submitted.";
  return step.attempts.map((attempt) => [
    `  - **${attempt.verdict.toUpperCase()}** · confidence ${Math.round(attempt.confidence * 100)}% · ${attempt.at}`,
    `    - Observed: ${attempt.observed}`,
    `    - Reason: ${attempt.reason}`,
    `    - Evidence SHA-256: \`${attempt.evidence?.sha256 ?? "none"}\``
  ].join("\n")).join("\n");
}

export function renderMarkdown(caseData) {
  const steps = caseData.steps.map((step, index) => [
    `## ${index + 1}. ${step.title} — ${step.status.toUpperCase()}`,
    "",
    step.instruction,
    "",
    attemptsMarkdown(step)
  ].join("\n")).join("\n\n");
  return `# GroundStep Proof Trail\n\n` +
    `**Case:** ${caseData.title}  \n` +
    `**Goal:** ${caseData.goal}  \n` +
    `**Status:** ${caseData.status.toUpperCase()}  \n` +
    `**Created:** ${caseData.createdAt}  \n` +
    `**Updated:** ${caseData.updatedAt}\n\n` +
    `${steps}\n\n---\nGenerated locally by GroundStep. Evidence hashes detect later file changes.\n`;
}

export function renderHtml(caseData) {
  const steps = caseData.steps.map((step, index) => {
    const attempts = step.attempts.map((attempt) => `
      <article class="attempt ${escapeHtml(attempt.verdict)}">
        <div><strong>${escapeHtml(attempt.verdict)}</strong><span>${Math.round(attempt.confidence * 100)}% confidence</span></div>
        <p>${escapeHtml(attempt.observed)}</p>
        <small>${escapeHtml(attempt.reason)}</small>
        <code>${escapeHtml(attempt.evidence?.sha256 ?? "no evidence hash")}</code>
      </article>`).join("") || "<p class=muted>No evidence submitted.</p>";
    return `<section><header><b>${String(index + 1).padStart(2, "0")}</b><div><h2>${escapeHtml(step.title)}</h2><span>${escapeHtml(step.status)}</span></div></header><p>${escapeHtml(step.instruction)}</p>${attempts}</section>`;
  }).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>GroundStep Proof Trail</title><style>
  :root{color-scheme:dark;font-family:Inter,system-ui;background:#080c13;color:#f7f8f3}body{max-width:920px;margin:0 auto;padding:56px 24px;background:radial-gradient(circle at 100% 0,#273719 0,transparent 30%)}
  h1{font-size:clamp(2.7rem,8vw,6rem);line-height:.85;margin:.4em 0}.lime{color:#b9ff66}.meta{border:1px solid #2e3846;border-radius:18px;padding:24px;background:#0e141f}.meta div{display:grid;grid-template-columns:100px 1fr;gap:20px;margin:8px 0}.meta span{color:#8f9bad}section{border-top:1px solid #2e3846;padding:34px 0}section header{display:flex;gap:20px;align-items:center}section header>b{font-size:2rem;color:#b9ff66}section header>div{display:flex;align-items:center;gap:12px}h2{margin:0}header span,.attempt strong{text-transform:uppercase;font-size:.7rem;letter-spacing:.12em;border:1px solid #536071;padding:5px 8px;border-radius:999px}.attempt{margin:16px 0;padding:18px;border-radius:14px;background:#111925;border-left:4px solid #78869a}.attempt.verified{border-color:#b9ff66}.attempt.mismatch,.attempt.unsafe{border-color:#ff6a64}.attempt>div{display:flex;justify-content:space-between}.attempt span,.muted,small{color:#8f9bad}.attempt code{display:block;margin-top:12px;overflow-wrap:anywhere;font-size:.68rem;color:#a7b2c2}footer{padding:30px 0;color:#8f9bad}
  </style></head><body><p class="lime">REALITY, VERIFIED.</p><h1>Proof<br>Trail.</h1><div class="meta"><div><span>Case</span><b>${escapeHtml(caseData.title)}</b></div><div><span>Goal</span><b>${escapeHtml(caseData.goal)}</b></div><div><span>Status</span><b>${escapeHtml(caseData.status.toUpperCase())}</b></div><div><span>Updated</span><b>${escapeHtml(caseData.updatedAt)}</b></div></div>${steps}<footer>Generated locally by GroundStep · evidence hashes detect later file changes</footer></body></html>`;
}

export async function writeReports(root, caseData) {
  const output = path.join(caseDirectory(root, caseData.id), "reports");
  await mkdir(output, { recursive: true });
  const markdown = path.join(output, "proof-trail.md");
  const html = path.join(output, "proof-trail.html");
  await Promise.all([
    writeFile(markdown, renderMarkdown(caseData), "utf8"),
    writeFile(html, renderHtml(caseData), "utf8")
  ]);
  return { markdown, html };
}
