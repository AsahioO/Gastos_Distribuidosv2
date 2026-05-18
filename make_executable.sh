#!/bin/bash

# Gastos Distribuidos - Make scripts executable
# Ejecuta este script una sola vez para hacer todos los .sh ejecutables

echo "Haciendo scripts ejecutables..."

chmod +x setup_initial.sh
chmod +x run_all.sh
chmod +x backend/run_server.sh
chmod +x frontend/run_frontend.sh

echo "[OK] Todos los scripts son ahora ejecutables"
echo ""
echo "Uso:"
echo "  1. Primera vez:  ./setup_initial.sh"
echo "  2. Desarrollo:   ./run_all.sh"
echo ""
