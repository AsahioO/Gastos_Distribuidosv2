#!/bin/bash

# Gastos Distribuidos - Launcher
# Inicia Backend y Frontend en paralelo

echo "=========================================="
echo "  Gastos Distribuidos - Launcher"
echo "=========================================="
echo ""
echo "Iniciando Backend y Frontend..."
echo ""

# Obtener ruta absoluta del script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Iniciar Backend en background
echo "[..] Iniciando Backend..."
cd "$SCRIPT_DIR/backend"
./run_server.sh &
BACKEND_PID=$!

# Esperar 3 segundos para que el backend inicie
sleep 3

# Iniciar Frontend en background
echo "[..] Iniciando Frontend..."
cd "$SCRIPT_DIR/frontend"
./run_frontend.sh &
FRONTEND_PID=$!

echo ""
echo "[OK] Servidores iniciados en background"
echo ""
echo "Backend  (PID $BACKEND_PID):  http://127.0.0.1:8000"
echo "Frontend (PID $FRONTEND_PID):  http://localhost:5173"
echo ""
echo "Credenciales: admin@gastos.local / admin123"
echo ""
echo "Para detener todo:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo "  O presiona Ctrl+C"
echo ""

# Esperar a que ambos procesos terminen
wait
