#!/bin/bash
cardano-cli query utxo --address $(cat /data/scripts/subscription.addr) --testnet-magic $TESTNET_MAGIC_NUM
