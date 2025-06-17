# GUIDE DE TEST - PAGE CA TYPES

## 🎯 Comment tester la nouvelle page CA Types

### 1. Accès à la page

- **URL directe :** `http://localhost:3001/dashboard/ca-types`
- **Depuis le dashboard :** Cliquer sur le bouton "CA Types" (couleur purple)
- **Menu mobile :** Utiliser le menu burger → "CA Types"

### 2. Fonctionnalités à tester

#### Interface principale

- [ ] **Header** : Vérifier le design purple/indigo avec le nom de l'organisation
- [ ] **Responsive** : Tester sur mobile pour voir le menu burger
- [ ] **Sélecteurs** : Changer l'année et le semestre (S1/S2)

#### Tableau de données

- [ ] **Colonnes** : Vérifier toutes les colonnes (CA, Evolution, Moyenne, etc.)
- [ ] **Tooltips** : Survoler les icônes d'information
- [ ] **Données** : Voir les valeurs par type d'établissement
- [ ] **Totaux** : Ligne de totaux en bas du tableau

#### Cartes de statistiques

- [ ] **4 cartes** : CA Total, Payroll, Meilleur mois, Types actifs
- [ ] **Icônes** : Vérifier les icônes colorées
- [ ] **Valeurs** : Montants formatés en CHF

#### Section répartition

- [ ] **Graphique** : Contributions par type en pourcentage
- [ ] **Couleurs** : Chaque type a sa couleur distincte

#### Export

- [ ] **Bouton Export CSV** : Cliquer pour télécharger
- [ ] **Bouton Actualiser** : Rafraîchir les données
- [ ] **Fichier CSV** : Vérifier le contenu du fichier téléchargé

### 3. Navigation

- [ ] **Breadcrumb** : "Dashboard > CA Types"
- [ ] **Retour dashboard** : Lien vers le tableau de bord
- [ ] **Menu dropdown** : Option "Voir CA Types" dans les totaux

### 4. Différences avec CA Global

- [ ] **Couleur** : Thème purple vs emerald pour CA Global
- [ ] **Données** : Consolidation par types vs mandats individuels
- [ ] **Lecture seule** : Pas d'édition inline (normal pour les données consolidées)

## 🔧 En cas de problème

### Erreurs communes

1. **Page blanche** : Vérifier que le serveur tourne sur port 3001
2. **401 Unauthorized** : Normal pour les APIs, nécessite une session utilisateur
3. **Données manquantes** : Les données sont actuellement simulées pour les tests

### Logs utiles

```bash
# Voir les logs du serveur
cd /Users/guili/code/Guillaumeperrottet/chaff
npm run dev -- -p 3001

# Vérifier les APIs
curl http://localhost:3001/api/mandats/ca-types
curl http://localhost:3001/api/export/ca-types
```

## ✅ Validation finale

Si tous les éléments ci-dessus fonctionnent, la page CA Types est prête pour la production !

## 📞 Support

En cas de problème, vérifier :

1. Le serveur Next.js tourne correctement
2. Aucune erreur dans la console du navigateur
3. Les fichiers API sont bien en place
4. La navigation est intégrée dans tous les menus
