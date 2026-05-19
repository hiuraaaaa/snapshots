const https = require("https");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

async function post(host, p, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const req = https.request(
      { hostname: host, path: p, method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } },
      (res) => {
        let raw = "";
        res.on("data", (c) => (raw += c));
        res.on("end", () => resolve(JSON.parse(raw)));
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function stream(host, p, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    let full = "";
    const req = https.request(
      { hostname: host, path: p, method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } },
      (res) => {
        res.on("data", (chunk) => {
          chunk.toString().split("\n").filter(Boolean).forEach((line) => {
            try {
              const j = JSON.parse(line);
              const text = j.choices?.[0]?.delta?.content;
              if (text) {
                process.stdout.write(text);
                full += text;
              }
            } catch {}
          });
        });
        res.on("end", () => resolve(full));
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function parseFiles(output) {
  const files = [];
  const regex = /```(?:tsx|ts|js|jsx|css|json|html)\{path=([^}]+)\}\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(output)) !== null) {
    files.push({ path: match[1], content: match[2] });
  }
  return files;
}

function writeFiles(files, outDir) {
  for (const file of files) {
    const full = path.join(outDir, file.path);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, file.content);
  }
}

async function main() {
  const prompt = process.argv.slice(2).join(" ") || "landing page";
  const slug = prompt.replace(/\s+/g, "-").toLowerCase().slice(0, 30);
  const outDir = path.join(process.cwd(), `output-${slug}`);
  const zipPath = `${outDir}.zip`;

  process.stdout.write(`\x1b[36m⟳ Prompt: ${prompt}\x1b[0m\n`);

  const { chatId, lastMessageId } = await post("llamacoder.together.ai", "/api/create-chat", {
    prompt,
    model: "zai-org/GLM-5",
    quality: "low",
  });

  process.stdout.write(`\x1b[32m✓ Chat: ${chatId}\x1b[0m\n\n`);
  process.stdout.write("\x1b[33m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n\n");

  const output = await stream(
    "llamacoder.together.ai",
    "/api/get-next-completion-stream-promise",
    { messageId: lastMessageId, model: "zai-org/GLM-5" }
  );

  process.stdout.write("\n\n\x1b[33m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n\n");

  const files = parseFiles(output);

  if (files.length === 0) {
    process.stdout.write("\x1b[31m✗ No files parsed from output\x1b[0m\n");
    process.exit(1);
  }

  process.stdout.write(`\x1b[36m⟳ Writing ${files.length} file(s)...\x1b[0m\n`);
  fs.mkdirSync(outDir, { recursive: true });
  writeFiles(files, outDir);

  process.stdout.write(`\x1b[36m⟳ Zipping...\x1b[0m\n`);
  execSync(`zip -r "${zipPath}" "${path.basename(outDir)}"`, { cwd: process.cwd() });
  fs.rmSync(outDir, { recursive: true, force: true });

  process.stdout.write(`\x1b[32m✓ Done → ${zipPath}\x1b[0m\n`);
  files.forEach((f) => process.stdout.write(`  \x1b[90m${f.path}\x1b[0m\n`));
}

main().catch((e) => { process.stderr.write(e.message + "\n"); process.exit(1); });
