@echo off
REM Script de préparation pour le déploiement Vercel (Windows)
REM Double-cliquez ou exécutez ce script avant de pousser sur GitHub

echo.
echo ========================================
echo  Preparation pour le deploiement Vercel
echo ========================================
echo.

REM Vérifier que nous sommes dans le bon répertoire
if not exist "vercel.json" (
    echo [ERREUR] vercel.json introuvable. Etes-vous dans le bon repertoire?
    pause
    exit /b 1
)

echo [OK] Repertoire valide
echo.

echo Installation des dependances backend...
cd backend
call npm install pg @types/pg
cd ..

echo.
echo [OK] Dependances installees!
echo.

echo Verification des fichiers de configuration...
echo.

if exist "database\migration-postgres.sql" (
    echo [OK] database\migration-postgres.sql
) else (
    echo [X] database\migration-postgres.sql introuvable
)

if exist "backend\src\config\database.prod.ts" (
    echo [OK] backend\src\config\database.prod.ts
) else (
    echo [X] backend\src\config\database.prod.ts introuvable
)

if exist "DEPLOIEMENT-VERCEL.md" (
    echo [OK] DEPLOIEMENT-VERCEL.md
) else (
    echo [X] DEPLOIEMENT-VERCEL.md introuvable
)

if exist ".env.vercel.example" (
    echo [OK] .env.vercel.example
) else (
    echo [X] .env.vercel.example introuvable
)

echo.
echo ========================================
echo  Prochaines etapes:
echo ========================================
echo.
echo 1. Creer un projet Supabase et executer database\migration-postgres.sql
echo 2. Pousser le code sur GitHub:
echo    git add .
echo    git commit -m "Deploy"
echo    git push
echo 3. Creer un projet Vercel et configurer les variables d'environnement
echo.
echo Consultez QUICK-START-VERCEL.md pour le guide complet
echo.
echo [OK] Pret pour le deploiement!
echo.

pause
