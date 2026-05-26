# Publishing And Release Guide

This guide describes how to publish the package and create a GitHub release.

## Package Name

The public npm package name is:

```text
cloudflare-secrets-manager
```

The GitHub repository is:

```text
https://github.com/nyigoro/cloudflare-secrets-manager
```

GitHub Packages previously used the scoped name:

```text
@nyigoro/cloudflare-secrets-manager
```

For the public npm registry, use the unscoped package name in `package.json`.

## Before Publishing

Check the working tree:

```bash
git status --short --branch
```

Check package contents:

```bash
npm pack --dry-run --registry=https://registry.npmjs.org
```

Confirm the package includes only public files.

Check npm authentication:

```bash
npm whoami --registry=https://registry.npmjs.org
```

Check the current published version:

```bash
npm view cloudflare-secrets-manager version --registry=https://registry.npmjs.org
```

## Versioning

Update `package.json` and `package-lock.json` together.

Patch release examples:

- Documentation only: `2.0.3`
- Small bug fix: `2.0.4`
- Backward-compatible feature: `2.1.0`
- Breaking change: `3.0.0`

Use npm's version command if you want npm to update both files:

```bash
npm version patch --no-git-tag-version
```

Then review the diff:

```bash
git diff -- package.json package-lock.json
```

## Publish To npm

Dry run:

```bash
npm publish --dry-run --registry=https://registry.npmjs.org
```

Publish:

```bash
npm publish --registry=https://registry.npmjs.org
```

If npm requires browser authentication or OTP, complete the prompt and rerun if needed.

Verify:

```bash
npm view cloudflare-secrets-manager name version license dist.tarball --registry=https://registry.npmjs.org
```

## Commit And Tag

Commit release changes:

```bash
git add .
git commit -m "Release vX.Y.Z"
```

Create an annotated tag:

```bash
git tag -a vX.Y.Z -m "Release vX.Y.Z"
```

Push:

```bash
git push origin main
git push origin vX.Y.Z
```

## Create A GitHub Release

Build the tarball:

```bash
npm pack
```

Create the release:

```bash
gh release create vX.Y.Z .\cloudflare-secrets-manager-X.Y.Z.tgz --title "cloudflare-secrets-manager vX.Y.Z" --notes "Release notes here."
```

Verify:

```bash
gh release view vX.Y.Z --json tagName,name,url,assets,isDraft,isPrerelease
```

## Post-Release Checks

Run:

```bash
git status --short --branch
npm view cloudflare-secrets-manager version license --registry=https://registry.npmjs.org
gh release view vX.Y.Z --json url,assets
```

If `npm pack` created a `.tgz` file locally, it should remain ignored by git.
