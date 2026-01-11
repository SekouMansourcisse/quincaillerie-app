# Guide de Démarrage Rapide

## Installation rapide (moins de 5 minutes)

### Étape 1: Prérequis
- Installez Node.js (https://nodejs.org)
- **Base de données** : Choisissez UNE option
  - **Option A (Recommandée)** : Compte Supabase gratuit (plus facile, hébergé)
  - **Option B** : PostgreSQL local

### Étape 2: Base de données

#### Option A : Supabase (Recommandée - Gratuit, Plus facile)

1. Créez un compte sur https://supabase.com (gratuit)
2. Créez un nouveau projet (notez le mot de passe !)
3. Dans l'onglet **SQL Editor**, cliquez "New Query"
4. Copiez tout le contenu de `backend/database/schema.sql`
5. Collez-le dans l'éditeur et cliquez "Run"
6. Dans **Settings > Database**, copiez la "Connection String" (URI)

**Guide détaillé : [SUPABASE_SETUP.md](SUPABASE_SETUP.md)**

#### Option B : PostgreSQL Local

1. Ouvrez PostgreSQL et créez la base de données:
```sql
CREATE DATABASE quincaillerie_db;
```

2. Exécutez le script SQL:
```bash
cd quincaillerie-app
psql -U postgres -d quincaillerie_db -f backend/database/schema.sql
```

Si vous n'avez pas accès à psql en ligne de commande:
- Ouvrez pgAdmin ou votre client PostgreSQL
- Connectez-vous à la base de données `quincaillerie_db`
- Copiez le contenu de `backend/database/schema.sql`
- Exécutez le script

### Étape 3: Backend

```bash
# Aller dans le dossier backend
cd backend

# Installer les dépendances
npm install
```

**Configurez le fichier .env :**

Si vous utilisez **Supabase** :
```bash
# Créez le fichier .env à partir du modèle Supabase
cp .env.supabase.example .env

# Éditez .env et collez votre chaîne de connexion Supabase
# DATABASE_URL=postgresql://postgres:[MOT-DE-PASSE]@db.xxxxx.supabase.co:5432/postgres
```

Si vous utilisez **PostgreSQL local** :
```bash
# Le fichier .env existe déjà avec les valeurs par défaut
# Si votre mot de passe PostgreSQL n'est pas "postgres", modifiez le fichier .env
```

Puis lancez le serveur :
```bash
npm run dev
```

Le backend démarre sur http://localhost:5000

### Étape 4: Frontend

Ouvrez un NOUVEAU terminal:

```bash
# Aller dans le dossier frontend
cd quincaillerie-app/frontend

# Installer les dépendances
npm install

# Lancer l'application
npm run dev
```

Le frontend démarre sur http://localhost:3000

### Étape 5: Se connecter

1. Ouvrez votre navigateur sur http://localhost:3000
2. Utilisez ces identifiants:
   - Email: `admin@quincaillerie.com`
   - Mot de passe: `admin123`

## Commandes utiles

### Backend
```bash
cd backend
npm run dev      # Mode développement
npm run build    # Compiler TypeScript
npm start        # Lancer en production
```

### Frontend
```bash
cd frontend
npm run dev      # Mode développement
npm run build    # Compiler pour production
npm run preview  # Prévisualiser la version de production
```

## Problèmes courants

### Erreur de connexion à la base de données
- Vérifiez que PostgreSQL est démarré
- Vérifiez les identifiants dans `backend/.env`
- Vérifiez que la base de données `quincaillerie_db` existe

### Le backend ne démarre pas
- Vérifiez que le port 5000 n'est pas utilisé
- Vérifiez que toutes les dépendances sont installées: `npm install`

### Le frontend ne se connecte pas au backend
- Vérifiez que le backend tourne sur http://localhost:5000
- Vérifiez la console du navigateur pour les erreurs

### Erreur 401 (Non autorisé)
- Vérifiez que vous êtes bien connecté
- Le token JWT peut avoir expiré, reconnectez-vous

## Structure rapide

```
quincaillerie-app/
├── backend/          # API Node.js + Express
│   ├── src/         # Code source TypeScript
│   ├── database/    # Scripts SQL
│   └── .env         # Configuration
├── frontend/         # Application React
│   └── src/         # Code source React
└── README.md        # Documentation complète
```

## Fonctionnalités disponibles

1. **Dashboard** - Vue d'ensemble avec statistiques
2. **Produits** - Ajouter, modifier, supprimer des produits
3. **Ventes** - Point de vente pour effectuer des transactions
4. **Statistiques** - Rapports sur les ventes

## Prochaines étapes

- Ajoutez vos propres produits
- Testez le point de vente
- Explorez les statistiques
- Modifiez le code selon vos besoins

Pour plus de détails, consultez le fichier README.md complet.
