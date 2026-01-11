# 📚 Index de la Documentation

Bienvenue dans la documentation de l'application de gestion de quincaillerie !

## 🚀 Démarrage Rapide

### Nouveaux utilisateurs - Par où commencer ?

1. **[QUICK_START.md](QUICK_START.md)** - ⭐ Commencez ici !
   - Installation en 5 minutes
   - Guide pas-à-pas pour débutants
   - Instructions claires et concises

2. **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)** - 🌟 Recommandé
   - Configuration Supabase (base de données gratuite dans le cloud)
   - Pas besoin d'installer PostgreSQL
   - Guide complet avec captures d'écran conceptuelles

3. **[DATABASE_COMPARISON.md](DATABASE_COMPARISON.md)** - ❓ Besoin d'aide pour choisir ?
   - Supabase vs PostgreSQL local
   - Tableau comparatif
   - Recommandations selon votre cas

## 📖 Documentation Complète

4. **[README.md](README.md)** - Documentation principale
   - Vue d'ensemble complète du projet
   - Architecture détaillée
   - API endpoints
   - Configuration avancée
   - Déploiement en production

## 📂 Structure du Projet

```
quincaillerie-app/
│
├── 📄 INDEX_DOCUMENTATION.md    ← Vous êtes ici !
├── 📄 QUICK_START.md            ← Commencez par ici
├── 📄 SUPABASE_SETUP.md         ← Configuration Supabase (recommandé)
├── 📄 DATABASE_COMPARISON.md    ← Aide au choix de BDD
├── 📄 README.md                 ← Documentation complète
│
├── backend/                      ← Code serveur (API)
│   ├── src/
│   ├── database/
│   │   └── schema.sql           ← Script de création de la BDD
│   ├── .env.example             ← Config PostgreSQL local
│   └── .env.supabase.example    ← Config Supabase
│
└── frontend/                     ← Code interface (React)
    └── src/
```

## 🎯 Guides par Objectif

### Je veux juste tester rapidement
→ [QUICK_START.md](QUICK_START.md) + [SUPABASE_SETUP.md](SUPABASE_SETUP.md)

### Je veux comprendre le projet en détail
→ [README.md](README.md)

### J'hésite entre Supabase et PostgreSQL local
→ [DATABASE_COMPARISON.md](DATABASE_COMPARISON.md)

### Je veux configurer Supabase
→ [SUPABASE_SETUP.md](SUPABASE_SETUP.md)

### Je veux utiliser PostgreSQL local
→ [README.md](README.md) section "Option B : PostgreSQL Local"

### Je veux déployer en production
→ [README.md](README.md) section "Build pour production"

## ⚡ Installation Express (TL;DR)

```bash
# 1. Base de données
Créez un compte sur https://supabase.com (gratuit)
Exécutez le script backend/database/schema.sql dans l'éditeur SQL

# 2. Backend
cd backend
npm install
cp .env.supabase.example .env
# Modifiez .env avec votre URL Supabase
npm run dev

# 3. Frontend (nouveau terminal)
cd frontend
npm install
npm run dev

# 4. Connectez-vous sur http://localhost:3000
Email: admin@quincaillerie.com
Mot de passe: admin123
```

## 🛠️ Fichiers de Configuration

| Fichier | Usage |
|---------|-------|
| `backend/.env.example` | Template pour PostgreSQL local |
| `backend/.env.supabase.example` | Template pour Supabase |
| `backend/database/schema.sql` | Script SQL de création des tables |
| `frontend/.env` | Configuration frontend (optionnel) |

## 📊 Fonctionnalités de l'Application

- ✅ Authentification (login/logout)
- ✅ Dashboard avec statistiques
- ✅ Gestion des produits (CRUD)
- ✅ Point de vente (POS)
- ✅ Gestion automatique du stock
- ✅ Alertes stock faible
- ✅ Rapports de ventes

## 🆘 Problèmes Courants

### Erreur de connexion à la base de données
→ Vérifiez votre `.env` et la connexion à Supabase/PostgreSQL

### Le backend ne démarre pas
→ Vérifiez que le port 5000 est libre
→ Exécutez `npm install` dans le dossier backend

### Erreur 401 (Non autorisé)
→ Reconnectez-vous, le token JWT a expiré

### Plus de détails
→ Consultez [README.md](README.md) section "Problèmes courants"

## 🔗 Liens Utiles

- **Supabase** : https://supabase.com
- **Documentation Supabase** : https://supabase.com/docs
- **PostgreSQL** : https://www.postgresql.org
- **Node.js** : https://nodejs.org
- **React** : https://react.dev
- **Tailwind CSS** : https://tailwindcss.com

## 📞 Support

Pour toute question :
1. Consultez d'abord les guides ci-dessus
2. Vérifiez la section "Problèmes courants" dans [README.md](README.md)
3. Créez une issue sur le dépôt GitHub

---

**Bon développement ! 🚀**

Commencez par [QUICK_START.md](QUICK_START.md) et vous serez opérationnel en moins de 5 minutes !
