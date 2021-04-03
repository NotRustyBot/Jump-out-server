@echo off
git add .
for /F "tokens=2" %%i in ('date /t') do set mydate=%%i
set mytime=%time%
git commit -m "%mydate%:%mytime%"
git push