@echo off
setlocal

cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not available on PATH.
    exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
    echo ERROR: npm is not available on PATH.
    exit /b 1
)

if not exist "package-lock.json" (
    echo ERROR: package-lock.json is missing. Run this script from the complete project.
    exit /b 1
)

if not exist "public\voice.wav" (
    echo ERROR: public\voice.wav is missing.
    exit /b 1
)

if not exist "..\templates\bridge\toon.ts" (
    echo ERROR: ..\templates\bridge\toon.ts is missing.
    echo Keep video-project inside the original repository folder structure.
    exit /b 1
)

if not "%~1"=="" if /I not "%~1"=="cpu" (
    echo Usage: run-workflow.bat [cpu]
    echo Use "cpu" to render with the software graphics backend.
    exit /b 2
)

echo.
echo [1/3] Installing dependencies...
call npm ci
if errorlevel 1 goto :install_failed

echo.
echo [2/3] Running lint and TypeScript checks...
call npm run lint
if errorlevel 1 goto :lint_failed

echo.
if /I "%~1"=="cpu" (
    echo [3/3] Rendering with the software graphics backend...
    call npm run render:cpu
) else (
    echo [3/3] Rendering with the default graphics backend...
    call npm run render
)
if errorlevel 1 goto :render_failed

if not exist "out\rope-short.mp4" (
    echo ERROR: Render finished without creating out\rope-short.mp4.
    exit /b 1
)

echo.
echo Workflow complete: %CD%\out\rope-short.mp4
exit /b 0

:install_failed
echo ERROR: Dependency installation failed.
exit /b 1

:lint_failed
echo ERROR: Lint or TypeScript checks failed.
exit /b 1

:render_failed
echo ERROR: Video rendering failed.
exit /b 1
