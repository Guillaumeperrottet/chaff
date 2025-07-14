# Modifications des cartes de statistiques

## Modifications apportées

### 1. Vue Mandats individuels (`/dashboard/mandates/[id]`)

- ✅ Ajout d'une nouvelle carte "Cumul Annuel" qui affiche le vrai cumul depuis janvier
- ✅ Renommage de "CA Total" en "CA Période" pour clarifier qu'il s'agit de la période sélectionnée
- ✅ Passage de 4 à 5 colonnes pour accommoder la nouvelle carte
- ✅ Affichage de l'évolution du cumul annuel vs année précédente

### 2. Vue CA par types (`/dashboard/ca-types`)

- ✅ Ajout d'une nouvelle carte "Cumul Annuel" identique
- ✅ Renommage de "CA Total" en "CA Type" pour plus de clarté
- ✅ Passage de 4 à 5 colonnes
- ✅ Gestion de l'affichage "1er semestre", "2ème semestre" ou "Année complète"

### 3. Vue CA global (`/dashboard/ca-global`)

- ✅ Ajout d'une nouvelle carte "Cumul Annuel" identique
- ✅ Renommage de "CA Total" en "CA Période"
- ✅ Passage de 4 à 5 colonnes
- ✅ Cohérence avec les autres vues

## Comportement des nouvelles cartes

### Carte "Cumul Annuel"

- **Valeur** : Cumul réel depuis le 1er janvier de l'année sélectionnée
- **Label** : "Depuis janvier [ANNÉE]"
- **Évolution** : Comparaison du cumul annuel vs année précédente à la même période
- **Icône** : BarChart3

### Carte "CA Période" (ex "CA Total")

- **Valeur** : Total de la période sélectionnée uniquement (semestre)
- **Label** : "1er semestre [ANNÉE]" ou "2ème semestre [ANNÉE]"
- **Évolution** : Comparaison de la période vs même période année précédente
- **Icône** : DollarSign

## Avantages

1. **Clarté** : Distinction claire entre cumul annuel et période sélectionnée
2. **Cohérence** : Même comportement dans toutes les vues
3. **Utilité** : Le cumul annuel est toujours visible, même en mode semestre
4. **Performance** : Les utilisateurs peuvent voir d'un coup d'œil :
   - La performance de la période (semestre)
   - La performance annuelle cumulative
   - L'évolution par rapport à l'année précédente pour les deux métriques

## Test recommandé

1. Sélectionner le 1er semestre 2024
2. Noter les valeurs "Cumul Annuel" et "CA Période"
3. Sélectionner le 2ème semestre 2024
4. Vérifier que :
   - "Cumul Annuel" affiche le cumul de janvier à décembre
   - "CA Période" affiche uniquement juillet à décembre
   - Les évolutions sont cohérentes
