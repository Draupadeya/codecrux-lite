# SparkLess Admin Portal - PowerShell Setup Script

function Show-Menu {
    Clear-Host
    Write-Host ""
    Write-Host "========================================"
    Write-Host "  SparkLess Admin Portal - Setup Menu"
    Write-Host "========================================"
    Write-Host ""
    Write-Host "1. Delete ALL users (except superuser)"
    Write-Host "2. Load sample students from CSV"
    Write-Host "3. Add single student"
    Write-Host "4. Open Admin Portal (browser)"
    Write-Host "5. Run development server"
    Write-Host "6. Exit"
    Write-Host ""
}

function Delete-Users {
    Clear-Host
    Write-Host ""
    Write-Host "WARNING: This will delete ALL users except superuser!" -ForegroundColor Red
    $confirm = Read-Host "Are you sure? (yes/no)"
    
    if ($confirm -eq "yes") {
        Write-Host "Deleting all users..." -ForegroundColor Yellow
        & python manage.py setup_students --delete-all
        Read-Host "Press Enter to continue"
    } else {
        Write-Host "Cancelled." -ForegroundColor Green
        Read-Host "Press Enter to continue"
    }
}

function Load-CSV {
    Clear-Host
    Write-Host ""
    Write-Host "Loading students from sample_students.csv..." -ForegroundColor Yellow
    Write-Host ""
    & python manage.py setup_students --file sample_students.csv
    Write-Host ""
    Read-Host "Press Enter to continue"
}

function Add-Student {
    Clear-Host
    Write-Host ""
    Write-Host "Format: ROLL_NO,FullName,YYYY-MM-DD"
    $student_data = Read-Host "Enter student data"
    
    Write-Host ""
    & python manage.py setup_students --add-student $student_data
    Write-Host ""
    Read-Host "Press Enter to continue"
}

function Open-Admin {
    Clear-Host
    Write-Host ""
    Write-Host "Opening Admin Portal in browser..." -ForegroundColor Green
    Start-Process "http://localhost:786/admin/"
    Start-Sleep -Seconds 2
}

function Run-Server {
    Clear-Host
    Write-Host ""
    Write-Host "Starting development server..." -ForegroundColor Green
    Write-Host "Admin Portal: http://localhost:786/admin/" -ForegroundColor Cyan
    Write-Host ""
    & python manage.py runserver 786
}

# Main Loop
do {
    Show-Menu
    $choice = Read-Host "Enter your choice (1-6)"
    
    switch ($choice) {
        "1" { Delete-Users }
        "2" { Load-CSV }
        "3" { Add-Student }
        "4" { Open-Admin }
        "5" { Run-Server; break }
        "6" { break }
        default { Write-Host "Invalid choice. Press Enter to continue..." -ForegroundColor Red; Read-Host }
    }
} while ($choice -ne "6")

Write-Host ""
Write-Host "Goodbye!" -ForegroundColor Green
Write-Host ""
