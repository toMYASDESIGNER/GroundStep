import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { caseSummary } from "./engine.mjs";
import { caseDirectory, listCases, loadCase } from "./store.mjs";

const srcDir = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.resolve(srcDir, "..", "web");

const mime = new Map([
  [".html", "text/html; charset=utf-8"], [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"], [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"], [".png", "image/png"], [".jpg", "image/jpeg"], [".jpeg", "image/jpeg"]
]);

function json(response, body, status = 200) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  response.end(JSON.stringify(body));
}

async function serveFile(response, file) {
  const info = await stat(file);
  response.writeHead(200, { "content-type": mime.get(path.extname(file)) || "application/octet-stream", "content-length": info.size });
  createReadStream(file).pipe(response);
}

export function createGroundStepServer({ root }) {
  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url, "http://groundstep.local");
      if (url.pathname === "/api/cases") {
        const cases = await listCases(root);
        return json(response, cases.map(caseSummary));
      }
      const caseMatch = url.pathname.match(/^\/api\/cases\/([^/]+)$/);
      if (caseMatch) return json(response, await loadCase(root, decodeURIComponent(caseMatch[1])));

      const evidenceMatch = url.pathname.match(/^\/evidence\/([^/]+)\/(.+)$/);
      if (evidenceMatch) {
        const caseId = decodeURIComponent(evidenceMatch[1]);
        const filename = path.basename(decodeURIComponent(evidenceMatch[2]));
        return serveFile(response, path.join(caseDirectory(root, caseId), "evidence", filename));
      }

      const asset = url.pathname === "/" ? "index.html" : path.basename(url.pathname);
      const candidate = path.join(webDir, asset);
      try {
        return await serveFile(response, candidate);
      } catch {
        const index = await readFile(path.join(webDir, "index.html"));
        response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        response.end(index);
      }
    } catch (error) {
      json(response, { error: error.message }, 500);
    }
  });
}

export async function startServer({ root, port = 4190, host = "127.0.0.1" }) {
  const server = createGroundStepServer({ root });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, resolve);
  });
  return server;
}
