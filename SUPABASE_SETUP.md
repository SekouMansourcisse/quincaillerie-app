# Configuration Supabase pour l'Application Quincaillerie

Ce guide vous montre comment configurer Supabase comme base de données pour l'application.

## Pourquoi Supabase ?

- ✅ PostgreSQL hébergé dans le cloud (pas d'installation locale)
- ✅ Gratuit pour démarrer (500 Mo de stockage)
- ✅ Interface web pour gérer les données
- ✅ Compatible 100% avec notre code actuel
- ✅ Sauvegardes automatiques
- ✅ Prêt pour la production

## Étape 1 : Créer un compte Supabase

1. Allez sur https://supabase.com
2. Cliquez sur "Start your project"
3. Connectez-vous avec GitHub, Google ou Email
4. C'est gratuit, aucune carte bancaire requise !

## Étape 2 : Créer un nouveau projet

1. Cliquez sur "New Project"
2. Remplissez les informations :
   - **Name** : `quincaillerie-app` (ou le nom de votre choix)
   - **Database Password** : Créez un mot de passe fort (NOTEZ-LE !)
   - **Region** : Choisissez la région la plus proche (Europe West pour la France)
   - **Pricing Plan** : Free (gratuit)
3. Cliquez sur "Create new project"
4. Attendez 2-3 minutes que le projet soit créé

## Étape 3 : Exécuter le script SQL

1. Dans votre projet Supabase, allez dans l'onglet **SQL Editor** (icône dans la barre latérale)
2. Cliquez sur "New Query"
3. Copiez le contenu du fichier `backend/database/schema.sql`
4. Collez-le dans l'éditeur SQL
5. Cliquez sur "Run" (ou Ctrl+Enter)
6. Vous devriez voir "Success. No rows returned" - c'est normal !

## Étape 4 : Récupérer les informations de connexion

1. Dans Supabase, allez dans **Settings** (icône roue dentée en bas)
2. Cliquez sur **Database** dans le menu de gauche
3. Descendez à la section **Connection String**
4. Sélectionnez **URI** puis copiez la chaîne de connexion

Elle ressemble à :
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
```

## Étape 5 : Configurer le Backend

### Option A : Utiliser la chaîne de connexion complète (RECOMMANDÉ)

Modifiez le fichier `backend/.env` :

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Supabase Database Configuration (remplacez par votre chaîne de connexion)
DATABASE_URL=postgresql://postgres:[VOTRE-MOT-DE-PASSE]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres

# OU si vous préférez séparer les paramètres :
DB_HOST=db.xxxxxxxxxxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe_supabase

# JWT Configuration
JWT_SECRET=quincaillerie_secret_key_2024_change_in_production
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost:3000
```

**Important** : Remplacez `[VOTRE-MOT-DE-PASSE]` par le mot de passe que vous avez créé à l'étape 2.

### Option B : Utiliser les paramètres séparés

Si vous préférez, vous pouvez utiliser les paramètres séparés disponibles dans :
Settings > Database > Connection parameters

## Étape 6 : Vérifier la connexion

1. Lancez le backend :
```bash
cd backend
npm run dev
```

2. Si vous voyez ce message, c'est bon ! :
```
✅ Base de données connectée
✅ Connecté à la base de données PostgreSQL
🚀 Serveur démarré sur le port 5000
```

## Étape 7 : Vérifier les données dans Supabase

1. Dans Supabase, allez dans **Table Editor**
2. Vous devriez voir toutes les tables créées :
   - users
   - categories
   - products
   - suppliers
   - customers
   - sales
   - sale_items
   - stock_movements

3. Cliquez sur la table **users**
4. Vous devriez voir un utilisateur admin déjà créé

## Étape 8 : Utiliser l'application

L'application fonctionne exactement pareil qu'avant, mais maintenant vos données sont stockées dans Supabase !

1. Démarrez le frontend :
```bash
cd frontend
npm run dev
```

2. Connectez-vous avec :
   - Email : `admin@quincaillerie.com`
   - Mot de passe : `admin123`

## Avantages de Supabase

### Interface Web
- Visualisez vos données en temps réel
- Modifiez les tables directement
- Exécutez des requêtes SQL
- Gérez les utilisateurs

### Sécurité
- Connexion SSL automatique
- Sauvegardes quotidiennes
- Gestion des accès

### Développement
- Logs SQL en temps réel
- API REST auto-générée
- Webhooks disponibles

## Problèmes courants

### Erreur "password authentication failed"
- Vérifiez que vous avez bien copié le bon mot de passe
- Le mot de passe contient peut-être des caractères spéciaux, mettez-le entre guillemets dans l'.env

### Erreur "could not connect to server"
- Vérifiez votre connexion internet
- Vérifiez que le projet Supabase est bien démarré (status : Active)
- Vérifiez le hostname dans la chaîne de connexion

### Erreur "no pg_hba.conf entry"
- Votre IP n'est peut-être pas autorisée (rare avec Supabase)
- Allez dans Settings > Database > Connection pooling

## Fonctionnalités bonus de Supabase

Une fois votre app lancée, vous pouvez explorer :

1. **Authentication** - Système d'auth intégré (alternative à JWT)
2. **Storage** - Stockage de fichiers (images de produits)
3. **Real-time** - Mises à jour en temps réel
4. **Edge Functions** - Fonctions serverless
5. **API auto-générée** - API REST/GraphQL automatique

## Migration vers un autre tier

Le tier gratuit offre :
- 500 Mo de stockage
- 2 Go de bande passante
- Parfait pour débuter et tester

Si vous avez besoin de plus :
- **Pro** : 25$/mois - 8 Go stockage, 50 Go bande passante
- **Team** : 599$/mois - Pour les équipes

## Backup manuel

Pour sauvegarder vos données manuellement :

1. Allez dans **Database** > **Backups**
2. Ou utilisez pg_dump :
```bash
pg_dump "postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres" > backup.sql
```

## Support

- Documentation Supabase : https://supabase.com/docs
- Communauté Discord : https://discord.supabase.com

---

Vous êtes maintenant prêt à utiliser Supabase ! Vos données sont sécurisées dans le cloud et accessibles depuis n'importe où.
