#!/bin/bash

# Script de préparation pour le déploiement Vercel
# Exécutez ce script avant de pousser sur GitHub

echo "🚀 Préparation pour le déploiement Vercel..."
echo ""

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "vercel.json" ]; then
    echo "❌ Erreur: vercel.json introuvable. Êtes-vous dans le bon répertoire?"
    exit 1
fi

echo "📦 Installation des dépendances backend..."
cd backend
npm install pg @types/pg
cd ..

echo ""
echo "✅ Dépendances installées!"
echo ""

echo "🔍 Vérification des fichiers de configuration..."

# Vérifier les fichiers nécessaires
files=("database/migration-postgres.sql" "backend/src/config/database.prod.ts" "DEPLOIEMENT-VERCEL.md" ".env.vercel.example")

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file introuvable!"
    fi
done

echo ""
echo "📝 Prochaines étapes:"
echo "  1. Créer un projet Supabase et exécuter database/migration-postgres.sql"
echo "  2. Pousser le code sur GitHub: git add . && git commit -m 'Deploy' && git push"
echo "  3. Créer un projet Vercel et configurer les variables d'environnement"
echo ""
echo "📖 Consultez QUICK-START-VERCEL.md pour le guide complet"
echo ""
echo "✨ Prêt pour le déploiement!"
