# Application de Gestion de Quincaillerie

Application web complète pour la gestion d'une quincaillerie avec gestion de stock, ventes, produits et statistiques.

## Technologies utilisées

### Backend
- Node.js + Express
- TypeScript
- PostgreSQL
- JWT pour l'authentification
- bcryptjs pour le hashage des mots de passe

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- Lucide React (icônes)

## 🚀 Déploiement

Cette application est prête pour le déploiement sur **Vercel** avec **Supabase** comme base de données.

📖 **[Guide de déploiement complet](./DEPLOYMENT.md)** - Instructions détaillées pour déployer sur Vercel

### Déploiement rapide

1. Créez un compte sur [Vercel](https://vercel.com)
2. Configurez votre base de données sur [Supabase](https://supabase.com)
3. Connectez votre repository GitHub
4. Configurez les variables d'environnement
5. Déployez en un clic !

Voir [DEPLOYMENT.md](./DEPLOYMENT.md) pour les instructions complètes.

## Fonctionnalités

- **Authentification** : Connexion sécurisée avec JWT
- **Dashboard** : Vue d'ensemble avec statistiques et alertes de stock faible
- **Gestion des produits** : CRUD complet (Créer, Lire, Modifier, Supprimer)
- **Point de vente** : Interface intuitive pour effectuer des ventes
- **Gestion du stock** : Suivi automatique des mouvements de stock
- **Statistiques** : Rapports sur les ventes et les revenus

## Prérequis

- Node.js (v18 ou supérieur)
- **Base de données** : Choisissez une option
  - **Option 1 (Recommandée)** : Compte Supabase gratuit - [Créer un compte](https://supabase.com)
  - **Option 2** : PostgreSQL local (v13 ou supérieur)
- npm ou yarn

## Installation

### 1. Cloner le projet

```bash
cd quincaillerie-app
```

### 2. Configuration de la base de données

Vous avez deux options :

#### Option A : Supabase (Recommandée - Plus facile, gratuit, hébergé)

**Suivez le guide détaillé : [SUPABASE_SETUP.md](SUPABASE_SETUP.md)**

Résumé rapide :
1. Créez un compte sur [Supabase](https://supabase.com)
2. Créez un nouveau projet
3. Copiez le script SQL de `backend/database/schema.sql` dans l'éditeur SQL de Supabase
4. Récupérez votre chaîne de connexion
5. Configurez le fichier `.env` (voir étape 3)

#### Option B : PostgreSQL Local

1. Créez une base de données PostgreSQL :

```sql
CREATE DATABASE quincaillerie_db;
```

2. Exécutez le script de création des tables :

```bash
psql -U postgres -d quincaillerie_db -f backend/database/schema.sql
```

### 3. Configuration du Backend

1. Accédez au dossier backend :

```bash
cd backend
```

2. Installez les dépendances :

```bash
npm install
```

3. Créez un fichier `.env` :

**Si vous utilisez Supabase :**
```bash
cp .env.supabase.example .env
```

**Si vous utilisez PostgreSQL local :**
```bash
cp .env.example .env
```

4. Modifiez le fichier `.env` avec vos informations :

**Pour Supabase :**
```env
PORT=5000
NODE_ENV=development

# Collez votre chaîne de connexion Supabase ici
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres

JWT_SECRET=votre_secret_jwt_tres_securise
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000
```

**Pour PostgreSQL local :**
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=quincaillerie_db
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe

JWT_SECRET=votre_secret_jwt_tres_securise
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000
```

5. Démarrez le serveur backend :

```bash
# Mode développement avec rechargement automatique
npm run dev

# ou en production
npm run build
npm start
```

Le serveur backend sera accessible sur http://localhost:5000

### 4. Configuration du Frontend

1. Ouvrez un nouveau terminal et accédez au dossier frontend :

```bash
cd frontend
```

2. Installez les dépendances :

```bash
npm install
```

3. Créez un fichier `.env` (optionnel) :

```env
VITE_API_URL=http://localhost:5000/api
```

4. Démarrez le serveur frontend :

```bash
npm run dev
```

Le frontend sera accessible sur http://localhost:3000

## Utilisation

### Connexion par défaut

- **Email** : admin@quincaillerie.com
- **Mot de passe** : admin123

**IMPORTANT** : Changez ce mot de passe en production !

### Structure de l'application

#### Backend (`backend/src/`)

```
backend/src/
├── config/          # Configuration (base de données)
├── controllers/     # Contrôleurs (logique métier)
├── models/          # Modèles de données
├── routes/          # Routes de l'API
├── middleware/      # Middleware (authentification)
└── server.ts        # Point d'entrée du serveur
```

#### Frontend (`frontend/src/`)

```
frontend/src/
├── components/      # Composants React
│   ├── Dashboard/   # Composants du dashboard
│   ├── Layout/      # Layout et navigation
│   ├── Products/    # Composants des produits
│   └── Sales/       # Composants des ventes
├── context/         # Context API (AuthContext)
├── pages/           # Pages de l'application
├── services/        # Services API
├── types/           # Types TypeScript
└── App.tsx          # Composant principal
```

## API Endpoints

### Authentification

- `POST /api/auth/register` - Créer un compte
- `POST /api/auth/login` - Se connecter
- `GET /api/auth/profile` - Obtenir le profil (authentifié)

### Produits

- `GET /api/products` - Liste des produits
- `GET /api/products/:id` - Détails d'un produit
- `POST /api/products` - Créer un produit (admin/manager)
- `PUT /api/products/:id` - Modifier un produit (admin/manager)
- `DELETE /api/products/:id` - Supprimer un produit (admin)
- `GET /api/products/low-stock` - Produits en stock faible

### Ventes

- `GET /api/sales` - Liste des ventes
- `GET /api/sales/:id` - Détails d'une vente
- `POST /api/sales` - Créer une vente
- `GET /api/sales/stats` - Statistiques des ventes

## Développement

### Backend

```bash
cd backend
npm run dev  # Démarre le serveur en mode développement
```

### Frontend

```bash
cd frontend
npm run dev  # Démarre Vite en mode développement
```

### Build pour production

**Backend**:
```bash
cd backend
npm run build
npm start
```

**Frontend**:
```bash
cd frontend
npm run build
# Les fichiers seront dans le dossier dist/
```

## Fonctionnalités futures possibles

- Gestion des fournisseurs
- Gestion des clients
- Gestion multi-magasins
- Code-barres / QR codes
- Exportation Excel/PDF
- Historique détaillé des mouvements de stock
- Application mobile
- Notifications par email
- Rapports avancés avec graphiques

## Sécurité

- Les mots de passe sont hashés avec bcrypt
- Authentification par JWT
- Validation des entrées
- Protection CSRF
- CORS configuré

**IMPORTANT** : En production :
1. Changez le JWT_SECRET
2. Changez le mot de passe admin par défaut
3. Utilisez HTTPS
4. Configurez un reverse proxy (nginx)
5. Utilisez des variables d'environnement sécurisées

## Licence

Ce projet est libre d'utilisation pour des projets personnels ou commerciaux.

## Support

Pour toute question ou problème, veuillez créer une issue sur le dépôt du projet.
