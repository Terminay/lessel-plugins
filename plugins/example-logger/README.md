# example-logger

Logs all matched messages with a custom prefix to help you debug your lessel pipeline.

## Install

```bash
lessel plugin install example-logger
```

## Usage

Add `example-logger` to your `lessel.config.json` plugins list. It will log every message that matches its schema.

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `prefix` | `string` | `[example-logger]` | Log line prefix |
| `includePayload` | `boolean` | `true` | Include full event payload in logs |

## License

MIT