import { existsSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { parseEnv } from "node:util";

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const separatorIndex = argv.indexOf("--");
  const localArgs = separatorIndex === -1 ? argv : argv.slice(0, separatorIndex);
  const passthroughArgs = separatorIndex === -1 ? [] : argv.slice(separatorIndex + 1);
  const options = {
    config: "",
    env: null,
    varsFile: "",
    keepVars: false,
    dryRun: false,
    passthroughArgs,
  };

  for (let index = 0; index < localArgs.length; index += 1) {
    const arg = localArgs[index];

    switch (arg) {
      case "--config":
        options.config = localArgs[index + 1] || fail("Missing value for --config");
        index += 1;
        break;
      case "--env":
        if (index + 1 >= localArgs.length) {
          fail("Missing value for --env");
        }
        options.env = localArgs[index + 1];
        index += 1;
        break;
      case "--vars-file":
        options.varsFile = localArgs[index + 1] || fail("Missing value for --vars-file");
        index += 1;
        break;
      case "--keep-vars":
        options.keepVars = true;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      default:
        fail(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function loadVars(varsFile) {
  if (!varsFile) {
    return {};
  }

  if (!existsSync(varsFile)) {
    console.log(`No vars file found at ${varsFile}. Deploying without additional plaintext variables.`);
    return {};
  }

  const raw = readFileSync(varsFile, "utf8");
  const parsed = parseEnv(raw);

  console.log(`Applying ${Object.keys(parsed).length} plaintext variable(s) from ${varsFile}:`);
  for (const key of Object.keys(parsed)) {
    console.log(`- ${key}`);
  }

  return parsed;
}

function resolveWranglerCommand() {
  const localWrangler = path.resolve(
    process.cwd(),
    "node_modules",
    ".bin",
    process.platform === "win32" ? "wrangler.cmd" : "wrangler"
  );

  if (existsSync(localWrangler)) {
    return [localWrangler];
  }

  return ["npx", "wrangler"];
}

function quoteForShell(value) {
  const text = String(value);

  if (process.platform === "win32") {
    return `"${text.replace(/"/g, '""').replace(/%/g, "%%")}"`;
  }

  return `'${text.replace(/'/g, `'\\''`)}'`;
}

const options = parseArgs(process.argv.slice(2));
const vars = loadVars(options.varsFile);
const commandParts = [...resolveWranglerCommand()];

if (options.config) {
  commandParts.push("--config", options.config);
}

commandParts.push("--env", options.env ?? "");

commandParts.push("deploy");

for (const [key, value] of Object.entries(vars)) {
  commandParts.push("--var", `${key}:${value}`);
}

if (options.keepVars) {
  commandParts.push("--keep-vars");
}

if (options.dryRun) {
  commandParts.push("--dry-run");
}

commandParts.push(...options.passthroughArgs);

const command = commandParts.map(quoteForShell).join(" ");

try {
  execSync(command, { stdio: "inherit" });
} catch (error) {
  process.exit(error.status ?? 1);
}
