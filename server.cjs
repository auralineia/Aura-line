const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const BACKEND = process.env.RIMAK_BACKEND_URL || "https://rimak.vercel.app";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8"
};

async function proxyApi(req, res, pathname) {
  const target = new URL(pathname + new URL(req.url, "http://localhost").search, BACKEND);
  const headers = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (!["host", "connection", "content-length"].includes(key)) headers[key] = value;
  }

  let body;
  if (req.method !== "GET" && req.method !== "HEAD") {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    body = Buffer.concat(chunks);
  }

  try {
    const response = await fetch(target, {
      method: req.method,
      headers,
      body: body && body.length ? body : undefined,
      redirect: "manual"
    });

    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      if (!["content-encoding", "transfer-encoding", "connection"].includes(key)) {
        res.setHeader(key, value);
      }
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    res.end(buffer);
  } catch (error) {
    console.error("RIMAK API proxy:", error);
    res.statusCode = 502;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: "Backend RIMAK indisponível no momento." }));
  }
}

function serveStatic(req, res, pathname) {
  let relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  if (relative.includes("..")) {
    res.statusCode = 400;
    return res.end("Bad request");
  }

  const file = path.join(ROOT, relative);
  fs.stat(file, (err, stat) => {
    if (!err && stat.isFile()) {
      const type = MIME[path.extname(file).toLowerCase()] || "application/octet-stream";
      res.setHeader("Content-Type", type);
      res.setHeader("Cache-Control", "no-cache");
      fs.createReadStream(file).pipe(res);
      return;
    }

    if (!path.extname(relative)) {
      const fallback = path.join(ROOT, "index.html");
      res.setHeader("Content-Type", MIME[".html"]);
      fs.createReadStream(fallback).pipe(res);
      return;
    }

    res.statusCode = 404;
    res.end("Not found");
  });
}

const server = http.createServer((req, res) => {
  const parsed = new URL(req.url, "http://localhost");

  if (parsed.pathname.startsWith("/api/")) {
    proxyApi(req, res, parsed.pathname);
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.statusCode = 405;
    return res.end("Method not allowed");
  }

  serveStatic(req, res, parsed.pathname);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("RIMAK running on port " + PORT);
});
