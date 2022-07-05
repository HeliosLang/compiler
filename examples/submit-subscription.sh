#!/bin/bash
set -e

if [ $# -ne 2 ]
then
    echo "expected 2 args"
    exit 1
fi

FUNDING_UTXO=$1
FEE_UTXO=$2

. /data/scripts/generate-subscription-datum.sh
. /data/scripts/generate-subscription-address.sh

TX_BODY=$(mktemp)
cardano-cli transaction build \
  --tx-in $FEE_UTXO \
  --tx-in $FUNDING_UTXO \
  --tx-out $(cat /data/scripts/subscription.addr)+4000000 \
  --change-address $(cat /data/wallets/wallet1.addr) \
  --tx-out-datum-hash $DATUM1_HASH \
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
