@echo off
setlocal EnableExtensions

set "VIEWER_DIR=%~dp0"
for %%I in ("%VIEWER_DIR%..\..") do set "REPO_DIR=%%~fI"
set "PAGES_URL=https://baemu.github.io/opic/"
set "OPEN_URL=%PAGES_URL%"
if /i "%~1"=="--minseok" set "OPEN_URL=%PAGES_URL%minseok/"

where git.exe >nul 2>&1
if errorlevel 1 (
  echo Git was not found.
  echo Install Git or add git.exe to PATH, then try again.
  pause
  exit /b 1
)

call "%VIEWER_DIR%OPIc-study.bat" --no-open
if errorlevel 1 goto :failed

pushd "%REPO_DIR%"
git add -- ".github/workflows/deploy-opic-study.yml" "opic_obsidian/output/scripts" "opic_obsidian/study-viewer" "opic_obsidian/study-viewer-minseok"
if errorlevel 1 goto :git_failed

git diff --cached --quiet
if errorlevel 1 (
  git commit -m "Update OPIc study app"
  if errorlevel 1 goto :git_failed
) else (
  echo No new study changes to commit.
)

echo Publishing OPIc Practice...
git push origin HEAD
if errorlevel 1 goto :git_failed
popd

echo.
echo Publish request complete.
echo GitHub usually updates the site within a few minutes:
echo %PAGES_URL%
echo %PAGES_URL%minseok/
start "" "%OPEN_URL%"
exit /b 0

:git_failed
popd
echo.
echo GitHub publish failed. Sign in to GitHub and try again.
pause
exit /b 1

:failed
echo.
echo Study data update failed. Check the message above.
pause
exit /b 1
