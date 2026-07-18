import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, readdir, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export function resolveGroundStepRoot(repo = process.cwd()) {
  return path.resolve(repo, ".groundstep");
}

function safeId(value) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{1,79}$/.test(value)) throw new Error("Case id contains unsupported characters.");
  return value;
}

export function caseDirectory(root, caseId) {
  return path.join(path.resolve(root), "cases", safeId(caseId));
}

export async function saveCase(root, caseData) {
  const dir = caseDirectory(root, caseData.id);
  await mkdir(dir, { recursive: true });
  const destination = path.join(dir, "case.json");
  const temporary = `${destination}.tmp`;
  await writeFile(temporary, `${JSON.stringify(caseData, null, 2)}\n`, "utf8");
  await rename(temporary, destination);
  return destination;
}

export async function loadCase(root, caseId) {
  const file = path.join(caseDirectory(root, caseId), "case.json");
  return JSON.parse(await readFile(file, "utf8"));
}

export async function listCases(root) {
  const casesDir = path.join(path.resolve(root), "cases");
  let entries;
  try {
    entries = await readdir(casesDir, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const cases = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    try {
      cases.push(await loadCase(root, entry.name));
    } catch {
      // Ignore incomplete folders so one interrupted write cannot hide healthy cases.
    }
  }
  return cases.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function storeEvidence(root, caseId, sourcePath, at = new Date()) {
  const source = path.resolve(sourcePath);
  const info = await stat(source);
  if (!info.isFile()) throw new Error("Evidence must be a file.");
  const bytes = await readFile(source);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const evidenceDir = path.join(caseDirectory(root, caseId), "evidence");
  await mkdir(evidenceDir, { recursive: true });
  const cleanName = path.basename(source).replace(/[^a-zA-Z0-9._-]/g, "-");
  const filename = `${at.toISOString().replace(/[:.]/g, "-")}-${sha256.slice(0, 10)}-${cleanName}`;
  const destination = path.join(evidenceDir, filename);
  await copyFile(source, destination);
  return {
    filename,
    originalName: path.basename(source),
    sha256,
    bytes: info.size,
    relativePath: `evidence/${filename}`
  };
}
