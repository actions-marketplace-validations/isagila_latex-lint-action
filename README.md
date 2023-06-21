# Latex Lint

GitHub Action for detecting lint errors in LaTeX

## General

Yet another GH Action for linting LaTeX. Inspired (and almost fully based on) by [lint-action](https://github.com/wearerequired/lint-action/tree/master) and [chktex-action](https://github.com/j2kun/chktex-action).

This extension uses chktex at the background. Also note that you should give
`checks` permissions for this action.

## Usage

Now only two options supported:

- `working_directory`: Directory where action should start (if you have `.chktexrc`, it should located here)

- `files`: List of .tex files separated by commas which should be linted

## Example

```
name: Lint

on:
  pull_request:
    branches: ["main"]

jobs:
  lint:
    runs-on: ubuntu-latest
    permissions:
      checks: write
      contents: write

    steps:
      - uses: actions/checkout@v3

      - name: Lint LaTeX
        uses: isagila/latex-lint-action@main
        with:
          working_directory: ./src
          files: main.tex
```
