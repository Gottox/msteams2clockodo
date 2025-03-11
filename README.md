# msteams2clockodo

This script reads JSON objects from the clipboard and imports meeting appointments into Clockodo.

## Usage

Install the dependencies:

```bash
yarn
```

set the CLOCKODO_API credentials in the environment variables:

```bash
export CLOCKODO_API=<username>:<api-key>
```

Then copy the JSON object from the MS Teams calendar using devtools

run the script.

```bash
yarn start
```
