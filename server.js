import http from "http";
import url from "url";
import fs from "fs";
import path from "path";
import cookie from "cookie";
import { signin, signout, signup } from "./services/security.js";
import {
  userInformation,
  changeUserInformation,
} from "./services/system_user.js";
import formidable from "formidable";
import {
  allPickupRequests,
  changeItemInformation,
  createPickupRequest,
  deletePickupRequest,
  dynamicSearch,
  getPrizeForUser,
  newRecycleItem,
  recycleHistoryMetrics,
  recyleItem,
  recyleItems,
  removeRecyleItem,
  systemPrizes,
  userPrizes,
  userUsedPrizes,
} from "./services/user_recycle.js";

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

const parseFormData = (req, callback) => {
  const form = formidable({ multiples: true }); // Allow multiple files if needed

  form.parse(req, (err, fields, files) => {
    if (err) {
      callback(err, null, null);
    } else {
      callback(null, fields, files);
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
  } else if (route === "/get-user" && method === "GET") {
    userInformation(req, res);
  } else if (route === "/update-user" && method === "PUT") {
    parseFormData(req, (err, fields, files) => {
      if (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Error parsing form data" }));
      }
      changeUserInformation({ ...fields, image: files.image }, req, res);
    });
  } else if (route === "/items" && method === "GET") {
    recyleItems(req, res);
  } else if (route.startsWith("/item") && method === "GET") {
    recyleItem(req, res);
  } else if (route === "/new-item" && method === "POST") {
    parseFormData(req, (err, fields, files) => {
      if (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Error parsing form data" }));
      }
      newRecycleItem({ ...fields, image: files.image }, req, res);
    });
  } else if (route.startsWith("/remove-item") && method === "DELETE") {
    removeRecyleItem(req, res);
  } else if (route.startsWith("/update-item") && method === "PUT") {
    parseFormData(req, (err, fields, files) => {
      if (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Error parsing form data" }));
      }
      changeItemInformation({ ...fields }, req, res);
    });
  } else if (route.startsWith("/recycle-history-metrics") && method === "GET") {
    recycleHistoryMetrics(req, res);
  } else if (route.startsWith("/system-prizes") && method === "GET") {
    systemPrizes(req, res);
  } else if (route.startsWith("/user-prizes") && method === "GET") {
    userPrizes(req, res);
  } else if (route.startsWith("/get-user-prize") && method === "POST") {
    getPrizeForUser(req, res);
  } else if (route.startsWith("/user-prize-history") && method === "GET") {
    userUsedPrizes(req, res);
  } else if (route.startsWith("/dyanmic-search") && method === "GET") {
    dynamicSearch(req, res);
  } else if (route.startsWith("/all-pickup-requests") && method === "GET") {
    allPickupRequests(req, res);
  } else if (
    route.startsWith("/delete-pickup-request") &&
    method === "DELETE"
  ) {
    deletePickupRequest(req, res);
  } else if (route === "/create-pickup-request" && method === "POST") {
    parseJSONBody(req, (err, body) => {
      if (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
      createPickupRequest(body, req, res);
    });
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
