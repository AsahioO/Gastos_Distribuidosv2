#!/bin/bash

# Gastos Distribuidos - Setup Inicial
# Script para primera ejecución tras clonar el repositorio en Linux

set -e  # Termina si hay error

echo "=========================================="
echo "  Gastos Distribuidos - Configuración Dev"
echo "=========================================="
echo ""

# --- Paso 1: Verificar Python ---
echo "[..] Verificando Python..."
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python3 no encontrado. Instala Python 3.10+ y vuelve a ejecutar este script."
    exit 1
fi
python3 --version
echo "[OK] Python disponible."
echo ""

# --- Paso 2: Crear entorno virtual si no existe ---
if [ ! -f "backend/venv/bin/python" ]; then
    echo "[..] Creando entorno virtual en backend/venv..."
    python3 -m venv backend/venv
    echo "[OK] Entorno virtual creado."
else
    echo "[OK] Entorno virtual ya existe."
fi
echo ""

# --- Paso 3: Activar venv e instalar dependencias ---
echo "[..] Activando entorno virtual e instalando dependencias..."
source backend/venv/bin/activate
pip install --upgrade pip setuptools wheel
pip install -r backend/requirements/development.txt
echo "[OK] Dependencias instaladas."
echo ""

# --- Paso 4: Ejecutar migraciones ---
echo "[..] Ejecutando migraciones..."
cd backend
export DJANGO_SETTINGS_MODULE=config.settings.development
python manage.py migrate
echo "[OK] Migraciones aplicadas."
echo ""

# --- Paso 5: Cargar datos iniciales ---
echo "[..] Cargando datos iniciales (roles, admin, empresa demo, COG)..."
python setup_initial_data.py
echo "[OK] Datos iniciales cargados."
echo ""

# --- Paso 6: Instalar dependencias frontend ---
cd ../frontend
echo "[..] Instalando dependencias del frontend..."
npm install
echo "[OK] Dependencias del frontend instaladas."
echo ""

# --- Paso 7: Mensaje final ---
echo "==========================================="
echo "  ¡Configuración completada exitosamente!"
echo "==========================================="
echo ""
echo "Credenciales de acceso:"
echo "  Usuario:    admin"
echo "  Contraseña: admin123"
echo "  Email:      admin@gastos.local"
echo ""
echo "Para iniciar todos los servidores:"
echo "  ./run_all.sh"
echo ""
echo "O manualmente:"
echo "  Backend:  cd backend && ./run_server.sh"
echo "  Frontend: cd frontend && ./run_frontend.sh"
echo ""
echo "URLs de acceso:"
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:5173"
echo ""
