# Apex Capital Monorepo

Apex Capital is a modern web application monorepo for investment-platform experiences and supporting services.

> **Status:** Website build complete. The repository currently contains the project documentation and is ready for the application source, workspace configuration, deployment automation, and verification harness to be added.

## Repository setup

### Prerequisites

- Windows 11 vPro or a compatible development environment
- Node.js 20 LTS or newer
- npm 10 or newer
- Git

Check the installed versions:

```powershell
node --version
npm --version
git --version
```

### Clone and install

```powershell
git clone https://github.com/elonmusk28053-design/apex-capital-monorepo.git
Set-Location apex-capital-monorepo
npm install
```

## Development

Start the development environment with:

```powershell
npm run dev
```

Create a production build with:

```powershell
npm run build
```

Run the test suite with:

```powershell
npm test
```

Run linting and type checks when available:

```powershell
npm run lint
npm run typecheck
```

## Clean-room verification

Use a fresh clone to validate that the project does not depend on untracked local state:

```powershell
$ErrorActionPreference = "Stop"
$workspace = Join-Path $env:TEMP "apex-capital-clean-room"
if (Test-Path $workspace) { Remove-Item $workspace -Recurse -Force }
git clone https://github.com/elonmusk28053-design/apex-capital-monorepo.git $workspace
Set-Location $workspace
npm ci
npm run build
npm test
```

## Deployment checklist

Before releasing a build:

- [ ] Install dependencies with `npm ci`.
- [ ] Run linting and type checks.
- [ ] Run the complete test suite.
- [ ] Produce and inspect the production build.
- [ ] Verify required environment variables are configured outside source control.
- [ ] Test the one-click launcher in a clean Windows PowerShell session.
- [ ] Confirm the deployed application loads over HTTPS.
- [ ] Review logs and verify health checks after deployment.

## Security

Never commit credentials, private keys, API tokens, production databases, or local environment files. Store deployment secrets in the CI/CD platform's encrypted secret store and provide local values through an ignored `.env` file.

## License

Copyright © Apex Capital. All rights reserved unless a separate license file states otherwise.
