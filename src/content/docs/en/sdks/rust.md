---

title: Rust SDK
description: Write a satellite in Rust with the nestor-satellite crate, or install its command.
---

The [`nestor-satellite`](https://crates.io/crates/nestor-satellite) crate handles pairing, the
token, the manifest, the WebRTC link (webrtc-rs, Opus) and audio. It does not depend on the Nestor
server. Building needs Rust 1.91 or later, a C compiler and `cmake` (libopus is built from source);
on Linux, the `audio` feature also needs ALSA (`apt install libasound2-dev pkg-config`).

```bash
cargo add nestor-satellite --features audio
cargo add tokio --features macros,rt-multi-thread
```

| Feature | Adds                                                                                                                                                |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| default | protocol types, pairing (codes, pairing URIs, display, voice, enroller), token store, the WebRTC link, `Body`, observations, test doubles for audio |
| `audio` | `devices::{Microphone, Speaker}`, through cpal                                                                                                      |
| `cli`   | the `nestor-satellite` command (implies `audio`)                                                                                                    |

## A minimal driver

A speaker with a microphone and a light, paired once, connected from then on:

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

With no enrollment code, it asks for a device code and says it on its speaker, digit by digit,
twice, with recorded clips (offline, English or French), and logs it. With `NESTOR_PAIRING_URI`
set, it pairs at once.

## Pairing options

| Builder                                                                                        | Declares                  |
| ---------------------------------------------------------------------------------------------- | ------------------------- |
| always (`.enrollment(Enrollment::parse(…)?)`, or `NESTOR_PAIRING_URI` / `NESTOR_PAIRING_CODE`) | `enrollment.provisioning` |
| `.display(…)`, a `Display` (`show_code`, `show_message`, `clear`)                              | `device_code.display`     |
| a sink with `AUDIO_PLAYBACK` and no display, or `.voice(…)`                                    | `device_code.speech`      |
| `.accepts_enrollment(EnrollmentMethod::Input)`                                                 | `enrollment.input`        |

This SDK drives no camera: it never declares `enrollment.qr`. A screen that shows its code and
takes codes typed on its keypad:

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

A refused enrollment code is said once (log, display, voice) and never sent again, even after a
restart: the `TokenStore` keeps its SHA-256, never the code. Messages to people are in English or
French (`.language(…)`, else `LANG`).

## The command

This machine’s microphone and speaker as a satellite:

```bash
cargo install nestor-satellite --features cli
NESTOR_PAIRING_URI='nestor+http://nestor.local:7860/?code=K7QF2M9X' nestor-satellite run --room salon
# or
nestor-satellite run --room salon --pairing-uri 'nestor+http://nestor.local:7860/?code=K7QF2M9X'
```

Without a code, `nestor-satellite run --core http://nestor.local:7860 --room salon` says a device
code through the speaker and logs it. `nestor-satellite devices` lists the sound cards,
`--language fr` speaks French, `--null-audio` runs without a sound card. `nestor-satellite run
--help` lists the rest.

## Going further

- The source, its examples and the voice clips' licence (CC BY 4.0):
  [nestor-satellite-rust](https://github.com/nestor-home/nestor-satellite-rust); the API on
  [docs.rs](https://docs.rs/nestor-satellite).
- Check yours: [Conformance](/docs/satellites/conformance/).
