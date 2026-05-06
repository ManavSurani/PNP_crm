@echo off
pushd "%~dp0"
title PNP CRM Startup
echo Starting PNP CRM...
powershell.exe -ExecutionPolicy Bypass -File .\start-crm.ps1
popd
exit
