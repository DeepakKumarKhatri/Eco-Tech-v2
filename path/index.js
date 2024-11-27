import fs from "fs";
import path from "path";

export default (req, res) => {
  const filePath = path.join(process.cwd(), "views", "index.html");
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("500: Internal Server Error");
    } else {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(data);
    }
  });
};