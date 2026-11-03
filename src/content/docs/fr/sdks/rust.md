---

title: SDK Rust
description: Écrire un satellite en Rust avec la crate nestor-satellite, ou installer sa commande, à voix haute ou par écrit.
---

La crate [`nestor-satellite`](https://crates.io/crates/nestor-satellite) gère l’appairage, le
jeton, le manifeste, le lien et le texte. Elle se construit avec Rust 1.91 ou plus récent et un
compilateur C. L’audio est la fonctionnalité `voice`, qui demande aussi `cmake` ; un appareil qui
ne fait qu’écrire s’en passe.

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

Sous Linux, `audio` demande ALSA (`apt install libasound2-dev pkg-config`).

## Un pilote minimal

Une enceinte avec un micro et une lumière (fonctionnalité `audio`) :

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

Sans code d’enrôlement, il dit un code d’appareil sur son haut-parleur et l’écrit dans son journal :
tapez-le dans l’administration.

## Un écran et un clavier

Un écran de cuisine qui écrit avec l’assistant, sans la fonctionnalité `voice`. Une ligne tapée
avant l’appairage est un code d’enrôlement ; après, un message :

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

Le manifeste décrit le corps et les capteurs (`EXPRESSION`, `IDENTIFY`, `HEAD_MOTION`,
`PERSON_DETECTION`, `SPEECH_ACTIVITY`). Le texte et l’audio découlent du constructeur ; les
déclarer dans le manifeste sans lui fait échouer `build` avec `Error::NotProvided`.

| Constructeur                                                | Déclare                                   |
| ----------------------------------------------------------- | ----------------------------------------- |
| `.text_display(…)`, un `TextDisplay` ou un `Fn(&str, bool)` | `text.display`                            |
| `.text_input()`                                             | `text.input`                              |
| `.source(…)`, un `AudioSource` (`voice`)                    | `audio.capture`                           |
| `.sink(…)`, un `AudioSink` (`voice`)                        | `audio.playback`                          |
| `.null_audio()` (`voice`)                                   | les deux, sans carte son (pour les tests) |

- `satellite.observer().input_text(…)` envoie de 1 à 4 000 caractères tapés. Il renvoie
  `Ok(false)` quand le lien est coupé, et `Error::CapabilityNotAllowed` si le foyer n’a pas autorisé
  `text.input`.
- `last` marque le dernier message d’une réponse.
- `.ice_servers(…)` ne sert qu’au-delà du réseau local.
- `run` renvoie `Error::Replaced` quand un lien plus récent du même appareil prend le relais.
  Sinon, il se reconnecte, ou s’appaire de nouveau si son jeton est refusé.

## Options d’appairage

Les méthodes d’appairage découlent du constructeur.

| Constructeur                                                                                     | Déclare                   |
| ------------------------------------------------------------------------------------------------ | ------------------------- |
| toujours (`.enrollment(Enrollment::parse(…)?)`, ou `NESTOR_PAIRING_URI` / `NESTOR_PAIRING_CODE`) | `enrollment.provisioning` |
| `.display(…)`, un `Display` (`show_code`, `show_message`, `clear`)                               | `device_code.display`     |
| un `.sink(…)` sans écran, ou `.voice(…)`                                                         | `device_code.speech`      |
| `.accepts_enrollment(EnrollmentMethod::Input)`, avec les codes passés à `satellite.enroller()`   | `enrollment.input`        |

- Un code d’enrôlement refusé n’est plus jamais envoyé.
- Ce SDK ne pilote aucune caméra : pas d’`enrollment.qr`.
- `.language(…)` règle la langue dans laquelle il parle (par défaut, `LANG`).

## La commande

`nestor-satellite run` fait de cette machine un satellite, à voix haute ou dans son terminal.
Chaque [version](https://github.com/nestor-home/nestor-satellite-rust/releases) a aussi des
binaires pour macOS et Linux.

```bash
cargo install nestor-satellite --features cli
NESTOR_PAIRING_URI='nestor+http://nestor.local:8471/?code=K7QF2M9X' nestor-satellite run --room salon
# ou
nestor-satellite run --room salon --pairing-uri 'nestor+http://nestor.local:8471/?code=K7QF2M9X'
# par écrit seulement : les lignes tapées sont envoyées, les réponses affichées
nestor-satellite run --core http://nestor.local:8471 --room bureau --text-only
```

- `--text-only` retire le micro, le haut-parleur et WebRTC ; `--text` ajoute l’écrit.
- Sans code, elle dit un code d’appareil.
- `--language fr` parle français. `nestor-satellite devices` liste les cartes son.

`nestor-satellite run --help` détaille le reste.

## Pour aller plus loin

- Le code, ses exemples et la licence des enregistrements de voix :
  [nestor-satellite-rust](https://github.com/nestor-home/nestor-satellite-rust) ; l’API sur
  [docs.rs](https://docs.rs/nestor-satellite).
- Les messages et les codes de fermeture : [Protocole](/fr/docs/satellites/protocol/).
- Vérifier le vôtre : [Conformité](/fr/docs/satellites/conformance/).
