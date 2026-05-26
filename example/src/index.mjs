function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("content-type", "application/json; charset=utf-8");

  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const secretPresent =
      typeof env.LIVE_TEST_SECRET === "string" && env.LIVE_TEST_SECRET.length > 0;

    if (url.pathname === "/") {
      return json({
        ok: true,
        service: "cloudflare-secrets-live-example",
        secretPresent,
        checkEndpoint: "/check?expected=hello-from-cloudflare",
      });
    }

    if (url.pathname === "/check") {
      if (!secretPresent) {
        return json(
          {
            ok: false,
            secretPresent: false,
            message: "LIVE_TEST_SECRET is missing. Sync secrets and redeploy.",
          },
          { status: 500 }
        );
      }

      const expected = url.searchParams.get("expected");

      if (!expected) {
        return json({
          ok: true,
          secretPresent: true,
          matchesExpected: null,
          message: "LIVE_TEST_SECRET is available. Add ?expected=... to compare values without returning the secret.",
        });
      }

      const matchesExpected = env.LIVE_TEST_SECRET === expected;

      return json(
        {
          ok: matchesExpected,
          secretPresent: true,
          matchesExpected,
        },
        { status: matchesExpected ? 200 : 400 }
      );
    }

    return json(
      {
        ok: false,
        message: 'Not found. Try "/" or "/check?expected=..."',
      },
      { status: 404 }
    );
  },
};
