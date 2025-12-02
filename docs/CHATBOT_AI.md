# 🤖 Chatbot IA avec Claude 3.5

Le chatbot IA est intégré dans l'application Chaff pour fournir des analyses en temps réel sur vos établissements, CA, et masse salariale.

## ✨ Fonctionnalités

- **Analyse contextuelle** : L'IA connaît vos établissements, vos chiffres et vos ratios
- **Streaming en temps réel** : Les réponses s'affichent progressivement
- **Historique de conversation** : Chaque conversation est sauvegardée
- **Limites par plan** :
  - FREE : 5 messages/mois
  - PREMIUM : 50 messages/mois
  - ILLIMITE : ♾️ messages
- **Questions suggérées** : Pour démarrer rapidement
- **Analyses avancées** : Ratios, tendances, recommandations

## 🚀 Configuration

### 1. Obtenir une clé API Anthropic

1. Créer un compte sur [https://console.anthropic.com/](https://console.anthropic.com/)
2. Aller dans **API Keys**
3. Créer une nouvelle clé API
4. Copier la clé (elle commence par `sk-ant-api03-...`)

### 2. Configurer la variable d'environnement

Ajouter dans votre fichier `.env.local` :

```bash
ANTHROPIC_API_KEY="sk-ant-api03-votre-cle-ici"
```

### 3. Redémarrer le serveur

```bash
npm run dev
```

## 💰 Coûts

### Claude 3.5 Sonnet (20241022)

- **Input** : $0.003 / 1K tokens (~750 mots)
- **Output** : $0.015 / 1K tokens (~750 mots)
- **Estimation par conversation** : $0.05-0.15

### Exemple de calcul

Pour 50 messages/mois (plan PREMIUM) :

- 50 messages × $0.10 moyen = **~$5/mois**
- Bien moins cher que GPT-4

## 🎯 Utilisation

### Questions suggérées

Le chatbot peut répondre à des questions comme :

- "Quel est mon meilleur établissement ce mois-ci ?"
- "Compare mes ratios de masse salariale"
- "Montre-moi l'évolution de mon CA"
- "Quels établissements nécessitent mon attention ?"
- "Donne-moi des recommandations pour améliorer mes performances"
- "Pourquoi mon ratio est critique au Restaurant X ?"
- "Quel est mon CA moyen par jour ?"
- "Combien d'employés ai-je par établissement ?"

### Contexte fourni à l'IA

L'IA a accès en temps réel à :

- **Organisation** : Nom, plan, nombre d'établissements
- **Mandats** : Liste complète avec détails
- **Chiffre d'affaires** :
  - CA du mois actuel
  - CA du mois précédent
  - Évolution en %
  - Moyenne journalière
- **Masse salariale** :
  - Montant actuel et précédent
  - Ratio MS/CA
  - Nombre d'employés
  - Status (excellent/bon/warning/critical)
- **Statistiques** :
  - Meilleur/pire établissement
  - Établissements à risque
  - Ratio moyen global

## 🏗️ Architecture technique

### Structure des fichiers

```
src/
├── app/
│   ├── api/
│   │   └── ai/
│   │       └── chat/
│   │           └── route.ts          # API endpoint avec streaming
│   └── components/
│       └── AIChatWidget.tsx          # Composant UI du chatbot
├── lib/
│   └── ai-context-service.ts         # Service de récupération du contexte
└── prisma/
    └── schema.prisma                 # Modèles ChatConversation, ChatMessage, ChatUsage
```

### Flow de données

1. **User** envoie un message via `AIChatWidget`
2. **API** `/api/ai/chat` :
   - Vérifie l'authentification
   - Vérifie les limites du plan
   - Récupère le contexte via `getAIContext()`
   - Génère le prompt système avec `generateSystemPrompt()`
   - Appelle Claude avec streaming
   - Sauvegarde la conversation en DB
   - Met à jour l'usage
3. **Widget** affiche la réponse en streaming
4. **DB** garde l'historique des conversations

### Modèles de données

```prisma
model ChatConversation {
  id              String
  userId          String
  organizationId  String
  title           String
  lastMessageAt   DateTime
  messages        ChatMessage[]
}

model ChatMessage {
  id              String
  conversationId  String
  role            ChatRole (USER, ASSISTANT, SYSTEM)
  content         String
  tokens          Int?
  cost            Float?
}

model ChatUsage {
  userId          String
  organizationId  String
  year            Int
  month           Int
  messageCount    Int
  totalTokens     Int
  totalCost       Float
}
```

## 🔧 Personnalisation

### Modifier les limites

Dans `src/app/api/ai/chat/route.ts` :

```typescript
const MESSAGE_LIMITS = {
  FREE: 5,
  PREMIUM: 50,
  SUPER_ADMIN: 999999,
  ILLIMITE: 999999,
  CUSTOM: 100, // Personnalisable
};
```

### Modifier le prompt système

Dans `src/lib/ai-context-service.ts`, fonction `generateSystemPrompt()` :

```typescript
export function generateSystemPrompt(context: UserAIContext): string {
  // Personnaliser le comportement de l'IA
  return `Tu es un assistant IA expert...`;
}
```

### Changer le modèle Claude

Dans `src/app/api/ai/chat/route.ts` :

```typescript
const result = await streamText({
  model: anthropic("claude-3-5-sonnet-20241022"), // Ou autre modèle
  // ...
});
```

Modèles disponibles :

- `claude-3-5-sonnet-20241022` (recommandé)
- `claude-3-opus-20240229` (plus puissant, plus cher)
- `claude-3-haiku-20240307` (plus rapide, moins cher)

## 🐛 Debugging

### Voir les logs

```bash
# Logs API
console.log() dans /api/ai/chat/route.ts

# Logs frontend
console.log() dans AIChatWidget.tsx
```

### Tester manuellement

```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Bonjour"}]}'
```

### Erreurs courantes

1. **"Non autorisé"** : Vérifier que l'utilisateur est connecté
2. **"Organisation non trouvée"** : Vérifier que l'user a une organisation
3. **"Limite atteinte"** : L'utilisateur a dépassé son quota mensuel
4. **Erreur Anthropic** : Vérifier la clé API et les crédits

## 📊 Monitoring

### Suivre l'usage

```sql
-- Usage par utilisateur ce mois
SELECT u.email, cu.messageCount, cu.totalCost
FROM "chat_usage" cu
JOIN "user" u ON u.id = cu."userId"
WHERE cu.year = 2025 AND cu.month = 12
ORDER BY cu.messageCount DESC;

-- Conversations récentes
SELECT c.title, c."lastMessageAt", u.email
FROM "chat_conversation" c
JOIN "user" u ON u.id = c."userId"
ORDER BY c."lastMessageAt" DESC
LIMIT 20;

-- Coût total
SELECT
  SUM("totalCost") as total_cost,
  SUM("messageCount") as total_messages
FROM "chat_usage"
WHERE year = 2025 AND month = 12;
```

## 🚀 Améliorations futures

- [ ] Export des conversations en PDF
- [ ] Graphiques générés par l'IA
- [ ] Suggestions proactives basées sur les données
- [ ] Intégration avec notifications
- [ ] Commandes vocales
- [ ] Analyse prédictive (ML)
- [ ] Multi-langue (anglais, allemand, italien)

## 📝 Notes

- Le contexte est recalculé à chaque message pour avoir les données les plus récentes
- Les conversations sont privées par organisation
- Le streaming permet une meilleure UX (pas d'attente)
- Les coûts sont trackés automatiquement en DB

## 🆘 Support

Pour toute question, consulter la documentation Anthropic :

- [Documentation Claude](https://docs.anthropic.com/claude/docs)
- [API Reference](https://docs.anthropic.com/claude/reference)
- [Best Practices](https://docs.anthropic.com/claude/docs/intro-to-prompting)
