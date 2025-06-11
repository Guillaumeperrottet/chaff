# Test de Vérification des Limites d'Import

## ✅ Configuration Actuelle

### Plan FREE

- **1 utilisateur maximum**
- **1 mandat/entreprise** ⚠️
- 100MB de stockage
- Support communauté

### Plan PREMIUM

- 5 utilisateurs maximum
- **Mandats illimités** ✅
- 10GB de stockage
- Support prioritaire

## 🧪 Scénarios de Test

### Test 1: Utilisateur FREE sans mandat

```
État actuel: 0 mandat
Fichier Excel: 2 nouveaux mandats
Résultat attendu: ❌ Bloqué
Message: "Vous ne pouvez créer que 1 mandat de plus"
```

### Test 2: Utilisateur FREE avec 1 mandat existant

```
État actuel: 1 mandat
Fichier Excel: 1 nouveau mandat
Résultat attendu: ❌ Bloqué
Message: "Limite atteinte (1/1). Passez au plan Premium"
```

### Test 3: Utilisateur FREE - Mise à jour d'un mandat existant

```
État actuel: 1 mandat
Fichier Excel: 1 mandat existant (même nom) + 1 nouveau
Résultat attendu: ✅ Partiellement réussi
- Mandat existant mis à jour
- Nouveau mandat rejeté avec message d'erreur
```

### Test 4: Utilisateur PREMIUM

```
État actuel: 10 mandats
Fichier Excel: 50 nouveaux mandats
Résultat attendu: ✅ Réussi
Message: "Import terminé: 50 mandats créés"
```

## 🔍 Points de Vérification

1. **Vérification préalable** : Compte les nouveaux mandats avant de commencer
2. **Vérification individuelle** : Vérifie pour chaque mandat avant création
3. **Distinction nouveau/existant** : Autorise la mise à jour des mandats existants
4. **Messages clairs** : Indique combien de mandats peuvent encore être créés

## 🛡️ Sécurité Garantie

- ❌ Un utilisateur FREE ne peut PAS contourner la limite de 1 mandat via l'import
- ✅ Les mandats existants peuvent toujours être mis à jour
- ✅ Messages d'erreur informatifs pour expliquer pourquoi l'import échoue
- ✅ Suggestion de passer au plan Premium

## 🚀 Pour Tester

1. Créer un utilisateur avec plan FREE
2. Créer 1 mandat manuellement
3. Préparer un fichier Excel avec 2-3 nouveaux mandats
4. Tenter l'import → Doit être bloqué avec message clair
