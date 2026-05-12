@echo off
title Gastos Distribuidos - Setup Inicial
echo ============================================
echo   Gastos Distribuidos - Configuracion Dev
echo ============================================
echo.

REM --- Paso 1: Verificar Python ---
python --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python no encontrado. Instala Python 3.10+ y vuelve a ejecutar este script.
    pause
    exit /b 1
)
echo [OK] Python disponible.

REM --- Paso 2: Crear entorno virtual si no existe ---
if not exist "backend\venv\Scripts\python.exe" (
    echo [..] Creando entorno virtual en backend\venv...
    python -m venv backend\venv
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] No se pudo crear el entorno virtual.
        pause
        exit /b 1
    )
    echo [OK] Entorno virtual creado.
) else (
    echo [OK] Entorno virtual ya existe.
)

REM --- Paso 3: Activar venv e instalar dependencias ---
echo.
echo [..] Activando entorno virtual e instalando dependencias...
call backend\venv\Scripts\activate.bat
pip install -r backend\requirements\development.txt
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Fallo la instalacion de dependencias.
    pause
    exit /b 1
)
echo [OK] Dependencias instaladas.

REM --- Paso 4: Ejecutar migraciones ---
echo.
echo [..] Ejecutando migraciones...
set DJANGO_SETTINGS_MODULE=config.settings.development
cd /d "%~dp0backend"
python manage.py migrate
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Fallo la ejecucion de migraciones.
    pause
    exit /b 1
)
echo [OK] Migraciones aplicadas.

REM --- Paso 5: Cargar datos iniciales ---
echo.
echo [..] Cargando datos iniciales (roles, admin, empresa demo, COG)...
python setup_initial_data.py
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Fallo la carga de datos iniciales.
    pause
    exit /b 1
)

REM --- Paso 6: Mensaje final ---
echo.
echo ============================================
echo   Configuracion completada exitosamente!
echo ============================================
echo.
echo Credenciales de acceso:
echo   Usuario:    admin
echo   Contrasena: admin123
echo   Email:      admin@gastos.local
echo.
echo Para iniciar el servidor:
echo   cd backend
echo   python manage.py runserver
echo.
echo Luego abre: http://localhost:8000
echo.
pause
