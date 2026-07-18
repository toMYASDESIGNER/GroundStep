const elements = {
  caseId: document.querySelector("#caseId"), caseTitle: document.querySelector("#caseTitle"),
  caseGoal: document.querySelector("#caseGoal"), meterFill: document.querySelector("#meterFill"),
  verifiedCount: document.querySelector("#verifiedCount"), attemptCount: document.querySelector("#attemptCount"),
  blockCount: document.querySelector("#blockCount"), steps: document.querySelector("#steps"),
  heroStatus: document.querySelector("#heroStatus"), replayButton: document.querySelector("#replayButton")
};

const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[char]);

function attemptTemplate(caseId, attempt, index) {
  const image = attempt.evidence?.filename ? `<img src="/evidence/${encodeURIComponent(caseId)}/${encodeURIComponent(attempt.evidence.filename)}" alt="Submitted evidence">` : "";
  return `<article class="attempt" data-attempt="${index}"><div class="attempt-main"><div class="attempt-image">${image}</div><div class="attempt-copy"><div class="attempt-top"><span class="verdict ${escapeHtml(attempt.verdict)}">${escapeHtml(attempt.verdict)}</span><span class="confidence">${Math.round(attempt.confidence * 100)}% CONFIDENCE</span></div><p>${escapeHtml(attempt.observed)}</p><small>${escapeHtml(attempt.reason)}</small><div class="hash">SHA-256 / ${escapeHtml(attempt.evidence?.sha256 ?? "NO HASH")}</div></div></div></article>`;
}

function stepTemplate(caseId, step, index, attemptOffset) {
  return `<article id="step-${escapeHtml(step.id)}" class="step ${escapeHtml(step.status)}"><div class="step-index">${String(index + 1).padStart(2,"0")}</div><div class="step-content"><div class="step-head"><h4>${escapeHtml(step.title)}</h4><span class="badge ${escapeHtml(step.status)}">${escapeHtml(step.status)}</span></div><p class="step-instruction">${escapeHtml(step.instruction)}</p><div class="expected"><span>Expected proof</span><b>${escapeHtml(step.expectedEvidence)}</b></div><div class="attempts">${step.attempts.map((attempt, i) => attemptTemplate(caseId, attempt, attemptOffset + i)).join("")}</div></div></article>`;
}

function render(data) {
  const attempts = data.steps.flatMap((step) => step.attempts);
  const verified = data.steps.filter((step) => step.status === "verified").length;
  const blocked = attempts.filter((attempt) => ["mismatch","uncertain","unsafe"].includes(attempt.verdict)).length;
  elements.caseId.textContent = data.id;
  elements.caseTitle.textContent = data.title;
  elements.caseGoal.textContent = data.goal;
  elements.verifiedCount.textContent = verified;
  elements.attemptCount.textContent = attempts.length;
  elements.blockCount.textContent = blocked;
  elements.meterFill.style.width = `${(verified / data.steps.length) * 100}%`;
  elements.heroStatus.textContent = data.status === "complete" ? "Every step verified — case complete" : `Waiting for proof: ${data.currentStepId}`;
  let offset = 0;
  elements.steps.innerHTML = data.steps.map((step, index) => {
    const html = stepTemplate(data.id, step, index, offset);
    offset += step.attempts.length;
    return html;
  }).join("");
}

async function load() {
  const cases = await fetch("/api/cases").then((response) => response.json());
  if (!cases.length) throw new Error("Run npm run demo:seed first.");
  const data = await fetch(`/api/cases/${encodeURIComponent(cases[0].id)}`).then((response) => response.json());
  render(data);
  if (location.hash) requestAnimationFrame(() => document.querySelector(location.hash)?.scrollIntoView({ block: "start" }));
}

elements.replayButton.addEventListener("click", async () => {
  const attempts = [...document.querySelectorAll(".attempt")];
  elements.replayButton.disabled = true;
  attempts.forEach((attempt) => { attempt.style.visibility = "hidden"; attempt.classList.remove("reveal"); });
  for (const attempt of attempts) {
    await new Promise((resolve) => setTimeout(resolve, 520));
    attempt.style.visibility = "visible";
    attempt.classList.add("reveal");
    attempt.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  elements.replayButton.disabled = false;
});

document.querySelector("#themeButton").addEventListener("click", () => document.body.classList.toggle("high-contrast"));

load().catch((error) => {
  elements.heroStatus.textContent = error.message;
  elements.steps.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
});
