# 🚀 Guide de Déploiement sur Vercel

Ce guide vous accompagne pas à pas pour déployer votre application de quincaillerie sur Vercel avec Supabase PostgreSQL.

## 📋 Prérequis

- Un compte GitHub (gratuit)
- Un compte Vercel (gratuit) - https://vercel.com
- Un compte Supabase (gratuit) - https://supabase.com

---

## 🗄️ ÉTAPE 1 : Configuration de la Base de Données (Supabase)

### 1.1 Créer un projet Supabase

1. Allez sur [https://supabase.com](https://supabase.com)
2. Cliquez sur **"Start your project"** ou **"New Project"**
3. Connectez-vous ou créez un compte
4. Créez une nouvelle organisation si nécessaire
5. Cliquez sur **"New Project"**
6. Remplissez les informations :
   - **Name** : `quincaillerie-app` (ou votre nom)
   - **Database Password** : Choisissez un mot de passe fort (notez-le!)
   - **Region** : Choisissez la région la plus proche de vos utilisateurs
   - **Pricing Plan** : Sélectionnez **Free**
7. Cliquez sur **"Create new project"**
8. Attendez 2-3 minutes que le projet soit créé

### 1.2 Obtenir la chaîne de connexion DATABASE_URL

1. Dans votre projet Supabase, allez dans **Settings** (⚙️ en bas à gauche)
2. Cliquez sur **Database** dans le menu latéral
3. Scroll jusqu'à **"Connection string"**
4. Sélectionnez **"URI"** (pas "Session")
5. Copiez la chaîne qui ressemble à :
   ```
   postgresql://postgres.[votre-projet]:[VOTRE-MOT-DE-PASSE]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
   ```
6. **IMPORTANT** : Remplacez `[VOTRE-MOT-DE-PASSE]` par le mot de passe que vous avez créé à l'étape 1.1
7. Gardez cette chaîne précieusement, vous en aurez besoin plus tard

### 1.3 Exécuter le script de migration

1. Dans votre projet Supabase, allez dans **SQL Editor** (dans le menu latéral)
2. Cliquez sur **"New query"**
3. Ouvrez le fichier `database/migration-postgres.sql` de votre projet
4. Copiez TOUT le contenu du fichier
5. Collez-le dans l'éditeur SQL de Supabase
6. Cliquez sur **"Run"** (ou appuyez sur Ctrl+Enter)
7. Vous devriez voir **"Success. No rows returned"** - c'est normal!
8. Vérifiez que les tables ont été créées :
   - Allez dans **Table Editor** (dans le menu latéral)
   - Vous devriez voir toutes les tables : users, products, categories, etc.

### 1.4 Créer l'utilisateur admin

Le script de migration ne crée pas l'utilisateur admin automatiquement car le mot de passe doit être hashé. Vous devez le créer manuellement :

1. Dans **SQL Editor**, créez une nouvelle requête
2. Collez ce code (remplacez `VOTRE_MOT_DE_PASSE_ADMIN` par le mot de passe désiré) :

```sql
-- Insérer l'utilisateur admin
-- Note: Le mot de passe sera 'admin123' (à changer après le premier login!)
INSERT INTO users (username, email, password, first_name, last_name, role)
VALUES (
  'admin',
  'admin@quincaillerie.com',
  '$2a$10$xV5LvJzKq5X9J6hV0f9Z0Og7lZ6mH5vK6rJ5Y8bZ6eH7fK6cL6mN6',
  'Admin',
  'Système',
  'admin'
);
```

3. Cliquez sur **"Run"**
4. **Identifiants par défaut** :
   - Email : `admin@quincaillerie.com`
   - Mot de passe : `admin123`
   - ⚠️ **Changez ce mot de passe après votre première connexion!**

---

## 📦 ÉTAPE 2 : Préparer le Code pour Vercel

### 2.1 Pousser le code sur GitHub

Si ce n'est pas déjà fait :

```bash
# Initialiser git (si pas déjà fait)
git init

# Ajouter tous les fichiers
git add .

# Créer un commit
git commit -m "Préparation pour déploiement Vercel"

# Créer un repository sur GitHub et pousser
# Remplacez YOUR_USERNAME et YOUR_REPO par vos valeurs
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### 2.2 Installer les dépendances nécessaires

```bash
# Dans le dossier backend
cd backend
npm install pg
npm install --save-dev @types/pg

# Revenir à la racine
cd ..
```

---

## 🚢 ÉTAPE 3 : Déployer sur Vercel

### 3.1 Créer un projet Vercel

1. Allez sur [https://vercel.com](https://vercel.com)
2. Cliquez sur **"Sign Up"** ou **"Log In"** avec GitHub
3. Autorisez Vercel à accéder à vos repositories GitHub
4. Sur le dashboard, cliquez sur **"Add New..."** → **"Project"**
5. Trouvez votre repository `quincaillerie-app` et cliquez sur **"Import"**

### 3.2 Configurer le projet

1. **Project Name** : `quincaillerie-app` (ou votre nom)
2. **Framework Preset** : Vercel devrait détecter automatiquement "Vite"
3. **Root Directory** : Laissez `.` (racine)
4. **Build Command** : Laissez la valeur par défaut (déjà configuré dans vercel.json)
5. **Output Directory** : Laissez la valeur par défaut (déjà configuré dans vercel.json)

### 3.3 Ajouter les variables d'environnement

⚠️ **TRÈS IMPORTANT** - Cliquez sur **"Environment Variables"** et ajoutez :

#### Variables Backend

| Name | Value | Notes |
|------|-------|-------|
| `DATABASE_URL` | `postgresql://postgres.[projet]:[password]@...` | La chaîne de connexion Supabase complète (étape 1.2) |
| `NODE_ENV` | `production` | Mode production |
| `JWT_SECRET` | `votre_secret_jwt_super_securise_123456` | Générez une clé aléatoire forte (min 32 caractères) |
| `JWT_EXPIRE` | `7d` | Durée de validité du token (7 jours) |
| `CORS_ORIGIN` | `*` | Autoriser toutes les origines (ou votre domaine spécifique) |

#### Variables Frontend

| Name | Value | Notes |
|------|-------|-------|
| `VITE_API_URL` | ⚠️ **LAISSEZ VIDE POUR L'INSTANT** | Nous allons le remplir après le déploiement |

**Comment générer un JWT_SECRET sécurisé :**
```bash
# Dans votre terminal
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3.4 Déployer

1. Cliquez sur **"Deploy"**
2. Vercel va :
   - Installer les dépendances
   - Builder le frontend
   - Déployer l'application
3. Attendez 2-5 minutes

### 3.5 Obtenir l'URL de déploiement

1. Une fois le déploiement terminé, vous verrez **"Congratulations!"**
2. Cliquez sur **"Visit"** ou copiez l'URL qui ressemble à :
   ```
   https://quincaillerie-app-xxxx.vercel.app
   ```
3. **Notez cette URL!**

### 3.6 Configurer VITE_API_URL

1. Retournez dans les **Settings** du projet Vercel
2. Allez dans **Environment Variables**
3. Trouvez `VITE_API_URL` et cliquez sur les trois points (...) → **Edit**
4. Remplacez la valeur par votre URL Vercel (sans slash final) :
   ```
   https://quincaillerie-app-xxxx.vercel.app
   ```
5. Cliquez sur **"Save"**
6. **Redéployez** l'application :
   - Allez dans **Deployments**
   - Cliquez sur les trois points de la dernière deployment
   - Cliquez sur **"Redeploy"**

---

## ✅ ÉTAPE 4 : Vérifier le Déploiement

### 4.1 Tester l'application

1. Ouvrez votre URL Vercel dans un navigateur
2. Vous devriez voir la page de connexion
3. Connectez-vous avec :
   - **Email** : `admin@quincaillerie.com`
   - **Mot de passe** : `admin123`
4. Si la connexion réussit : **Félicitations! 🎉**

### 4.2 Vérifier l'API

1. Testez l'API en allant sur :
   ```
   https://votre-app.vercel.app/api/health
   ```
2. Vous devriez voir : `{"status":"ok"}`

### 4.3 En cas d'erreur

Si vous voyez des erreurs :

1. **Vérifier les logs Vercel** :
   - Dans le dashboard Vercel, allez dans **Deployments**
   - Cliquez sur le déploiement qui a échoué
   - Regardez les **Build Logs** et **Function Logs**

2. **Erreurs communes** :
   - **"Cannot connect to database"** → Vérifiez votre `DATABASE_URL`
   - **"JWT must be provided"** → Vérifiez votre `JWT_SECRET`
   - **"API not responding"** → Attendez 1-2 minutes (cold start)
   - **"CORS error"** → Vérifiez `CORS_ORIGIN` dans les variables d'environnement

---

## 🔐 ÉTAPE 5 : Sécurité Post-Déploiement

### 5.1 Changer le mot de passe admin

1. Connectez-vous à votre application
2. Allez dans **Utilisateurs** ou **Paramètres**
3. Changez le mot de passe par défaut `admin123`

### 5.2 Configurer un domaine personnalisé (Optionnel)

1. Dans Vercel, allez dans **Settings** → **Domains**
2. Ajoutez votre domaine personnalisé
3. Suivez les instructions pour configurer vos DNS
4. **N'oubliez pas** de mettre à jour `VITE_API_URL` avec votre nouveau domaine!

### 5.3 Activer HTTPS (Automatique)

Vercel active automatiquement HTTPS pour tous les déploiements. Aucune configuration nécessaire! 🔒

---

## 📱 ÉTAPE 6 : Configuration Supabase Avancée (Optionnel)

### 6.1 Activer Row Level Security (RLS)

Pour plus de sécurité, vous pouvez activer RLS sur certaines tables :

```sql
-- Exemple pour la table users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Créer des politiques (policies) selon vos besoins
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);
```

### 6.2 Configurer les Backups

1. Dans Supabase, allez dans **Settings** → **Database**
2. La sauvegarde automatique est activée par défaut (7 jours de rétention)
3. Vous pouvez télécharger des backups manuels si nécessaire

---

## 🎯 Checklist Finale

Avant de considérer le déploiement comme terminé, vérifiez :

- [ ] ✅ Base de données Supabase créée et migrée
- [ ] ✅ Utilisateur admin créé et testé
- [ ] ✅ Code poussé sur GitHub
- [ ] ✅ Projet Vercel créé et déployé
- [ ] ✅ Toutes les variables d'environnement configurées
- [ ] ✅ `VITE_API_URL` configuré avec l'URL finale
- [ ] ✅ Application accessible et fonctionnelle
- [ ] ✅ Connexion admin testée
- [ ] ✅ Mot de passe admin changé
- [ ] ✅ API testée et fonctionnelle

---

## 🆘 Support & Debugging

### Logs Vercel

```bash
# Installer Vercel CLI
npm install -g vercel

# Se connecter
vercel login

# Voir les logs en temps réel
vercel logs
```

### Logs Supabase

1. Dans Supabase, allez dans **Logs** (dans le menu latéral)
2. Sélectionnez **Postgres Logs** pour voir les requêtes SQL
3. Sélectionnez **API Logs** pour voir les requêtes API

### Commandes Utiles

```bash
# Redéployer depuis le terminal
vercel --prod

# Vérifier les variables d'environnement
vercel env ls

# Ajouter une variable d'environnement
vercel env add JWT_SECRET

# Voir les informations du projet
vercel inspect
```

---

## 📚 Ressources Additionnelles

- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Supabase](https://supabase.com/docs)
- [Guide PostgreSQL](https://www.postgresql.org/docs/)
- [Vercel CLI Reference](https://vercel.com/docs/cli)

---

## 🎉 Félicitations!

Votre application de quincaillerie est maintenant déployée en production! 🚀

**URL de votre application** : https://votre-app.vercel.app

**Prochaines étapes suggérées** :
1. Ajouter des utilisateurs
2. Importer vos produits
3. Configurer les catégories
4. Former les utilisateurs
5. Surveiller les performances

---

## 📧 Questions?

Si vous rencontrez des problèmes :
1. Consultez les logs Vercel et Supabase
2. Vérifiez la section "En cas d'erreur" ci-dessus
3. Revérifiez toutes les variables d'environnement
4. Assurez-vous que la DATABASE_URL est correcte

Bon déploiement! 💪
