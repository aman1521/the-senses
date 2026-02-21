# The Senses - Development Server Starter
# This script starts both Backend and Frontend servers in separate windows

Write-Host "🚀 Starting The Senses Development Servers..." -ForegroundColor Cyan
Write-Host ""

# Start Backend Server
Write-Host "📡 Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\The Senses (BE+FE)\Backend'; Write-Host '🔧 Backend Server' -ForegroundColor Green; npm run dev"

# Wait for backend to initialize
Start-Sleep -Seconds 3

# Start Frontend Server
Write-Host "🎨 Starting Frontend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\The Senses (BE+FE)\frontend'; Write-Host '⚛️  Frontend Server' -ForegroundColor Blue; npm run dev"

# Wait a moment
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "✅ Both servers are starting..." -ForegroundColor Green
Write-Host ""
Write-Host "📍 Access Points:" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:5000" -ForegroundColor White
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "💡 Two new PowerShell windows will open with the servers" -ForegroundColor Yellow
Write-Host "   Close those windows to stop the servers" -ForegroundColor Yellow
Write-Host ""
Write-Host "🧪 Test the new features:" -ForegroundColor Cyan
Write-Host "   1. User Profiles:     /profile/me" -ForegroundColor White
Write-Host "   2. Social Feed:       /feed (add route first)" -ForegroundColor White
Write-Host "   3. Score Sharing:     Complete a test" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor DarkGray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
