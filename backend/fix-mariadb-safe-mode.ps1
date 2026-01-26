# PowerShell script to fix MariaDB permissions using safe mode
# Run this script as Administrator

Write-Host "🔧 Fixing MariaDB Permissions (Safe Mode Method)" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Find MariaDB/MySQL installation
$possiblePaths = @(
    "C:\xampp\mysql\bin",
    "C:\laragon\bin\mysql\*\bin",
    "C:\Program Files\MariaDB *\bin",
    "C:\Program Files (x86)\MariaDB *\bin",
    "C:\mysql\bin"
)

$mysqlPath = $null
foreach ($path in $possiblePaths) {
    $resolvedPath = Resolve-Path $path -ErrorAction SilentlyContinue
    if ($resolvedPath -and (Test-Path (Join-Path $resolvedPath "mysql.exe"))) {
        $mysqlPath = $resolvedPath
        break
    }
}

# Also check PATH
if (-not $mysqlPath) {
    $mysqlCmd = Get-Command mysql -ErrorAction SilentlyContinue
    if ($mysqlCmd) {
        $mysqlPath = Split-Path $mysqlCmd.Source
    }
}

if (-not $mysqlPath) {
    Write-Host "❌ MySQL/MariaDB not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please manually:" -ForegroundColor Yellow
    Write-Host "1. Find your MySQL/MariaDB bin folder" -ForegroundColor Yellow
    Write-Host "2. Open Command Prompt as Administrator" -ForegroundColor Yellow
    Write-Host "3. cd to the bin folder" -ForegroundColor Yellow
    Write-Host "4. Run: mysqld --skip-grant-tables" -ForegroundColor Yellow
    Write-Host "5. Open another Command Prompt and run: mysql -u root" -ForegroundColor Yellow
    Write-Host "6. Execute the SQL commands from fix-mariadb-permissions.sql" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Found MySQL/MariaDB at: $mysqlPath" -ForegroundColor Green
Write-Host ""

# Find mysqld.exe
$mysqldPath = Join-Path $mysqlPath "mysqld.exe"
if (-not (Test-Path $mysqldPath)) {
    Write-Host "❌ mysqld.exe not found!" -ForegroundColor Red
    exit 1
}

Write-Host "⚠️  This will:" -ForegroundColor Yellow
Write-Host "   1. Stop MariaDB service (if running)" -ForegroundColor Yellow
Write-Host "   2. Start MariaDB in safe mode" -ForegroundColor Yellow
Write-Host "   3. Fix permissions" -ForegroundColor Yellow
Write-Host "   4. Restart MariaDB service" -ForegroundColor Yellow
Write-Host ""

$confirm = Read-Host "Continue? (Y/N)"
if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit 0
}

# Stop MariaDB service
Write-Host ""
Write-Host "🛑 Stopping MariaDB service..." -ForegroundColor Cyan
$services = @("MariaDB", "MySQL", "MySQL80", "MySQL57")
$stopped = $false
foreach ($service in $services) {
    $svc = Get-Service -Name $service -ErrorAction SilentlyContinue
    if ($svc -and $svc.Status -eq "Running") {
        Stop-Service -Name $service -Force
        Write-Host "   ✅ Stopped $service" -ForegroundColor Green
        $stopped = $true
    }
}

if (-not $stopped) {
    Write-Host "   ℹ️  No MariaDB service found or already stopped" -ForegroundColor Gray
}

# Start MariaDB in safe mode
Write-Host ""
Write-Host "🔄 Starting MariaDB in safe mode..." -ForegroundColor Cyan
Write-Host "   (This will run in the background)" -ForegroundColor Gray

$safeModeProcess = Start-Process -FilePath $mysqldPath -ArgumentList "--skip-grant-tables", "--skip-networking" -PassThru -WindowStyle Hidden

# Wait a bit for MariaDB to start
Start-Sleep -Seconds 3

# Connect and fix permissions
Write-Host ""
Write-Host "🔧 Fixing permissions..." -ForegroundColor Cyan

$mysqlExe = Join-Path $mysqlPath "mysql.exe"
$sqlCommands = @"
USE mysql;
CREATE USER IF NOT EXISTS 'root'@'localhost';
CREATE USER IF NOT EXISTS 'root'@'127.0.0.1';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' WITH GRANT OPTION;
GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' WITH GRANT OPTION;
UPDATE user SET host='%' WHERE user='root' AND host='localhost';
FLUSH PRIVILEGES;
SELECT 'Permissions fixed!' AS Result;
"@

try {
    $result = & $mysqlExe -u root -e $sqlCommands 2>&1
    Write-Host "   ✅ Permissions fixed!" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Error: $_" -ForegroundColor Red
}

# Stop safe mode process
Write-Host ""
Write-Host "🛑 Stopping safe mode..." -ForegroundColor Cyan
Stop-Process -Id $safeModeProcess.Id -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Start MariaDB service again
Write-Host ""
Write-Host "🔄 Starting MariaDB service..." -ForegroundColor Cyan
foreach ($service in $services) {
    $svc = Get-Service -Name $service -ErrorAction SilentlyContinue
    if ($svc) {
        Start-Service -Name $service
        Write-Host "   ✅ Started $service" -ForegroundColor Green
        break
    }
}

Write-Host ""
Write-Host "✅ Done! Please test the connection now." -ForegroundColor Green
Write-Host ""
Write-Host "Test with:" -ForegroundColor Yellow
Write-Host "  mysql -u root -e `"SELECT 'Connection successful!' AS Result;`"" -ForegroundColor Gray
