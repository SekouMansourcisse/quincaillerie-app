# ⚡ Vercel Postgres - Guide Rapide (5 minutes)

Déployer votre application avec Vercel Postgres en 5 minutes chrono!

---

## 🚀 Étapes Rapides

### 1️⃣ GitHub (1 minute)

```bash
git add .
git commit -m "Deploy to Vercel"
git push origin main
```

### 2️⃣ Vercel - Premier Déploiement (2 minutes)

```
✅ https://vercel.com → Login avec GitHub
✅ New Project → Import votre repo
✅ Environment Variables → Ajouter :
```

| Variable | Valeur |
|----------|--------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Générer : `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `JWT_EXPIRE` | `7d` |
| `CORS_ORIGIN` | `*` |

```
✅ Deploy → Attendre 2 min
✅ Copier URL : https://votre-app.vercel.app
```

### 3️⃣ Créer Database Vercel Postgres (1 minute)

```
✅ Dans votre projet → Storage → Create Database
✅ Sélectionner "Postgres"
✅ Nom : quincaillerie-db
✅ Région : Choisir la plus proche
✅ Create → Attendre 30 sec
✅ Connect to Project → Sélectionner votre projet
✅ Production + Preview + Development → Connect
```

**✅ Automatique** : Vercel configure `POSTGRES_URL` et `DATABASE_URL`!

### 4️⃣ Initialiser la Database (1 minute)

```
✅ Storage → quincaillerie-db → Query
✅ Copier tout database/migration-postgres.sql
✅ Coller dans Query Editor
✅ Run Query → Success!
```

**Créer l'admin** :
```sql
INSERT INTO users (username, email, password, first_name, last_name, role)
VALUES ('admin', 'admin@quincaillerie.com',
'$2a$10$xV5LvJzKq5X9J6hV0f9Z0Og7lZ6mH5vK6rJ5Y8bZ6eH7fK6cL6mN6',
'Admin', 'Système', 'admin');
```

**Identifiants** : `admin@quincaillerie.com` / `admin123`

### 5️⃣ Configurer VITE_API_URL et Redéployer (1 minute)

```
✅ Settings → Environment Variables → Add New
```

| Variable | Valeur |
|----------|--------|
| `VITE_API_URL` | `https://votre-app.vercel.app` |

```
✅ Deployments → ... → Redeploy
✅ Attendre 2 min
```

### 6️⃣ Tester (30 secondes)

```
✅ Ouvrir : https://votre-app.vercel.app
✅ Login : admin@quincaillerie.com / admin123
✅ Changer le mot de passe admin
```

---

## ✅ C'est Terminé!

Votre app est en ligne avec Vercel Postgres! 🎉

**Temps total** : ~5-7 minutes

---

## 🆘 Problèmes?

| Erreur | Solution |
|--------|----------|
| "Cannot connect" | Vérifier que la database est connectée au projet |
| "Relation does not exist" | Réexécuter database/migration-postgres.sql |
| Page blanche | Vérifier VITE_API_URL + Redeploy |
| API lente | Normal (cold start), attendre 1-2 min |

---

## 📚 Besoin de Plus de Détails?

→ **DEPLOIEMENT-VERCEL-POSTGRES.md** (guide complet)

---

## 💡 Avantages Vercel Postgres

✅ Setup en 5 minutes
✅ Tout dans Vercel
✅ Configuration automatique
✅ Parfait pour débuter

⚠️ Limites : 256 MB stockage, 60h compute/mois

**Alternative** : Supabase (500 MB, compute illimité) → voir **COMPARAISON-BDD.md**

---

Bon déploiement! 🚀
