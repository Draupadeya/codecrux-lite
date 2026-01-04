# Quick setup script for backend exposure and frontend deployment

Write-Host "🚀 Sparkless Deployment Helper" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if Django is running
$djangoRunning = Get-Process python -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*manage.py*runserver*" }

if (-not $djangoRunning) {
    Write-Host "⚠️  Django server not detected. Starting it now..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Run this in a separate terminal:" -ForegroundColor Green
    Write-Host "cd 'D:\sparkless 1\video_proctoring_project\proctoring'" -ForegroundColor White
    Write-Host "py manage.py runserver 8000" -ForegroundColor White
    Write-Host ""
    $continue = Read-Host "Press Enter when Django is running (or Ctrl+C to exit)"
}

Write-Host "✅ Django server check passed" -ForegroundColor Green
Write-Host ""

# Prompt for backend URL
Write-Host "🌐 Backend Configuration" -ForegroundColor Cyan
Write-Host "------------------------" -ForegroundColor Cyan
Write-Host ""
Write-Host "How do you want to expose your backend?" -ForegroundColor Yellow
Write-Host "1. Use ngrok (recommended for testing)"
Write-Host "2. I already have a public URL"
Write-Host "3. Skip - deploy with localhost (won't work on Vercel)"
Write-Host ""

$choice = Read-Host "Enter choice (1-3)"

$backendUrl = "http://127.0.0.1:8000"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "📡 ngrok Setup" -ForegroundColor Cyan
        Write-Host "--------------" -ForegroundColor Cyan
        Write-Host ""
        
        # Check if ngrok is installed
        $ngrokPath = Get-Command ngrok -ErrorAction SilentlyContinue
        
        if (-not $ngrokPath) {
            Write-Host "❌ ngrok not found!" -ForegroundColor Red
            Write-Host ""
            Write-Host "Download from: https://ngrok.com/download" -ForegroundColor Yellow
            Write-Host "After installing, run this script again." -ForegroundColor Yellow
            exit
        }
        
        Write-Host "✅ ngrok found" -ForegroundColor Green
        Write-Host ""
        Write-Host "Starting ngrok tunnel on port 8000..." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "IMPORTANT:" -ForegroundColor Red
        Write-Host "1. A new window will open with ngrok" -ForegroundColor Yellow
        Write-Host "2. Look for the 'Forwarding' line" -ForegroundColor Yellow
        Write-Host "3. Copy the https://XXXXX.ngrok.io URL" -ForegroundColor Yellow
        Write-Host "4. Come back here and paste it" -ForegroundColor Yellow
        Write-Host ""
        
        Start-Process ngrok -ArgumentList "http 8000" -WindowStyle Normal
        
        Start-Sleep -Seconds 3
        Write-Host ""
        $backendUrl = Read-Host "Enter your ngrok URL (e.g., https://abc123.ngrok.io)"
        
        if (-not $backendUrl.StartsWith("https://")) {
            Write-Host "⚠️  URL should start with https://" -ForegroundColor Yellow
            $backendUrl = "https://$backendUrl"
        }
    }
    
    "2" {
        Write-Host ""
        $backendUrl = Read-Host "Enter your public backend URL (e.g., https://your-domain.com)"
    }
    
    "3" {
        Write-Host ""
        Write-Host "⚠️  Using localhost - this will NOT work when deployed to Vercel!" -ForegroundColor Red
        Write-Host "   Use this only for local testing." -ForegroundColor Yellow
        $backendUrl = "http://127.0.0.1:8000"
    }
}

Write-Host ""
Write-Host "✅ Backend URL set to: $backendUrl" -ForegroundColor Green
Write-Host ""

# Update .env file
$envPath = "D:\sparkless 1\frontend\.env"
$envContent = @"
# Backend Configuration
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
VITE_BACKEND_URL=$backendUrl
VITE_API_BASE_URL=$backendUrl
"@

Set-Content -Path $envPath -Value $envContent
Write-Host "✅ Updated frontend/.env" -ForegroundColor Green
Write-Host ""

# Ask about deployment
Write-Host "🚀 Ready to Deploy!" -ForegroundColor Cyan
Write-Host "------------------" -ForegroundColor Cyan
Write-Host ""
Write-Host "What would you like to do?" -ForegroundColor Yellow
Write-Host "1. Build for Vercel deployment"
Write-Host "2. Build and deploy with Vercel CLI"
Write-Host "3. Just build (manual deployment)"
Write-Host "4. Exit (I'll deploy later)"
Write-Host ""

$deployChoice = Read-Host "Enter choice (1-4)"

cd "D:\sparkless 1\frontend"

switch ($deployChoice) {
    "1" {
        Write-Host ""
        Write-Host "📦 Building for Vercel..." -ForegroundColor Cyan
        npm run build
        Write-Host ""
        Write-Host "✅ Build complete!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Go to https://vercel.com" -ForegroundColor White
        Write-Host "2. Create new project" -ForegroundColor White
        Write-Host "3. Import from Git or upload the 'dist' folder" -ForegroundColor White
        Write-Host "4. Set environment variable: VITE_BACKEND_URL=$backendUrl" -ForegroundColor White
        Write-Host "5. Deploy!" -ForegroundColor White
    }
    
    "2" {
        Write-Host ""
        Write-Host "📦 Building and deploying..." -ForegroundColor Cyan
        Write-Host ""
        
        # Check if vercel CLI is installed
        $vercelPath = Get-Command vercel -ErrorAction SilentlyContinue
        
        if (-not $vercelPath) {
            Write-Host "⚠️  Vercel CLI not found. Installing..." -ForegroundColor Yellow
            npm install -g vercel
        }
        
        Write-Host ""
        npm run build
        Write-Host ""
        Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Cyan
        $env:VITE_BACKEND_URL = $backendUrl
        vercel --prod
    }
    
    "3" {
        Write-Host ""
        Write-Host "📦 Building..." -ForegroundColor Cyan
        npm run build
        Write-Host ""
        Write-Host "✅ Build complete! Files are in frontend/dist/" -ForegroundColor Green
    }
    
    "4" {
        Write-Host ""
        Write-Host "👋 Exiting. Your .env file has been updated with:" -ForegroundColor Green
        Write-Host "   VITE_BACKEND_URL=$backendUrl" -ForegroundColor White
        Write-Host ""
        Write-Host "When ready to build, run:" -ForegroundColor Yellow
        Write-Host "   cd 'D:\sparkless 1\frontend'" -ForegroundColor White
        Write-Host "   npm run build" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "✨ Done!" -ForegroundColor Green
Write-Host ""
Write-Host "📚 For detailed instructions, see:" -ForegroundColor Cyan
Write-Host "   D:\sparkless 1\VERCEL_DEPLOYMENT_GUIDE.md" -ForegroundColor White
Write-Host ""
