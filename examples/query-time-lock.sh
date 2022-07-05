#!/bin/bash
cardano-cli query utxo --address $(cat /data/scripts/time-lock.addr) --testnet-magic $TESTNET_MAGIC_NUM
