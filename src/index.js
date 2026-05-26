function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("content-type", "application/json; charset=utf-8");

  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers,
  });
}

function hasSecret(value) {
  return typeof value === "string" && value.length > 0;
}

function parseBooleanFlag(value) {
  if (typeof value !== "string") {
    return false;
  }

  switch (value.trim().toLowerCase()) {
    case "1":
    case "true":
    case "yes":
    case "on":
      return true;
    default:
      return false;
  }
}

function getPublicConfig(env) {
  return {
    appName: env.PUBLIC_APP_NAME || "Cloudflare Secrets Manager",
    apiBaseUrl: env.PUBLIC_API_BASE_URL || null,
    environment: env.ENVIRONMENT || "production",
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const config = getPublicConfig(env);
    const features = {
      signupsEnabled: parseBooleanFlag(env.FEATURE_SIGNUPS_ENABLED),
    };

    if (url.pathname === "/") {
      return json({
        ok: true,
        service: "cloudflare-secrets-manager-template",
        config,
        features,
        endpoints: {
          health: "/health",
          config: "/config",
          features: "/features",
        },
        message: "Replace src/index.js with your Worker logic. This template reads both secrets and plaintext variables from env.",
      });
    }

    if (url.pathname === "/health") {
      return json({
        ok: true,
        environment: config.environment,
        configured: Boolean(config.apiBaseUrl),
        secretsPresent: {
          mySecretKey: hasSecret(env.MY_SECRET_KEY),
          databaseUrl: hasSecret(env.DATABASE_URL),
          jwtSecret: hasSecret(env.JWT_SECRET),
        },
      });
    }

    if (url.pathname === "/config") {
      return json({
        ok: true,
        config,
      });
    }

    if (url.pathname === "/features") {
      return json({
        ok: true,
        features,
      });
    }

    return json(
      {
        ok: false,
        message: 'Not found. Try "/", "/health", "/config", or "/features".',
      },
      { status: 404 }
    );
  },
};
