# Scripts d'administration

Ce dossier contient des scripts utilitaires pour gérer les utilisateurs et les plans de l'application.

## Scripts disponibles

### Gestion des utilisateurs

- **`list-users.ts`** - Liste tous les utilisateurs
- **`change-user-plan.ts`** - Change le plan d'un utilisateur
- **`upgrade-user-to-premium.ts`** - Met à niveau un utilisateur vers Premium

### Gestion du plan ILLIMITE

- **`create-unlimited-plan.ts`** - Crée le plan ILLIMITE dans la base de données
- **`assign-unlimited-plan.ts`** - Attribue le plan ILLIMITE à un utilisateur

## Usage

### Créer le plan ILLIMITE

```bash
npx ts-node scripts/create-unlimited-plan.ts
```

### Attribuer le plan ILLIMITE à un utilisateur

```bash
npx ts-node scripts/assign-unlimited-plan.ts user@example.com
```

### Lister les utilisateurs

```bash
npx ts-node scripts/list-users.ts
```

### Changer le plan d'un utilisateur

```bash
npx ts-node scripts/change-user-plan.ts user@example.com PREMIUM
```

## Plan ILLIMITE - Caractéristiques

Le plan ILLIMITE offre :

- ✅ Utilisateurs illimités (999,999)
- ✅ Mandats illimités (999,999)
- ✅ Stockage illimité (999 GB)
- ✅ Appels API illimités (999,999,999)
- ✅ Rapports avancés
- ✅ Accès API complet
- ✅ Branding personnalisé
- ✅ Support premium
- ✅ Durée de 10 ans

Ce plan est réservé aux utilisateurs spéciaux et ne peut être attribué que manuellement par un administrateur.
