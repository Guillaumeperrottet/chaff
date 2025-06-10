# Guide de Test Better Auth

## 🧪 Tests à Effectuer

### 1. **Test Local (Development)**

```bash
# Lancer l'application
npm run dev

# Ouvrir dans le navigateur
open http://localhost:3000
```

**Pages à tester :**

- [ ] `/` - Page d'accueil
- [ ] `/signin` - Page de connexion
- [ ] `/signup` - Page d'inscription
- [ ] `/dashboard` - Dashboard (doit rediriger vers signin si non connecté)
- [ ] `/cookie-debug` - Diagnostic des cookies
- [ ] `/test-auth` - Test du hook useSession

### 2. **Test d'Authentification**

#### **Scénario 1 : Utilisateur non connecté**

1. Aller sur `/dashboard` → Doit rediriger vers `/signin`
2. Aller sur `/` → Doit rester sur la page d'accueil
3. Vérifier `/cookie-debug` → Aucun cookie Better Auth

#### **Scénario 2 : Connexion**

1. Aller sur `/signin`
2. Entrer des identifiants valides
3. Après connexion → Doit rediriger vers `/dashboard`
4. Vérifier `/cookie-debug` → Cookies Better Auth présents

#### **Scénario 3 : Session active**

1. Utilisateur connecté va sur `/signin` → Doit rediriger vers `/dashboard`
2. Rafraîchir `/dashboard` → Doit rester connecté
3. Ouvrir nouvel onglet `/dashboard` → Doit être connecté

#### **Scénario 4 : Déconnexion**

1. Se déconnecter depuis `/dashboard`
2. Doit rediriger vers `/`
3. Aller sur `/dashboard` → Doit rediriger vers `/signin`

### 3. **Test Vercel (Production)**

```bash
# Déployer sur Vercel
vercel --prod

# Tester les mêmes scénarios sur l'URL de production
```

## 🔧 Debugging

### **Logs à surveiller :**

#### **Middleware (doit être silencieux avec version simplifiée)**

```
✅ Pas d'erreur Prisma
✅ Pas de message "Accès refusé"
```

#### **Better Auth API**

```
✅ GET /api/auth/get-session 200
✅ POST /api/auth/sign-in 200
✅ POST /api/auth/sign-out 200
```

#### **Console Browser**

```javascript
// Dans les DevTools Console
// Vérifier que le hook useSession fonctionne
console.log("Session:", window.__BETTER_AUTH_SESSION__);
```

### **Diagnostic des Cookies**

Page `/cookie-debug` doit afficher :

```
✅ better-auth.session_token (si connecté)
✅ Liste de tous les cookies disponibles
✅ Recommandations pour le middleware
```

## 🚨 Problèmes Courants

### **1. Utilisateur bloqué sur signin**

- Vérifier que Better Auth API répond (DevTools Network)
- Vérifier les variables d'environnement
- Tester avec `/test-auth` pour voir l'état du hook

### **2. Redirection en boucle**

- Vérifier que le middleware ne bloque pas les cookies
- S'assurer que UnifiedSessionManager ne créé pas de conflit
- Vérifier les logs console pour les erreurs

### **3. Session ne persiste pas**

- Vérifier les cookies dans `/cookie-debug`
- Vérifier la configuration des domaines en production
- Tester la synchronisation entre onglets

## ✅ Validation Finale

### **Checklist avant déploiement :**

- [ ] Middleware simplifié activé
- [ ] Toutes les pages se chargent sans erreur
- [ ] Flow d'authentification complet fonctionne
- [ ] Cookies Better Auth visibles dans `/cookie-debug`
- [ ] Pas d'erreur Prisma dans les logs
- [ ] Variables d'environnement configurées sur Vercel
