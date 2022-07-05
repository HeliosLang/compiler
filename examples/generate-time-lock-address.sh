#!/bin/bash
cardano-cli address build --payment-script-file /data/scripts/time-lock.json --out-file /data/scripts/time-lock.addr --testnet-magic $TESTNET_MAGIC_NUM
