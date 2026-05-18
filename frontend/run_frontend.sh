#!/bin/bash

# Gastos Distribuidos - Frontend Dev Server
# Inicia el servidor de desarrollo Vite

echo "=========================================="
echo "  Gastos Distribuidos - Frontend"
echo "=========================================="
echo ""

# Obtener la ruta del script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "[INFO] Iniciando servidor de desarrollo..."
echo "[INFO] La aplicación estará en http://localhost:5173"
echo "[INFO] Presiona Ctrl+C para detener"
echo ""

npm run dev
