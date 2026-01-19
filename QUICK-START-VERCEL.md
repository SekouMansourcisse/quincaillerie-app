# ⚡ Déploiement Vercel - Guide Rapide (10 minutes)

Guide rapide pour déployer votre application sur Vercel. Pour plus de détails, voir [DEPLOIEMENT-VERCEL.md](./DEPLOIEMENT-VERCEL.md).

## 🎯 Checklist Rapide

### 1️⃣ Supabase (3 minutes)

```
✅ Créer compte : https://supabase.com
✅ Nouveau projet → Choisir un nom et mot de passe
✅ Settings → Database → Connection String (URI) → COPIER
✅ SQL Editor → Nouveau → Coller database/migration-postgres.sql → RUN
✅ SQL Editor → Créer admin avec ce code :
```

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

**Identifiants** : `admin@quincaillerie.com` / `admin123`

### 2️⃣ GitHub (1 minute)

```bash
git init
git add .
git commit -m "Deploy to Vercel"
git remote add origin https://github.com/VOTRE_USERNAME/VOTRE_REPO.git
git push -u origin main
```

### 3️⃣ Vercel (5 minutes)

```
✅ Créer compte : https://vercel.com (avec GitHub)
✅ New Project → Import votre repo
✅ Environment Variables → AJOUTER CES VARIABLES :
```

#### Variables à configurer :

| Variable | Valeur | Comment l'obtenir |
|----------|--------|-------------------|
| `DATABASE_URL` | `postgresql://...` | Copié depuis Supabase (étape 1) |
| `NODE_ENV` | `production` | Tapez `production` |
| `JWT_SECRET` | *généré* | Commande ci-dessous ⬇️ |
| `JWT_EXPIRE` | `7d` | Tapez `7d` |
| `CORS_ORIGIN` | `*` | Tapez `*` |

**Générer JWT_SECRET** :
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

```
✅ Deploy → Attendre 2-3 minutes
✅ Copier l'URL : https://votre-app.vercel.app
✅ Settings → Environment Variables → Ajouter :
```

| Variable | Valeur |
|----------|--------|
| `VITE_API_URL` | `https://votre-app.vercel.app` |

```
✅ Deployments → ... → Redeploy
```

### 4️⃣ Tester (1 minute)

```
✅ Ouvrir : https://votre-app.vercel.app
✅ Login : admin@quincaillerie.com / admin123
✅ Changer le mot de passe admin
```

## 🆘 Problèmes Courants

| Erreur | Solution |
|--------|----------|
| "Cannot connect to database" | Vérifier `DATABASE_URL` dans Vercel |
| "JWT must be provided" | Vérifier `JWT_SECRET` dans Vercel |
| "API not responding" | Attendre 1-2 min (cold start) |
| "CORS error" | Vérifier `VITE_API_URL` + Redeploy |

## 📋 Variables d'Environnement - Template

Copier-coller dans Vercel :

```
DATABASE_URL=postgresql://postgres.xxxxx:password@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
NODE_ENV=production
JWT_SECRET=GENERER_AVEC_LA_COMMANDE_CI_DESSUS
JWT_EXPIRE=7d
CORS_ORIGIN=*
VITE_API_URL=https://votre-app.vercel.app
```

## ✅ C'est terminé!

Votre application est maintenant en ligne! 🎉

**Prochaines étapes** :
1. Changer le mot de passe admin
2. Ajouter vos produits
3. Inviter vos utilisateurs
4. (Optionnel) Configurer un domaine personnalisé dans Vercel Settings

---

**Besoin d'aide?** → Consultez [DEPLOIEMENT-VERCEL.md](./DEPLOIEMENT-VERCEL.md) pour le guide complet.
