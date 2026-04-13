# mcp-business-central

MCP server that connects AI assistants to Microsoft Dynamics 365 Business Central via the [Model Context Protocol](https://modelcontextprotocol.io).

**115 named tools** covering 93 BC entities (85 standard + 8 custom API entities) with full OData query support, ETag-based concurrency, and Azure CLI authentication.

---

## Setup Guide

### Quick Install (Recommended)

Open **PowerShell** and paste this command:

```powershell
irm https://raw.githubusercontent.com/MS-Cloud-Experts/mcp-business-central/main/setup.ps1 | iex
```

Or if you already cloned the repo, right-click `setup.ps1` → **Run with PowerShell**.

The script will check prerequisites, install missing tools via winget, clone/build the project, configure Claude Desktop, and walk you through Azure login.

---

### Manual Install

<details>
<summary>Click to expand step-by-step instructions</summary>

### 1. Install Prerequisites

You need these three programs installed on your Windows PC:

| # | Program | Download | What it does |
|---|---------|----------|--------------|
| 1 | **Node.js** (v18+) | https://nodejs.org → **LTS** version | Runs the MCP server |
| 2 | **Git** | https://git-scm.com/download/win | Clones the code from GitHub |
| 3 | **Azure CLI** | https://aka.ms/installazurecliwindows | Authenticates to Business Central |

Install each one with default settings. **Restart your PC** after installing all three.

### 2. Verify Installations

Open **Command Prompt** (search "cmd" in Start menu) and run:

```
node --version
git --version
az --version
```

You should see version numbers for all three. If any says `'xxx' is not recognized`, reinstall that program and restart.

### 3. Sign in to Azure

In the same Command Prompt, run:

```
az login
```

A browser window will open. Sign in with your **Microsoft work account** (the one you use for Business Central). Once you see "You have logged in successfully", close the browser tab.

### 4. Clone and Build

Run these commands one at a time:

```
cd %USERPROFILE%\Documents
git clone https://github.com/MS-Cloud-Experts/mcp-business-central.git
cd mcp-business-central
npm install
npm run build
```

> If `git clone` asks for credentials, use your GitHub account. You need access to the **MS-Cloud-Experts** organization — ask Ivan if you get a 404 or permission error.

### 5. Configure Claude Desktop

1. Open **Claude Desktop**
2. Click the **hamburger menu** top-left -> **Settings** -> **Developer** -> **Edit Config**
3. Replace the file contents with:

```json
{
  "mcpServers": {
    "BusinessCentral": {
      "command": "node",
      "args": ["C:\\Users\\YOUR_USERNAME\\Documents\\mcp-business-central\\build\\index.js"],
      "env": {
        "BC_TENANT_ID": "your-tenant-guid",
        "BC_ENVIRONMENT": "Production",
        "BC_COMPANY": "Your Company Name"
      }
    }
  }
}
```

4. Replace `YOUR_USERNAME` with your Windows username, and fill in your BC tenant details.
5. **(Optional)** If you use custom APIs, add these env vars too:
   - `BC_CUSTOM_API_PUBLISHER` — e.g., `MscloudExperts`
   - `BC_CUSTOM_API_GROUP` — the custom API group name (optional)
   - `BC_CUSTOM_API_VERSION` — e.g., `v1.0` (default)
6. Save the file (**Ctrl+S**)
7. **Quit Claude Desktop completely** — right-click the icon in the system tray -> **Quit**, then reopen it

### 6. Verify It Works

In Claude Desktop, look at the bottom of the chat input box. You should see a **hammer icon** (🔨) showing **115 tools**. Click it to browse the full list.

Try asking Claude:

- *"List the top 5 open sales orders"*
- *"Show me mat utilization summaries"*
- *"How many customers do we have?"*

### Troubleshooting

| Problem | Solution |
|---------|----------|
| No hammer icon / 0 tools | Check the file path in step 5 — it must match your actual `Documents` folder |
| "Authentication failed" errors | Run `az login` again in Command Prompt, then restart Claude Desktop |
| `git clone` returns 404 | Ask Ivan to add your GitHub account to the MS-Cloud-Experts organization |
| `npm install` fails | Make sure Node.js is v18 or later (`node --version`) |
| Tools show but queries fail | Your Azure account may not have BC permissions — contact Ivan |

### Daily Use

- **Azure login expires** every few hours. If Claude starts showing authentication errors, open Command Prompt, run `az login`, and restart Claude Desktop.
- You do **not** need to rebuild or reinstall anything — just re-authenticate when needed.

</details>

---

## Architecture

```
src/
├── index.ts                    # Entry point (StdioServerTransport)
├── server.ts                   # MCP server wiring & request handlers
├── config.ts                   # Tenant, environment, company config
├── client/
│   ├── auth.ts                 # AzureCliCredential token provider
│   ├── bc-client.ts            # HTTP client (GET/POST/PATCH/DELETE)
│   ├── company-resolver.ts     # Company GUID resolution & caching
│   └── url-builder.ts          # OData URL construction
├── catalog/
│   ├── types.ts                # EntityDefinition, PropertyDef, KeyStrategy
│   ├── helpers.ts              # Property type builders (str, uuid, decimal, etc.)
│   ├── index.ts                # Master entity registry (93 entities)
│   ├── standard/               # 85 standard BC API v2.0 entities
│   │   ├── master-data.ts      #   23 entities (items, customers, vendors…)
│   │   ├── sales.ts            #   10 entities (orders, quotes, invoices…)
│   │   ├── purchasing.ts       #   12 entities (POs, receipts, credit memos…)
│   │   ├── finance.ts          #   21 entities (GL, journals, dimensions…)
│   │   ├── projects.ts         #    1 entity  (projects)
│   │   └── reports.ts          #   11 entities (aged AR/AP, balance sheet…)
│   └── custom/
│       └── index.ts            #  8 custom API entities (jobs, mats, timesheets…)
├── factory/
│   ├── tool-generator.ts       # Generates MCP tool defs from catalog
│   ├── schema-builder.ts       # JSON Schema for tool inputs
│   └── description-builder.ts  # Human-readable tool descriptions
└── handlers/
    ├── dispatcher.ts           # Routes tool calls → operations
    └── operations.ts           # List, Create, Modify, Delete, Action handlers
```

### How It Works

1. **Catalog** — Each entity is a pure-data definition: name, page ID, properties, key strategy, allowed operations
2. **Factory** — At startup, the factory reads every catalog entry and generates MCP tool schemas (no hand-written tool JSON)
3. **Dispatcher** — Incoming tool calls are parsed by name (`{Operation}{Entity}_{PageId}`) and routed to the correct handler
4. **BCClient** — Builds OData URLs, acquires Azure tokens, and executes HTTP requests against the BC API

---

## Tool Catalog

### Naming Convention

```
{Operation}{EntityName}_{PageId}
```

| Operation | HTTP | Example |
|-----------|------|---------|
| `List` | GET | `ListSalesOrders_PAG30028` |
| `Create` | POST | `CreateSalesOrderLine_PAG30044` |
| `Modify` | PATCH | `ModifySalesOrder_PAG30028` |
| `Delete` | DELETE | `DeleteSalesOrder_PAG30028` |
| Action | POST | `ShipAndInvoice_PAG30028` |

### Standard Entities (85)

| Domain | Entities | Tools |
|--------|----------|-------|
| **Master Data** | items, customers, vendors, contacts, employees, locations, item categories, item variants, units of measure… | 23 |
| **Sales** | orders, order lines, quotes, quote lines, credit memos, credit memo lines, invoices, invoice lines, shipments, shipment lines | 10 |
| **Purchasing** | purchase orders, PO lines, invoices, invoice lines, receipts, receipt lines, credit memos, credit memo lines, vendor entries… | 12 |
| **Finance** | GL accounts, GL entries, journals, journal lines, customer/vendor payments, bank accounts, dimensions, currencies, tax… | 21 |
| **Projects** | projects | 1 |
| **Reports** | aged AR/AP, balance sheet, trial balance, income statement, cash flow, PDF documents, job queue… | 11 |

### Custom API Entities (8)

These map to a custom API published in Business Central (page IDs PAG73038-PAG73094). They are **optional** — set `BC_CUSTOM_API_PUBLISHER`, `BC_CUSTOM_API_GROUP`, and `BC_CUSTOM_API_VERSION` only if your tenant has these pages deployed. Otherwise use the script without those env vars and you get the 107 standard tools.


| Entity | Page ID | Key Strategy | Operations | Purpose |
|--------|---------|--------------|------------|---------|
| `dktJobLedgerEntries` | PAG73038 | integer (`entryNo`) | List | Job usage/sales postings with costs and dimensions |
| `dktJobTasks` | PAG73045 | composite (`jobNo` + `jobTaskNo`) | List, Create, Modify, Delete | Job task hierarchy (Posting, Heading, Total…) |
| `dktJobPlanningLines` | PAG73046 | UUID (`systemId`) | List, Create, Modify, Delete | Budget/billable planning lines with mat-specific fields |
| `matUtilizations` | PAG73090 | integer (`entryNo`) | List | Per-mat utilization %, stock, rental status, daily cost |
| `matCategorySummaries` | PAG73091 | integer (`entryNo`) | List | Category-level utilization vs. target summaries |
| `matUtilizationHistories` | PAG73092 | integer (`entryNo`) | List | Historical utilization snapshots by category |
| `itemAttributeMappings` | PAG73093 | integer (`entryNo`) | List, Create, Modify, Delete | Item-to-attribute classification mappings |
| `timeSheetEntries` | PAG73094 | integer (`entryNo`) | List, Create, Modify, Delete | Employee time tracking on jobs/tasks |

---

## Key Features

### OData Query Support

Every `List` tool accepts standard OData parameters:

| Parameter | Example |
|-----------|---------|
| `filter` | `"status eq 'Open' and customerNo eq 'C10000'"` |
| `orderby` | `"postingDate desc"` |
| `select` | `"no,description,unitPrice"` |
| `top` | `25` |
| `skip` | `50` |

### Key Strategies

| Strategy | Description | Example |
|----------|-------------|---------|
| **UUID** | Single `id` or `systemId` field | Most standard entities |
| **Composite** | Multiple fields as named key pairs | `dktJobTasks` → `(jobNo='J001',jobTaskNo='100')` |
| **Integer** | Single integer key | `dktJobLedgerEntries` → `entryNo=42` |

### ETag Concurrency

All `Modify` operations require an `If-Match` header (ETag value) to prevent conflicting updates. The ETag is returned in every `List` response as `@odata.etag`.

### Configuration

All connection details are passed via environment variables (set in your MCP client config):

| Variable | Required | Example |
|----------|----------|---------|
| `BC_TENANT_ID` | Yes | `9d75096e-e828-45c7-ab5f-409cd0ad5b59` |
| `BC_ENVIRONMENT` | Yes | `Production`, `Sandbox` |
| `BC_COMPANY` | Yes | `CRONUS USA, Inc.` |
| `BC_CUSTOM_API_PUBLISHER` | No | `MscloudExperts` |
| `BC_CUSTOM_API_GROUP` | No | custom API group name |
| `BC_CUSTOM_API_VERSION` | No | `v1.0` (default) |

### Authentication

Uses `AzureCliCredential` from `@azure/identity` — no secrets stored. Run `az login` before starting the server; the token refreshes automatically.

### Company Resolution

The company GUID is resolved once on first request and cached for the lifetime of the process.

---

## Development

```bash
# Build
npm run build

# Watch mode (rebuild on changes)
npx tsc --watch

# Verify tool count
node -e "
  import('./build/handlers/dispatcher.js').then(m => {
    const d = new m.Dispatcher(new (require('./build/client/bc-client.js').BCClient)());
    console.log(d.listTools().length + ' tools');
  });
"
```

---

## Optional: Dataverse MCP installer

This repo also hosts `setup-dataverse.ps1`, an **independent** one-shot installer for the [`mcp-dataverse`](https://www.npmjs.com/package/mcp-dataverse) server. It is **not** related to the Business Central MCP above — it is bundled here only to give clients a single `irm | iex` entry point while we evaluate the package.

The installer:

- Checks Node.js v20+
- Runs `npm install mcp-dataverse` into `%USERPROFILE%\mcp-dataverse`
- Writes a `config.json` with the tenant/client IDs pre-filled
- Prompts for the **client secret** (hidden input) or accepts it via `-ClientSecret`
- Merges a `Dataverse` entry into `%APPDATA%\Claude\claude_desktop_config.json` with the same backup + verify logic as `setup.ps1`

**Interactive (prompts for the secret):**

```powershell
irm https://raw.githubusercontent.com/MS-Cloud-Experts/mcp-business-central/main/setup-dataverse.ps1 | iex
```

**With the secret passed inline** (useful for unattended installs):

```powershell
$secret = "your-client-secret"
powershell -ExecutionPolicy Bypass -File setup-dataverse.ps1 -ClientSecret $secret
```

Note: the `irm | iex` form executes the script inline and cannot pass `-ClientSecret`, so it will always prompt interactively.

---

## License

MIT
