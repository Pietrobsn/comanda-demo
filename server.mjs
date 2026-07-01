import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

const root = process.cwd();
const host = "127.0.0.1";
const port = Number(process.env.PORT || 4173);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "content-type": type,
    "cache-control": "no-store"
  });
  res.end(body);
}

createServer(async (req, res) => {
  try {
    const requestPath = new URL(req.url || "/", `http://${host}`).pathname;
    const pathName = decodeURIComponent(requestPath === "/" ? "/index.html" : requestPath);
    const filePath = resolve(root, `.${pathName}`);
    const insideRoot = filePath === root || filePath.startsWith(`${root}${sep}`);

    if (!insideRoot) {
      send(res, 403, "Acesso negado.");
      return;
    }

    const body = await readFile(filePath);
    send(res, 200, body, mimeTypes[extname(filePath)] || "application/octet-stream");
  } catch {
    send(res, 404, "Arquivo nao encontrado.");
  }
}).listen(port, host, () => {
  console.log(`Comanda Demo rodando em http://${host}:${port}`);
});
