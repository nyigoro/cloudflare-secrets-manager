function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("content-type", "application/json; charset=utf-8");

  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers,
  });
}

async function runScheduledJob(env) {
  if (typeof env.API_TOKEN !== "string" || env.API_TOKEN.length === 0) {
    throw new Error("Missing API_TOKEN secret.");
  }

  const endpoint = env.PUBLIC_API_BASE_URL || "https://api.example.com";
  const response = await fetch(`${endpoint}/scheduled-check`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.API_TOKEN}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      environment: env.ENVIRONMENT || "production",
      checkedAt: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Scheduled job failed with HTTP ${response.status}.`);
  }
}

export default {
  async fetch(_request, env) {
    return json({
      ok: true,
      service: "scheduled-worker-template",
      environment: env.ENVIRONMENT || "production",
    });
  },

  async scheduled(_event, env, ctx) {
    ctx.waitUntil(runScheduledJob(env));
  },
};
