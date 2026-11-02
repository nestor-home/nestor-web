---

title: Rust SDK
description: Write a satellite in Rust with the nestor-satellite crate, or install its command, aloud or in writing.
---

The [`nestor-satellite`](https://crates.io/crates/nestor-satellite) crate handles pairing, the
token, the manifest, the WebSocket link and text. Audio over WebRTC (webrtc-rs, Opus) is the
`voice` feature: a device that only writes builds without it. The crate does not depend on the
Nestor server. Building needs Rust 1.91 or later and a C compiler; the `voice` feature also needs
`cmake` (libopus is built from source), and on Linux the `audio` feature needs ALSA
(`apt install libasound2-dev pkg-config`).

```bash
cargo add nestor-satellite --features audio   # a speaker: WebRTC and the machine's sound card
cargo add nestor-satellite                    # a screen and a keyboard: no WebRTC
cargo add tokio --features macros,rt-multi-thread
```

| Feature | Adds                                                                                                                       |
| ------- | -------------------------------------------------------------------------------------------------------------------------- |
| default | protocol types, pairing (codes, pairing URIs, display, voice, enroller), token store, the link, `Body`, observations, text |
| `voice` | WebRTC audio (Opus) with your own `AudioSource` and `AudioSink`, the device code said aloud                                |
| `audio` | `voice` with `devices::{Microphone, Speaker}`, through cpal                                                                |
| `cli`   | the `nestor-satellite` command (implies `audio`)                                                                           |

## A minimal driver

A speaker with a microphone and a light, paired once, connected from then on (`audio` feature):

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

With no enrollment code, it asks for a device code and says it on its speaker, digit by digit,
twice, with recorded clips (offline, English or French), and logs it. With `NESTOR_PAIRING_URI`
set, it pairs at once.

## A screen and a keyboard

A kitchen screen that talks with the assistant in writing. It shows its device code, takes
enrollment codes typed before it is paired, then sends what is typed and shows the answers. It
builds without the `voice` feature:

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

## Text and audio

The manifest lists the device and what its body and sensors do (`EXPRESSION`, `IDENTIFY`,
`HEAD_MOTION`, `PERSON_DETECTION`, `SPEECH_ACTIVITY`). The text and audio capabilities follow from
the builder. A manifest that declares one without what carries it out fails in `build` with
`Error::NotProvided`.

| Builder                                                 | Declares                           |
| ------------------------------------------------------- | ---------------------------------- |
| `.text_display(…)`, a `TextDisplay` or `Fn(&str, bool)` | `text.display`                     |
| `.text_input()`                                         | `text.input`                       |
| `.source(…)`, an `AudioSource` (`voice`)                | `audio.capture`                    |
| `.sink(…)`, an `AudioSink` (`voice`)                    | `audio.playback`                   |
| `.null_audio()` (`voice`)                               | both, without a sound card (tests) |

- `satellite.observer()` gives an `Observer` that sends typed text with `input_text` (1 to 4,000
  characters) and reports observations. It returns `Ok(false)` while the link is down (nothing is
  queued), and `Error::CapabilityNotAllowed` when the capability was not declared or the household
  did not allow it.
- An answer can come in several messages (the assistant says it is looking, then gives the result);
  `last` marks the last one of a turn. A typed turn is answered in writing when the device shows
  text, aloud otherwise.
- With the `voice` feature, the satellite offers WebRTC only once the core has allowed audio; until
  then, and on a device without audio, everything goes through the link. `.ice_servers(…)` is only
  needed beyond the local network.
- `run` returns `Error::Replaced` when a newer link of the same device takes over (`4409`). A refused
  token (`4401`) is forgotten and the device pairs again; any other close reconnects, waiting longer
  each time.

## Pairing options

| Builder                                                                                        | Declares                  |
| ---------------------------------------------------------------------------------------------- | ------------------------- |
| always (`.enrollment(Enrollment::parse(…)?)`, or `NESTOR_PAIRING_URI` / `NESTOR_PAIRING_CODE`) | `enrollment.provisioning` |
| `.display(…)`, a `Display` (`show_code`, `show_message`, `clear`)                              | `device_code.display`     |
| a `.sink(…)` and no display, or `.voice(…)`                                                    | `device_code.speech`      |
| `.accepts_enrollment(EnrollmentMethod::Input)`, codes handed to `satellite.enroller()`         | `enrollment.input`        |

This SDK drives no camera: it never declares `enrollment.qr`. A device with neither a screen nor a
speaker only logs its device code. A refused enrollment code is said once (log, display, voice) and
never sent again, even after a restart: the `TokenStore` keeps its SHA-256, never the code.
Messages to people are in English or French (`.language(…)`, else `LANG`).

## The command

To use this machine’s microphone and speaker as a satellite, or its terminal:

```bash
cargo install nestor-satellite --features cli
NESTOR_PAIRING_URI='nestor+http://nestor.local:8471/?code=K7QF2M9X' nestor-satellite run --room salon
# or
nestor-satellite run --room salon --pairing-uri 'nestor+http://nestor.local:8471/?code=K7QF2M9X'
# in writing only: lines typed on stdin are sent, the answers printed
nestor-satellite run --core http://nestor.local:8471 --room bureau --text-only
```

Prebuilt binaries for macOS and Linux are attached to each
[release](https://github.com/nestor-home/nestor-satellite-rust/releases). `--text` adds writing to
the voice, `--text-only` drops the microphone, the speaker and WebRTC. Without a code,
`nestor-satellite run --core http://nestor.local:8471 --room salon` says a device code through the
speaker and logs it. `nestor-satellite devices` lists the sound cards, `--language fr` speaks
French, `--null-audio` runs without a sound card. `nestor-satellite run --help` lists the rest.

## Going further

- The source, its examples and the voice clips' licence (CC BY 4.0):
  [nestor-satellite-rust](https://github.com/nestor-home/nestor-satellite-rust); the API on
  [docs.rs](https://docs.rs/nestor-satellite).
- The messages and close codes: [Protocol](/docs/satellites/protocol/).
- Check yours: [Conformance](/docs/satellites/conformance/).
