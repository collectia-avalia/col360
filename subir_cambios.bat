@echo off
echo Guardando cambios...
git add .
git commit -m "Sube cambios a produccion"

echo Subiendo al servidor (Vercel)...
git push origin main

echo Proceso finalizado.
pause

