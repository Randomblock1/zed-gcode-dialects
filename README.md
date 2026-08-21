# G-code Dialects

A Zed extension for the G-code people edit on real printers and CNC machines, backed by the [tree-sitter-gcode-dialects](https://github.com/Randomblock1/tree-sitter-gcode-dialects) grammar. It is independently authored, not a fork of `ChocolateNao/zed-gcode`.

One extension supplies four selectable language modes backed by one tolerant grammar:

| Language mode | Primary coverage | Default suffixes |
| --- | --- | --- |
| 3D Printer G-code | Marlin, RepRap-style firmware, slicer output, common vendor commands | `.gcode`, `.gco`, `.gc`, `.bfb` |
| RepRapFirmware G-code | RRF meta commands, indentation, brace expressions, variables, object-model paths, arrays, strings | `.g`, `.rrf`, `.rrfg` |
| Klipper G-code Config | Klipper sections/options, extended commands, macro parameters, Jinja statements and expressions | `.klipper.cfg`; other Klipper files usually need manual selection (see below) |
| CNC G-code | RS274/NGC and common LinuxCNC/Fanuc constructs, parameters, bracket expressions, O-code flow control | `.nc`, `.ngc`, `.tap`, `.cnc`, and related suffixes |

The parser deliberately accepts unknown extended commands and vendor arguments, and understands space-free compact lines (`N10G01X1.Y1.F100.` splits into its words). Firmware remains the authority on whether a particular command exists and whether its operands are valid; the extension's job is to preserve useful syntax structure and highlighting without breaking the rest of a file. Grammar internals, dialect coverage details, and the pinned upstream validation runs live in the grammar repository.

Klipper installations commonly use `printer.cfg`, which is too broad a suffix to claim globally, and Zed's first-line detection only sees line 1 — most real Klipper configs open with comment headers, so detection rarely triggers. The normal path is choosing **Klipper G-code Config** from Zed's language selector or adding a Zed `file_types` setting for the paths used by your printer configuration.

## Local development install

Zed builds the grammar from the `repository`/`rev` pin in `extension.toml`, never from a working tree. To develop against a local grammar checkout, clone [tree-sitter-gcode-dialects](https://github.com/Randomblock1/tree-sitter-gcode-dialects) as a sibling of this repository (or set `GCODE_GRAMMAR_DIR` to its path), then:

```sh
node scripts/use-local-grammar.mjs
```

This points the manifest at the local clone via a `file://` URL and pins `rev` to its `HEAD` — commit grammar changes before reinstalling the dev extension; the script warns when the checkout is dirty. Then in Zed run `zed: install dev extension` and select this repository directory. Before committing or publishing the extension manifest, restore the release URL (this re-pins `rev` and warns if that commit is not fetchable from the release repository):

```sh
node scripts/use-release-grammar.mjs
```

The four language modes share their query files. They are canonical in the grammar repository's `queries/`; after changing them there, regenerate the copies here with:

```sh
node scripts/sync-zed-queries.mjs
```

## Publishing

1. Push the grammar repository and make it public — the extension registry's CI (and any other user's dev build) fetches `rev` anonymously, so a private grammar repository will fail to build.
2. Run `node scripts/use-release-grammar.mjs` against the grammar checkout being released.
3. Install as a Zed dev extension and inspect the grammar repository's `examples/` files in each language mode.
4. Submit this repository as a submodule under `extensions/gcode-dialects` in `zed-industries/extensions`. The registry's existing `gcode` extension (`ChocolateNao/zed-gcode`) is a separate entry; this one is `gcode-dialects`.
