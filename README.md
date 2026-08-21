# Practical G-code for Zed

Practical G-code is an independently authored Zed extension and Tree-sitter grammar for the G-code people edit on real printers and CNC machines. It is not a fork of `ChocolateNao/zed-gcode` or `ChocolateNao/tree-sitter-gcode`.

One extension supplies four selectable language modes backed by one tolerant grammar:

| Language mode | Primary coverage | Default suffixes |
| --- | --- | --- |
| 3D Printer G-code | Marlin, RepRap-style firmware, slicer output, common vendor commands | `.gcode`, `.gco`, `.gc` |
| RepRapFirmware G-code | RRF meta commands, indentation, brace expressions, variables, object-model paths, arrays, strings | `.g`, `.rrf`, `.rrfg` |
| Klipper G-code Config | Klipper sections/options, extended commands, macro parameters, Jinja statements and expressions | `.klipper.cfg`; other Klipper files usually need manual selection (see below) |
| CNC G-code | RS274/NGC and common LinuxCNC/Fanuc constructs, parameters, bracket expressions, O-code flow control | `.nc`, `.ngc`, `.tap`, `.cnc`, and related suffixes |

The parser deliberately accepts unknown extended commands and vendor arguments, and understands space-free compact lines (`N10G01X1.Y1.F100.` splits into its words). Firmware remains the authority on whether a particular command exists and whether its operands are valid; the extension's job is to preserve useful syntax structure and highlighting without breaking the rest of a file.

## RRF support

The grammar handles the constructs that generic RS274 grammars usually miss:

- `var`, `global`, `set`, `if`, `elif`, `else`, `while`, `echo`, and `abort`
- `{...}` expressions in G/M-code operands
- object-model paths such as `move.axes[global.AXIS].machinePosition`
- `var.name` and `global.name` references
- quoted strings, arrays, calls, unary `!`, comparisons, boolean operators, and `^` concatenation
- indented meta-command bodies without requiring a fixed command catalog

The complete `measure_idle_window.g` example is in [`examples/rrf.g`](examples/rrf.g) and is part of the zero-error fixture gate.

## Local development install

The release manifest references a grammar commit in this same repository. Until that commit has been pushed to GitHub, point the manifest at the local clone:

```sh
node scripts/use-local-grammar.mjs
```

This sets both the grammar `repository` and its pinned `rev`. Zed builds the pinned commit, not the working tree, so commit grammar changes before reinstalling the dev extension — the script warns when the grammar has uncommitted changes. Then in Zed run `zed: install dev extension` and select this repository directory. Before committing or publishing the extension manifest, restore the release URL (this also re-pins `rev` and warns if that commit is not fetchable from the release repository):

```sh
node scripts/use-release-grammar.mjs
```

Klipper installations commonly use `printer.cfg`, which is too broad a suffix to claim globally, and Zed's first-line detection only sees line 1 — most real Klipper configs open with comment headers, so detection rarely triggers. The normal path is choosing **Klipper G-code Config** from Zed's language selector or adding a Zed `file_types` setting for the paths used by your printer configuration.

## Development

Tree-sitter CLI 0.25 is used to generate and test the parser:

```sh
npm install
npm run generate
npm test
npm run parse:fixtures
```

The canonical Zed queries live in `queries/`. After changing them, regenerate the four language-mode copies with:

```sh
node scripts/sync-zed-queries.mjs
```

The corpus tests assert stable syntax trees at the grammar interface. The example fixture gate separately rejects every Tree-sitter `ERROR` or missing node across representative RRF, Klipper, Marlin/RepRap, and LinuxCNC files. `npm test` also compiles every query file, verifies the four language-mode query copies match `queries/`, and regenerates the parser so `src/` cannot silently drift from `grammar.js`.

See [`docs/VALIDATION.md`](docs/VALIDATION.md) for the pinned upstream compatibility run — 228 Klipper configs, 570 Duet3D RRF files, and 247 LinuxCNC programs all parse without recovery nodes — reproducible with:

```sh
npm run validate:corpora
```

## Publishing

1. Push this repository to `Randomblock1/zed-gcode`.
2. Run `node scripts/use-release-grammar.mjs` — it points `extension.toml` at the GitHub grammar URL, re-pins `rev` to the latest grammar commit, and warns if that commit is not fetchable from the release repository.
3. Install it as a Zed dev extension and inspect every file in `examples/`.
4. Submit the repository as a submodule under `extensions/practical-gcode` in `zed-industries/extensions`, with version `0.1.0`.

## Design

The grammar is the deep module: its syntax tree is the small interface tested by every dialect fixture. Dialect differences remain named nodes at that interface—RRF statements, Klipper sections/options and Jinja directives, LinuxCNC O-statements—while common commands, operands, comments, and expressions share one implementation. This keeps vendor additions local and avoids four parsers drifting apart.
