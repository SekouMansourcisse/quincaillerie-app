# 🎉 Bienvenue dans l'Application de Gestion de Quincaillerie !

## 👋 Première fois ici ?

**Commencez par ces 3 étapes simples :**

### 1️⃣ Créez votre base de données (2 minutes)

Nous recommandons **Supabase** (gratuit, hébergé, aucune installation) :

1. Allez sur https://supabase.com et créez un compte gratuit
2. Créez un nouveau projet
3. Suivez le guide détaillé → **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)**

> 💡 Vous préférez PostgreSQL local ? Consultez [DATABASE_COMPARISON.md](DATABASE_COMPARISON.md)

### 2️⃣ Installez et lancez l'application (2 minutes)

**Backend :**
```bash
cd backend
npm install
cp .env.supabase.example .env
# Éditez .env et ajoutez votre URL Supabase
npm run dev
```

**Frontend (nouveau terminal) :**
```bash
cd frontend
npm install
npm run dev
```

### 3️⃣ Connectez-vous ! (1 minute)

Ouvrez http://localhost:3000 et utilisez :
- **Email** : `admin@quincaillerie.com`
- **Mot de passe** : `admin123`

---

## 📚 Documentation Complète

- **[INDEX_DOCUMENTATION.md](INDEX_DOCUMENTATION.md)** - Index de tous les guides
- **[QUICK_START.md](QUICK_START.md)** - Guide de démarrage rapide
- **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)** - Configuration Supabase (recommandé)
- **[DATABASE_COMPARISON.md](DATABASE_COMPARISON.md)** - Supabase vs PostgreSQL local
- **[README.md](README.md)** - Documentation technique complète

---

## ✨ Fonctionnalités

✅ **Dashboard** - Statistiques et vue d'ensemble
✅ **Produits** - Gestion complète du catalogue
✅ **Point de Vente** - Interface de caisse intuitive
✅ **Stock** - Suivi automatique des mouvements
✅ **Alertes** - Notifications de stock faible
✅ **Rapports** - Statistiques de ventes

---

## 🛠️ Technologies

**Backend :** Node.js, Express, TypeScript, PostgreSQL
**Frontend :** React, TypeScript, Tailwind CSS, Vite
**Base de données :** Supabase ou PostgreSQL

---

## 🆘 Besoin d'aide ?

1. Consultez [INDEX_DOCUMENTATION.md](INDEX_DOCUMENTATION.md)
2. Section "Problèmes courants" dans [README.md](README.md)
3. Guide Supabase détaillé : [SUPABASE_SETUP.md](SUPABASE_SETUP.md)

---

## 🚀 Démarrage Rapide (Commandes)

```bash
# 1. Backend
cd backend && npm install
cp .env.supabase.example .env  # Puis éditez .env
npm run dev

# 2. Frontend (nouveau terminal)
cd frontend && npm install
npm run dev

# 3. Ouvrez http://localhost:3000
```

**Connexion par défaut :**
- Email: `admin@quincaillerie.com`
- Mot de passe: `admin123`

---

## 📁 Structure du Projet

```
quincaillerie-app/
├── START_HERE.md              ← Vous êtes ici !
├── INDEX_DOCUMENTATION.md     ← Index des guides
├── QUICK_START.md            ← Démarrage rapide
├── SUPABASE_SETUP.md         ← Config Supabase
├── README.md                 ← Doc complète
│
├── backend/                  ← Serveur API
│   ├── src/
│   ├── database/schema.sql   ← Script SQL
│   └── .env.supabase.example
│
└── frontend/                 ← Interface React
    └── src/
```

---

**Prêt à commencer ?** → [SUPABASE_SETUP.md](SUPABASE_SETUP.md) 🚀

Vous serez opérationnel en **5 minutes** !
