# 🚀 Guide de Déploiement sur Vercel

Ce guide vous accompagne pour déployer votre application Quincaillerie sur Vercel avec Supabase.

## 📋 Prérequis

- ✅ Compte Vercel (gratuit) : https://vercel.com
- ✅ Base de données Supabase configurée (voir [SUPABASE_SETUP.md](./SUPABASE_SETUP.md))
- ✅ Git installé sur votre machine
- ✅ Repository Git (GitHub, GitLab, ou Bitbucket)

## 🎯 Architecture de Déploiement

```
Vercel
├── Frontend (React/Vite) → Hébergement statique
├── API (/api/*) → Serverless Functions
└── Database → Supabase PostgreSQL
```

## 📦 Étape 1 : Préparer le Repository Git

### 1.1 Initialiser Git (si pas déjà fait)

```bash
cd c:\Users\Administrator\Desktop\Projects\quincaillerie-app
git init
git add .
git commit -m "Initial commit - Ready for Vercel deployment"
```

### 1.2 Créer un repository sur GitHub

1. Allez sur https://github.com/new
2. Créez un nouveau repository (ex: `quincaillerie-app`)
3. **Ne cochez pas** "Initialize with README"
4. Cliquez sur "Create repository"

### 1.3 Pousser le code

```bash
git remote add origin https://github.com/VOTRE-USERNAME/quincaillerie-app.git
git branch -M main
git push -u origin main
```

## 🔧 Étape 2 : Configurer Vercel

### 2.1 Créer un compte Vercel

1. Allez sur https://vercel.com/signup
2. Connectez-vous avec GitHub (recommandé)
3. Autorisez Vercel à accéder à vos repositories

### 2.2 Importer le projet

1. Sur le dashboard Vercel, cliquez sur **"Add New Project"**
2. Sélectionnez votre repository `quincaillerie-app`
3. Vercel détectera automatiquement la configuration grâce au fichier `vercel.json`

### 2.3 Configuration du Build

Vercel devrait détecter automatiquement :
- **Framework Preset** : Vite
- **Build Command** : `cd frontend && npm install && npm run build`
- **Output Directory** : `frontend/dist`
- **Install Command** : `npm install --prefix backend && npm install --prefix frontend`

> Si ce n'est pas le cas, vérifiez que ces valeurs sont correctes.

## 🔐 Étape 3 : Configurer les Variables d'Environnement

### 3.1 Variables Backend (API)

Dans Vercel, allez dans **Settings** > **Environment Variables** et ajoutez :

| Variable | Valeur | Description |
|----------|--------|-------------|
| `DATABASE_URL` | `postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres` | URL de connexion Supabase |
| `JWT_SECRET` | `votre_secret_jwt_securise` | Secret pour les tokens JWT |
| `CORS_ORIGIN` | `https://votre-app.vercel.app` | URL de votre app (sera fournie après déploiement) |
| `NODE_ENV` | `production` | Environnement de production |

> [!IMPORTANT]
> **DATABASE_URL** : Récupérez cette valeur depuis Supabase :
> 1. Allez dans votre projet Supabase
> 2. Settings > Database > Connection String
> 3. Copiez l'URI et remplacez `[YOUR-PASSWORD]` par votre mot de passe

### 3.2 Variables Frontend

| Variable | Valeur | Description |
|----------|--------|-------------|
| `VITE_API_URL` | `https://votre-app.vercel.app` | URL de l'API (même que CORS_ORIGIN) |

> [!TIP]
> Vous pouvez laisser `VITE_API_URL` vide pour l'instant. Après le premier déploiement, vous aurez l'URL Vercel et pourrez la configurer.

## 🚀 Étape 4 : Déployer

### 4.1 Premier Déploiement

1. Cliquez sur **"Deploy"** dans Vercel
2. Attendez 2-3 minutes que le build se termine
3. Vercel vous donnera une URL (ex: `https://quincaillerie-app-xxx.vercel.app`)

### 4.2 Mettre à jour les Variables d'Environnement

1. Copiez l'URL fournie par Vercel
2. Retournez dans **Settings** > **Environment Variables**
3. Mettez à jour :
   - `CORS_ORIGIN` avec l'URL Vercel
   - `VITE_API_URL` avec l'URL Vercel
4. Redéployez : **Deployments** > **...** (sur le dernier déploiement) > **Redeploy**

## ✅ Étape 5 : Vérification

### 5.1 Tester l'API

```bash
# Health check
curl https://votre-app.vercel.app/api/health

# Devrait retourner :
# {"status":"OK","message":"API de gestion de quincaillerie en ligne"}
```

### 5.2 Tester l'Interface

1. Ouvrez `https://votre-app.vercel.app` dans votre navigateur
2. Connectez-vous avec :
   - Email : `admin@quincaillerie.com`
   - Mot de passe : `admin123`
3. Vérifiez que :
   - ✅ La connexion fonctionne
   - ✅ Les produits s'affichent
   - ✅ Les statistiques se chargent
   - ✅ Vous pouvez créer/modifier des produits

## 🔄 Déploiements Futurs

### Déploiement Automatique

Vercel déploie automatiquement à chaque push sur `main` :

```bash
git add .
git commit -m "Nouvelle fonctionnalité"
git push
```

Vercel détectera le push et déploiera automatiquement.

### Déploiement via CLI (optionnel)

```bash
# Installer Vercel CLI
npm install -g vercel

# Se connecter
vercel login

# Déployer
vercel --prod
```

## 🐛 Troubleshooting

### Erreur "Database connection failed"

**Cause** : Variables d'environnement mal configurées

**Solution** :
1. Vérifiez `DATABASE_URL` dans Vercel
2. Testez la connexion depuis Supabase SQL Editor
3. Vérifiez que le mot de passe est correct

### Erreur "CORS policy"

**Cause** : `CORS_ORIGIN` ne correspond pas à l'URL Vercel

**Solution** :
1. Vérifiez que `CORS_ORIGIN` = URL Vercel exacte
2. Redéployez après modification

### Erreur 404 sur les routes frontend

**Cause** : Configuration SPA manquante

**Solution** : Le fichier `vercel.json` devrait gérer cela automatiquement. Vérifiez qu'il est bien présent à la racine.

### Build échoue

**Cause** : Dépendances manquantes ou erreurs TypeScript

**Solution** :
1. Vérifiez les logs de build dans Vercel
2. Testez le build localement :
   ```bash
   cd frontend
   npm run build
   ```

### API Timeout (10 secondes)

**Cause** : Requête trop longue pour le plan gratuit Vercel

**Solution** :
- Optimisez vos requêtes SQL
- Ajoutez des index dans Supabase
- Considérez le plan Pro Vercel (60s timeout)

## 📊 Monitoring

### Logs en Temps Réel

1. Allez dans **Deployments** > Cliquez sur votre déploiement
2. Onglet **Functions** pour voir les logs API
3. Onglet **Build Logs** pour les logs de build

### Analytics

Vercel fournit gratuitement :
- Nombre de visiteurs
- Performance des pages
- Erreurs 4xx/5xx

Accessible via l'onglet **Analytics**

## 🔒 Sécurité

### Recommandations

1. **JWT_SECRET** : Utilisez un secret fort (32+ caractères aléatoires)
   ```bash
   # Générer un secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Variables d'environnement** : Ne les committez JAMAIS dans Git
   - Les fichiers `.env` sont dans `.gitignore`
   - Utilisez uniquement le dashboard Vercel

3. **CORS** : Limitez à votre domaine exact
   ```
   CORS_ORIGIN=https://votre-app.vercel.app
   ```

## 🎨 Domaine Personnalisé (Optionnel)

### Ajouter votre propre domaine

1. Dans Vercel : **Settings** > **Domains**
2. Ajoutez votre domaine (ex: `quincaillerie.com`)
3. Configurez les DNS selon les instructions Vercel
4. Mettez à jour `CORS_ORIGIN` et `VITE_API_URL` avec le nouveau domaine

## 💰 Coûts

### Plan Gratuit Vercel

- ✅ 100 GB bande passante/mois
- ✅ Déploiements illimités
- ✅ SSL automatique
- ✅ Parfait pour démarrer

### Plan Gratuit Supabase

- ✅ 500 MB stockage
- ✅ 2 GB bande passante
- ✅ Parfait pour démarrer

**Total : 0€/mois** pour commencer ! 🎉

## 📚 Ressources

- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Supabase](https://supabase.com/docs)
- [Vercel CLI](https://vercel.com/docs/cli)

---

**Félicitations ! 🎉** Votre application est maintenant en ligne et accessible depuis n'importe où dans le monde !
