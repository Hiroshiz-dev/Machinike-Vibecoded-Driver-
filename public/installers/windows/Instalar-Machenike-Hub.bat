@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
title Machenike Hub - Instalador para Windows

cd /d "%~dp0..\.."

echo ============================================================
echo        MACHENIKE HUB - INSTALADOR PARA WINDOWS (PC)
echo ============================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo [ERRO] Node.js nao encontrado neste computador.
    echo Baixe e instale a versao LTS em: https://nodejs.org/
    echo Depois execute este instalador novamente.
    echo.
    pause
    exit /b 1
)

echo [1/3] Verificando e instalando dependencias do projeto...
call npm install
if errorlevel 1 (
    echo [ERRO] Falha ao instalar dependencias.
    pause
    exit /b 1
)

echo.
echo Escolha o modo de instalacao no Windows:
echo   [1] Compilar e abrir Instalador Nativo (.EXE) com Electron (Recomendado)
echo   [2] Compilar App Local e criar atalho na Area de Trabalho
echo.
set /p MODO="Digite 1 ou 2 e pressione Enter: "

if "%MODO%"=="2" goto :modo_atalho

:modo_exe
echo.
echo [2/3] Preparando empacotador Desktop (Electron)...
call npm install --no-save electron electron-builder
if errorlevel 1 (
    echo [ERRO] Falha ao preparar o empacotador Electron.
    pause
    exit /b 1
)

echo.
echo [3/3] Gerando executavel Windows (.exe) em release\...
set VITE_BASE_PATH=./
call npm run build
if errorlevel 1 (
    echo [ERRO] Falha no build do aplicativo.
    pause
    exit /b 1
)
call npx electron-builder --config electron-builder.json --win --publish never
if errorlevel 1 (
    echo [ERRO] Falha ao empacotar o executavel Windows.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo   CONCLUIDO! Executavel gerado na pasta "release\".
echo ============================================================
start "" explorer "%cd%\release"
pause
exit /b 0

:modo_atalho
echo.
echo [2/3] Compilando aplicativo em modo producao...
call npm run build
if errorlevel 1 (
    echo [ERRO] Falha no build do aplicativo.
    pause
    exit /b 1
)

echo [3/3] Criando atalho "Machenike Hub" na Area de Trabalho...
set "LAUNCHER=%cd%\installers\windows\Abrir-Machenike-Hub.bat"
(
echo @echo off
echo cd /d "%cd%"
echo start "" /b cmd /c "npx vite preview --port 3000 --host 127.0.0.1"
echo timeout /t 2 /nobreak ^>nul
echo start "" "http://127.0.0.1:3000"
) > "%LAUNCHER%"

powershell -NoProfile -Command "$s=(New-Object -COM WScript.Shell).CreateShortcut('%USERPROFILE%\Desktop\Machenike Hub.lnk'); $s.TargetPath='%LAUNCHER%'; $s.WorkingDirectory='%cd%'; $s.Description='Machenike Hub - Controlador de Recursos e Driver'; $s.Save()"

echo.
echo ============================================================
echo   INSTALACAO CONCLUIDA!
echo   Atalho criado na Area de Trabalho: "Machenike Hub"
echo ============================================================
pause
exit /b 0
