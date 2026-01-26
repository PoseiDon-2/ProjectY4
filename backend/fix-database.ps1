# PowerShell script to fix MariaDB connection issue
# Run this script as Administrator if needed

Write-Host "🔧 Fixing MariaDB Connection Issue..." -ForegroundColor Cyan
Write-Host ""

# Check if mysql command is available
$mysqlPath = Get-Command mysql -ErrorAction SilentlyContinue

if (-not $mysqlPath) {
    Write-Host "❌ MySQL/MariaDB command not found in PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run the SQL commands manually:" -ForegroundColor Yellow
    Write-Host "1. Open Command Prompt or PowerShell" -ForegroundColor Yellow
    Write-Host "2. Run: mysql -u root -p" -ForegroundColor Yellow
    Write-Host "3. Execute the SQL commands from fix-mariadb-permissions.sql" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Or use phpMyAdmin/HeidiSQL to run the SQL file" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ MySQL/MariaDB command found" -ForegroundColor Green
Write-Host ""

# Ask for password
$password = Read-Host "Enter MySQL root password (press Enter if no password)"

# Build mysql command
$sqlCommands = @"
GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' IDENTIFIED BY '' WITH GRANT OPTION;
GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' IDENTIFIED BY '' WITH GRANT OPTION;
FLUSH PRIVILEGES;
SELECT 'Permissions fixed successfully!' AS Result;
"@

if ($password) {
    $mysqlCmd = "mysql -u root -p$password -e `"$sqlCommands`""
} else {
    $mysqlCmd = "mysql -u root -e `"$sqlCommands`""
}

Write-Host "🔄 Running SQL commands..." -ForegroundColor Cyan
Write-Host ""

try {
    Invoke-Expression $mysqlCmd
    Write-Host ""
    Write-Host "✅ Database permissions fixed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔄 Clearing Laravel config cache..." -ForegroundColor Cyan
    
    # Clear Laravel cache
    Set-Location $PSScriptRoot
    php artisan config:clear
    php artisan config:cache
    
    Write-Host ""
    Write-Host "✅ Done! Please restart your Laravel server and try again." -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run the SQL commands manually using:" -ForegroundColor Yellow
    Write-Host "  mysql -u root -p < fix-mariadb-permissions.sql" -ForegroundColor Yellow
}
