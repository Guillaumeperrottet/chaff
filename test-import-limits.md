# Test des Limites d'Import

## Résumé des Améliorations Apportées

### 🔒 Sécurité Ajoutée pour l'Import Excel

Votre système d'import Excel vérifie maintenant les limites selon le plan de l'utilisateur :

### 1. **Vérification Préalable (Avant de commencer l'import)**

- Compte les nouveaux mandats qui vont être créés
- Vérifie si l'utilisateur peut créer tous ces mandats d'un coup
- Arrête l'import avec un message clair si la limite est dépassée

### 2. **Vérification Individuelle (Pour chaque mandat)**

- Avant de créer chaque mandat, vérifie les limites
- Si un mandat existe déjà, le met simplement à jour (pas de limite)
- Si c'est un nouveau mandat, vérifie qu'il peut être créé

### 3. **Messages d'Erreur Informatifs**

- Messages clairs indiquant combien de mandats l'utilisateur peut encore créer
- Suggestion de passer au plan Premium pour augmenter les limites

## Exemple de Comportement

### Plan Gratuit (limite : 1 mandat)

- Utilisateur actuel : 0 mandat
- Essaie d'importer 3 nouveaux mandats
- **Résultat** : Import bloqué avec message "Vous ne pouvez créer que 1 mandat de plus"

### Plan Gratuit (limite déjà atteinte)

- Utilisateur actuel : 1 mandat
- Essaie d'importer 2 nouveaux mandats
- **Résultat** : Import bloqué avec message "Limite atteinte (1/1). Passez au plan Premium"

### Plan Premium (mandats illimités)

- Utilisateur actuel : 50 mandats
- Essaie d'importer 100 nouveaux mandats
- **Résultat** : Import réussi sans problème

## Code Ajouté

### Vérification préalable (lignes 268-288)

```typescript
// Compter les nouveaux mandats
const newMandatesCount = mandantsData.filter(
  (m) => m.Id && m.Nom && m.Catégorie && !existingNames.has(m.Nom.trim())
).length;

// Vérifier les limites globalement
if (newMandatesCount > 0) {
  const limitCheck = await canPerformAction(
    organizationId,
    "mandates",
    newMandatesCount
  );
  if (!limitCheck.allowed) {
    return {
      success: false,
      message: `Import impossible: ${limitCheck.reason}...`,
    };
  }
}
```

### Vérification individuelle (lignes 307-322)

```typescript
// Vérifier si le mandat existe déjà
const existingMandate = await prisma.mandate.findUnique({
  where: {
    name_organizationId: { name: mandantRow.Nom.trim(), organizationId },
  },
});

// Si nouveau mandat, vérifier les limites
if (!existingMandate) {
  const limitCheck = await canPerformAction(organizationId, "mandates", 1);
  if (!limitCheck.allowed) {
    stats.errors.push(
      `Impossible de créer "${mandantRow.Nom}": ${limitCheck.reason}`
    );
    continue;
  }
}
```

## Test Suggéré

1. **Créer un utilisateur gratuit** avec déjà 2-3 mandats
2. **Préparer un fichier Excel** avec 5+ nouveaux mandats
3. **Tenter l'import** → Devrait être bloqué avec message clair
4. **Upgrader vers Premium** → Import devrait fonctionner

✅ **Sécurité Garantie** : Les utilisateurs gratuits ne peuvent plus contourner les limites via l'import Excel !
