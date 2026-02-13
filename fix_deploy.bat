@echo off
echo Preparando fix de despliegue...
git add package.json
git commit -m "fix(deploy): move typescript to dependencies and set node engine"
echo Subiendo cambios...
git push origin main
echo Listo. Dokploy deberia reconstruir automaticamente.
pause
