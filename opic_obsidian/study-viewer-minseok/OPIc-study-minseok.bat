@echo off
setlocal

set "VIEWER_DIR=%~dp0"

where node.exe >nul 2>&1
if errorlevel 1 (
  echo Node.js was not found.
  echo Install Node.js or add node.exe to PATH, then try again.
  pause
  exit /b 1
)

echo Updating Minseok OPIc study data...
pushd "%VIEWER_DIR%"
node.exe "build-data.mjs"
set "BUILD_EXIT=%ERRORLEVEL%"
popd

if not "%BUILD_EXIT%"=="0" goto :failed

echo Update complete.
if /i "%~1"=="--no-open" exit /b 0

start "" "%VIEWER_DIR%compact.html"
exit /b 0

:failed
echo.
echo Update failed. Check the message above.
pause
exit /b %BUILD_EXIT%
