#!/bin/bash
cardano-cli query utxo --address $(cat /data/wallets/wallet2.addr) --testnet-magic $TESTNET_MAGIC_NUM
