/** Static check: nothing under src/private may touch the database, the file system, or log content. */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const dir = path.resolve(__dirname, "../private");
const forbidden: [RegExp, string][] = [
  [/supabase/i, "database access"],
  [/from\s+["'](?:node:)?fs(?:\/promises)?["']/, "file system access"],
  [/\b(?:writeFile|appendFile|createWriteStream)\b/, "file writes"],
  [/\bconsole\.(?:log|info|debug|warn|error)\b/, "logging"],
];

let bad = 0;
for (const f of readdirSync(dir).filter((n) => n.endsWith(".ts"))) {
  const lines = readFileSync(path.join(dir, f), "utf8").split("\n");
  lines.forEach((line, i) => {
    // Comments may describe the rules, so skip them.
    if (/^\s*(\/\/|\/\*|\*)/.test(line)) return;
    for (const [re, what] of forbidden) {
      if (re.test(line)) {
        bad++;
        console.log(`FAIL  src/private/${f}:${i + 1}  ${what}: ${line.trim()}`);
      }
    }
  });
}
console.log(bad === 0 ? "PASS  src/private keeps nothing (no db, no fs, no logging)" : `${bad} violation(s)`);
process.exit(bad === 0 ? 0 : 1);
