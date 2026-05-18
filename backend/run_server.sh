#!/bin/bash

# Gastos Distribuidos - Backend Server
# Inicia el servidor Django

echo "=========================================="
echo "  Gastos Distribuidos - Backend API"
echo "=========================================="
echo ""

# Obtener la ruta del script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Configurar variables de entorno
export DJANGO_SETTINGS_MODULE=config.settings.local
export PYTHONUNBUFFERED=1

echo "[INFO] Configuración: $DJANGO_SETTINGS_MODULE"
echo "[INFO] Iniciando servidor en http://127.0.0.1:8000"
echo "[INFO] Presiona Ctrl+C para detener"
echo ""

# Activar entorno virtual y ejecutar servidor
source venv/bin/activate
python manage.py runserver 8000
