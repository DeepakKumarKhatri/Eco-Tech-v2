import http from "http";
import url from "url";
import fs from "fs";
import path from "path";
import cookie from "cookie";
import { signin, signout, signup } from "./services/security.js";

const PORT = 8000;

const getMimeType = (ext) => {
  const mimeTypes = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".ico": "image/x-icon",
    ".json": "application/json",
  };
  return mimeTypes[ext] || "application/octet-stream";
};

const serveStaticFile = (filePath, res) => {
  const ext = path.extname(filePath);
  const mimeType = getMimeType(ext);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404: File Not Found");
    } else {
      res.writeHead(200, { "Content-Type": mimeType });
      res.end(data);
    }
  });
};

const parseJSONBody = (req, callback) => {
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    try {
      const parsed = JSON.parse(body);
      callback(null, parsed);
    } catch (err) {
      callback(err);
    }
  });
};

// Create server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const route = parsedUrl.pathname;
  const method = req.method;

  console.log(`[${req.method}] ${route}`);

  // Serve static files or route requests
  if (route === "/") {
    serveStaticFile(path.join(process.cwd(), "views", "index.html"), res);
  } else if (route === "/signup" && method === "POST") {
    parseJSONBody(req, (err, body) => {
      if (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
      signup(body, req, res);
    });
  } else if (route === "/signin" && method === "POST") {
    parseJSONBody(req, (err, body) => {
      if (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
      signin(body, req, res);
    });
  } else if (route === "/signout" && method === "POST") {
    signout(req, res);
  } else {
    const filePath = path.join(process.cwd(), "views", route);

    // Check if the requested file exists
    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404: File Not Found");
      } else {
        serveStaticFile(filePath, res);
      }
    });
  }
});

server.listen(PORT, () => {
  const link = `\x1b[36mhttp://localhost:${PORT}\x1b[0m`;
  console.log(`Server running on ${link}`);
});
