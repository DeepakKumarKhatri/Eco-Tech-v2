import http from "http";
import url from "url";
import fs from "fs";
import path from "path";
import cookie from "cookie";

const PORT = 8000;

// Helper function to get MIME type
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

// Create server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const route = parsedUrl.pathname;

  console.log(`[${req.method}] ${route}`);

  // Serve static files or route requests
  if (route === "/") {
    serveStaticFile(path.join(process.cwd(), "views", "index.html"), res);
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

// Start server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
