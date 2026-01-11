# Configuration GitHub Remote

## Informations Nécessaires

Pour pousser votre code vers GitHub, nous avons besoin de configurer le remote avec votre nom d'utilisateur GitHub.

### Votre Repository
- **Nom du repository**: `quincaillerie-app`
- **Nom d'utilisateur GitHub**: `[À FOURNIR]`

### URL du Remote
Une fois votre nom d'utilisateur fourni, l'URL sera:
```
https://github.com/VOTRE-USERNAME/quincaillerie-app.git
```

### Commandes à Exécuter
```bash
# Ajouter le remote
git remote add origin https://github.com/VOTRE-USERNAME/quincaillerie-app.git

# Renommer la branche en main
git branch -M main

# Pousser le code
git push -u origin main
```

## Statut Actuel
- ✅ Git initialisé
- ✅ Fichiers ajoutés
- ✅ Commit initial créé
- ⏳ En attente du nom d'utilisateur GitHub
