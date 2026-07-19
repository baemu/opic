@echo off
setlocal

set "VIEWER_DIR=%~dp0"
set "OBSIDIAN_DIR=%VIEWER_DIR%.."
set "MINSEOK_DIR=%OBSIDIAN_DIR%\study-viewer-minseok"

where node.exe >nul 2>&1
if errorlevel 1 (
  echo Node.js was not found.
  echo Install Node.js or add node.exe to PATH, then try again.
  pause
  exit /b 1
)

echo Updating OPIc study data...
call :build "%VIEWER_DIR%"
if errorlevel 1 goto :failed

if exist "%MINSEOK_DIR%\build-data.mjs" (
  echo Updating Minseok study data...
  call :build "%MINSEOK_DIR%"
  if errorlevel 1 goto :failed
)

echo Update complete.
if /i "%~1"=="--no-open" exit /b 0

start "" "%VIEWER_DIR%compact.html"
exit /b 0

:build
pushd "%~1"
node.exe "build-data.mjs"
set "BUILD_EXIT=%ERRORLEVEL%"
popd
exit /b %BUILD_EXIT%

:failed
echo.
echo Update failed. Check the message above.
pause
exit /b 1
