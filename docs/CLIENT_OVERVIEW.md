# Dataverse for Claude — Client Overview

**A plain-English guide to installing and using the Dataverse integration for Claude Desktop.**

Prepared by **MS Cloud Experts** for the Dakota team.

---

## Table of contents

1. [What is this?](#1-what-is-this)
2. [How it works — the connection in one picture](#2-how-it-works--the-connection-in-one-picture)
3. [What runs where, and what data leaves the PC](#3-what-runs-where-and-what-data-leaves-the-pc)
4. [Authentication & permissions](#4-authentication--permissions)
5. [Before you start — prerequisites](#5-before-you-start--prerequisites)
6. [Install in one command](#6-install-in-one-command)
7. [First-run smoke test](#7-first-run-smoke-test)
8. [What Claude can do — capability summary](#8-what-claude-can-do--capability-summary)
9. [Daily use & maintenance](#9-daily-use--maintenance)
10. [Troubleshooting](#10-troubleshooting)
11. [Limits & boundaries](#11-limits--boundaries)
12. [Appendix — manual install](#12-appendix--manual-install)
13. [Glossary](#13-glossary)

---

## 1. What is this?

This package connects **Claude Desktop** directly to your **Microsoft Dataverse** environment, so you can ask questions and perform actions on your data using natural language. After installation, Claude gains the ability to read and write records in your Dataverse tables — accounts, contacts, opportunities, custom tables, files, notes, audit history, and more.

A few examples of what you'll be able to ask:

- *"List all accounts with revenue over $1M."*
- *"Show me the notes attached to opportunity 'Acme renewal'."*
- *"Create a contact for Jane Doe under account Acme Corp."*
- *"Summarise audit changes for record 1a2b3c4d-… over the last 30 days."*
- *"Which workflows are active on the opportunity table?"*

**What this is not:**

- Not a replacement for the Power Apps web UI.
- Not a reporting dashboard or BI tool.
- Not a server-hosted application — it runs locally on each user's Windows PC.
- Not a third-party data broker — no data is sent anywhere except Microsoft itself.

---

## 2. How it works — the connection in one picture

```
+-------------------+      spawns      +------------------------+
|  Claude Desktop   | ───────────────▶ |   MCP server (local)   |
|   (your PC app)   |                  |   Node.js process      |
+-------------------+                  +-----------+------------+
                                                   │
                                                   │  HTTPS + OAuth token
                                                   ▼
                                       +------------------------+
                                       |  Dataverse Web API     |
                                       |  (Microsoft cloud)     |
                                       +------------------------+
```

The flow in three sentences:

1. When you launch **Claude Desktop**, it automatically starts a small local program called the **MCP server** on your PC (you never see a window for it — it runs in the background).
2. That local program signs in to Microsoft on your behalf using a pre-configured **Azure AD app registration**, and gets a short-lived security token.
3. Every time you ask Claude a question that involves Dataverse, the local program calls Microsoft's official Dataverse API over HTTPS and returns the result to Claude.

No data passes through MS Cloud Experts servers. No data passes through Anthropic servers other than the question you typed and the answer Claude gives you. The actual Dataverse data flows directly between your PC and Microsoft.

**MCP** stands for **Model Context Protocol** — an open standard published by Anthropic that lets AI assistants connect to external tools and data sources.

---

## 3. What runs where, and what data leaves the PC

After installation, four things live on your PC:

| Component | Location | What it holds |
|---|---|---|
| MCP server code (`mcp-dataverse`) | `%USERPROFILE%\mcp-dataverse\node_modules\mcp-dataverse\` | JavaScript code (~400 KB). The actual program that talks to Dataverse. |
| `config.json` | `%USERPROFILE%\mcp-dataverse\config.json` | Environment URL, tenant ID, client ID, **and the client secret in plain text**. |
| Claude Desktop config | `%APPDATA%\Claude\claude_desktop_config.json` | The command to launch the MCP server + a single env var `MCP_CONFIG_PATH` pointing to `config.json`. **Does NOT contain the secret.** |
| Backups | Same folders, with `.backup.<timestamp>` suffix | Previous versions of the config files, saved automatically before any change. |

**`%USERPROFILE%` typically resolves to `C:\Users\<your-windows-username>\`.**

### Why two files?

The installer deliberately keeps the secret out of `claude_desktop_config.json`. That file gets shared more often (screenshots, support tickets, "show me your MCP config"). Splitting the secret into a separate `config.json` reduces the chance of accidental leaks. **If you open the Claude config and don't see the secret — that's correct.** It lives one folder over, in `%USERPROFILE%\mcp-dataverse\config.json`.

### Security note about the secret

The **client secret** (a long random password issued by Microsoft for our app registration) is stored in `config.json` in plain text. This means:

- Only your Windows user account can read it (standard NTFS permissions).
- **Do not share the secret in email, chat, or screenshots.** If you suspect it has leaked, contact MS Cloud Experts and we will rotate it.
- If the PC is lost or stolen, rotate the secret as a precaution.

### Network traffic

The MCP server makes outbound HTTPS connections to only two Microsoft endpoints:

- `https://login.microsoftonline.com` — to sign in and refresh tokens.
- `https://<your-org>.crm.dynamics.com` — to query and modify Dataverse data.

No telemetry, analytics, or third-party calls.

---

## 4. Authentication & permissions

### Two ways to talk to Dataverse — and which one we use

Before going into permissions, an important architectural note. Dataverse actually exposes **two completely separate API surfaces** that AI tools can connect to:

| | Endpoint | Description |
|---|---|---|
| **Native MCP endpoint** | `https://<your-org>.crm.dynamics.com/api/mcp` | A purpose-built MCP endpoint that Microsoft launched at Ignite 2025. Requires you to enable **Managed Environment**, turn on a **Dataverse Model Context Protocol** feature toggle in PPAC, and register each AI client in an **Allowed MCP Clients** table. May consume Copilot Credits. |
| **Standard Web API** | `https://<your-org>.crm.dynamics.com/api/data/v9.2/` | The classic OData v4 API that powers every Power Apps form, Power Automate flow, plugin, and integration since Dataverse v9. No special toggles, no allowlists, no Copilot Credits. |

**Our install uses the Standard Web API**, not the native MCP endpoint. That's a deliberate choice: when we tested Microsoft's official client (`@microsoft/dataverse` / the native endpoint), it didn't work with Claude Desktop because of timeout and stdout-handling issues. The community package we use (`codeurali/mcp-dataverse`) calls the standard Web API directly, which is more stable, free of Copilot Credit charges, and doesn't require any tenant-level MCP feature toggles.

**Practical consequence:** if you ever look at Power Platform Admin Center and see an *Allowed MCP Clients* table, a *Managed Environment* toggle, or a *Dataverse MCP* feature flag — **none of that affects this installation.** Those settings only matter if you're using the native MCP endpoint. You can leave them on or turn them off; our setup ignores them.

**Empirically verified (May 2026).** In Dakota's SANDBOX, we turned OFF both Dataverse MCP toggles in PPAC (the GA and Preview ones) and we removed Claude Desktop's row from the *Allowed MCP Clients* entity entirely. After restarting Claude Desktop, the integration kept working — `dataverse_whoami` and `list 1 account` returned correct results without any change to our installation. This confirms that the community package we use depends only on the standard Web API and is fully independent of the PPAC MCP feature.

### Why is there an "app registration"?

Microsoft requires every program that calls the Dataverse API to be registered in Azure Active Directory (Azure AD). This registration is called an **app registration**, and it acts like an identity card for the program. Three values uniquely identify our app:

| ID | What it is | Where it comes from |
|---|---|---|
| **Tenant ID** | The GUID of your Microsoft 365 / Entra organisation. | **You provide this during install.** Your IT admin (or MS Cloud Experts) gives you the value. |
| **Client ID** | The GUID of the app registration. Identifies *this* MCP server specifically. | **You provide this during install.** Same source as the tenant ID. |
| **Client Secret** | A long random password that proves the caller is genuine. | **You provide this during install.** Treat it like a password. |

All four values (the three above plus the Dataverse environment URL) are entered into a small **PowerShell wizard** that the installer runs. They get saved locally to `config.json`; they are never embedded into the public installer script itself.

#### The app registration already exists — we reuse it

For Dakota, the app registration `Dataverse MCP Server` **already exists** in your Azure tenant. It was originally created in April 2026 for the Microsoft native MCP attempt described earlier in this section. When we switched to the community package, we **kept reusing the same identity** — no duplicate Azure work was needed. Same `user_impersonation` permission, same Application User in Dataverse, same security role.

What that means in practice: the **Tenant ID** and **Client ID** the wizard asks for never change for Dakota users. Once your IT admin captures them once (in the onboarding email together with the Environment URL), every user pastes the same three IDs every time they install. Only the **Client Secret** rotates over time.

This is intentional: rotating credentials on one shared, established identity is cheaper and safer than maintaining parallel app registrations for every team or rollout wave.

#### Managing the client secret — two paths

The **client secret** is the only credential that needs to be refreshed periodically. Azure client secrets typically last 6 to 24 months; when one expires, Claude returns authentication errors and the installer has to be re-run with a fresh value. You have two options for managing this rotation:

**Path A — Ask MS Cloud Experts (default).** Email Ivan when the secret expires. We generate a new one in Azure and send it to you over a secure channel. Simplest, but you depend on us for the rotation cadence.

**Path B — Dakota IT generates the secret directly in Azure.** You don't need our involvement. Anyone with appropriate access to your Azure tenant can:

1. Go to <https://portal.azure.com> → **Microsoft Entra ID** → **App registrations**.
2. Find and open the app registration named **Dataverse MCP Server** (Client ID `e6cfa67d-4acc-477c-8108-8fdeb9f026cf`).
3. In the left navigation, click **Certificates & secrets**.
4. Click **+ New client secret**. Set a Description (e.g. *"MCP rotation — May 2027"*) and an Expires value (12 or 24 months). Click **Add**.
5. **Copy the Value column immediately.** Azure displays the secret only once; once you leave the page it can never be recovered.
6. Hand the value to whoever runs the installer. They paste it when the wizard prompts for *Client Secret*.
7. Optionally, delete the old expired secret from the same page once the new one is confirmed working. Azure supports multiple active secrets in parallel, so a small overlap during rotation is fine.

**Both paths use the same Azure app registration.** There is no need to create a new one. The permissions, the Application User in Dataverse, and the assigned security role all stay unchanged — only the secret string rotates.

#### (Advanced) Creating your own app registration from scratch

If for any reason Dakota needs a fully independent app registration — different identity, separate audit trail — the process is documented in [Microsoft's server-to-server authentication guide](https://learn.microsoft.com/power-apps/developer/data-platform/use-single-tenant-server-server-authentication). At a high level: create the app registration → add the `user_impersonation` permission on Dynamics CRM → grant admin consent → create an Application User in Dataverse linked to the new app → assign a Security Role → update the installer's hardcoded `clientId` and `tenantId` values to match.

This is a one-time multi-hour task and requires updating our installer. **For routine secret rotation, prefer Path B above** — it achieves the same security benefit (Dakota fully controls the credential) with a fraction of the work.

### What can the app actually do in Dataverse?

The app runs as a **service principal** in Dataverse — a non-human identity. Like any user, it has one or more **security roles** that determine which tables it can read, write, or delete.

In short:

- **If the app's role allows reading a table, Claude can read it.** If not, Claude gets an "insufficient privileges" error.
- **If the app's role allows writing to a table, Claude can create, update, or delete records there.**
- The app cannot grant itself new permissions — only a Power Platform admin can change its role.

The current role assignment is managed by MS Cloud Experts. **Ask Ivan for the exact list of roles** if you need to know in detail what Claude can and cannot do.

### Audit trail — important caveat

All Dakota users share the same Dataverse identity (the app registration). When you create or update a record through Claude, the **Created By** / **Modified By** field will show the app's name, not your personal user. If you need person-level audit trails, do that work in Power Apps directly. We can also enable optional impersonation later if needed.

---

## 5. Before you start — prerequisites

| Requirement | How to check | How to get it |
|---|---|---|
| Windows 10 or 11 PC | Already running it. | — |
| **Node.js v20 or later** | Open PowerShell → run `node --version`. If it shows `v20` or higher, you're good. | Download the **LTS** installer from <https://nodejs.org> and install with default options. Restart PowerShell after installing. |
| **Claude Desktop** | Open the app from the Start menu. | Download from <https://claude.ai/download>. Sign in with your work account. |
| **Client secret** | You'll be given a long random string by MS Cloud Experts. | Request from Ivan. |
| Internet access | Required throughout. | — |

Installation takes ~2 minutes from a clean prerequisites state. The MCP server itself uses negligible disk (~10 MB) and RAM (~50 MB).

---

## 6. Install in one command

### Step 1 — Open PowerShell

Click the **Start** menu, type `PowerShell`, and open it. You don't need Administrator — a normal user window is fine.

### Step 2 — Paste and run the installer

Copy this single line into PowerShell and press **Enter**:

```powershell
irm https://raw.githubusercontent.com/MS-Cloud-Experts/mcp-business-central/main/setup-dataverse.ps1 | iex
```

You will see four steps on screen:

1. **Step 1/4 — Installing mcp-dataverse** — downloads the program from the npm public package registry. Takes ~30 seconds.
2. **Step 2/4 — Creating config.json** — prompts you for the client secret. **Input is hidden — that's normal**, just paste and press Enter.
3. **Step 3/4 — Updating Claude Desktop config** — backs up your existing Claude config and adds the Dataverse entry.
4. **Step 4/4 — Verifying** — confirms all three files exist and parse correctly.

If everything succeeds, you'll see a green **INSTALLATION COMPLETE** banner.

### Step 3 — Restart Claude Desktop

- Right-click the Claude icon in the system tray (bottom-right of Windows, near the clock).
- Choose **Quit** (not just close the window).
- Reopen Claude Desktop from the Start menu.

### Step 4 — Confirm the tools loaded

Look at the bottom of the Claude chat input box. You should see a **hammer icon** (🔨) with a tool count next to it (around **79 tools** for the latest Dataverse package). Click the hammer to browse the full list — they'll all start with `dataverse_`.

If you don't see the hammer or the tool count is 0, jump to [Troubleshooting](#10-troubleshooting).

### Optional — verify the secret was saved correctly

Open `%USERPROFILE%\mcp-dataverse\config.json` in Notepad. You should see five fields: `environmentUrl`, `authMethod`, `tenantId`, `clientId`, `clientSecret`. The secret will be visible here in plain text — that's expected and only readable by your Windows user account.

**You will NOT see the secret in `claude_desktop_config.json`.** That file only stores the path to `config.json` via an env var called `MCP_CONFIG_PATH`. See [Section 3 — Why two files?](#why-two-files) if you want the reasoning.

---

## 7. First-run smoke test

Open a new chat in Claude Desktop and try these two prompts in order:

### Test 1 — Authentication works

> *"Use the Dataverse whoami tool and tell me which environment I'm connected to."*

Expected: Claude calls `dataverse_whoami` and shows back the app's user ID, the business unit, the organisation name, and the environment URL. If this works, authentication is correctly configured.

### Test 2 — Data access works

> *"List the first 5 accounts in Dataverse, just the name and revenue."*

Expected: Claude returns a small table with 5 account names and their revenue. If this works, your permissions are correctly assigned.

If either test fails, skip to [Troubleshooting](#10-troubleshooting). If both succeed, you're done — start using it.

---

## 8. What Claude can do — capability summary

The Dataverse MCP currently exposes **~79 tools** grouped into **25 categories**. You do not need to know the tool names — Claude picks the right one based on your question. The categories below give you a sense of the surface area.

| Category | # tools | What it does, in business terms |
|---|---|---|
| Query | 3 | Find records using filters, sorting, aggregations, and OData expressions. |
| CRUD | 6 | Create, read, update, delete records. Includes upsert and reassign-owner. |
| Search | 1 | Full-text relevance search across multiple tables at once. |
| Metadata | 9 | Inspect tables, columns, option sets, relationships, alternate keys. |
| Audit | 1 | See who changed what and when (requires auditing enabled). |
| Files | 2 | Upload and download files stored in Dataverse file-type columns. |
| Notes (annotations) | 2 | Read or create notes / attachments linked to a record. |
| Workflows | 4 | List, inspect, activate, or deactivate classic workflows. |
| Users / Teams / Org / RBAC | 11 | List users, teams, business units; manage role assignments. |
| Batch | 1 | Run up to 1,000 operations atomically (all-or-nothing). |
| Solutions | 2 | List solutions and their components. |
| Schema admin | 4 | Add or modify columns on a table — **advanced, write operations require explicit confirmation**. |
| Environment variables | 4 | Read or set Power Platform environment variable values. |
| Trace / diagnostics | 2 | Inspect plugin and workflow execution traces. |
| Actions & functions | 6 | Execute Dataverse global or bound actions/functions (e.g. `WinOpportunity`, `CalculateRollupField`). |
| Change tracking | 1 | Delta queries — fetch only what changed since the last sync. |
| Impersonation | 1 | Run a single call as another user (advanced; requires special privilege). |
| Customisation | 4 | List custom actions, plugin steps; activate/deactivate workflows. |
| Quality | 1 | Run Dataverse duplicate detection rules against prospective data. |
| Views | 1 | List saved system and personal views for a table. |
| Assistance | 2 | "Which tool should I use for X?" + built-in step-by-step guides. |

For the full per-tool reference (parameters, examples, edge cases), ask Claude:

> *"Run dataverse_list_tool_tags and dataverse_list_guides."*

Claude will list every category and every guide available in the version you have installed.

---

## 9. Daily use & maintenance

### Tips for getting good answers

- **Be specific about tables.** "List my opportunities" works; "List opportunities won this quarter, ordered by revenue" works much better.
- **Ask Claude to use the metadata tools** when you're unsure of column names: *"What columns are on the opportunity table?"*
- **Confirm before destructive actions.** Delete tools always require explicit confirmation — Claude will ask before executing.
- **For large result sets** (>1,000 records), Claude will use the paginated query tool automatically. Expect a few seconds of latency.

### When something stops working

Almost all issues fall into one of two categories:

1. **The client secret expired.** Microsoft issues secrets with an expiry (typically 6 to 24 months). When it expires, Claude will return authentication errors on every Dataverse call. **Fix:** ask MS Cloud Experts for a new secret, then re-run the installer (paste the new secret when prompted).
2. **The Dataverse package was updated upstream.** To pull the latest version with new tools and bug fixes, re-run the same installer command. It will reinstall in place and pick up the latest version from npm.

### What does NOT need maintenance

- No daily logins. Once installed, the MCP signs in silently each time Claude Desktop launches.
- No manual updates of Claude Desktop's config — re-running the installer handles it.
- No background services, scheduled tasks, or Windows startup items.

---

## 10. Troubleshooting

### "I don't see the hammer icon, or it shows 0 tools."

- Make sure you **fully quit Claude Desktop** (right-click the tray icon → Quit) before reopening — closing the window only minimises it.
- Open `%APPDATA%\Claude\claude_desktop_config.json` in Notepad. Confirm there's a `"Dataverse"` entry under `"mcpServers"`. If not, the installer didn't finish — re-run it.
- **Don't be alarmed if you don't see the secret in `claude_desktop_config.json`** — by design, it's stored in `%USERPROFILE%\mcp-dataverse\config.json` instead. The Claude config only references it via `MCP_CONFIG_PATH`. This is normal.

### "Cannot find module 'C:\Users\<somebody-else>\mcp-dataverse\node_modules\...'"

This means the installer wrote a path for one Windows user, but Claude Desktop is running as a different Windows user. The path is hardcoded.

**Fix:** sign in to Windows as the user who will actually use Claude Desktop, then re-run the installer. Or, hand-edit the `args` paths in `claude_desktop_config.json` to match the correct profile.

### "Fatal error: Invalid configuration: environmentUrl: Required"

The MCP server can't read `config.json`. Either it's missing, or the path didn't make it through.

**Fix:** Use the manual config in [Appendix — manual install](#12-appendix--manual-install). It bypasses `config.json` entirely by passing the values directly as environment variables.

### `Unexpected token 'w', "warn: Mode"... is not valid JSON`

You accidentally installed Microsoft's older `@microsoft/dataverse` package instead of the community `mcp-dataverse` we use. They have a known bug where logs corrupt the message stream.

**Fix:** re-run the installer in this guide — it always installs the correct package (`mcp-dataverse` by `codeurali`).

### "'npx' is not recognized"

You should not see this with our installer (it uses absolute paths to `node.exe`). If you do, you probably hand-edited `claude_desktop_config.json` to use `npx`. Re-run our installer to restore the correct paths.

### "I lost the client secret."

Secrets are never recoverable from the install — they're stored hashed on Microsoft's side. **Contact MS Cloud Experts** and we'll issue a fresh one. The old one can be revoked at the same time as a precaution.

### "Authentication failed" / 401 errors after months of working fine

The client secret most likely expired. Request a new one from MS Cloud Experts and re-run the installer.

### Still stuck?

Send Ivan a screenshot of the error message and the **STEP 4/4 — Verifying** output from the installer. That tells us within a minute where things went wrong.

---

## 11. Limits & boundaries

- **One Dataverse environment per Claude Desktop install.** To switch (e.g. Production → Sandbox), edit `config.json` and restart Claude.
- **Query size**: a single query returns up to 5,000 records. Paginated queries can fetch up to 50,000 total. For larger exports, use Power Apps / Power Automate.
- **File downloads** return as base64 inside the chat. This is fine for documents up to a few MB; not suitable for large PDFs or images.
- **Destructive operations** (`delete`, `delete_attribute`) require an explicit `confirm: true` parameter. Claude will always ask you to confirm before calling them.
- **No real-time subscriptions.** If you need "tell me when X changes," use the change-tracking tool to poll for deltas, or set up a Power Automate flow instead.
- **The audit trail shows the app, not you personally** (see [Section 4](#4-authentication--permissions)).

---

## 12. Appendix — manual install

If your IT policy blocks `Invoke-Expression` (the `iex` part of the install command), or if the automated installer fails repeatedly, you can configure Claude Desktop by hand.

> **Note — different secret location.** This manual approach puts the secret directly into `claude_desktop_config.json` as an environment variable (no separate `config.json`). It's a valid fallback when corporate policies block the automated installer, but the secret ends up in a file that's slightly more likely to be shared by accident. **Prefer the one-command installer in [Section 6](#6-install-in-one-command) when possible.**

### Steps

1. Install Node.js v20+ from <https://nodejs.org>.
2. Open PowerShell and run:
   ```powershell
   mkdir $env:USERPROFILE\mcp-dataverse
   cd $env:USERPROFILE\mcp-dataverse
   npm init -y
   npm install mcp-dataverse
   ```
3. Find your `claude_desktop_config.json`:
   - Open Claude Desktop → **hamburger menu** → **Settings** → **Developer** → **Edit Config**.
4. Replace the file contents with the block below, filling in your own values for the four placeholders:
   ```json
   {
     "mcpServers": {
       "Dataverse": {
         "command": "C:\\Program Files\\nodejs\\node.exe",
         "args": [
           "C:\\Users\\<your-windows-username>\\mcp-dataverse\\node_modules\\mcp-dataverse\\dist\\server.js"
         ],
         "env": {
           "DATAVERSE_ENV_URL": "https://<your-org>.crm.dynamics.com",
           "AUTH_METHOD": "client-credentials",
           "AZURE_TENANT_ID": "<tenant-guid-from-ms-cloud-experts>",
           "AZURE_CLIENT_ID": "<client-id-from-ms-cloud-experts>",
           "AZURE_CLIENT_SECRET": "<the-secret-you-were-given>"
         }
       }
     }
   }
   ```
5. Save the file. Fully quit and restart Claude Desktop.

This form passes all credentials directly to the server, so it does not depend on `config.json`.

---

## 13. Glossary

| Term | Meaning |
|---|---|
| **Dataverse** | Microsoft's data platform behind Dynamics 365 and Power Apps. Stores tables (entities), columns (attributes), relationships, and security data. |
| **MCP (Model Context Protocol)** | Open standard by Anthropic that lets AI assistants like Claude connect to external tools and data sources. |
| **MCP server** | A small program that implements MCP and exposes a set of tools. In our case, it talks to Dataverse on behalf of Claude. |
| **Azure AD app registration** | A registered application identity in Microsoft Entra (Azure AD). Required for any non-interactive call to Microsoft APIs. |
| **Tenant ID** | The unique ID of your Microsoft 365 / Entra organisation. |
| **Client ID** | The unique ID of an app registration within a tenant. |
| **Client Secret** | A password-like credential proving an app is genuine. Expires periodically. |
| **Service principal** | The identity that an app registration takes on inside a specific Microsoft cloud service (e.g. Dataverse). Has its own security roles. |
| **Security role** | A bundle of Dataverse permissions (read/write/delete by table). Determines what the service principal can do. |
| **Client-credentials flow** | OAuth 2.0 flow where an app signs in as itself (not as a person) using its tenant ID, client ID, and client secret. |
| **OData** | The query language Dataverse uses. Similar in spirit to SQL but built for HTTP APIs (`$filter`, `$select`, `$top`, etc.). |
| **FetchXML** | An older XML-based query language Dataverse supports alongside OData, useful for aggregations and complex joins. |
| **Entity / table** | A type of record in Dataverse (e.g. `account`, `contact`, `opportunity`). |
| **Attribute / column** | A field on a record (e.g. `name`, `revenue`). |
| **Solution** | A package of Dataverse customisations (tables, columns, workflows) that can be exported/imported between environments. |

---

*Document version: 1.0 — prepared by MS Cloud Experts. For questions or to request a new client secret, contact Ivan.*
