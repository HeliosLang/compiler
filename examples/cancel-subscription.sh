#!/bin/bash
set -e

if [ $# -ne 2 ]
then
    echo "expected 2 args"
    exit 1
fi

SCRIPT_UTXO=$1
FEE_UTXO=$2

. /data/scripts/generate-subscription-datum.sh
. /data/scripts/generate-subscription-address.sh

PARAMS=$(mktemp)
cardano-cli query protocol-parameters --testnet-magic $TESTNET_MAGIC_NUM > $PARAMS

TX_BODY=$(mktemp)
cardano-cli transaction build \
  --tx-in $FEE_UTXO \
  --tx-in $SCRIPT_UTXO \
  --tx-in-datum-file $DATUM1 \
  --tx-in-redeemer-value "42" \
  --tx-in-script-file /data/scripts/subscription.json \
  --tx-in-collateral $FEE_UTXO \
  --required-signer /data/wallets/wallet1.skey \
  --change-address $(cat /data/wallets/wallet1.addr) \
  --tx-out $(cat /data/wallets/wallet1.addr)+4000000 \
  --out-file $TX_BODY \
  --testnet-magic $TESTNET_MAGIC_NUM \
  --protocol-params-file $PARAMS \
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
