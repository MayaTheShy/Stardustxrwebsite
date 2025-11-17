# Command-Line Arguments

## Stardust XR Server (`server`)
Run with: `cargo run --release -- [OPTIONS]`

**Available launch arguments:**

- `-f`, `--force-flatscreen` — Force flatscreen mode and use the mouse pointer as a 3D pointer
- `-s`, `--spectator` — Replace flatscreen mode with a first person spectator camera
- `-t`, `--transparent-flatscreen` — Create a transparent window for flatscreen mode
- `--disable-controllers` — Disable controller emulation (raw input only)
- `--disable-hands` — Disable hand emulation (raw input only)
- `--transparent-hands` — Make hands fully transparent for passthrough
- `--disable-pipelined-rendering` — Disable pipelined rendering (may decrease performance)
- `-o`, `--overlay <PRIORITY>` — Run as an overlay with given priority
- `-d`, `--debug` — Debug clients started by the server
- `-e`, `--execute-startup-script <PATH>` — Run a script when ready for clients to connect (overrides default startup script)
- `--restore <SESSION_ID>` — Restore a session by ID (or `latest`), ignoring the startup script

---

## Armillary
Run with: `cargo run -- <MODEL_FILE>`

**Argument:**
- `<MODEL_FILE>` — Path to a 3D model file to view (e.g., `.glb`, `.gltf`, `.obj`, `.stl`, `.ply`)

---

## Atmosphere
Run with: `cargo run -- <COMMAND> [ARGS]`

**Subcommands:**
- `list` — List available environments
- `install <PATH>` — Install an environment from a folder
- `set-default <ENV_NAME>` — Set the default environment
- `show [ENV_NAME]` — Show the current or specified environment

---

## Flatland, Black Hole, Hexagon Launcher, App Grid, Sirius, Absolute Solver
- These are typically launched without special arguments, or with a path to a `.desktop` file or directory in the case of some launchers.
- For example, `single` (Protostar) takes a `.desktop` file path:  
  `cargo run -- <DESKTOP_FILE>`
- Sirius:  
  `cargo run -- <APPS_DIRECTORY>`

---
# Launch Options for StardustXR

This page documents the various ways to launch and run components of the StardustXR project, including scripts, binaries, and desktop entries. It also highlights other pertinent information for getting started.

## 1. Launch Scripts

- **stardustxr_setup.sh**
  - Located at the root of the repository.
  - Prepares the environment for StardustXR. Run with:
    ```sh
    ./stardustxr_setup.sh
    ```
- **startup.sh**
  - Also at the root. Used to start StardustXR services or applications.
    ```sh
    ./startup.sh
    ```

## 2. Desktop Entry

- **stardust-xr-server.desktop**
  - Found in `server/`.
  - Allows launching the Stardust XR Server from a desktop environment.
  - To install:
    1. Copy to your local applications directory:
       ```sh
       cp server/stardust-xr-server.desktop ~/.local/share/applications/
       ```
    2. It should now appear in your application launcher.

## 3. Cargo Binaries

Each Rust project (e.g., `server`, `flatland`, `Armillary`, `atmosphere`, `black-hole`, `absolute-solver`, `protostar`, `sphereland`, `comet`) can be built and run using Cargo:

```sh
cd <project-folder>
cargo run --release
```

Or build all at once from the root:

```sh
cargo build --release --workspace
```

## 4. Nix/Flake Support

Many subprojects include `flake.nix` for reproducible builds:

```sh
nix develop
# or
nix build
```

## 5. Additional Notes

- See each subproject's `README.md` for project-specific instructions.
- The `website/` folder contains this documentation and can be served as a static site.
- For developer setup, see the main `README.md` and `docs/` for guides on OpenXR, Quest 3 setup, and more.

---

For more details, visit the [User Guide](../docs/02-User-Guide/01-What-is-Stardust.md) and [Dive Deeper](../docs/03-dive-deeper/01-brief-overview.md) sections.