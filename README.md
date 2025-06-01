markdown# PlanniKeeper

> Une plateforme de gestion immobilière intelligente pour optimiser la maintenance, les tâches et la collaboration d'équipe

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-15.3.0-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.6.0-green)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.17-blue)](https://tailwindcss.com/)
[![Better Auth](https://img.shields.io/badge/Better_Auth-1.2.7-purple)](https://www.better-auth.com/)

[Demo](#demo) • [Fonctionnalités](#fonctionnalités) • [Tech Stack](#tech-stack) • [Installation](#installation) • [Architecture](#architecture)

</div>

## 🚀 Introduction

PlanniKeeper est une application web moderne conçue pour révolutionner la gestion immobilière. Elle permet aux agences, propriétaires et gestionnaires de biens de centraliser, visualiser et optimiser l'ensemble de leurs opérations de maintenance et de suivi.

### 🎯 Qui peut l'utiliser ?

- **Agences immobilières** : gestion de portefeuille complet avec collaboration d'équipe
- **Propriétaires de biens** : campings, hôtels, résidences, immeubles
- **Indépendants** : solution légère pour les freelances

## ✨ Fonctionnalités principales

### 🏢 Gestion d'organisation

- Création et gestion d'organisations multi-utilisateurs
- Système de rôles (admin/membre)
- Invitations sécurisées avec codes d'invitation

### 🗺️ Visualisation interactive

- Interface intuitive pour naviguer à travers les propriétés
- Cartographie visuelle des secteurs avec uploading d'images
- Positionnement d'articles directement sur les plans

### 📋 Gestion des tâches

- Planification et suivi de tâches par objet/secteur
- Système d'assignation avec notifications
- Calendrier intégré et vue agenda
- Gestion de documents associés aux tâches

### 🔔 Notifications

- Notifications en temps réel via Firebase Cloud Messaging
- Emails quotidiens de récapitulatif
- Paramétrage des préférences utilisateur

### 👥 Collaboration

- Gestion granulaire des accès (none/read/write/admin)
- Mode collaboratif en temps réel
- Partage d'informations entre équipes

### 📊 Rapports et analytics

- Suivi des tâches complétées
- Statistiques par secteur/objet
- Export et impression des données

## 🛠️ Tech Stack

### Frontend

- **Next.js 15.3.0** - Framework React avec Server Components
- **React 19** - Librairie UI avec suspense et concurrency
- **TypeScript** - Type safety et meilleure DX
- **Tailwind CSS** - Styling utility-first
- **Framer Motion** - Animations fluides
- **Shadcn/UI + Radix UI** - Composants accessibles

### Backend

- **Node.js** - Runtime serveur
- **Better Auth** - Authentication moderne
- **Prisma** - ORM avec PostgreSQL
- **Next.js API Routes** - API endpoints sécurisés

### Services Cloud

- **Cloudinary** - Stockage et optimisation d'images
- **Firebase** - Notifications push en temps réel
- **Resend** - Service d'emails transactionnels
- **Vercel** - Hébergement et déploiement

### Outils de développement

- **ESLint** - Linting du code
- **Prettier** - Formatage automatisé
- **Sonner** - Notifications toast
- **date-fns** - Manipulation des dates

## 📦 Installation

### Prérequis

- Node.js 18+
- PostgreSQL
- Yarn ou npm
- Accounts Cloudinary, Firebase, Resend

### Configuration environnement

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/plannikeeper"

# Authentication
BETTER_AUTH_SECRET="your-secret-key"

# Services
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_VAPID_KEY="your-vapid-key"

RESEND_API_KEY="your-resend-key"
Installation
bash# Cloner le repo
git clone https://github.com/yourusername/plannikeeper.git

# Installation des dépendances
cd plannikeeper
yarn install

# Setup de la base de données
yarn prisma generate
yarn prisma migrate dev

# Lancer en développement
yarn dev
🏗️ Architecture
Organisation du code
src/
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   ├── components/        # Composants réutilisables
│   ├── dashboard/         # Interface principale
│   ├── profile/           # Gestion utilisateur
│   └── ...
├── lib/                   # Utilities et services
│   ├── auth-session.ts    # Gestion d'authentification
│   ├── firebase-admin.ts  # Service notifications
│   ├── cloudinary.ts      # Upload de fichiers
│   └── ...
└── prisma/                # Schéma de base de données
Base de données
Le schéma utilise Prisma avec PostgreSQL et inclut :

Gestion des utilisateurs et organisations
Hiérarchie objets → secteurs → articles → tâches
Système de permissions granulaires
Notifications et historique

🔐 Sécurité

Authentification robuste avec Better Auth
Contrôle d'accès basé sur les rôles (RBAC)
Validation des entrées côté serveur
Protection CSRF intégrée
Headers de sécurité configurés

📚 Utilisation
Démarrage rapide

Créer une organisation ou rejoindre via invitation
Ajouter des objets (propriétés, campings, etc.)
Configurer des secteurs avec images
Placer des articles sur les plans
Assigner des tâches aux membres de l'équipe

Fonctionnalités avancées

Mode impression optimisé pour les rapports
Agenda interactif avec glisser-déposer
Notifications push temps réel
Export des données en CSV/PDF

🚢 Déploiement
L'application est configurée pour Vercel avec Cron jobs pour les emails quotidiens :
json{
  "crons": [
    {
      "path": "/api/cron/daily-emails",
      "schedule": "0 6 * * *"
    }
  ]
}
📱 PWA Support
L'application supporte les Progressive Web Apps :

Service Worker pour les notifications
Manifest pour l'installation
Mode hors-ligne basique

🤝 Contribution
Les contributions sont les bienvenues ! N'hésitez pas à :

Fork le projet
Créer une branche feature (git checkout -b feature/AmazingFeature)
Commit vos changements (git commit -m 'Add AmazingFeature')
Push vers la branche (git push origin feature/AmazingFeature)
Ouvrir une Pull Request

📄 Licence

Copyright (c) 2024 PlanniKeeper
Ce logiciel est fourni sous licence non-commerciale.
Vous POUVEZ :

✅ Voir et étudier le code source
✅ Modifier le code pour un usage personnel
✅ Utiliser pour des projets personnels, éducatifs ou de recherche
✅ Partager et distribuer le code source modifié ou non

Vous NE POUVEZ PAS :

❌ Utiliser à des fins commerciales
❌ Revendre ou redistribuer dans un but lucratif
❌ Offrir ce logiciel comme un service payant
❌ Utiliser ce logiciel dans une entreprise pour générer des revenus

Pour toute utilisation commerciale, veuillez contacter : perrottet.guillaume.97@gmail.com

LE LOGICIEL EST FOURNI "TEL QUEL", SANS GARANTIE D'AUCUNE SORTE, EXPRESSE OU IMPLICITE, Y COMPRIS MAIS SANS S'Y LIMITER AUX GARANTIES DE QUALITÉ MARCHANDE, D'ADÉQUATION À UN USAGE PARTICULIER ET D'ABSENCE DE CONTREFAÇON.

👥 Équipe

Développé avec ❤️ par l'équipe PlanniKeeper
```
