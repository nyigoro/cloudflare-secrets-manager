function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("content-type", "application/json; charset=utf-8");

  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers,
  });
}

function present(value) {
  return typeof value === "string" && value.length > 0;
}

function flag(value) {
  return ["1", "true", "yes", "on"].includes(String(value || "").toLowerCase());
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return json({
        ok: true,
        environment: env.ENVIRONMENT || "production",
        secrets: {
          apiToken: present(env.API_TOKEN),
          jwtSecret: present(env.JWT_SECRET),
          databaseUrl: present(env.DATABASE_URL),
        },
      });
    }

    if (url.pathname === "/config") {
      return json({
        ok: true,
        appName: env.PUBLIC_APP_NAME || "Worker",
        apiBaseUrl: env.PUBLIC_API_BASE_URL || null,
        docsUrl: env.PUBLIC_DOCS_URL || null,
        features: {
          signups: flag(env.FEATURE_SIGNUPS_ENABLED),
          betaDashboard: flag(env.FEATURE_BETA_DASHBOARD),
          readonlyMode: flag(env.FEATURE_READONLY_MODE),
        },
      });
    }

    return json(
      {
        ok: false,
        message: 'Not found. Try "/health" or "/config".',
      },
      { status: 404 }
    );
  },
};
