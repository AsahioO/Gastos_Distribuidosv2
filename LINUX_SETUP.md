# Gastos Distribuidos v2 — Linux Setup Guide

## Instalación inicial (primera vez después de clonar)

### 1. Hacer los scripts ejecutables
```bash
bash make_executable.sh
```

O manualmente:
```bash
chmod +x setup_initial.sh run_all.sh backend/run_server.sh frontend/run_frontend.sh
```

### 2. Ejecutar setup inicial
```bash
./setup_initial.sh
```

Esto automáticamente:
- ✅ Verifica Python 3.10+
- ✅ Crea entorno virtual (`backend/venv`)
- ✅ Instala dependencias backend (`requirements/development.txt`)
- ✅ Ejecuta migraciones Django
- ✅ Carga datos iniciales (roles, admin, COG)
- ✅ Instala dependencias frontend (`npm install`)

**Tiempo estimado:** 5-10 minutos

**Credenciales creadas:**
- Usuario: `admin`
- Email: `admin@gastos.local`
- Contraseña: `admin123`

---

## Uso diario — Desarrollo

### Opción A: Iniciar todo en una sola terminal (recomendado)
```bash
./run_all.sh
```

Esto lanza backend y frontend en paralelo en background. Presiona `Ctrl+C` para detener todo.

**URLs:**
- Backend: http://localhost:8000
- Frontend: http://localhost:5173
- API Swagger: http://localhost:8000/api/docs/

### Opción B: Iniciar por separado (en 2 terminales)

**Terminal 1 — Backend:**
```bash
cd backend
./run_server.sh
```

**Terminal 2 — Frontend:**
```bash
cd frontend
./run_frontend.sh
```

---

## Estructura de scripts

| Script | Descripción | Uso |
|---|---|---|
| `setup_initial.sh` | Setup inicial completo | Una sola vez después de clonar |
| `run_all.sh` | Inicia backend + frontend en paralelo | Desarrollo diario |
| `backend/run_server.sh` | Servidor Django solo | Si ejecutas manual |
| `frontend/run_frontend.sh` | Vite dev server solo | Si ejecutas manual |
| `make_executable.sh` | Hace ejecutables todos los .sh | Si tienes permisos conflictivos |

---

## Troubleshooting

### "Permission denied" cuando ejecuto los scripts
```bash
chmod +x setup_initial.sh run_all.sh backend/run_server.sh frontend/run_frontend.sh
```

### Python3 no encontrado
Instala Python 3.10+:
```bash
sudo apt update
sudo apt install python3 python3-venv python3-pip  # Debian/Ubuntu
```

### npm no encontrado
Instala Node.js 18+:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs
```

### Puerto 8000 o 5173 en uso
Opción 1: Detener otros procesos que usen ese puerto
```bash
sudo lsof -i :8000
sudo lsof -i :5173
```

Opción 2: Editar `backend/run_server.sh` o `frontend/run_frontend.sh` para usar otros puertos

### Entorno virtual corrupto
```bash
rm -rf backend/venv
./setup_initial.sh
```

---

## Notas Linux vs Windows

| Aspecto | Windows (.bat) | Linux (.sh) |
|---|---|---|
| Activar venv | `call venv\Scripts\activate.bat` | `source venv/bin/activate` |
| Paths | `\` | `/` |
| Ejecutable | `run_server.bat` | `./run_server.sh` (+ chmod +x) |
| Terminales | `start cmd /k` | Procesos en background |
| Variables entorno | `set VARIABLE=value` | `export VARIABLE=value` |

---

## Próximos pasos

Después de `setup_initial.sh` y con `run_all.sh` ejecutándose:

1. Abre http://localhost:5173 en tu navegador
2. Login: `admin@gastos.local` / `admin123`
3. Ve a http://localhost:8000/api/docs/ para explorar la API
4. Comienza a desarrollar 🚀

---

## Alias útiles (opcional)

Agrega esto a tu `~/.bashrc` o `~/.zshrc`:
```bash
alias gd-setup='cd /ruta/al/repo && ./setup_initial.sh'
alias gd-dev='cd /ruta/al/repo && ./run_all.sh'
alias gd-backend='cd /ruta/al/repo/backend && ./run_server.sh'
alias gd-frontend='cd /ruta/al/repo/frontend && ./run_frontend.sh'
```

Luego: `gd-dev` para iniciar todo 🚀

---

_Para Windows, usa los archivos `.bat` equivalentes._
