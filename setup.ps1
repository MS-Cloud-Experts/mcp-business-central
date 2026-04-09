#Requires -Version 5.1
<#
.SYNOPSIS
    Setup script for mcp-business-central - MCP server for Business Central (Business Central)
.DESCRIPTION
    Checks prerequisites, clones/builds the project, configures Claude Desktop,
    and guides the user through Azure authentication.
#>

param(
    [string]$InstallDir = "$env:USERPROFILE\Documents\mcp-business-central",
    [switch]$SkipAzLogin
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# -- Helpers ------------------------------------------------------------------

function Write-Step  { param([string]$msg) Write-Host "`n> $msg" -ForegroundColor Cyan }
function Write-Ok    { param([string]$msg) Write-Host "  OK: $msg" -ForegroundColor Green }
function Write-Warn  { param([string]$msg) Write-Host "  !! $msg" -ForegroundColor Yellow }
function Write-Fail  { param([string]$msg) Write-Host "  X $msg" -ForegroundColor Red }

function Test-Command {
    param([string]$Name)
    $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

# -- Banner -------------------------------------------------------------------

Clear-Host
Write-Host ""
Write-Host "  +==================================================+" -ForegroundColor Cyan
Write-Host "  |   MCP Business Central - Setup Wizard   |" -ForegroundColor Cyan
Write-Host "  |   115 AI tools for Claude Desktop               |" -ForegroundColor Cyan
Write-Host "  +==================================================+" -ForegroundColor Cyan
Write-Host ""

# -- Step 1: Check prerequisites ----------------------------------------------

Write-Step "Checking prerequisites..."

$missing = @()

# Node.js
if (Test-Command "node") {
    $nodeVer = (node --version 2>$null) -replace '^v',''
    $nodeMajor = [int]($nodeVer -split '\.')[0]
    if ($nodeMajor -ge 18) {
        Write-Ok "Node.js v$nodeVer"
    } else {
        Write-Fail "Node.js v$nodeVer found -need v18 or later"
        $missing += "Node.js (v18+) -https://nodejs.org"
    }
} else {
    Write-Fail "Node.js not found"
    $missing += "Node.js (v18+) -https://nodejs.org"
}

# Git
if (Test-Command "git") {
    $gitVer = (git --version 2>$null) -replace 'git version ',''
    Write-Ok "Git $gitVer"
} else {
    Write-Fail "Git not found"
    $missing += "Git -https://git-scm.com/download/win"
}

# Azure CLI
if (Test-Command "az") {
    $azVer = (az version 2>$null | ConvertFrom-Json).'azure-cli'
    Write-Ok "Azure CLI $azVer"
} else {
    Write-Fail "Azure CLI not found"
    $missing += "Azure CLI -https://aka.ms/installazurecliwindows"
}

# Claude Desktop
$claudeExe = "$env:LOCALAPPDATA\Programs\Claude\Claude.exe"
if (Test-Path $claudeExe) {
    Write-Ok "Claude Desktop installed"
} else {
    Write-Warn "Claude Desktop not detected (may be installed elsewhere)"
}

# Bail if missing
if ($missing.Count -gt 0) {
    Write-Host ""
    Write-Fail "Missing prerequisites. Please install:"
    foreach ($m in $missing) {
        Write-Host "     - $m" -ForegroundColor Yellow
    }
    Write-Host ""

    $useWinget = $false
    if (Test-Command "winget") {
        Write-Host "  winget is available. Want to install missing tools automatically?" -ForegroundColor Cyan
        $answer = Read-Host "  Install with winget? (Y/N)"
        if ($answer -match '^[Yy]') { $useWinget = $true }
    }

    if ($useWinget) {
        foreach ($m in $missing) {
            if ($m -match "Node") {
                Write-Step "Installing Node.js LTS..."
                winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
            }
            if ($m -match "Git") {
                Write-Step "Installing Git..."
                winget install Git.Git --accept-package-agreements --accept-source-agreements
            }
            if ($m -match "Azure") {
                Write-Step "Installing Azure CLI..."
                winget install Microsoft.AzureCLI --accept-package-agreements --accept-source-agreements
            }
        }
        Write-Host ""
        Write-Warn "Prerequisites installed. Please CLOSE this window, open a NEW terminal, and run this script again."
        Write-Host "  (New terminal is needed so the PATH updates take effect)" -ForegroundColor Gray
        Read-Host "Press Enter to exit"
        exit 0
    } else {
        Write-Host ""
        Write-Host "  Install the missing tools, restart your terminal, and run this script again." -ForegroundColor Gray
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# -- Step 2: Azure login ------------------------------------------------------

if (-not $SkipAzLogin) {
    Write-Step "Azure authentication"

    # Check if already logged in
    $azAccount = $null
    try {
        $azAccount = az account show 2>$null | ConvertFrom-Json
    } catch {}

    if ($azAccount) {
        Write-Ok "Already signed in as $($azAccount.user.name)"
        $relogin = Read-Host "  Use this account? (Y to keep, N to sign in with a different one)"
        if ($relogin -match '^[Nn]') {
            Write-Host "  A browser window will open -sign in with your Business Central account." -ForegroundColor Gray
            az login | Out-Null
        }
    } else {
        Write-Host "  A browser window will open -sign in with your Business Central / Microsoft work account." -ForegroundColor Gray
        Read-Host "  Press Enter to open the login page"
        az login | Out-Null
    }

    # Verify tenant access
    $azAccount = az account show 2>$null | ConvertFrom-Json
    if ($azAccount) {
        Write-Ok "Authenticated as $($azAccount.user.name)"
    } else {
        Write-Fail "Azure login failed. Please try again."
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# -- Step 3: Clone or update repo --------------------------------------------

Write-Step "Setting up project in $InstallDir"

if (Test-Path "$InstallDir\.git") {
    Write-Ok "Project already cloned - pulling latest..."
    Push-Location $InstallDir
    $ErrorActionPreference = "Continue"
    git pull origin main 2>&1 | Out-Null
    $ErrorActionPreference = "Stop"
    Pop-Location
} else {
    if (Test-Path $InstallDir) {
        Write-Warn "$InstallDir exists but is not a git repo -removing and re-cloning"
        Remove-Item $InstallDir -Recurse -Force
    }
    Write-Host "  Cloning from GitHub (you may be asked for credentials)..." -ForegroundColor Gray
    $ErrorActionPreference = "Continue"
    git clone https://github.com/MS-Cloud-Experts/mcp-business-central.git $InstallDir 2>&1 | Out-Null
    $ErrorActionPreference = "Stop"
    if (-not (Test-Path "$InstallDir\package.json")) {
        Write-Fail "Clone failed. Make sure your GitHub account has access to MS-Cloud-Experts."
        Write-Host "  Ask Ivan to add you to the organization." -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
}
Write-Ok "Source code ready"

# -- Step 4: Install dependencies & build -------------------------------------

Write-Step "Installing dependencies..."
Push-Location $InstallDir
$ErrorActionPreference = "Continue"
npm install --loglevel=error 2>&1 | Out-Null
$ErrorActionPreference = "Stop"
Write-Ok "Dependencies installed"

Write-Step "Building..."
$ErrorActionPreference = "Continue"
npm run build 2>&1 | Out-Null
$ErrorActionPreference = "Stop"
if (Test-Path "$InstallDir\build\index.js") {
    Write-Ok "Build successful"
} else {
    Write-Fail "Build failed. Check the output above for errors."
    Pop-Location
    Read-Host "Press Enter to exit"
    exit 1
}
Pop-Location

# -- Step 5: Business Central connection details ------------------------------

Write-Step "Business Central connection details"
Write-Host "  These values connect the MCP server to your BC environment." -ForegroundColor Gray
Write-Host "  Ask your BC admin if you are unsure." -ForegroundColor Gray
Write-Host ""

$bcTenantId    = Read-Host "  Tenant ID (GUID)"
$bcEnvironment = Read-Host "  Environment name (e.g. Production, Sandbox, Pre-Production)"
$bcCompany     = Read-Host "  Company name (e.g. CRONUS USA, Inc.)"

Write-Host ""
Write-Host "  Custom APIs are optional. Press Enter to skip if you only need standard BC APIs." -ForegroundColor Gray
$bcCustomPub   = Read-Host "  Custom API publisher (or Enter to skip)"
$bcCustomGroup = ""
$bcCustomVer   = ""
if ($bcCustomPub) {
    $bcCustomGroup = Read-Host "  Custom API group"
    $bcCustomVer   = Read-Host "  Custom API version (default: v1.0)"
    if (-not $bcCustomVer) { $bcCustomVer = "v1.0" }
}

Write-Ok "Tenant: $bcTenantId"
Write-Ok "Environment: $bcEnvironment"
Write-Ok "Company: $bcCompany"
if ($bcCustomPub) {
    Write-Ok "Custom API: $bcCustomPub/$bcCustomGroup/$bcCustomVer"
}

# -- Step 6: Configure Claude Desktop ----------------------------------------

Write-Step "Configuring Claude Desktop..."

$configDir  = "$env:APPDATA\Claude"
$configFile = "$configDir\claude_desktop_config.json"
$serverPath = "$InstallDir\build\index.js"

# Build env block
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

# Build the desired server entry
$desiredServer = [ordered]@{
    command = "node"
    args    = @($serverPath)
    env     = $envBlock
}

if (Test-Path $configFile) {
    $raw = Get-Content $configFile -Raw
    try {
        $config = $raw | ConvertFrom-Json

        # Ensure mcpServers exists
        if (-not $config.mcpServers) {
            $config | Add-Member -NotePropertyName "mcpServers" -NotePropertyValue ([PSCustomObject]@{})
        }

        # Remove old BC servers if present
        $toRemove = @()
        $config.mcpServers.PSObject.Properties | ForEach-Object {
            if ($_.Name -match "BusinessCentral") {
                $toRemove += $_.Name
            }
        }
        foreach ($name in $toRemove) {
            $config.mcpServers.PSObject.Properties.Remove($name)
        }

        # Add our server
        $config.mcpServers | Add-Member -NotePropertyName "BusinessCentral" -NotePropertyValue ([PSCustomObject]$desiredServer) -Force

        $config | ConvertTo-Json -Depth 10 | Set-Content $configFile -Encoding UTF8
        Write-Ok "Updated existing config (removed old BC entries, added new one)"

    } catch {
        # JSON parse failed - back up and overwrite
        $backup = "$configFile.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Copy-Item $configFile $backup
        Write-Warn "Could not parse existing config - backed up to $backup"

        $newConfig = @{
            mcpServers = @{
                BusinessCentral = $desiredServer
            }
        }
        $newConfig | ConvertTo-Json -Depth 10 | Set-Content $configFile -Encoding UTF8
        Write-Ok "Created fresh config"
    }
} else {
    if (-not (Test-Path $configDir)) {
        New-Item -ItemType Directory -Path $configDir -Force | Out-Null
    }
    $newConfig = @{
        mcpServers = @{
            BusinessCentral = $desiredServer
        }
    }
    $newConfig | ConvertTo-Json -Depth 10 | Set-Content $configFile -Encoding UTF8
    Write-Ok "Created new config at $configFile"
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
Write-Host "    3. Look for the hammer icon (115 tools)" -ForegroundColor Gray
Write-Host '    4. Try: "List the top 5 open sales orders"' -ForegroundColor Gray
Write-Host ""
Write-Host "  If Azure login expires, run: az login" -ForegroundColor Yellow
Write-Host "  To update later, run this script again." -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter to close"
