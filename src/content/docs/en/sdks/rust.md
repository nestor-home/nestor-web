---

title: Rust SDK
description: Write a satellite in Rust with the nestor-satellite crate, or install its command, aloud or in writing.
---

The [`nestor-satellite`](https://crates.io/crates/nestor-satellite) crate handles pairing, the
token, the manifest, the link and text. It builds with Rust 1.91 or later and a C compiler. Audio
is the `voice` feature, which also needs `cmake`; a device that only writes skips it.

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

On Linux, `audio` needs ALSA (`apt install libasound2-dev pkg-config`).

## A minimal driver

A speaker with a microphone and a light (`audio` feature):

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

Without an enrollment code, it says a device code on its speaker and logs it: type it in the admin.

## A screen and a keyboard

A kitchen screen that writes with the assistant, without the `voice` feature. A line typed before
pairing is an enrollment code; after, a message:

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

The manifest lists the body and sensors (`EXPRESSION`, `IDENTIFY`, `HEAD_MOTION`,
`PERSON_DETECTION`, `SPEECH_ACTIVITY`). Text and audio follow from the builder; declaring them in
the manifest without it fails `build` with `Error::NotProvided`.

| Builder                                                 | Declares                           |
| ------------------------------------------------------- | ---------------------------------- |
| `.text_display(…)`, a `TextDisplay` or `Fn(&str, bool)` | `text.display`                     |
| `.text_input()`                                         | `text.input`                       |
| `.source(…)`, an `AudioSource` (`voice`)                | `audio.capture`                    |
| `.sink(…)`, an `AudioSink` (`voice`)                    | `audio.playback`                   |
| `.null_audio()` (`voice`)                               | both, without a sound card (tests) |

- `satellite.observer().input_text(…)` sends 1 to 4,000 typed characters. It returns `Ok(false)`
  while the link is down, and `Error::CapabilityNotAllowed` if the household did not allow
  `text.input`.
- `last` marks the last message of an answer.
- `.ice_servers(…)` is needed only beyond the local network.
- `run` returns `Error::Replaced` when a newer link of the same device takes over. Otherwise it
  reconnects, or pairs again if its token is refused.

## Pairing options

Pairing methods follow from the builder.

| Builder                                                                                        | Declares                  |
| ---------------------------------------------------------------------------------------------- | ------------------------- |
| always (`.enrollment(Enrollment::parse(…)?)`, or `NESTOR_PAIRING_URI` / `NESTOR_PAIRING_CODE`) | `enrollment.provisioning` |
| `.display(…)`, a `Display` (`show_code`, `show_message`, `clear`)                              | `device_code.display`     |
| a `.sink(…)` and no display, or `.voice(…)`                                                    | `device_code.speech`      |
| `.accepts_enrollment(EnrollmentMethod::Input)`, codes handed to `satellite.enroller()`         | `enrollment.input`        |

- A refused enrollment code is never sent again.
- This SDK drives no camera, so no `enrollment.qr`.
- `.language(…)` sets the language it speaks (default: `LANG`).

## The command

`nestor-satellite run` turns this machine into a satellite, aloud or in its terminal. Each
[release](https://github.com/nestor-home/nestor-satellite-rust/releases) also has binaries for macOS
and Linux.

```bash
cargo install nestor-satellite --features cli
NESTOR_PAIRING_URI='nestor+http://nestor.local:8471/?code=K7QF2M9X' nestor-satellite run --room salon
# or
nestor-satellite run --room salon --pairing-uri 'nestor+http://nestor.local:8471/?code=K7QF2M9X'
# in writing only: lines typed on stdin are sent, the answers printed
nestor-satellite run --core http://nestor.local:8471 --room bureau --text-only
```

- `--text-only` drops the microphone, the speaker and WebRTC; `--text` adds writing.
- Without a code, it says a device code.
- `--language fr` speaks French. `nestor-satellite devices` lists the sound cards.

`nestor-satellite run --help` lists the rest.

## Going further

- The source, its examples and the voice clips' licence:
  [nestor-satellite-rust](https://github.com/nestor-home/nestor-satellite-rust); the API on
  [docs.rs](https://docs.rs/nestor-satellite).
- Messages and close codes: [Protocol](/docs/satellites/protocol/).
- Check yours: [Conformance](/docs/satellites/conformance/).
