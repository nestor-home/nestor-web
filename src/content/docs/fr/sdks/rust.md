---

title: SDK Rust
description: Écrire un satellite en Rust avec la crate nestor-satellite, ou installer sa commande.
---

La crate [`nestor-satellite`](https://crates.io/crates/nestor-satellite) s’occupe de l’appairage,
du jeton, du manifeste, du lien WebRTC (webrtc-rs, Opus) et de l’audio. Elle ne dépend pas du
serveur Nestor. Il faut Rust 1.91 ou plus récent, un compilateur C et `cmake` pour la construire
(libopus est compilée depuis ses sources) ; sous Linux, la fonctionnalité `audio` demande aussi ALSA
(`apt install libasound2-dev pkg-config`).

```bash
cargo add nestor-satellite --features audio
cargo add tokio --features macros,rt-multi-thread
```

| Fonctionnalité | Ajoute                                                                                                                                                                                  |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| par défaut     | les types du protocole, l’appairage (codes, URI d’appairage, écran, voix, enrôleur), le magasin de jetons, le lien WebRTC, `Body`, les observations, des doublures audio pour les tests |
| `audio`        | `devices::{Microphone, Speaker}`, avec cpal                                                                                                                                             |
| `cli`          | la commande `nestor-satellite` (inclut `audio`)                                                                                                                                         |

## Un pilote minimal

Une enceinte avec un micro et une lumière, appairée une fois, connectée ensuite :

```rust
use nestor_satellite::devices::{Microphone, Speaker};
use nestor_satellite::{
    AUDIO_CAPTURE, AUDIO_PLAYBACK, Behavior, Body, Device, IDENTIFY, Manifest, Satellite, TokenStore,
};

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
    let manifest = Manifest::new(device, [AUDIO_CAPTURE, AUDIO_PLAYBACK, IDENTIFY])?;
    let tokens = TokenStore::new("~/.config/nestor-satellite/enceinte-salon.json");
    let satellite = Satellite::builder("http://nestor.local:7860", manifest, tokens).body(Led);
    satellite.source(Microphone::new()).sink(Speaker::new()).build()?.run().await // pairs once, then reconnects
}
```

Sans code d’enrôlement, il demande un code d’appareil et le dit sur son haut-parleur, chiffre par
chiffre, deux fois, avec des enregistrements (hors ligne, en anglais ou en français), et l’écrit
dans son journal. Avec `NESTOR_PAIRING_URI`, il s’appaire aussitôt.

## Options d’appairage

| Constructeur                                                                                     | Déclare                   |
| ------------------------------------------------------------------------------------------------ | ------------------------- |
| toujours (`.enrollment(Enrollment::parse(…)?)`, ou `NESTOR_PAIRING_URI` / `NESTOR_PAIRING_CODE`) | `enrollment.provisioning` |
| `.display(…)`, un `Display` (`show_code`, `show_message`, `clear`)                               | `device_code.display`     |
| un haut-parleur avec `AUDIO_PLAYBACK` et sans écran, ou `.voice(…)`                              | `device_code.speech`      |
| `.accepts_enrollment(EnrollmentMethod::Input)`                                                   | `enrollment.input`        |

Ce SDK ne pilote aucune caméra : il ne déclare jamais `enrollment.qr`. Un écran qui affiche son
code et accepte les codes tapés sur son clavier :

```rust
use nestor_satellite::{AUDIO_PLAYBACK, Device, Display, EnrollmentMethod, IDENTIFY, Manifest, Satellite, TokenStore};

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
    let manifest = Manifest::new(device, [AUDIO_PLAYBACK, IDENTIFY])?;
    let tokens = TokenStore::new("~/.config/nestor-satellite/ecran-cuisine.json");
    let satellite = Satellite::builder("http://nestor.local:7860", manifest, tokens)
        .display(Screen) // declares device_code.display
        .accepts_enrollment(EnrollmentMethod::Input) // declares enrollment.input
        .build()?;
    let keypad = satellite.enroller();
    std::thread::spawn(move || {
        for typed in std::io::stdin().lines().map_while(Result::ok) {
            if let Err(error) = keypad.enroll(&typed, EnrollmentMethod::Input) {
                eprintln!("{error}"); // not a code, or the device is not waiting for one
            }
        }
    });
    satellite.run().await
}
```

Un code d’enrôlement refusé est dit une fois (journal, écran, voix) et n’est plus jamais envoyé,
même après un redémarrage : le `TokenStore` garde son SHA-256, jamais le code. Les messages aux gens
sont en anglais ou en français (`.language(…)`, sinon `LANG`).

## La commande

Le micro et le haut-parleur de cette machine comme satellite :

```bash
cargo install nestor-satellite --features cli
NESTOR_PAIRING_URI='nestor+http://nestor.local:7860/?code=K7QF2M9X' nestor-satellite run --room salon
# ou
nestor-satellite run --room salon --pairing-uri 'nestor+http://nestor.local:7860/?code=K7QF2M9X'
```

Sans code, `nestor-satellite run --core http://nestor.local:7860 --room salon` dit un code
d’appareil sur le haut-parleur et l’écrit dans le journal. `nestor-satellite devices` liste les
cartes son, `--language fr` parle français, `--null-audio` tourne sans carte son.
`nestor-satellite run --help` donne le reste.

## Pour aller plus loin

- Le code, ses exemples et la licence des enregistrements de voix (CC BY 4.0) :
  [nestor-satellite-rust](https://github.com/nestor-home/nestor-satellite-rust) ; l’API sur
  [docs.rs](https://docs.rs/nestor-satellite).
- Vérifier le vôtre : [Conformité](/fr/docs/satellites/conformance/).
