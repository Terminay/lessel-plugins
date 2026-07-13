# lessel Plugins

Community plugin registry for [lessel](https://github.com/Terminay/lessel) — the message pipeline framework.

## Usage

```bash
# Search for plugins
lessel plugin search sentiment

# Install a plugin
lessel plugin install sentiment-analysis

# List installed plugins
lessel plugin list
```

## Submitting a Plugin

1. Fork this repo
2. Create a directory under `plugins/` with your plugin name
3. Add a `plugin.json` manifest and at least one version directory
4. Open a Pull Request

## Plugin Structure

```
plugins/
  your-plugin-name/
    plugin.json           # Manifest
    ˋ1.0.0/                # Version directory
      index.js             # Plugin code
    ˋ1.1.0/
      index.js
```

### plugin.json

```json
{
  "name": "sentiment-analysis",
  "description": "Analyzes message sentiment and adds a sentiment score",
  "author": "your-github-username",
  "repository": "https://github.com/you/your-plugin-repo",
  "schema": ["*"],
  "engines": { "lessel": ">=0.1.0" },
  "tags": ["utility", "nlp"],
  "versions": {
    "1.0.0": { "checksum": "sha256:abc...", "published": "2026-07-12" },
    "1.1.0": { "checksum": "sha256:def...", "published": "2026-07-14" }
  }
}
```

## GitHub Pages

Browse the registry visually at: [https://terminay.github.io/lessel-plugins](https://terminay.github.io/lessel-plugins)