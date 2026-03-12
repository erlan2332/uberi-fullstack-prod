import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const API_HOST = process.env.API_HOST || "127.0.0.1";
const API_PORT = Number(process.env.API_PORT || 8082);
const BUILD_DIR = path.join(__dirname, "build");
const INDEX_FILE = path.join(BUILD_DIR, "index.html");

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".xml": "application/xml; charset=utf-8",
};

function sendNotFound(response) {
  response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Not Found");
}

function sendServerError(response, message = "Internal Server Error") {
  response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
  response.end(message);
}

function serveStatic(requestPath, response) {
  let safePath = path.normalize(requestPath);
  if (safePath.startsWith("..")) {
    sendNotFound(response);
    return;
  }

  if (safePath === "/" || safePath === ".") {
    safePath = "/index.html";
  }

  let filePath = path.join(BUILD_DIR, safePath);
  if (!filePath.startsWith(BUILD_DIR)) {
    sendNotFound(response);
    return;
  }

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    filePath = INDEX_FILE;
  }

  const extension = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[extension] || "application/octet-stream";

  response.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": extension ? "public, max-age=300" : "no-cache",
  });

  fs.createReadStream(filePath)
    .on("error", () => sendServerError(response))
    .pipe(response);
}

function proxyApi(request, response) {
  const proxyRequest = http.request(
    {
      host: API_HOST,
      port: API_PORT,
      method: request.method,
      path: request.url,
      headers: {
        ...request.headers,
        host: `${API_HOST}:${API_PORT}`,
      },
    },
    (proxyResponse) => {
      response.writeHead(proxyResponse.statusCode || 502, proxyResponse.headers);
      proxyResponse.pipe(response);
    }
  );

  proxyRequest.on("error", () => {
    sendServerError(response, "API proxy error");
  });

  request.pipe(proxyRequest);
}

const server = http.createServer((request, response) => {
  if (!request.url) {
    sendNotFound(response);
    return;
  }

  if (request.url.startsWith("/api/")) {
    proxyApi(request, response);
    return;
  }

  const pathname = request.url.split("?")[0];
  serveStatic(pathname, response);
});

server.listen(PORT, () => {
  process.stdout.write(`Proxy server listening on http://localhost:${PORT}\n`);
});
