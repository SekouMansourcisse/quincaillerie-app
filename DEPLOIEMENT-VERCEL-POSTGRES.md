# 🚀 Déploiement sur Vercel avec Vercel Postgres

Guide complet pour déployer votre application en utilisant **Vercel Postgres** (tout dans Vercel, pas besoin de Supabase).

## ⚖️ Vercel Postgres vs Supabase

| Critère | Vercel Postgres | Supabase |
|---------|----------------|----------|
| **Setup** | ✅ Plus simple (tout dans Vercel) | ⚠️ Compte séparé nécessaire |
| **Plan Gratuit** | 256 MB stockage, 60h compute | 500 MB stockage, illimité |
| **Intégration** | ✅ Native avec Vercel | ⚠️ Externe |
| **Interface Admin** | ⚠️ Basique | ✅ SQL Editor, Table Editor |
| **Backups** | ⚠️ Manuels | ✅ Automatiques (7 jours) |
| **Auth & API** | ❌ Non | ✅ Oui (Auth, Storage, Realtime) |
| **Prix** | À partir de $20/mois | À partir de $25/mois |

**Recommandation** :
- **Vercel Postgres** si vous voulez simplicité et tout dans Vercel
- **Supabase** si vous voulez plus de fonctionnalités et un meilleur plan gratuit

---

## 📋 Prérequis

- Un compte GitHub (gratuit)
- Un compte Vercel (gratuit) - https://vercel.com
- Code de l'application prêt

---

## 🗄️ ÉTAPE 1 : Pousser le Code sur GitHub

```bash
# Initialiser git (si pas déjà fait)
git init

# Ajouter tous les fichiers
git add .

# Créer un commit
git commit -m "Déploiement Vercel avec Vercel Postgres"

# Créer un repository sur GitHub et pousser
git remote add origin https://github.com/VOTRE_USERNAME/VOTRE_REPO.git
git branch -M main
git push -u origin main
```

---

## 🚢 ÉTAPE 2 : Créer le Projet Vercel

### 2.1 Importer le projet

1. Allez sur [https://vercel.com](https://vercel.com)
2. Cliquez sur **"Sign Up"** ou **"Log In"** avec GitHub
3. Autorisez Vercel à accéder à vos repositories GitHub
4. Sur le dashboard, cliquez sur **"Add New..."** → **"Project"**
5. Trouvez votre repository et cliquez sur **"Import"**

### 2.2 Configurer les variables d'environnement (temporaires)

⚠️ Pour l'instant, ajoutez ces variables (nous configurerons DATABASE_URL après) :

| Name | Value |
|------|-------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Générer avec : `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `JWT_EXPIRE` | `7d` |
| `CORS_ORIGIN` | `*` |
| `VITE_API_URL` | ⚠️ Laisser vide pour l'instant |

### 2.3 Déployer (première fois)

1. Cliquez sur **"Deploy"**
2. Attendez que le build termine (2-5 minutes)
3. **NE PAS TESTER ENCORE** (la base de données n'est pas configurée)
4. Notez votre URL : `https://votre-app-xxxx.vercel.app`

---

## 🗄️ ÉTAPE 3 : Créer la Base de Données Vercel Postgres

### 3.1 Créer le storage

1. Dans votre projet Vercel, allez dans l'onglet **"Storage"**
2. Cliquez sur **"Create Database"**
3. Sélectionnez **"Postgres"**
4. Donnez un nom : `quincaillerie-db` (ou votre choix)
5. Sélectionnez la **région** la plus proche de vos utilisateurs
6. Cliquez sur **"Create"**
7. Attendez 30 secondes - 1 minute

### 3.2 Connecter la base de données au projet

1. Vercel vous demande **"Connect to Project"**
2. Sélectionnez votre projet `quincaillerie-app`
3. Sélectionnez l'environnement : **Production, Preview, Development**
4. Cliquez sur **"Connect"**

✅ **Vercel configure automatiquement** la variable `POSTGRES_URL` (qui sera utilisée comme DATABASE_URL)!

### 3.3 Vérifier les variables d'environnement

1. Allez dans **Settings** → **Environment Variables**
2. Vous devriez voir de nouvelles variables :
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`
   - etc.

### 3.4 Ajouter l'alias DATABASE_URL

1. Dans **Environment Variables**, cliquez sur **"Add New"**
2. **Key** : `DATABASE_URL`
3. **Value** : Référencer `POSTGRES_URL` :
   ```
   ${POSTGRES_URL}
   ```
   OU copiez directement la valeur de `POSTGRES_URL`
4. Sélectionnez **Production, Preview, Development**
5. Cliquez sur **"Save"**

---

## 📊 ÉTAPE 4 : Initialiser la Base de Données

### 4.1 Accéder au Query Editor

1. Dans votre projet Vercel, allez dans **"Storage"**
2. Cliquez sur votre database **"quincaillerie-db"**
3. Allez dans l'onglet **"Query"**

### 4.2 Exécuter le script de migration

1. Ouvrez le fichier `database/migration-postgres.sql` de votre projet local
2. Copiez **TOUT** le contenu
3. Collez-le dans le **Query Editor** de Vercel
4. Cliquez sur **"Run Query"**
5. Vous devriez voir : **"Query executed successfully"**

### 4.3 Vérifier que les tables sont créées

1. Dans l'onglet **"Data"** de votre database
2. Vous devriez voir toutes vos tables :
   - users
   - products
   - categories
   - suppliers
   - sales
   - etc.

### 4.4 Créer l'utilisateur admin

1. Dans le **Query Editor**, exécutez cette requête :

```sql
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

2. Cliquez sur **"Run Query"**

**Identifiants par défaut** :
- Email : `admin@quincaillerie.com`
- Mot de passe : `admin123`
- ⚠️ Changez ce mot de passe après votre première connexion!

---

## ⚙️ ÉTAPE 5 : Configurer VITE_API_URL et Redéployer

### 5.1 Ajouter VITE_API_URL

1. Allez dans **Settings** → **Environment Variables**
2. Trouvez ou ajoutez `VITE_API_URL`
3. **Value** : Votre URL Vercel (sans slash final)
   ```
   https://votre-app-xxxx.vercel.app
   ```
4. Assurez-vous que c'est coché pour **Production, Preview, Development**
5. Cliquez sur **"Save"**

### 5.2 Redéployer l'application

1. Allez dans **Deployments**
2. Trouvez le dernier déploiement
3. Cliquez sur les **trois points (...)** → **"Redeploy"**
4. Cochez **"Use existing Build Cache"** (plus rapide)
5. Cliquez sur **"Redeploy"**
6. Attendez 2-3 minutes

---

## ✅ ÉTAPE 6 : Tester l'Application

### 6.1 Accéder à l'application

1. Allez sur votre URL : `https://votre-app-xxxx.vercel.app`
2. Vous devriez voir la page de connexion

### 6.2 Se connecter

1. **Email** : `admin@quincaillerie.com`
2. **Mot de passe** : `admin123`
3. Cliquez sur **"Connexion"**

### 6.3 Tester l'API

1. Ouvrez : `https://votre-app-xxxx.vercel.app/api/health`
2. Vous devriez voir : `{"status":"ok"}`

### 6.4 Si ça fonctionne 🎉

**Félicitations!** Votre application est déployée avec Vercel Postgres!

**Prochaines étapes** :
1. Changez le mot de passe admin
2. Ajoutez vos produits et catégories
3. Invitez vos utilisateurs

---

## 🔧 ÉTAPE 7 : Gestion de la Base de Données

### 7.1 Accéder à la console

1. **Storage** → Votre database → **"Data"**
2. Vous pouvez voir toutes vos tables et données

### 7.2 Exécuter des requêtes SQL

1. **Storage** → Votre database → **"Query"**
2. Écrivez votre SQL et cliquez sur **"Run Query"**

Exemples de requêtes utiles :

```sql
-- Voir tous les utilisateurs
SELECT * FROM users;

-- Voir tous les produits
SELECT p.*, c.name as category_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id;

-- Voir les statistiques de ventes
SELECT
  COUNT(*) as total_sales,
  SUM(net_amount) as total_revenue
FROM sales
WHERE sale_date >= CURRENT_DATE - INTERVAL '30 days';

-- Changer le mot de passe admin (avec hash bcrypt)
UPDATE users
SET password = '$2a$10$NouveauHashIci'
WHERE email = 'admin@quincaillerie.com';
```

### 7.3 Backups manuels

Vercel Postgres ne propose pas de backups automatiques sur le plan gratuit.

**Pour exporter vos données** :

```sql
-- Dans le Query Editor, exécutez pour chaque table
SELECT * FROM users;
-- Copiez les résultats et sauvegardez dans un fichier CSV
```

**Alternative** : Utiliser `pg_dump` depuis votre machine locale :

```bash
# Installer PostgreSQL client si nécessaire
# Windows : https://www.postgresql.org/download/windows/
# Mac : brew install postgresql
# Linux : sudo apt-get install postgresql-client

# Obtenir la DATABASE_URL depuis Vercel Settings > Environment Variables
# puis :

pg_dump "DATABASE_URL_ICI" > backup.sql
```

### 7.4 Limites du plan gratuit

**Plan Gratuit Vercel Postgres** :
- ✅ 256 MB de stockage
- ✅ 60 heures de compute time par mois
- ✅ 256 MB RAM
- ⚠️ Pas de backups automatiques
- ⚠️ 1 seule database

**Si vous dépassez ces limites** :
- Passez au plan **Pro** ($20/mois) : 512 MB stockage, plus de compute
- Ou migrez vers Supabase (500 MB gratuit)

---

## 🔐 ÉTAPE 8 : Sécurité

### 8.1 Changer le mot de passe admin

1. Connectez-vous à votre application
2. Allez dans **Paramètres** ou **Utilisateurs**
3. Changez le mot de passe `admin123` par un mot de passe fort

### 8.2 Configurer CORS (si nécessaire)

Si vous voulez limiter les origines autorisées :

1. **Settings** → **Environment Variables**
2. Modifiez `CORS_ORIGIN`
3. Remplacez `*` par votre domaine : `https://votre-app.vercel.app`
4. Redéployez

### 8.3 Variables sensibles

⚠️ **NE JAMAIS COMMITER** :
- `DATABASE_URL`
- `JWT_SECRET`
- Fichiers `.env`

Ces variables doivent UNIQUEMENT être dans Vercel Environment Variables.

---

## 🎯 Checklist Finale

Avant de considérer le déploiement terminé :

- [ ] ✅ Code poussé sur GitHub
- [ ] ✅ Projet Vercel créé et déployé
- [ ] ✅ Base de données Vercel Postgres créée
- [ ] ✅ Variable `DATABASE_URL` configurée
- [ ] ✅ Script SQL exécuté (tables créées)
- [ ] ✅ Utilisateur admin créé
- [ ] ✅ `VITE_API_URL` configuré
- [ ] ✅ Application redéployée avec la bonne config
- [ ] ✅ Application accessible et fonctionnelle
- [ ] ✅ Connexion admin testée
- [ ] ✅ Mot de passe admin changé
- [ ] ✅ API testée (`/api/health`)

---

## 🆘 Dépannage

### Erreur "Cannot connect to database"

1. Vérifiez que `DATABASE_URL` existe dans Environment Variables
2. Vérifiez que la database est bien connectée au projet (Storage)
3. Vérifiez les logs : **Deployments** → Votre deployment → **Function Logs**

### Erreur "relation does not exist"

Les tables n'ont pas été créées. Retournez à l'ÉTAPE 4 et réexécutez le script SQL.

### Erreur "password authentication failed"

La DATABASE_URL est incorrecte. Régénérez-la :
1. **Storage** → Database → **Settings**
2. Copiez `POSTGRES_URL`
3. Mettez à jour `DATABASE_URL` dans Environment Variables
4. Redéployez

### Page blanche

1. Vérifiez `VITE_API_URL` dans Environment Variables
2. Vérifiez qu'il n'y a pas de slash final
3. Redéployez l'application

### Cold Start (API lente au premier appel)

C'est normal sur Vercel serverless. La première requête peut prendre 3-5 secondes, les suivantes seront rapides.

---

## 📚 Ressources

- [Documentation Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Documentation Vercel](https://vercel.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## 🎉 Félicitations!

Votre application est maintenant déployée sur Vercel avec Vercel Postgres! 🚀

**Avantages de cette solution** :
- ✅ Tout dans le même dashboard Vercel
- ✅ Configuration automatique de DATABASE_URL
- ✅ Facile à gérer
- ✅ Bon pour débuter et petits projets

**Limitations** :
- ⚠️ Plan gratuit limité (256 MB)
- ⚠️ Pas de backups automatiques
- ⚠️ Interface moins riche que Supabase

**Prochaines étapes** :
1. Surveillez votre usage dans **Storage** → Database → **Usage**
2. Configurez des alertes si vous approchez des limites
3. Pensez à migrer vers un plan payant ou Supabase si nécessaire

Bon déploiement! 💪
