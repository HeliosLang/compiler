#!/bin/bash

export DATUM1=$(mktemp)
export DATUM2=$(mktemp)

echo '{"constructor": 0, "fields": [{"bytes": "1d22b9ff5fc20bae3b84b8f9434e747c1792b0ea2b0af658a8a76d43"}, {"bytes": "3a1858b50ae22f5eb40bc8cdab12643b6793e9e14f9c7590402d73de"}, {"map": [{"k": {"bytes": ""}, "v": {"map": [{"k": {"bytes": ""}, "v": {"int": 4000000}}]}}]}, {"map": [{"k": {"bytes": ""}, "v": {"map": [{"k": {"bytes": ""}, "v": {"int": 2000000}}]}}]}, {"int": 1656990939419}, {"int": 300000}]}' > $DATUM1

echo '{"constructor": 0, "fields": [{"bytes": "1d22b9ff5fc20bae3b84b8f9434e747c1792b0ea2b0af658a8a76d43"}, {"bytes": "3a1858b50ae22f5eb40bc8cdab12643b6793e9e14f9c7590402d73de"}, {"map": [{"k": {"bytes": ""}, "v": {"map": [{"k": {"bytes": ""}, "v": {"int": 2000000}}]}}]}, {"map": [{"k": {"bytes": ""}, "v": {"map": [{"k": {"bytes": ""}, "v": {"int": 2000000}}]}}]}, {"int": 1656991239419}, {"int": 300000}]}' > $DATUM2

export DATUM1_HASH=$(cardano-cli transaction hash-script-data --script-data-file $DATUM1)
export DATUM2_HASH=$(cardano-cli transaction hash-script-data --script-data-file $DATUM2)
