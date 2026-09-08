@echo off
rem AURA: пересборка витрины каталога из данных BizHub (выгрузка 1С)
cd /d "%~dp0"
python catalog_build.py
echo.
pause
