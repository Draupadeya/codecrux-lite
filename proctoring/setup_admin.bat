@echo off
REM SparkLess Admin Portal - Quick Setup Script

setlocal enabledelayedexpansion

:menu
cls
echo.
echo ========================================
echo   SparkLess Admin Portal - Setup Menu
echo ========================================
echo.
echo 1. Delete ALL users (except superuser)
echo 2. Load sample students from CSV
echo 3. Add single student
echo 4. Open Admin Portal (browser)
echo 5. Run development server
echo 6. Exit
echo.
set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" goto delete_users
if "%choice%"=="2" goto load_csv
if "%choice%"=="3" goto add_student
if "%choice%"=="4" goto open_admin
if "%choice%"=="5" goto run_server
if "%choice%"=="6" goto end
goto menu

:delete_users
cls
echo.
echo WARNING: This will delete ALL users except superuser!
set /p confirm="Are you sure? (yes/no): "
if /i "%confirm%"=="yes" (
    python manage.py setup_students --delete-all
    pause
) else (
    echo Cancelled.
    pause
)
goto menu

:load_csv
cls
echo.
echo Loading students from sample_students.csv...
echo.
python manage.py setup_students --file sample_students.csv
echo.
pause
goto menu

:add_student
cls
echo.
echo Format: ROLL_NO,FullName,YYYY-MM-DD
set /p student_data="Enter student data: "
echo.
python manage.py setup_students --add-student "%student_data%"
echo.
pause
goto menu

:open_admin
cls
echo.
echo Opening Admin Portal in browser...
start http://localhost:786/admin/
timeout /t 2
goto menu

:run_server
cls
echo.
echo Starting development server...
echo Admin Portal: http://localhost:786/admin/
echo.
python manage.py runserver 786
goto menu

:end
echo.
echo Goodbye!
echo.
