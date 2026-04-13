#Requires -Version 5.1
<#
.SYNOPSIS
    Setup script for @mscloudexperts/mcp-business-central - MCP server for Business Central
.DESCRIPTION
    Checks prerequisites, runs Azure login, prompts for Business Central connection
    details, and writes the Claude Desktop config to launch the server via
    `npx -y @mscloudexperts/mcp-business-central`. No git clone, no npm install,
    no build step.
#>

param(
    [switch]$SkipAzLogin
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# -- Helpers ------------------------------------------------------------------

function Write-Step { param([string]$msg) Write-Host "`n> $msg" -ForegroundColor Cyan }
function Write-Ok   { param([string]$msg) Write-Host "  OK: $msg" -ForegroundColor Green }
function Write-Warn { param([string]$msg) Write-Host "  !! $msg" -ForegroundColor Yellow }
function Write-Fail { param([string]$msg) Write-Host "  X  $msg" -ForegroundColor Red }

function Test-Command {
    param([string]$Name)
    $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

# Writes text to a file as UTF-8 WITHOUT a BOM. PowerShell 5.1's
# `Set-Content -Encoding UTF8` emits a BOM, which Claude Desktop's JSON
# parser rejects — this helper sidesteps that.
function Write-Utf8NoBom {
    param([string]$Path, [string]$Content)
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

function ConvertTo-HashtableDeep {
    param($InputObject)
    if ($null -eq $InputObject) { return $null }
    if ($InputObject -is [System.Collections.IDictionary]) {
        $h = @{}
        foreach ($k in $InputObject.Keys) { $h[$k] = ConvertTo-HashtableDeep $InputObject[$k] }
        return $h
    }
    if ($InputObject -is [System.Management.Automation.PSCustomObject]) {
        $h = @{}
        foreach ($p in $InputObject.PSObject.Properties) { $h[$p.Name] = ConvertTo-HashtableDeep $p.Value }
        return $h
    }
    if ($InputObject -is [System.Collections.IEnumerable] -and -not ($InputObject -is [string])) {
        return @($InputObject | ForEach-Object { ConvertTo-HashtableDeep $_ })
    }
    return $InputObject
}

# -- Banner -------------------------------------------------------------------

Clear-Host
Write-Host ""
Write-Host "  +==================================================+" -ForegroundColor Cyan
Write-Host "  |   MCP Business Central - Setup Wizard            |" -ForegroundColor Cyan
Write-Host "  |   115 AI tools for Claude Desktop                |" -ForegroundColor Cyan
Write-Host "  +==================================================+" -ForegroundColor Cyan
Write-Host ""

# -- Step 1: Prerequisites ----------------------------------------------------

Write-Step "Checking prerequisites..."

$missing = @()

if (Test-Command "node") {
    $nodeVer = (node --version 2>$null) -replace '^v',''
    $nodeMajor = [int]($nodeVer -split '\.')[0]
    if ($nodeMajor -ge 18) {
        Write-Ok "Node.js v$nodeVer"
    } else {
        Write-Fail "Node.js v$nodeVer is too old - need v18 or later"
        $missing += "Node.js (v18+) - https://nodejs.org"
    }
} else {
    Write-Fail "Node.js not found"
    $missing += "Node.js (v18+) - https://nodejs.org"
}

if (Test-Command "az") {
    $azVer = (az version 2>$null | ConvertFrom-Json).'azure-cli'
    Write-Ok "Azure CLI $azVer"
} else {
    Write-Fail "Azure CLI not found"
    $missing += "Azure CLI - https://aka.ms/installazurecliwindows"
}

$claudeExe = "$env:LOCALAPPDATA\Programs\Claude\Claude.exe"
if (Test-Path $claudeExe) {
    Write-Ok "Claude Desktop installed"
} else {
    Write-Warn "Claude Desktop not detected (may be installed elsewhere)"
}

if ($missing.Count -gt 0) {
    Write-Host ""
    Write-Fail "Missing prerequisites:"
    foreach ($m in $missing) { Write-Host "     - $m" -ForegroundColor Yellow }
    Write-Host ""

    $useWinget = $false
    if (Test-Command "winget") {
        $answer = Read-Host "  winget is available. Install missing tools automatically? (Y/N)"
        if ($answer -match '^[Yy]') { $useWinget = $true }
    }

    if ($useWinget) {
        foreach ($m in $missing) {
            if ($m -match "Node") {
                Write-Step "Installing Node.js LTS..."
                winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
            }
            if ($m -match "Azure") {
                Write-Step "Installing Azure CLI..."
                winget install Microsoft.AzureCLI --accept-package-agreements --accept-source-agreements
            }
        }
        Write-Host ""
        Write-Warn "Installed. CLOSE this window, open a NEW terminal, and run this script again."
        Read-Host "Press Enter to exit"
        exit 0
    } else {
        Write-Host "  Install the missing tools and re-run this script." -ForegroundColor Gray
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Resolve absolute path to npx.cmd (Claude Desktop does not resolve PATH reliably)
$npxCmd = Get-Command npx.cmd -ErrorAction SilentlyContinue
if (-not $npxCmd) {
    Write-Fail "npx.cmd not found on PATH. Reinstall Node.js LTS and open a new terminal."
    Read-Host "Press Enter to exit"
    exit 1
}
$npxPath = $npxCmd.Source
Write-Ok "npx at $npxPath"

# -- Step 2: Azure login ------------------------------------------------------

if (-not $SkipAzLogin) {
    Write-Step "Azure authentication"

    $azAccount = $null
    try { $azAccount = az account show 2>$null | ConvertFrom-Json } catch {}

    if ($azAccount) {
        Write-Ok "Already signed in as $($azAccount.user.name)"
        $relogin = Read-Host "  Use this account? (Y to keep, N to sign in with another)"
        if ($relogin -match '^[Nn]') {
            Write-Host "  A browser window will open." -ForegroundColor Gray
            az login | Out-Null
        }
    } else {
        Write-Host "  A browser window will open - sign in with your Business Central / Microsoft work account." -ForegroundColor Gray
        Read-Host "  Press Enter to open the login page"
        az login | Out-Null
    }

    $azAccount = az account show 2>$null | ConvertFrom-Json
    if ($azAccount) {
        Write-Ok "Authenticated as $($azAccount.user.name)"
    } else {
        Write-Fail "Azure login failed."
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# -- Step 3: Business Central connection --------------------------------------

Write-Step "Business Central connection"
Write-Host "  Ask your BC admin if you are unsure of these values." -ForegroundColor Gray
Write-Host ""

$bcTenantId    = Read-Host "  Tenant ID (GUID)"
$bcEnvironment = Read-Host "  Environment name (e.g. Production, Sandbox, Pre-Production)"
$bcCompany     = Read-Host "  Company name (e.g. Dakota Matting)"

Write-Host ""
Write-Host "  Custom APIs are optional. Press Enter to skip if you only need standard BC APIs." -ForegroundColor Gray
$bcCustomPub   = Read-Host "  Custom API publisher (e.g. MscloudExperts, or Enter to skip)"
$bcCustomGroup = ""
$bcCustomVer   = ""
if ($bcCustomPub) {
    $bcCustomGroup = Read-Host "  Custom API group (e.g. dakotaMats)"
    $bcCustomVer   = Read-Host "  Custom API version (default: v1.0)"
    if (-not $bcCustomVer) { $bcCustomVer = "v1.0" }
}

Write-Ok "Tenant:      $bcTenantId"
Write-Ok "Environment: $bcEnvironment"
Write-Ok "Company:     $bcCompany"
if ($bcCustomPub) {
    Write-Ok "Custom API:  $bcCustomPub/$bcCustomGroup/$bcCustomVer"
}

# -- Step 4: Configure Claude Desktop -----------------------------------------

Write-Step "Configuring Claude Desktop..."

$configDir  = "$env:APPDATA\Claude"
$configFile = "$configDir\claude_desktop_config.json"

$envBlock = [ordered]@{
    BC_TENANT_ID   = $bcTenantId
    BC_ENVIRONMENT = $bcEnvironment
    BC_COMPANY     = $bcCompany
}
if ($bcCustomPub) {
    $envBlock["BC_CUSTOM_API_PUBLISHER"] = $bcCustomPub
    $envBlock["BC_CUSTOM_API_GROUP"]     = $bcCustomGroup
    $envBlock["BC_CUSTOM_API_VERSION"]   = $bcCustomVer
}

$desiredServer = @{
    command = $npxPath
    args    = @("-y", "@mscloudexperts/mcp-business-central")
    env     = $envBlock
}

if (-not (Test-Path $configDir)) {
    New-Item -ItemType Directory -Path $configDir -Force | Out-Null
}

$backupPath = $null
if (Test-Path $configFile) {
    $backupPath = "$configFile.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Copy-Item $configFile $backupPath -Force
    Write-Ok "Backed up existing config to $backupPath"

    $raw = Get-Content $configFile -Raw
    $configHash = $null
    try {
        $parsed = $raw | ConvertFrom-Json
        $configHash = ConvertTo-HashtableDeep $parsed
    } catch {
        Write-Warn "Existing config was not valid JSON - starting from an empty config"
        $configHash = $null
    }

    if (-not $configHash -or -not ($configHash -is [hashtable])) {
        $configHash = @{}
    }
    if (-not $configHash.ContainsKey("mcpServers") -or -not ($configHash["mcpServers"] -is [hashtable])) {
        $configHash["mcpServers"] = @{}
    }
    $configHash["mcpServers"]["BusinessCentral"] = $desiredServer
} else {
    $configHash = @{ mcpServers = @{ BusinessCentral = $desiredServer } }
}

$json = $configHash | ConvertTo-Json -Depth 10
Write-Utf8NoBom -Path $configFile -Content $json

# Validate what we just wrote — if Claude Desktop can't parse it, we'd rather
# fail loudly here than have the user discover it on next launch.
try {
    $verify = Get-Content $configFile -Raw | ConvertFrom-Json
    if (-not $verify.mcpServers.BusinessCentral) {
        throw "BusinessCentral entry missing after write"
    }
    Write-Ok "Wrote config and verified it parses cleanly"
} catch {
    Write-Fail "Config written but failed verification: $($_.Exception.Message)"
    if ($backupPath -and (Test-Path $backupPath)) {
        Copy-Item $backupPath $configFile -Force
        Write-Warn "Restored previous config from backup"
    }
    Read-Host "Press Enter to exit"
    exit 1
}

# -- Done ---------------------------------------------------------------------

Write-Host ""
Write-Host "  +==================================================+" -ForegroundColor Green
Write-Host "  |              Setup complete!                     |" -ForegroundColor Green
Write-Host "  +==================================================+" -ForegroundColor Green
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor White
Write-Host "    1. Close Claude Desktop completely" -ForegroundColor Gray
Write-Host "       (right-click system tray icon -> Quit)" -ForegroundColor DarkGray
Write-Host "    2. Reopen Claude Desktop" -ForegroundColor Gray
Write-Host "    3. First launch takes a few seconds to download the package" -ForegroundColor Gray
Write-Host "    4. Look for the hammer icon with the 115 BC tools" -ForegroundColor Gray
Write-Host '    5. Try: "List the top 5 customers"' -ForegroundColor Gray
Write-Host ""
Write-Host "  If Azure login expires later, run: az login" -ForegroundColor Yellow
Write-Host "  To update, re-run this script (npx pulls the latest version automatically)." -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter to close"
