@echo off
echo Configurando repositorio remoto...
git remote remove origin
git remote add origin https://github.com/collectia-avalia/dokploy.git

echo Guardando cambios...
git add .
git commit -m "Subida inicial a nuevo repositorio"

echo Subiendo al servidor...
git push -u origin main --force

echo Proceso finalizado.
pause
