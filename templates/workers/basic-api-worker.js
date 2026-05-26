function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("content-type", "application/json; charset=utf-8");

  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers,
  });
}

function requireSecret(env, name) {
  const value = env[name];

  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing required secret: ${name}`);
  }

  return value;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return json({
        ok: true,
        environment: env.ENVIRONMENT || "production",
        apiTokenConfigured: typeof env.API_TOKEN === "string" && env.API_TOKEN.length > 0,
      });
    }

    if (url.pathname === "/proxy") {
      const apiToken = requireSecret(env, "API_TOKEN");
      const upstreamUrl = `${env.PUBLIC_API_BASE_URL || "https://api.example.com"}/status`;
      const upstream = await fetch(upstreamUrl, {
        headers: {
          authorization: `Bearer ${apiToken}`,
        },
      });

      return new Response(upstream.body, {
        status: upstream.status,
        headers: upstream.headers,
      });
    }

    return json(
      {
        ok: false,
        message: 'Not found. Try "/health" or "/proxy".',
      },
      { status: 404 }
    );
  },
};
