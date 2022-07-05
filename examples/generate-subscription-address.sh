#!/bin/bash
cardano-cli address build --payment-script-file /data/scripts/subscription.json --out-file /data/scripts/subscription.addr --testnet-magic $TESTNET_MAGIC_NUM
