# 🔥 PURGATOIRE - Jeu de Cartes Ange vs Démon

Un jeu de cartes stratégique immersif développé en React Native avec Expo Go, où les forces du Bien et du Mal s'affrontent pour la domination du monde !

## 🎮 Fonctionnalités

### ⚔️ Gameplay Principal
- **Combat de cartes** avec système de mana et tours
- **6 régions uniques** à conquérir avec des bonus spéciaux
- **Système de purge** : victoire totale puis reset du monde
- **5 classes** avec capacités spéciales (Mage, Guerrier, Paladin, Nécromancien, Chaman)
- **Conversion de faction** : changez de camp en cours de jeu !

### 🃏 Système de Cartes
- **3 types de cartes** : Créatures, Sorts, Équipements
- **4 raretés** : Commune, Rare, Épique, Légendaire
- **Deck building** avec collection évolutive
- **Cartes uniques** par faction et classe

### 🗺️ Méta-jeu
- **Carte du monde interactive** avec contrôle territorial
- **Progression de joueur** avec niveaux et expérience
- **Statistiques détaillées** et profil personnalisable
- **Sauvegarde locale** avec AsyncStorage

## 🚀 Installation

### Prérequis
- Node.js 18+ installé
- Expo Go app sur votre téléphone ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
- Yarn ou npm

### Étapes d'installation

1. **Clonez ou téléchargez le projet**
```bash
# Si vous avez git
git clone <url-du-projet>
cd purgatoire

# Ou créez le dossier manuellement et copiez les fichiers
```

2. **Installez les dépendances**
```bash
# Avec yarn (recommandé)
yarn install

# Ou avec npm
npm install
```

3. **Configurez TypeScript** (optionnel, le jeu fonctionne aussi en JS)
```bash
# Créer le tsconfig.json automatiquement
npx expo install typescript
```

4. **Lancez le projet**
```bash
# Démarrage du serveur Expo
yarn start

# Ou
npx expo start
```

5. **Scannez le QR code** avec l'app Expo Go sur votre téléphone

## 📁 Structure du Projet

```
purgatoire/
├── App.tsx                     # Application principale
├── src/
│   ├── screens/               # Écrans du jeu
│   │   ├── HomeScreen.tsx     # Écran d'accueil
│   │   ├── FactionSelectionScreen.tsx  # Choix de faction
│   │   ├── WorldMapScreen.tsx # Carte du monde
│   │   ├── BattleScreen.tsx   # Combat de cartes
│   │   ├── DeckScreen.tsx     # Gestion du deck
│   │   └── ProfileScreen.tsx  # Profil joueur
│   ├── types/
│   │   └── gameTypes.ts       # Types TypeScript
│   ├── services/
│   │   └── gameService.ts     # Logique métier
│   └── contexts/
│       └── GameContext.tsx    # État global
├── package.json
└── README.md
```

## 🎯 Guide de Jeu

### Premier Lancement
1. **Choisissez votre faction** : Anges (soin/protection) ou Démons (attaque/destruction)
2. **Sélectionnez une classe** : Chaque classe a des bonus uniques
3. **Entrez votre nom** de guerrier

### Gameplay
1. **Explorez la carte du monde** : 6 régions à conquérir
2. **Combattez** pour contrôler les territoires
3. **Gérez votre deck** : ajoutez/retirez des cartes
4. **Progressez** : gagnez XP, montez de niveau
5. **Attention à la purge** : quand une faction domine à 80%, tout est remis à zéro !

### Combat
- **Mana** : augmente chaque tour
- **Cartes** : coûtent du mana à jouer
- **Victoire** : réduisez les PV adverses à 0
- **Stratégie** : équilibrez créatures, sorts et équipements

## 🛠️ Dépendances Principales

- **Expo SDK 53** : Framework React Native
- **React Native 0.76** : Runtime mobile
- **Expo Linear Gradient** : Dégradés visuels
- **AsyncStorage** : Sauvegarde locale
- **TypeScript** : Typage statique

## 📱 Compatibilité

### Testé sur :
- ✅ **Expo Go** (iOS/Android)
- ✅ **Expo Development Build**
- ✅ **Web** (expo start --web)

### Optimisé pour :
- Téléphones en mode portrait
- Écrans de 5" à 7"
- iOS 12+ / Android 7+

## 🔧 Développement

### Commandes utiles
```bash
# Lancement sur Android
yarn android

# Lancement sur iOS
yarn ios

# Lancement web
yarn web

# Reset du cache Expo
npx expo start --clear

# Installation de nouvelles dépendances Expo
npx expo install <package-name>
```

### Debugging
- **Logs** : Consultez la console Expo
- **Erreurs** : Shaker votre téléphone → "Debug Remote"
- **Reset data** : Bouton dans l'écran d'accueil

## 🎨 Thème Visuel

### Palette de Couleurs
- **Anges** : Or (#FFD700), Bleu ciel (#87CEEB), Blanc (#F0F8FF)
- **Démons** : Rouge (#DC143C), Rouge sombre (#8B0000), Marron (#2F1B14)
- **Interface** : Bleu nuit (#1a1a2e), Gris (#2a2a3e)

### Typographie
- **Titres** : Bold, Lettres espacées
- **Corps** : 14-16px, Lisible
- **Boutons** : 16-18px, Gras

## 🐛 Résolution de Problèmes

### Le jeu ne se lance pas
1. Vérifiez Node.js 18+
2. Supprimez `node_modules` et `yarn.lock`
3. Réinstallez : `yarn install`
4. Redémarrez : `yarn start`

### Erreurs de sauvegarde
1. L'app utilise AsyncStorage (local seulement)
2. En cas de problème : bouton "Reset Data"

### Performance lente
1. Fermez d'autres apps
2. Utilisez un appareil récent
3. Évitez le mode Debug en production

## 🚧 Futures Améliorations

### Version 1.1
- [ ] Multijoueur en ligne
- [ ] Plus de cartes et classes
- [ ] Événements temporaires
- [ ] Son et musique

### Version 1.2
- [ ] Mode tournoi
- [ ] Cartes personnalisables
- [ ] Guildes et alliances
- [ ] Classements globaux

## 📞 Support

En cas de problème :
1. Consultez la console Expo
2. Vérifiez les logs d'erreur
3. Utilisez le bouton "Reset Data" si nécessaire

## 📄 Licence

Projet éducatif - Libre d'utilisation et modification

---

**Bon combat, et que le meilleur camp gagne ! ⚔️**