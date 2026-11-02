---

title: SDK Rust
description: Écrire un satellite en Rust avec la crate nestor-satellite, ou installer sa commande, à voix haute ou par écrit.
---

La crate [`nestor-satellite`](https://crates.io/crates/nestor-satellite) s’occupe de l’appairage,
du jeton, du manifeste, du lien WebSocket et du texte. L’audio en WebRTC (webrtc-rs, Opus) est la
fonctionnalité `voice` : un appareil qui ne fait qu’écrire se construit sans elle. La crate ne
dépend pas du serveur Nestor. Il faut Rust 1.91 ou plus récent et un compilateur C pour la
construire ; la fonctionnalité `voice` demande aussi `cmake` (libopus est compilée depuis ses
sources), et sous Linux la fonctionnalité `audio` demande ALSA
(`apt install libasound2-dev pkg-config`).

```bash
cargo add nestor-satellite --features audio   # une enceinte : WebRTC et la carte son de la machine
cargo add nestor-satellite                    # un écran et un clavier : sans WebRTC
cargo add tokio --features macros,rt-multi-thread
```

| Fonctionnalité | Ajoute                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| par défaut     | les types du protocole, l’appairage (codes, URI d’appairage, écran, voix, enrôleur), le magasin de jetons, le lien, `Body`, les observations, le texte |
| `voice`        | l’audio en WebRTC (Opus) avec vos propres `AudioSource` et `AudioSink`, le code d’appareil dit à voix haute                                            |
| `audio`        | `voice` avec `devices::{Microphone, Speaker}`, par cpal                                                                                                |
| `cli`          | la commande `nestor-satellite` (inclut `audio`)                                                                                                        |

## Un pilote minimal

Une enceinte avec un micro et une lumière, appairée une fois, connectée ensuite (fonctionnalité
`audio`) :

```rust
use nestor_satellite::devices::{Microphone, Speaker};
use nestor_satellite::{Behavior, Body, Device, IDENTIFY, Manifest, Satellite, TokenStore};

struct Led;
impl Body for Led {
    fn behavior(&self, behavior: Behavior) {
        println!("attitude: {behavior}"); // light the ring, from a task of its own
    }
    fn identify(&self) {
        println!("blink"); // a person looks for this device: blink for a few seconds
    }
}

#[tokio::main]
async fn main() -> nestor_satellite::Result<()> {
    let device = Device::new("enceinte-salon", "raspberry-pi-4", "salon")?;
    let manifest = Manifest::new(device, [IDENTIFY])?;
    let tokens = TokenStore::new("~/.config/nestor-satellite/enceinte-salon.json");
    let satellite = Satellite::builder("http://nestor.local:8471", manifest, tokens).body(Led);
    // The microphone declares audio.capture, the speaker audio.playback.
    satellite.source(Microphone::new()).sink(Speaker::new()).build()?.run().await // pairs once, then reconnects
}
```

Sans code d’enrôlement, il demande un code d’appareil et le dit sur son haut-parleur, chiffre par
chiffre, deux fois, avec des enregistrements (hors ligne, en anglais ou en français), et l’écrit
dans son journal. Avec `NESTOR_PAIRING_URI`, il s’appaire aussitôt.

## Un écran et un clavier

Un écran de cuisine qui échange par écrit avec l’assistant. Il affiche son code d’appareil, accepte
les codes d’enrôlement tapés avant l’appairage, puis envoie ce qui est tapé et affiche les réponses.
Il se construit sans la fonctionnalité `voice` :

```rust
use nestor_satellite::{Device, Display, EnrollmentMethod, IDENTIFY, Manifest, Satellite, TokenStore};

struct Screen;
impl Display for Screen {
    fn show_code(&self, text: &str, code: &str) {
        println!("{text}\n    {code}"); // draw it large, from a task of its own
    }
    fn show_message(&self, text: &str) {
        println!("{text}"); // a refused enrollment code, in the device's language
    }
    fn clear(&self) {
        println!("paired");
    }
}

#[tokio::main]
async fn main() -> nestor_satellite::Result<()> {
    let device = Device::new("ecran-cuisine", "raspberry-pi-zero", "cuisine")?;
    let manifest = Manifest::new(device, [IDENTIFY])?;
    let tokens = TokenStore::new("~/.config/nestor-satellite/ecran-cuisine.json");
    let satellite = Satellite::builder("http://nestor.local:8471", manifest, tokens)
        .display(Screen) // declares device_code.display
        .accepts_enrollment(EnrollmentMethod::Input) // declares enrollment.input
        .text_display(|text: &str, _last: bool| println!("> {text}")) // declares text.display
        .text_input() // declares text.input
        .build()?;
    let (keypad, keyboard) = (satellite.enroller(), satellite.observer());
    std::thread::spawn(move || {
        for typed in std::io::stdin().lines().map_while(Result::ok) {
            // Before pairing, a line is an enrollment code; once paired, a message to the assistant.
            let sent = if keypad.is_pairing() {
                keypad.enroll(&typed, EnrollmentMethod::Input)
            } else {
                keyboard.input_text(&typed).map(|_connected| ())
            };
            if let Err(error) = sent {
                eprintln!("{error}");
            }
        }
    });
    satellite.run().await
}
```

## Texte et audio

Le manifeste décrit l’appareil et ce que font son corps et ses capteurs (`EXPRESSION`, `IDENTIFY`,
`HEAD_MOTION`, `PERSON_DETECTION`, `SPEECH_ACTIVITY`). Les capacités de texte et d’audio découlent
du constructeur. Un manifeste qui en déclare une sans ce qui la réalise échoue dans `build` avec
`Error::NotProvided`.

| Constructeur                                                | Déclare                                   |
| ----------------------------------------------------------- | ----------------------------------------- |
| `.text_display(…)`, un `TextDisplay` ou un `Fn(&str, bool)` | `text.display`                            |
| `.text_input()`                                             | `text.input`                              |
| `.source(…)`, un `AudioSource` (`voice`)                    | `audio.capture`                           |
| `.sink(…)`, un `AudioSink` (`voice`)                        | `audio.playback`                          |
| `.null_audio()` (`voice`)                                   | les deux, sans carte son (pour les tests) |

- `satellite.observer()` donne un `Observer` qui envoie le texte tapé avec `input_text` (de 1 à
  4 000 caractères) et signale les observations. Il renvoie `Ok(false)` quand le lien est coupé
  (rien n’est mis en attente) et `Error::CapabilityNotAllowed` si la capacité n’a pas été déclarée
  ou si le foyer ne l’a pas autorisée.
- Une réponse peut arriver en plusieurs messages (l’assistant dit qu’il cherche, puis donne le
  résultat) ; `last` marque le dernier d’un tour. Un tour tapé reçoit une réponse écrite si
  l’appareil affiche du texte, à voix haute sinon.
- Avec la fonctionnalité `voice`, le satellite ne propose WebRTC qu’une fois l’audio autorisé par le
  cœur ; d’ici là, et sur un appareil sans audio, tout passe par le lien. `.ice_servers(…)` ne
  sert qu’au-delà du réseau local.
- `run` renvoie `Error::Replaced` quand un lien plus récent du même appareil prend le relais
  (`4409`). Un jeton refusé (`4401`) est oublié et l’appareil s’appaire de nouveau ; toute autre
  fermeture mène à une reconnexion, avec une attente qui s’allonge.

## Options d’appairage

| Constructeur                                                                                     | Déclare                   |
| ------------------------------------------------------------------------------------------------ | ------------------------- |
| toujours (`.enrollment(Enrollment::parse(…)?)`, ou `NESTOR_PAIRING_URI` / `NESTOR_PAIRING_CODE`) | `enrollment.provisioning` |
| `.display(…)`, un `Display` (`show_code`, `show_message`, `clear`)                               | `device_code.display`     |
| un `.sink(…)` sans écran, ou `.voice(…)`                                                         | `device_code.speech`      |
| `.accepts_enrollment(EnrollmentMethod::Input)`, avec les codes passés à `satellite.enroller()`   | `enrollment.input`        |

Ce SDK ne pilote aucune caméra : il ne déclare jamais `enrollment.qr`. Un appareil sans écran ni
haut-parleur se contente d’écrire son code d’appareil dans le journal. Un code d’enrôlement refusé
est dit une fois (journal, écran, voix) et n’est plus jamais envoyé, même après un
redémarrage : le `TokenStore` garde son SHA-256, jamais le code. Les messages aux gens sont en
anglais ou en français (`.language(…)`, sinon `LANG`).

## La commande

Pour faire de cette machine un satellite, avec son micro et son haut-parleur, ou avec son
terminal :

```bash
cargo install nestor-satellite --features cli
NESTOR_PAIRING_URI='nestor+http://nestor.local:8471/?code=K7QF2M9X' nestor-satellite run --room salon
# ou
nestor-satellite run --room salon --pairing-uri 'nestor+http://nestor.local:8471/?code=K7QF2M9X'
# par écrit seulement : les lignes tapées sont envoyées, les réponses affichées
nestor-satellite run --core http://nestor.local:8471 --room bureau --text-only
```

Des binaires précompilés pour macOS et Linux sont joints à chaque
[version](https://github.com/nestor-home/nestor-satellite-rust/releases). `--text` ajoute l’écrit à
la voix, `--text-only` retire le micro, le haut-parleur et WebRTC. Sans code,
`nestor-satellite run --core http://nestor.local:8471 --room salon` dit un code d’appareil sur le
haut-parleur et l’écrit dans le journal. `nestor-satellite devices` liste les cartes son,
`--language fr` parle français, `--null-audio` tourne sans carte son. `nestor-satellite run --help`
détaille les autres options.

## Pour aller plus loin

- Le code, ses exemples et la licence des enregistrements de voix (CC BY 4.0) :
  [nestor-satellite-rust](https://github.com/nestor-home/nestor-satellite-rust) ; l’API sur
  [docs.rs](https://docs.rs/nestor-satellite).
- Les messages et les codes de fermeture : [Protocole](/fr/docs/satellites/protocol/).
- Vérifier le vôtre : [Conformité](/fr/docs/satellites/conformance/).
