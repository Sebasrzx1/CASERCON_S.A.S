@echo off

echo Iniciando Backend...
start cmd /k "cd backend && pnpm install && pnpm dev"

echo Iniciando Frontend...
start cmd /k "cd frontend && pnpm install && pnpm run dev"

start http://localhost:5173
echo Proyecto iniciado.
pause