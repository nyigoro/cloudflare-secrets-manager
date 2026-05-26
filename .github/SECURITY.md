# Security Policy

## Reporting Security Issues

Please do not open a public issue for vulnerabilities, exposed credentials, or anything that may reveal private infrastructure.

Report security issues privately through GitHub Security Advisories:

https://github.com/nyigoro/cloudflare-secrets-manager/security/advisories/new

If GitHub advisories are unavailable, contact the repository owner directly through GitHub.

## What To Report

Please report:

- Accidental inclusion of real secrets in examples, templates, package artifacts, or releases.
- A workflow that can print or expose secret values.
- A bug that may upload secrets to the wrong Cloudflare environment.
- A package or release artifact that includes ignored secret files.
- A vulnerability in the helper scripts that could leak local credentials.

## What Not To Include

Do not include real secret values in a report.

If a secret has already been exposed, rotate it first. Then report the exposure with the value redacted.

## Supported Versions

Security fixes target the latest `2.x` release.

## Secret Exposure Checklist

If a secret is exposed:

1. Revoke or rotate it at the upstream provider.
2. Update the relevant local env file.
3. Run the secret sync or rotation workflow.
4. Verify the Worker still works.
5. Remove the exposed value from any public place where it appeared.
