# Guide de gestion des employés

## Nouvelles fonctionnalités d'édition et suppression

### 🔧 Édition d'un employé

1. **Accès à l'édition**

   - Depuis la liste des employés (`/dashboard/employees`)
   - Cliquer sur les 3 points → "Modifier"
   - Ou naviguer vers `/dashboard/employees/[id]/edit`

2. **Modifications possibles**

   - ✏️ ID employé (avec validation d'unicité)
   - ✏️ Informations personnelles (nom, prénom, email, téléphone)
   - ✏️ Affectation d'établissement
   - ✏️ Poste et taux horaire
   - ✏️ Date d'embauche
   - ✏️ Statut actif/inactif

3. **Protections**
   - ⚠️ Alerte si l'employé a des données de temps/paie
   - ✅ Validation en temps réel des champs
   - 🔒 Vérification d'unicité de l'ID employé

### 🗑️ Suppression d'un employé

1. **Suppression simple**

   - Pour les employés sans données associées
   - Suppression immédiate après confirmation

2. **Suppression protégée**

   - Si l'employé a des données de temps ou de paie
   - Proposition automatique de désactivation
   - Conservation des données historiques

3. **Options alternatives**
   - **Désactivation** : masque l'employé sans perdre les données
   - **Réactivation** : remet un employé inactif en service

### 🎨 Interface utilisateur

1. **Indicateurs visuels**

   - Employés inactifs : affichage en grisé
   - Badge de statut : "Actif" / "Inactif"
   - Mention "(Inactif)" dans le nom

2. **Menu contextuel adaptatif**

   - **Employés actifs** : Modifier, Saisir heures, Voir horaires, Voir paie, Supprimer
   - **Employés inactifs** : Modifier, Réactiver, Supprimer

3. **Navigation cohérente**
   - Bouton "Retour aux employés" sur toutes les pages
   - Breadcrumb avec informations contextuelles

## Flux de travail recommandé

### Scénario 1 : Modification d'informations

```
1. Liste des employés → Modifier
2. Ajuster les informations nécessaires
3. Sauvegarder → Retour automatique à la liste
```

### Scénario 2 : Départ d'un employé

```
1. Si l'employé a des données → Désactiver (recommandé)
2. Si l'employé n'a pas de données → Supprimer
3. Possibilité de réactiver plus tard si nécessaire
```

### Scénario 3 : Retour d'un employé

```
1. Rechercher dans la liste (filtrer par "Inactifs")
2. Menu → Réactiver
3. L'employé redevient visible dans les vues normales
```

## API disponibles

### GET `/api/employees/[id]`

Récupère les détails d'un employé

### PUT `/api/employees/[id]`

Met à jour un employé (tous les champs optionnels)

### DELETE `/api/employees/[id]`

Supprime un employé (avec vérifications)

## Bonnes pratiques

1. **Avant de supprimer** : toujours vérifier s'il y a des données associées
2. **Pour les départs temporaires** : utiliser la désactivation
3. **Pour les changements d'établissement** : utiliser l'édition plutôt que suppression/recréation
4. **ID employé** : éviter de le modifier s'il est utilisé dans des imports Gastrotime

---

_Ces fonctionnalités sont maintenant disponibles dans l'interface de gestion des employés._
