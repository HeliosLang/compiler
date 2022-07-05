#!/bin/bash

export DATUM=$(mktemp)

echo '{"constructor": 0, "fields": [{"int": 1656543694024}, {"bytes": "1d22b9ff5fc20bae3b84b8f9434e747c1792b0ea2b0af658a8a76d43"}, {"int": 42}]}' > $DATUM


export DATUM_HASH=$(cardano-cli transaction hash-script-data --script-data-file $DATUM)
