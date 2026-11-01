---

title: "Protocole : nestor.satellite/1"
description: Le standard que tout satellite implémente, quel que soit son langage. Version actuelle, la seule que les serveurs acceptent.
---

Un **satellite** est un appareil qui s’appaire à un serveur Nestor (le **cœur**), déclare ce qu’il
sait faire, fait passer l’audio, remonte des observations et exécute les intentions du cœur. Cette
page est le standard : les SDK et les pilotes, dans tout langage, l’implémentent, et la
[suite de conformité](/fr/docs/satellites/conformance/) boîte noire du cœur les vérifie. Voici la
version 1, la première (voir l’[historique](#10-historique)).

Les mots DOIT, NE DOIT PAS, DEVRAIT, NE DEVRAIT PAS et PEUT s’entendent au sens de la
[RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) (MUST, MUST NOT, SHOULD, SHOULD NOT, MAY).

Les classes de messages du cœur (`nestor.modules.satellites.wire`) font foi pour les formes. Les
schémas JSON qu’elles génèrent sont servis à
`https://nestorhome.dev/schemas/satellite/1/<message>.json` (voir [Schémas](/fr/docs/satellites/schemas/)) ;
les SDK en gardent une copie et testent ce qu’ils envoient avec.

## 1. Vue d’ensemble

```text
appareil                                cœur                                 membre du foyer
  │ POST /satellites/pairings ────────▶ pending + code d’appareil        ◀── lance un ajout (facultatif)
  │ présente le code d’appareil (écran, voix, journal)
  │                                                       ◀──────────────── tape le code d’appareil
  │                           ou, au premier arrivé
  │ POST …/{pairing_id}/enrollment ───▶ approved                             (code d’enrôlement créé dans l’administration)
  │ GET  /satellites/pairings/{id} ───▶ approved + jeton (une fois)
  │ POST /satellites/{device_id}/offer (jeton Bearer, SDP WebRTC)
  │ canal de données `nestor` : hello → welcome, intentions ⇄ acks, observations
```

Un appareil configuré avec un code d’enrôlement l’envoie dès sa première requête et il est approuvé
aussitôt.

## 2. Méthodes d’appairage

La preuve qu’une personne voulait appairer un appareil circule dans un sens ou dans l’autre :

- un **code d’appareil** va de l’appareil à la personne, qui le tape dans l’administration ;
- un **code d’enrôlement** va de l’administration à l’appareil, qui le présente au cœur.

L’appareil déclare les méthodes qu’il prend en charge ; la personne en choisit une. Les méthodes
sont :

| Méthode                   | Preuve            | La personne…                                                                                          |
| ------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------- |
| `device_code.display`     | code d’appareil   | lit le code sur l’écran de l’appareil et le tape dans l’administration                                |
| `device_code.speech`      | code d’appareil   | entend l’appareil dire son code et le tape dans l’administration                                      |
| `enrollment.input`        | code d’enrôlement | tape le code d’enrôlement sur l’appareil                                                              |
| `enrollment.provisioning` | code d’enrôlement | met l’URI ou le code d’appairage dans la configuration de l’appareil (option, environnement, fichier) |
| `enrollment.qr`           | code d’enrôlement | montre le QR code de l’URI d’appairage à la caméra de l’appareil                                      |

L’identification (section 6) n’est pas une méthode : elle aide à distinguer les appareils et se
déclare par la capacité `device.identify`.

### 2.1 Négociation

- **N1.** Un manifeste DOIT lister dans `pairing_methods` les méthodes que l’appareil prend en
  charge, au moins une, sans répétition. Un appareil NE DOIT PAS déclarer une méthode qu’il ne sait
  pas mener à bien.
- **N2.** Le cœur recommande une méthode, la première que l’appareil prend en charge dans cet
  ordre : `device_code.display`, `device_code.speech`, `enrollment.qr`, `enrollment.input`,
  `enrollment.provisioning`. Pour un appareil qui n’a pas encore contacté le cœur, toutes les
  méthodes sont proposées. L’administration met en avant la méthode recommandée et garde les autres
  disponibles.
- **N3.** L’appareil n’impose jamais de méthode. Quoi que la personne choisisse, l’appareil DOIT
  accepter les deux preuves jusqu’à ce que l’une soit acceptée (section 3.3).

## 3. Appairage

### 3.1 Points d’accès

Tous les corps sont en JSON (`Content-Type: application/json`).

| Requête                                             | Corps                | Réponse                |
| --------------------------------------------------- | -------------------- | ---------------------- |
| `POST /satellites/pairings`                         | `pairing.request`    | `201` `pairing.ticket` |
| `POST /satellites/pairings/{pairing_id}/enrollment` | `pairing.enrollment` | `200` `pairing.state`  |
| `GET /satellites/pairings/{pairing_id}`             |                      | `200` `pairing.state`  |

```json
POST /satellites/pairings
{"manifest": {"protocol": "nestor.satellite/1",
              "device": {"id": "capteur-entree", "model": "esp32", "room": "entree"},
              "capabilities": [{"name": "device.identify"}],
              "pairing_methods": ["enrollment.provisioning", "enrollment.qr"]},
 "enrollment_code": "K7QF2M9X", "method": "enrollment.provisioning"}

201 {"pairing_id": "…", "status": "approved", "expires_at": "2026-10-30T12:10:00+00:00"}
201 {"pairing_id": "…", "status": "pending", "expires_at": "…", "device_code": "042917"}   (sans code)

GET /satellites/pairings/{pairing_id}
200 {"status": "pending", "identify": true}
200 {"status": "approved", "token": "nst1_…", "device_id": "capteur-entree", "room": "entree",
     "capabilities": ["device.identify"]}
```

Les erreurs répondent `pairing.error` : `{"error": code, "detail": texte, "reason"?: …, "retry_after_s"?: …}`.

| `error`                | Statut | Sens                                                                                            |
| ---------------------- | ------ | ----------------------------------------------------------------------------------------------- |
| `invalid_request`      | 422    | le corps ne suit pas son schéma                                                                 |
| `protocol_unsupported` | 422    | le manifeste nomme une autre version de ce protocole                                            |
| `too_many_pending`     | 429    | trop d’appareils attendent une preuve ; `Retry-After` et `retry_after_s` disent quand réessayer |
| `too_many_attempts`    | 429    | trop de codes d’enrôlement faux ; `Retry-After` et `retry_after_s` disent quand réessayer       |
| `enrollment_refused`   | 403    | le code d’enrôlement n’appaire rien ; `reason` vaut `unknown`, `expired`, `used` ou `cancelled` |
| `not_pending`          | 409    | l’appairage n’attend plus de preuve : l’autre preuve l’a emporté, ou il a expiré                |

`detail` est en anglais, pour les journaux. Un appareil qui montre ou dit une erreur aux gens DOIT
la traduire à partir de `error` et `reason`, jamais afficher `detail`.

### 3.2 États d’un appairage

```text
             code d’appareil tapé dans l’administration
           ┌───────────────────────────────┐
requête ──▶ pending                         ├──▶ approved ──(première lecture : jeton)──▶ claimed
  │        └───────────────────────────────┘        │
  │          code d’enrôlement accepté              │ l’échéance passe, jeton non réclamé
  │                                                 ▼
  └── avec un code d’enrôlement ──▶ approved     expired ◀── l’échéance passe en attente,
                                                              ou l’appareil redemande (remplacé)
```

- Un appairage en attente dure 10 minutes. Un `pairing_id` inconnu, remplacé ou oublié se lit
  `expired` : interroger ne révèle rien.
- Le jeton n’est remis qu’avec la première réponse `approved` ; les lectures suivantes donnent
  `claimed`.

### 3.3 Règles de l’appareil

- **P1.** Un appareil DOIT prendre en charge `enrollment.provisioning` : il lit une URI
  d’appairage dans la variable d’environnement `NESTOR_PAIRING_URI`, ou un code d’enrôlement dans
  `NESTOR_PAIRING_CODE` avec l’adresse du cœur donnée à part, et DEVRAIT accepter les deux par une
  option de ligne de commande et dans son fichier de configuration.
- **P2.** Sans code d’enrôlement, un appareil DOIT demander un appairage et présenter son code
  d’appareil sur toutes ses sorties : à l’écran (`device_code.display`), à voix haute
  (`device_code.speech` : une courte phrase, puis les chiffres un par un avec une pause entre
  chacun, le tout dit deux fois, dans la langue de l’appareil, sans avoir besoin du réseau), et
  toujours dans son journal. Un appareil sans écran ni voix DOIT écrire le code d’appareil dans son
  journal et y dire qu’un code d’enrôlement est le moyen de l’appairer. Il interroge ensuite
  l’appairage environ une fois par seconde jusqu’à ce qu’il soit approuvé ou expire ; s’il expire,
  il redemande.
- **P3.** Un appareil qui a un code d’enrôlement DOIT l’envoyer avec sa requête, avec la méthode par
  laquelle il l’a reçu, et NE DOIT PAS présenter de code d’appareil sauf si ce code est refusé.
- **P4.** Un appareil en attente DOIT accepter un code d’enrôlement à tout moment (tapé, scanné,
  configuré) et l’envoyer à `POST …/{pairing_id}/enrollment`. La première preuve acceptée
  l’emporte :
  - si le code d’appareil a été tapé d’abord, l’enrôlement répond `not_pending` et le code
    d’enrôlement n’est **pas** consommé : l’appareil continue d’interroger et obtient son jeton ;
  - si le code d’enrôlement a été accepté d’abord, le code d’appareil tapé ensuite est refusé.
    Sur `approved`, l’appareil cesse aussitôt de présenter son code d’appareil (une voix se tait).
- **P5.** Un code d’enrôlement refusé par `enrollment_refused` NE DOIT PLUS être présenté, même
  après un redémarrage : l’appareil garde les codes refusés avec son jeton (une empreinte de chacun
  suffit). Il DOIT le dire dans son journal (et sur ses sorties, traduit), puis se rabattre sur un
  code d’appareil (P2) pour qu’une personne puisse encore l’appairer.
- **P6.** Sur un `429`, un appareil DOIT attendre au moins `Retry-After` secondes avant de
  réessayer.
- **P7.** Les codes d’enrôlement DOIVENT être normalisés avant envoi (section 4.2) ; un appareil
  PEUT les envoyer tels que tapés, le cœur normalise aussi.
- **P8.** Un appareil DOIT garder son jeton secret (lisible par son seul propriétaire sur un système
  de fichiers) et l’oublier quand le cœur le refuse (`401` sur une offre), puis s’appairer à
  nouveau.

### 3.4 Règles du cœur

- **C1.** Le cœur n’accepte que `nestor.satellite/1`. Un manifeste qui nomme un autre
  `nestor.satellite/<n>` est refusé avec `protocol_unsupported`.
- **C2.** Un code d’enrôlement appaire un seul appareil : il est consommé dès qu’il est accepté,
  avant que quoi que ce soit puisse l’observer, si bien que deux appareils qui l’utilisent en même
  temps obtiennent une approbation et un `enrollment_refused` (`used`).
- **C3.** Une preuve n’est acceptée que tant que son appairage est `pending` ; la première acceptée
  le fait passer aussitôt à `approved`. Un code d’enrôlement refusé parce que l’appairage n’est plus
  en attente n’est pas consommé.
- **C4.** Le jeton fait 256 bits aléatoires, préfixé `nst1_` ; seul son SHA-256 est conservé.
- **C5.** Une nouvelle demande avec le même identifiant d’appareil remplace la demande en attente.
- **C6.** Le journal enregistre chaque étape : `satellite.pairing.requested` (avec les méthodes
  déclarées), `satellite.addition.started|completed|cancelled|expired`,
  `satellite.enrollment.refused` (avec sa raison et l’adresse), `satellite.paired` (avec la preuve,
  la méthode et l’ajout), `satellite.identify.requested`, `satellite.revoked`. Jamais un code ni un
  jeton en clair.

### 3.5 Ajouts

Une personne ajoute un satellite depuis l’administration en lançant un **ajout** : la méthode
choisie et, si elle le veut, un nom, une pièce et les capacités à autoriser au plus. Il dure 15
minutes par défaut (de 1 minute à 7 jours).

- Avec une méthode d’enrôlement, l’ajout crée le code d’enrôlement, rendu une seule fois avec son
  URI d’appairage. L’appareil qui le présente est appairé aussitôt, nommé, dans la pièce de l’ajout,
  avec les capacités déclarées restreintes à celles de l’ajout.
- Avec une méthode par code d’appareil, l’ajout attend un appareil : l’administration liste les
  appareils en attente, la personne les distingue (identification), tape le code que présente le
  bon, et le nom, la pièce et les capacités de l’ajout s’appliquent.

Un ajout se termine quand son appareil est appairé (`completed`), quand une personne l’annule ou
quand il expire. Il y en a au plus 32 en cours à la fois. Un ajout appaire un seul appareil : le
cœur le réclame en une étape, si bien que deux personnes qui tapent un code pour lui au même instant
appairent un seul appareil, et l’autre apprend que l’ajout est terminé.

## 4. Codes et URI

### 4.1 Code d’appareil

Six chiffres décimaux (`042917`), aléatoires, uniques parmi les appairages en attente. Des chiffres
se lisent bien à voix haute et sur n’importe quel écran.

### 4.2 Code d’enrôlement

- Huit symboles de l’alphabet base32 de Crockford `0123456789ABCDEFGHJKMNPQRSTVWXYZ` : 40 bits
  aléatoires.
- Affiché par groupes de quatre : `K7QF-2M9X`.
- Normalisation, avant toute comparaison : retirer espaces et tirets, passer en majuscules, puis
  remplacer `O` par `0`, `I` et `L` par `1`. Un résultat qui ne fait pas 8 symboles de l’alphabet
  n’est pas un code (`U` n’en est jamais un).
- Forme canonique : les 8 symboles normalisés, sans tiret.

### 4.3 URI d’appairage

```text
nestor+http://nestor.local:7860/?code=K7QF2M9X
nestor+https://nestor.example.org/satellites-proxy/?code=K7QF2M9X
```

- Le schéma est `nestor+` suivi du schéma de l’URL de base du cœur (`http` ou `https`) ; hôte, port
  et chemin sont ceux de l’URL de base du cœur. Retirer `nestor+` et la requête donne l’URL de base.
- `code` est le code d’enrôlement, sous forme canonique.
- Pourquoi cette forme : l’adresse du cœur et le code voyagent ensemble, un appareil sans écran n’a
  besoin de rien d’autre ; le transport (TLS ou non) est explicite ; tout analyseur d’URL la lit ;
  le préfixe dit à un lecteur de QR code ou à un chargeur de configuration ce qu’elle contient,
  comme `git+https`.
- L’administration renvoie l’URI ; une interface dessine son QR code elle-même.

## 5. Manifeste

```json
{
  "protocol": "nestor.satellite/1",
  "device": { "id": "salon", "model": "reachy-mini", "room": "salon", "brand": "pollen-robotics" },
  "sdk": { "name": "nestor-satellite-python", "version": "0.1.0" },
  "capabilities": [{ "name": "audio.capture" }, { "name": "audio.playback" }, { "name": "device.identify" }],
  "pairing_methods": ["device_code.speech", "enrollment.provisioning"]
}
```

`id` et `room` sont des identifiants en minuscules (`^[a-z0-9][a-z0-9_-]{0,63}$`). Les capacités
sont des noms `famille.fonction`, 32 au plus, chacune déclarée une fois. Capacités connues :
`audio.capture`, `audio.playback`, `audio.speech_activity`, `vision.person_detection`,
`expression.emotion`, `motion.head`, `device.identify`. Le manifeste est envoyé à l’appairage et
dans `hello`.

## 6. Identification

- **I1.** Un appareil qui déclare `device.identify` DOIT, sur une réponse d’attente portant
  `"identify": true`, se faire remarquer quelques secondes avec les sorties dont il dispose
  (clignoter, remuer, sonner, faire flasher son écran), et continuer d’interroger.
- **I2.** Une fois appairé et autorisé à `device.identify`, il DOIT accuser réception de
  `intent.identify` comme de toute intention, et se faire remarquer de la même façon.
- **I3.** Le cœur n’envoie l’identification qu’à un appareil qui l’a déclarée (en attente) ou qui y
  est autorisé (appairé). L’administration la refuse sinon, ainsi que pour un appareil appairé qui
  n’est pas connecté.
- L’identification aide seulement une personne à distinguer des appareils. Elle ne prouve rien :
  n’importe quel appareil peut clignoter sur demande, elle ne remplace donc jamais un code.

## 7. Lien temps réel

- **W1.** Avec son jeton, l’appareil propose une connexion WebRTC : `POST
  /satellites/{device_id}/offer` avec `Authorization: Bearer <jeton>` et `{"sdp", "type"}` ; le cœur
  répond `{"sdp", "type", "pc_id"}`. Les candidats ICE suivent en `PATCH` sur le même chemin. Un
  mauvais jeton répond `401` ; le `pc_id` d’un autre appareil, `403`.
- **W2.** Sur le canal de données `nestor`, chaque message est `{"type", "id", "at", "payload"}`.
  L’appareil DOIT envoyer `hello` (son manifeste, avec l’identifiant appairé) en premier ; le cœur
  répond `welcome` (la pièce appairée et les capacités autorisées). L’appareil DOIT accuser
  réception de chaque `intent.*` par un `ack` en moins d’une seconde, et NE DOIT remonter que les
  observations qui lui sont permises. Les types de message inconnus venant du cœur sont ignorés.
- **W3.** Audio : Opus sur WebRTC, la voix du cœur vers l’appareil, le micro (avec
  `audio.capture`) vers le cœur.
- **W4.** Après un raccrochage ou une perte du lien, l’appareil se reconnecte avec le même jeton,
  avec un délai croissant.

## 8. Sécurité

- **Entropie.** Un code d’enrôlement a 40 bits (environ 1,1 × 10¹² valeurs). Avec au plus 32 codes
  en cours et au plus 5 codes faux par minute et par adresse (20 toutes adresses confondues), les
  300 essais qui tiennent dans une durée de vie de 15 minutes en trouvent un environ une fois sur
  10⁸ ; en trouver un demande en moyenne quelque 1 600 ans d’essais. Un code d’appareil a 20 bits,
  mais il n’est tapé que par une personne connectée, sur un appairage en attente qu’elle a choisi
  (`pairing_id`), dans les 10 minutes.
- **Durée de vie.** Les codes d’enrôlement durent 15 minutes par défaut, 7 jours au plus ; les codes
  d’appareil, 10 minutes.
- **Usage unique.** Un code d’enrôlement accepté est consommé avant que la réponse soit écrite (C2).
- **Limites de débit.** Les codes d’enrôlement faux sont comptés par adresse cliente et au total sur
  une minute glissante. Au-delà de l’une ou l’autre limite, chaque tentative, juste ou fausse, est
  refusée avec `429` jusqu’à ce que la fenêtre libère une place : un client limité n’apprend rien.
- **Empreintes.** Seuls les SHA-256 des codes et des jetons sont stockés, et journalisés. Un code
  présenté est comparé à chaque empreinte connue en temps constant. 40 bits se cassent hors ligne à
  partir d’une empreinte divulguée : l’empreinte ne vaut que tant que le code vit, gardez des durées
  de vie courtes.
- **Transport.** Codes et jetons traversent le réseau en clair sur `http` ; utilisez `https` (une
  URI `nestor+https`) hors d’un réseau domestique de confiance.
- **Ce que l’identification ne prouve pas.** Elle montre quel appareil répond, pas que c’est celui
  que la personne a en main : n’appairez jamais sur la seule identification.
- **Consentement.** L’appairage ne donne à un appareil que les capacités qu’une personne a
  autorisées, jamais plus que ce qu’il a déclaré.

## 9. Conformité

`check_satellite(driver)` lance le pilote une fois par scénario : une fonction coroutine Python qui
prend un `Launch`, ou une commande où `{url}` est l’URL du cœur et `{state}` un dossier neuf pour
son jeton. Le code d’enrôlement est donné dans `NESTOR_PAIRING_URI` (retirée de l’environnement des
autres scénarios). Un pilote, dans n’importe quel langage, lance la suite en ligne de commande :
voir [Conformité](/fr/docs/satellites/conformance/).

| Vérification                                                                                    | Règles |
| ----------------------------------------------------------------------------------------------- | ------ |
| déclare enrollment.provisioning                                                                 | N1, P1 |
| demande à s’appairer ; réclame son jeton une fois son code d’appareil tapé                      | P2     |
| continue d’interroger après une identification en attente (s’il déclare `device.identify`)      | I1     |
| se connecte avec son jeton ; envoie d’abord un hello ; se présente comme l’appareil appairé     | W1, W2 |
| accuse réception de chaque intention en moins d’1 s (`intent.identify` s’il y est autorisé)     | W2, I2 |
| chaque message suit son schéma                                                                  | W2     |
| reçoit l’audio du cœur ; envoie l’audio de son micro                                            | W3     |
| se reconnecte avec le même jeton après un raccrochage                                           | W4     |
| s’appaire avec le code d’enrôlement de `NESTOR_PAIRING_URI`, sans code tapé                     | P1, P3 |
| se rabat sur un code d’appareil après le refus de son code d’enrôlement (faux, expiré, utilisé) | P5     |
| ne présente qu’une fois un code d’enrôlement refusé (faux, expiré, utilisé)                     | P5     |
| attend Retry-After quand il est limité ; s’appaire une fois la limite levée                     | P6     |

Les règles propres au cœur (C1 à C6, la course de P4, I3, les limites) sont prouvées par ses tests
([`tests/modules/satellites/`](https://github.com/nestor-home/nestor/tree/main/tests/modules/satellites),
[`test_gateway.py`](https://github.com/nestor-home/nestor/blob/main/tests/adapters/channels/voice/satellites/test_gateway.py)).

## 10. Historique

- **1.** Première version. Appairage dans les deux sens : codes d’appareil (affichés, dits ou
  journalisés) et codes d’enrôlement (tapés, configurés, scannés) créés par une personne qui ajoute
  un satellite depuis l’administration, avec l’URI d’appairage. Identification, schémas JSON pour
  chaque message, erreurs avec codes, lien temps réel en WebRTC. Les appareils appairés avec le
  brouillon non publié `nestor.satellite/0` ne s’authentifient plus : mettez-les à jour, puis
  appairez-les à nouveau.
