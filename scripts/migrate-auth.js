const fs = require("fs");
const path = require("path");

const baseDir = "src/pages/api";

function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);

    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
      return;
    }

    if (!file.endsWith(".ts")) return;

    let content = fs.readFileSync(fullPath, "utf8");

    // 1. Replace verifyToken imports
    content = content.replace(
      /import\s+.*verifyToken.*from\s+["']@\/lib\/auth["'];?/g,
      `import { withAuth } from "@/lib/middleware/withAuth";`
    );

    // 2. Replace hasPermission imports
    content = content.replace(
      /import\s+.*hasPermission.*from\s+["']@\/lib\/auth["'];?/g,
      `import { withPermission } from "@/lib/middleware/withPermission";`
    );

    fs.writeFileSync(fullPath, content);
    console.log("Migrated:", fullPath);
  });
}

walk(baseDir);
console.log("DONE MIGRATION");