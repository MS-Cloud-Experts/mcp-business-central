# ============================================================
# MCP Dataverse Installer for Claude Desktop
# MsCloudExperts
# Usage:
#   powershell -ExecutionPolicy Bypass -File install-dataverse-mcp.ps1
#   powershell -ExecutionPolicy Bypass -File install-dataverse-mcp.ps1 -ClientSecret "xxxx"
# ============================================================

param(
    [string]$ClientSecret
)

$ErrorActionPreference = "Stop"

# -- Helpers ------------------------------------------------------------------

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Write-Utf8NoBom {
    param([string]$Path, [string]$Content)
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

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MCP Dataverse - Claude Desktop Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# -- 1. Check Node.js ---------------------------------------------------------

try {
    $nodeVersion = (node --version 2>$null)
    if (-not $nodeVersion) { throw "not found" }
    $major = [int]($nodeVersion -replace 'v','').Split('.')[0]
    if ($major -lt 20) {
        Write-Host "[ERROR] Node.js $nodeVersion detected but version 20+ is required." -ForegroundColor Red
        Write-Host "        Download from https://nodejs.org" -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "[OK] Node.js $nodeVersion" -ForegroundColor Green
}
catch {
    Write-Host "[ERROR] Node.js not found. Install it from https://nodejs.org (v20+)" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# -- 2. Install npm package ---------------------------------------------------

$installDir = Join-Path $env:USERPROFILE "mcp-dataverse"
$modulePath = Join-Path $installDir "node_modules\mcp-dataverse"

if (Test-Path $modulePath) {
    Write-Host ""
    Write-Host "[INFO] mcp-dataverse already installed at $installDir" -ForegroundColor Yellow
    $reinstall = Read-Host "       Reinstall? (y/N)"
    if ($reinstall -eq 'y') {
        Remove-Item (Join-Path $installDir "node_modules") -Recurse -Force -ErrorAction SilentlyContinue
        Remove-Item (Join-Path $installDir "package.json") -Force -ErrorAction SilentlyContinue
        Remove-Item (Join-Path $installDir "package-lock.json") -Force -ErrorAction SilentlyContinue
    }
}

if (-not (Test-Path $modulePath)) {
    Write-Host ""
    Write-Host "[STEP 1/4] Installing mcp-dataverse..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Path $installDir -Force | Out-Null
    Push-Location $installDir
    cmd /c "npm init -y" 2>&1 | Write-Host
    cmd /c "npm install mcp-dataverse" 2>&1 | Write-Host
    Pop-Location

    $serverJs = Join-Path $modulePath "dist\server.js"
    if (-not (Test-Path $serverJs)) {
        Write-Host "[ERROR] Installation failed. Run npm install manually in $installDir" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "[OK] mcp-dataverse installed" -ForegroundColor Green
}
else {
    Write-Host "[STEP 1/4] mcp-dataverse already installed - skipped" -ForegroundColor Green
}

# -- 3. Create config.json ----------------------------------------------------

Write-Host "[STEP 2/4] Creating config.json..." -ForegroundColor Cyan

if (-not $ClientSecret) {
    Write-Host ""
    Write-Host "  Client secret not provided via -ClientSecret." -ForegroundColor Gray
    Write-Host "  Paste it now (input is hidden)." -ForegroundColor Gray
    $secureSecret = Read-Host "  Client Secret" -AsSecureString
    $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureSecret)
    try {
        $ClientSecret = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
    } finally {
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    }
}

if (-not $ClientSecret) {
    Write-Host "[ERROR] Client secret is required." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

$configObject = [ordered]@{
    environmentUrl = "https://orga7f42fb6.crm.dynamics.com"
    authMethod     = "client-credentials"
    tenantId       = "9d75096e-e828-45c7-ab5f-409cd0ad5b59"
    clientId       = "e6cfa67d-4acc-477c-8108-8fdeb9f026cf"
    clientSecret   = $ClientSecret
}
$configJson = $configObject | ConvertTo-Json

$configFilePath = Join-Path $installDir "config.json"
Write-Utf8NoBom -Path $configFilePath -Content $configJson
Write-Host "[OK] config.json created" -ForegroundColor Green

# -- 4. Update claude_desktop_config.json -------------------------------------

Write-Host "[STEP 3/4] Updating Claude Desktop config..." -ForegroundColor Cyan

$claudeDir        = Join-Path $env:APPDATA "Claude"
$claudeConfigPath = Join-Path $claudeDir "claude_desktop_config.json"
$serverJsPath     = Join-Path $modulePath "dist\server.js"

if (-not (Test-Path $claudeDir)) {
    New-Item -ItemType Directory -Path $claudeDir -Force | Out-Null
}

$dataverseEntry = @{
    command = "node"
    args    = @($serverJsPath)
    env     = @{ MCP_CONFIG_PATH = $configFilePath }
}

$backupPath = $null
if (Test-Path $claudeConfigPath) {
    $backupPath = "$claudeConfigPath.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Copy-Item $claudeConfigPath $backupPath -Force
    Write-Host "  Backed up existing config to $backupPath" -ForegroundColor Gray

    $raw = Get-Content $claudeConfigPath -Raw
    try {
        $configHash = ConvertTo-HashtableDeep ($raw | ConvertFrom-Json)
    } catch {
        Write-Host "  Existing config was not valid JSON - starting fresh" -ForegroundColor Yellow
        $configHash = $null
    }
} else {
    $configHash = $null
}

if (-not $configHash -or -not ($configHash -is [hashtable])) {
    $configHash = @{}
}
if (-not $configHash.ContainsKey("mcpServers") -or -not ($configHash["mcpServers"] -is [hashtable])) {
    $configHash["mcpServers"] = @{}
}
$configHash["mcpServers"]["Dataverse"] = $dataverseEntry

$json = $configHash | ConvertTo-Json -Depth 10
Write-Utf8NoBom -Path $claudeConfigPath -Content $json

try {
    $verify = Get-Content $claudeConfigPath -Raw | ConvertFrom-Json
    if (-not $verify.mcpServers.Dataverse) { throw "Dataverse entry missing after write" }
    Write-Host "[OK] Claude Desktop config updated and verified" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Config written but failed verification: $($_.Exception.Message)" -ForegroundColor Red
    if ($backupPath -and (Test-Path $backupPath)) {
        Copy-Item $backupPath $claudeConfigPath -Force
        Write-Host "         Restored previous config from backup" -ForegroundColor Yellow
    }
    Read-Host "Press Enter to exit"
    exit 1
}

# -- 5. Summary ---------------------------------------------------------------

Write-Host ""
Write-Host "[STEP 4/4] Verifying..." -ForegroundColor Cyan

$ok1 = Test-Path $serverJsPath
$ok2 = Test-Path $configFilePath
$ok3 = Test-Path $claudeConfigPath

if ($ok1) { Write-Host "  [OK] server.js exists" -ForegroundColor Green } else { Write-Host "  [FAIL] server.js missing" -ForegroundColor Red }
if ($ok2) { Write-Host "  [OK] config.json exists" -ForegroundColor Green } else { Write-Host "  [FAIL] config.json missing" -ForegroundColor Red }
if ($ok3) { Write-Host "  [OK] Claude config updated" -ForegroundColor Green } else { Write-Host "  [FAIL] Claude config missing" -ForegroundColor Red }

Write-Host ""
if ($ok1 -and $ok2 -and $ok3) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  INSTALLATION COMPLETE" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Next step: Restart Claude Desktop" -ForegroundColor Yellow
    Write-Host "  (right-click tray icon -> Quit, then reopen)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  The Dataverse server should appear" -ForegroundColor Yellow
    Write-Host "  in Settings -> MCP Servers" -ForegroundColor Yellow
}
else {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  INSTALLATION HAD ERRORS" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  Check the messages above." -ForegroundColor Yellow
}

Write-Host ""
Read-Host "Press Enter to exit"
