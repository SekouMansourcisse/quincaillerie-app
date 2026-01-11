# 🆘 Aide pour l'Étape 4 : Récupérer votre URL de connexion Supabase

## Où trouver votre chaîne de connexion dans Supabase ?

### Méthode Simple (Recommandée)

1. **Connectez-vous à votre projet Supabase**
   - Allez sur https://supabase.com
   - Cliquez sur votre projet

2. **Allez dans les paramètres**
   - En bas de la barre latérale gauche, cherchez l'icône ⚙️ (roue dentée)
   - Cliquez sur **"Settings"** ou **"Paramètres"**

3. **Ouvrez Database**
   - Dans le menu qui s'ouvre à gauche, cliquez sur **"Database"**

4. **Trouvez Connection String**
   - Descendez jusqu'à voir **"Connection string"**
   - Vous verrez plusieurs options : **Postgres**, **URI**, **JDBC**, etc.

5. **Copiez l'URI**
   - Cliquez sur **"URI"** (pas Postgres, pas JDBC)
   - Vous verrez quelque chose comme :
   ```
   postgresql://postgres.[projet-id]:[VOTRE-MOT-DE-PASSE]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
   ```
   - Cliquez sur le bouton **"Copy"** ou sélectionnez tout et copiez

6. **IMPORTANT** : Le mot de passe
   - Dans la chaîne copiée, vous verrez `[YOUR-PASSWORD]` ou `[VOTRE-MOT-DE-PASSE]`
   - Remplacez cette partie par le mot de passe que vous avez créé à l'étape 2
   - Si vous l'avez oublié, cliquez sur "Reset database password"

### Exemple

**Ce que vous copiez :**
```
postgresql://postgres.abcdefgh:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

**Ce que vous devez avoir (après avoir remplacé le mot de passe) :**
```
postgresql://postgres.abcdefgh:MonMotDePasse123@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

---

## 🎯 Méthode Alternative (Si vous ne trouvez pas)

1. Dans Supabase, allez dans **Project Settings** (en bas à gauche)
2. Cliquez sur **API** dans le menu
3. Descendez jusqu'à **Database**
4. Vous verrez **"Connection string"**

---

## ❓ Vous n'arrivez toujours pas ?

**Donnez-moi ces informations et je vous aiderai :**

1. Quel est le nom de votre projet Supabase ?
2. Dans quelle région l'avez-vous créé ? (Europe West, US East, etc.)
3. Avez-vous bien noté le mot de passe lors de la création du projet ?

**Format de la chaîne de connexion :**

Votre chaîne ressemble forcément à ceci :
```
postgresql://postgres.[QUELQUECHOSE]:[MOT-DE-PASSE]@[REGION].supabase.com:5432/postgres
```

Ou parfois (avec pooler) :
```
postgresql://postgres.[QUELQUECHOSE]:[MOT-DE-PASSE]@[REGION].pooler.supabase.com:6543/postgres
```

Les deux fonctionnent !
