@echo off

echo Iniciando Backend...
start cmd /k "cd backend && npm install && npm run dev"

echo Iniciando Frontend...
start cmd /k "cd frontend && npm install && npm run dev"

start http://localhost:5173
echo Proyecto iniciado.
pause