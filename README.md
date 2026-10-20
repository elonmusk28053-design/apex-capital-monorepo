Apex Capital Monorepo

Apex Capital is a monorepo for building investment-platform web experiences and supporting services. This repository is intended to provide a maintainable foundation for application development, automated quality checks, security controls, and release verification.

«Release status: NO_GO — pending verification.

Repository documentation is available. The completeness of the application source, workspace configuration, automated tests, security controls, and deployment setup must be established from the actual repository and successful verification results. Do not interpret this README as evidence of a completed or production-ready website.»

1. Project objectives

The repository should provide:

- A clearly structured application and service workspace.
- Reproducible dependency installation and builds.
- Automated tests, linting, and type checking.
- Security checks for dependencies, configuration, and API boundaries.
- Environment-specific configuration without committed secrets.
- Auditable release evidence and controlled deployment procedures.
- A clean-room verification process that detects reliance on untracked local files.

Implement only the workspaces and services that are actually present in the repository. Do not document unimplemented features as operational.

2. Prerequisites

Use a compatible development environment with:

- Windows 11, macOS, or Linux.
- Git.
- Node.js 20 LTS or a currently supported LTS release compatible with the project.
- The npm version required by the repository's "package.json".

Check the installed tools:

node --version
npm --version
git --version

If the repository declares a specific Node.js version, follow that declaration rather than assuming that every newer version is compatible.

3. Clone the repository

git clone https://github.com/elonmusk28053-design/apex-capital-monorepo.git
Set-Location apex-capital-monorepo

Inspect the repository before installing dependencies:

git status --short
git branch --show-current
Get-ChildItem -Force

Confirm that the expected "package.json", lockfile, workspace configuration, source directories, and test configuration actually exist.

4. Install dependencies

For reproducible installation, use "npm ci" when a valid, committed "package-lock.json" is present and consistent with "package.json":

npm ci

If the package manifest or lockfile is missing, stop and correct the repository setup before proceeding. Do not generate or modify a lockfile silently as part of release verification.

Never commit ".env" files containing real credentials, API tokens, private keys, or production data.

5. Development and verification

Run only scripts that are defined in the checked-out project's "package.json".

npm run

If the corresponding scripts exist, use:

npm run dev
npm run lint
npm run typecheck
npm test
npm run build

A missing script is a repository configuration gap, not a successful check. Record unavailable checks explicitly and do not mark them as passed.

Required verification outcomes

Check| Acceptance requirement
Dependency installation| Clean installation succeeds using the committed lockfile
Linting| No unresolved lint errors
Type checking| No unresolved type errors
Unit and integration tests| Required tests pass
Production build| Build completes and generated artifacts are inspected
Security checks| Relevant security tests and dependency checks pass
Configuration| Required variables are documented and supplied securely
Release evidence| Results are traceable to the reviewed commit
Deployment| Performed only after explicit release authorization

6. Clean-room verification on Windows

Run the following in PowerShell to test a fresh clone independently of the existing working directory.

$ErrorActionPreference = "Stop"

$repoUrl = "https://github.com/elonmusk28053-design/apex-capital-monorepo.git"
$workspace = Join-Path $env:TEMP "apex-capital-clean-room"

if (Test-Path $workspace) {
    Remove-Item $workspace -Recurse -Force
}

git clone $repoUrl $workspace

if ($LASTEXITCODE -ne 0) {
    throw "Git clone failed."
}

Set-Location $workspace

if (-not (Test-Path "package.json")) {
    throw "package.json is missing. Application build verification cannot proceed."
}

if (-not (Test-Path "package-lock.json")) {
    throw "package-lock.json is missing. Reproducible npm ci verification cannot proceed."
}

npm ci
if ($LASTEXITCODE -ne 0) { throw "Dependency installation failed." }

npm run
if ($LASTEXITCODE -ne 0) { throw "Unable to enumerate npm scripts." }

npm run lint
if ($LASTEXITCODE -ne 0) { throw "Lint verification failed." }

npm run typecheck
if ($LASTEXITCODE -ne 0) { throw "Type-check verification failed." }

npm test
if ($LASTEXITCODE -ne 0) { throw "Test verification failed." }

npm run build
if ($LASTEXITCODE -ne 0) { throw "Production build verification failed." }

Write-Host "All explicitly invoked verification commands passed."

Important: This strict script assumes that "lint", "typecheck", "test", and "build" scripts exist. If the repository uses different script names, update the verification commands to match the actual manifest and document the change. Do not treat a missing command as a pass.

For stronger release evidence, capture the commit SHA, tool versions, command results, test summaries, and build artifact hashes. Keep logs free of secrets.

7. Security requirements

Secrets and configuration

- Keep credentials out of source control, client-side bundles, logs, and documentation.
- Store CI/CD credentials in the platform's encrypted secret store.
- Provide local configuration through ignored environment files or an approved secret manager.
- Validate required configuration at application startup.
- Fail closed when security-critical configuration is missing or invalid.
- Rotate exposed credentials through the authorized provider workflow.

Application and API security

As applicable to implemented services:

- Validate untrusted input at API boundaries using explicit schemas.
- Enforce authentication and authorization on protected operations.
- Configure CORS with an explicit allowlist of trusted origins.
- Use secure session handling, appropriate CSRF protections, and safe cookie attributes.
- Apply rate limits and bounded timeouts to sensitive or resource-intensive operations.
- Avoid logging credentials, session tokens, personal financial information, or other sensitive data.
- Use parameterized database operations and reviewed migrations.
- Test failure paths as well as successful requests.
- Pin third-party CI actions to verified immutable revisions when supported by the platform and maintain an update process.

Security controls must be confirmed in source and tests; their presence in this checklist is not evidence that they have been implemented.

8. Continuous integration

The CI workflow should be the authoritative record of automated verification for each reviewed commit.

At minimum, configure the checks appropriate to the implemented project:

1. Reproducible dependency installation.
2. Linting and type checking.
3. Unit and integration tests.
4. Production build verification.
5. Dependency and security checks.
6. Upload or retention of relevant test and build evidence.

Use least-privilege workflow permissions. Keep optional telemetry non-blocking and separate from the actual quality gates. Never allow a failed required security check to appear as a successful release.

Avoid duplicating existing workflows; inspect and improve the current pipeline before introducing another.

9. Environment and deployment policy

Keep development, staging, and production configurations separate.

Before any deployment:

- [ ] Confirm the exact commit intended for release.
- [ ] Verify a clean dependency installation.
- [ ] Pass linting and type checking.
- [ ] Pass the required test suite.
- [ ] Inspect the production build.
- [ ] Validate configuration and secret availability without exposing values.
- [ ] Verify authentication, authorization, and critical application flows.
- [ ] Review relevant security findings and release evidence.
- [ ] Confirm the rollback and incident-response procedures.
- [ ] Obtain explicit release authorization.

After an authorized deployment, verify HTTPS, application health, critical user flows, error logs, and monitoring.

Current policy: Do not deploy, migrate production databases, change DNS, purchase domains, or alter production secrets while the release remains on NO_GO or the necessary authorization is absent.

10. Financial-product accuracy

Because Apex Capital is intended for investment-platform experiences:

- Do not invent investment services, mining or staking availability, returns, licenses, regulatory approvals, affiliations, or partners.
- Clearly distinguish prototypes and simulated data from live financial data.
- Do not present simulated trades, balances, or performance as real account activity.
- Verify the applicable legal, regulatory, and provider requirements before enabling financial transactions or publishing claims.
- Keep marketing-only staging separate from real-money or production operations.

11. Troubleshooting

"npm ci" fails: Check that the lockfile is committed and consistent with "package.json", and confirm the supported Node.js and npm versions.

An npm script is missing: Inspect "package.json" and the available scripts. Add the missing implementation or correct the documentation; do not mark the check as passed.

Tests pass locally but fail in CI: Reproduce the run from a clean clone, check environment differences, and remove dependencies on untracked files or developer-specific configuration.

A secret is exposed: Stop using the affected credential and follow the authorized revocation and rotation process. Removing a secret from the latest commit alone does not invalidate it.

A security check fails: Preserve the evidence, identify the cause, correct the underlying issue, and rerun the affected checks before seeking release approval.

12. License and ownership

Copyright © Apex Capital.

All rights reserved unless a separate license file or written authorization specifies otherwise. Verify the repository's actual license and ownership terms before redistributing or incorporating third-party material.

---

Release declaration

This README describes the intended development and verification process. It does not certify that the application is complete, that security controls have passed, or that a production release is authorized.

Release decision: NO_GO pending repository inspection, successful verification, review of outstanding security and compliance requirements, and explicit authorization.
