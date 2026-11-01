arch-title = Un cœur, et tout le reste branché.
arch-lede = Le cœur ne connaît aucun fournisseur ; tout le reste est un adaptateur. Choisissez une partie pour voir ce qu’elle fait et les contrats qu’elle implémente.
arch-core = Le cœur
arch-ports = Contrats

arch-agent = Agent central
arch-agent-text = Tient la conversation sur tous les canaux avec un modèle rapide et remplaçable, et des outils directs pour ce qui est fréquent et court : la maison, la mémoire, les minuteurs, les recherches rapides.
arch-agent-point-1 = Appelé directement, jamais à travers un harnais d’exécution
arch-agent-point-2 = Sa persona est construite à partir de ce qui est branché : il ne promet jamais une capacité absente

arch-memory = Mémoire
arch-memory-text = Ce que l’agent sait de chaque personne : daté, sourcé, cherchable. Le retenir, le retrouver, le corriger ou l’oublier, à la voix ou depuis l’administration.
arch-memory-point-1 = Partagée dans le foyer par défaut, personnelle par sa source
arch-memory-point-2 = Recherche plein texte aujourd’hui ; la recherche par le sens (vecteurs) est prévue

arch-initiative = Initiative
arch-initiative-text = Des veilles créées depuis la conversation, un tri en trois étages de ce qui arrive, et une décision de livraison (à qui, où, comment, quand) écrite avec sa raison.
arch-initiative-point-1 = Heures calmes, « pas maintenant », jamais pendant une conversation
arch-initiative-point-2 = Un message vocal resté sans réponse est doublé d’un message écrit

arch-journal = Journal
arch-journal-text = Le journal d’événements, en ajout seul, fait foi : l’administration, l’audit, les tâches durables et le rejeu en découlent. Un seul fichier SQLite.
arch-journal-point-1 = Chaque tour, appel d’outil, tâche, souvenir, prise de parole et décision de politique
arch-journal-point-2 = Les événements sont versionnés ; les anciens sont mis à niveau à la lecture, jamais réécrits

arch-channels = Canaux
arch-channels-text = Les façons de joindre le même agent, avec la même mémoire : la voix en temps réel (navigateur et satellites) et Telegram. Une demande faite à voix haute peut trouver sa réponse par écrit plus tard.
arch-channels-point-1 = Voix et Telegram aujourd’hui ; WhatsApp, Signal et Discord sont prévus
arch-channels-point-2 = Chaque canal a sa propre fenêtre de conversation ; les souvenirs les traversent tous

arch-satellites = Satellites
arch-satellites-text = Des appareils qui s’appairent avec un code et parlent des protocoles standard : audio WebRTC, événements sur un canal de données. Ils déclarent leurs capacités et exécutent des intentions, jamais des mouvements ; ils n’ont jamais de second cerveau.
arch-satellites-point-1 = SDK Python, TypeScript et Rust ; une suite de conformité boîte noire
arch-satellites-point-2 = Prévus : un profil WebSocket plus léger pour les microcontrôleurs, et une passerelle Wyoming pour les satellites vocaux de Home Assistant

arch-home = Home Assistant
arch-home-text = La maison, les pièces, les personnes et la présence viennent de Home Assistant par son API WebSocket ; les appareils se pilotent par son serveur MCP. Nestor intègre plutôt que réimplémenter.
arch-home-point-1 = La présence à la granularité qu’a la maison
arch-home-point-2 = Prévu : Nestor comme agent de conversation Assist de Home Assistant

arch-connectors = Connecteurs
arch-connectors-text = Les comptes tiers branchés depuis l’administration : Gmail et IMAP en natif, n’importe quel serveur MCP sans code. OAuth avec PKCE, un coffre chiffré, un interrupteur par outil.
arch-connectors-point-1 = Des outils pour l’agent, des déclencheurs pour les veilles
arch-connectors-point-2 = Les jetons n’atteignent jamais le modèle, le journal ni les logs

arch-executors = Exécutants
arch-executors-text = Le long et le complexe (recherche, paperasse, code, navigation) part chez un agent d’exécution, en tâche durable que l’agent suit, annonce une fois et peut annuler.
arch-executors-point-1 = Hermes aujourd’hui ; Codex et d’autres sont prévus sur le même contrat
arch-executors-point-2 = Les tâches survivent à un redémarrage et livrent une seule fois

arch-providers = Modèles
arch-providers-text = Le modèle de l’agent est un adaptateur : n’importe quelle API compatible OpenAI, dans le cloud ou en local. Les services de parole se règlent dans la configuration du canal vocal.
arch-providers-point-1 = En changer modifie la configuration, jamais le cœur
arch-providers-point-2 = Les services cloud sont facultatifs par conception ; des modèles locaux entrent dans les mêmes contrats
