import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const options = { varsFile: "" };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    switch (arg) {
      case "--vars-file":
        options.varsFile = argv[index + 1] || fail("Missing value for --vars-file");
        index += 1;
        break;
      default:
        fail(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

const options = parseArgs(process.argv.slice(2));

if (!options.varsFile) {
  fail("Pass --vars-file <path>.");
}

if (!existsSync(options.varsFile)) {
  console.log(`No vars file found at ${options.varsFile}.`);
  console.log("Create it if you want deploy-time plain-text variables.");
  process.exit(0);
}

const parsed = parseEnv(readFileSync(options.varsFile, "utf8"));
const keys = Object.keys(parsed);

console.log(`Variables from ${options.varsFile}:`);

if (keys.length === 0) {
  console.log("(none)");
  process.exit(0);
}

for (const key of keys) {
  console.log(`${key}=${parsed[key]}`);
}
