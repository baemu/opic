@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "VIEWER_DIR=%~dp0"
for %%I in ("%VIEWER_DIR%..\..") do set "REPO_DIR=%%~fI"
set "PAGES_URL=https://baemu.github.io/opic/"
set "OPEN_URL=%PAGES_URL%compact.html"
set "WORKFLOW_FILE=deploy-opic-study.yml"
if /i "%~1"=="--minseok" set "OPEN_URL=%PAGES_URL%minseok/compact.html"

where git.exe >nul 2>&1
if errorlevel 1 (
  echo Git was not found.
  echo Install Git or add git.exe to PATH, then try again.
  pause
  exit /b 1
)

echo [1/3] Updating local study data from Markdown...
call "%VIEWER_DIR%OPIc-study.bat" --no-open
if errorlevel 1 goto :failed

pushd "%REPO_DIR%"
echo.
echo [2/3] Saving and uploading the updated study data...
git add -- ".github/workflows/deploy-opic-study.yml" "opic_obsidian/output/scripts" "opic_obsidian/study-viewer" "opic_obsidian/study-viewer-minseok"
if errorlevel 1 goto :git_failed

git diff --cached --quiet
if errorlevel 1 (
  git commit -m "Update OPIc study app"
  if errorlevel 1 goto :git_failed
) else (
  echo No new study changes to commit.
)

for /f "delims=" %%I in ('git rev-parse HEAD') do set "COMMIT_SHA=%%I"

echo Uploading OPIc Practice...
git push origin HEAD
if errorlevel 1 goto :git_failed

echo.
echo [3/3] Waiting for the public site to finish updating...
where gh.exe >nul 2>&1
if errorlevel 1 goto :fallback_wait

set "RUN_ID="
for /l %%N in (1,1,20) do (
  for /f "delims=" %%R in ('gh run list --workflow "!WORKFLOW_FILE!" --commit "!COMMIT_SHA!" --limit 1 --json databaseId --jq ".[0].databaseId" 2^>nul') do set "RUN_ID=%%R"
  if defined RUN_ID goto :watch_run
  timeout /t 3 /nobreak >nul
)
goto :fallback_wait

:watch_run
gh run watch "%RUN_ID%" --exit-status
if errorlevel 1 goto :deploy_failed
goto :open_public

:fallback_wait
echo GitHub CLI is unavailable or the deployment has not appeared yet.
echo Waiting 45 seconds before opening the public page...
timeout /t 45 /nobreak >nul

:open_public
set "SHORT_SHA=!COMMIT_SHA:~0,12!"
popd
echo.
echo Public site update complete:
echo %PAGES_URL%
echo %PAGES_URL%minseok/
start "" "%OPEN_URL%?v=!SHORT_SHA!"
exit /b 0

:deploy_failed
popd
echo.
echo GitHub Pages deployment failed. Check the GitHub Actions message above.
pause
exit /b 1

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
