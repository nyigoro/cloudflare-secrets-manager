import https from "node:https";

const [workerUrl, expectedSecret] = process.argv.slice(2);

if (!workerUrl || !expectedSecret) {
  console.error("Usage: node example/live-test.mjs <worker-url> <expected-secret>");
  console.error(
    "Example: node example/live-test.mjs https://cloudflare-secrets-live-example.<subdomain>.workers.dev hello-from-cloudflare"
  );
  process.exit(1);
}

const targetUrl = new URL("/check", workerUrl);
targetUrl.searchParams.set("expected", expectedSecret);

console.log(`Checking deployed Worker at ${targetUrl.toString()}`);

https
  .get(targetUrl, (response) => {
    let body = "";

    response.setEncoding("utf8");
    response.on("data", (chunk) => {
      body += chunk;
    });

    response.on("end", () => {
      if (body) {
        console.log(body);
      }

      if (response.statusCode && response.statusCode >= 400) {
        process.exitCode = 1;
      }
    });
  })
  .on("error", (error) => {
    console.error(error.message);
    process.exit(1);
  });
