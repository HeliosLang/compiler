#!/bin/bash
set -e

if [ $# -ne 1 ]
then
    echo "expected 1 arg"
    exit 1
fi

FUNDING_UTXO=$1

. /data/scripts/generate-time-lock-datum.sh
. /data/scripts/generate-time-lock-address.sh

TX_BODY=$(mktemp)
cardano-cli transaction build \
  --tx-in $FUNDING_UTXO \
  --tx-out $(cat /data/scripts/time-lock.addr)+2000000 \
  --change-address $(cat /data/wallets/wallet1.addr) \
  --tx-out-datum-hash $DATUM_HASH \
  --testnet-magic $TESTNET_MAGIC_NUM \
  --out-file $TX_BODY \
  --babbage-era

TX_SIGNED=$(mktemp)
cardano-cli transaction sign \
  --tx-body-file $TX_BODY \
  --signing-key-file /data/wallets/wallet1.skey \
  --testnet-magic $TESTNET_MAGIC_NUM \
  --out-file $TX_SIGNED

cardano-cli transaction submit \
  --tx-file $TX_SIGNED \
  --testnet-magic $TESTNET_MAGIC_NUM
