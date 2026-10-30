arch-title = Un cœur, et tout le reste branché.
arch-lede = Le cœur tourne sur votre serveur et ne connaît aucun fournisseur. Canaux, satellites, maison, comptes, exécutants et fournisseurs d'IA s'y branchent par des contrats publics. Choisissez une partie pour voir son rôle.
arch-core = Le cœur
arch-ports = Contrats

arch-agent = Agent central
arch-agent-text = Tient la conversation sur tous les canaux avec un modèle rapide et remplaçable, et des outils directs pour ce qui est fréquent et court : la maison, la mémoire, les minuteurs, les recherches rapides.
arch-agent-point-1 = Première phrase en 0,64 s médian, en appel direct
arch-agent-point-2 = Un outil passe de la délégation à l'appel direct seulement si la latence mesurée le justifie

arch-memory = Mémoire
arch-memory-text = Ce que l'agent sait de chaque personne : daté, sourcé, cherchable. Retenir, retrouver, corriger, oublier — à la voix ou depuis l'administration.
arch-memory-point-1 = Partagée dans le foyer par défaut, personnelle par sa source
arch-memory-point-2 = Recherche plein texte aujourd'hui ; vectorielle quand un banc le justifiera

arch-initiative = Initiative
arch-initiative-text = Des veilles créées depuis la conversation, un tri en trois étages de ce qui arrive, et une décision de livraison — à qui, où, comment, quand — écrite avec sa raison.
arch-initiative-point-1 = Heures calmes, « pas maintenant », jamais pendant une conversation
arch-initiative-point-2 = Un message vocal resté sans réponse est doublé d'un message écrit

arch-journal = Journal
arch-journal-text = Le journal d'événements, en ajout seul, fait foi : l'administration, l'audit, les tâches durables et le rejeu en découlent. Un seul fichier SQLite en mode WAL.
arch-journal-point-1 = Chaque tour, appel d'outil, tâche, souvenir, prise de parole et décision de politique
arch-journal-point-2 = Réplication continue avec Litestream, en option

arch-channels = Canaux
arch-channels-text = Les façons de joindre le même agent, avec la même mémoire : la voix en temps réel — d'abord dans un navigateur — et Telegram. Une demande faite à voix haute peut trouver sa réponse par écrit une heure plus tard.
arch-channels-point-1 = Voix et Telegram aujourd'hui ; WhatsApp et Discord plus tard
arch-channels-point-2 = Chaque compte du foyer est relié à ses personnes sur chaque canal

arch-satellites = Satellites
arch-satellites-text = Des appareils qui s'appairent avec un code et parlent des protocoles standard : audio WebRTC, événements sur un canal de données. Ils déclarent leurs capacités et exécutent des intentions ; ils n'ont jamais de second cerveau.
arch-satellites-point-1 = SDK Python, TypeScript et Rust ; une suite de conformité boîte noire
arch-satellites-point-2 = La sécurité — watchdog, limites de mouvement — s'exécute sur l'appareil, jamais par le réseau

arch-home = Home Assistant
arch-home-text = La maison, les pièces, les personnes et la présence viennent de Home Assistant par son API WebSocket ; les appareils se pilotent par son serveur MCP. Nestor intègre plutôt que réimplémenter.
arch-home-point-1 = La présence à la granularité qu'a la maison
arch-home-point-2 = Plus tard : Nestor comme agent de conversation Assist de Home Assistant

arch-connectors = Connecteurs
arch-connectors-text = Les comptes tiers branchés depuis l'administration : Gmail et IMAP en natif, n'importe quel serveur MCP sans code. OAuth avec PKCE, un coffre chiffré, un interrupteur par outil.
arch-connectors-point-1 = Des outils pour l'agent, des déclencheurs pour les veilles
arch-connectors-point-2 = Les jetons n'atteignent jamais le modèle, le journal ni les logs

arch-executors = Exécutants
arch-executors-text = Le long et le complexe — code, navigation, recherche, paperasse — part chez un agent d'exécution comme Hermes ou Codex, en tâche durable que l'agent suit, annonce et peut annuler.
arch-executors-point-1 = Un exécutant déclare ce qu'il sait faire : l'agent ne promet jamais plus
arch-executors-point-2 = Les tâches survivent à un redémarrage et livrent une seule fois

arch-providers = Fournisseurs d'IA
arch-providers-text = Modèles de langage, transcription, voix et détection de fin de tour sont des adaptateurs choisis par configuration, sur des bancs reproductibles. Toute API de modèle compatible OpenAI convient à l'agent.
arch-providers-point-1 = En changer modifie la configuration, jamais le cœur
arch-providers-point-2 = Les services cloud sont facultatifs par conception ; des modèles locaux entrent dans les mêmes contrats
