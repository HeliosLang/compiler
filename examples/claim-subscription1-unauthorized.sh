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

echo "DATUM1: $(cat $DATUM1)"
echo "DATUM2: $(cat $DATUM2)"

TX_BODY=$(mktemp)
cardano-cli transaction build \
  --tx-in $FEE_UTXO \
  --tx-in $SCRIPT_UTXO \
  --tx-in-datum-file $DATUM1 \
  --tx-in-redeemer-value "42" \
  --tx-in-script-file /data/scripts/subscription.json \
  --tx-in-collateral $FEE_UTXO \
  --invalid-before $(/data/scripts/query-slot-no.sh) \
  --required-signer /data/wallets/wallet3.skey \
  --change-address $(cat /data/wallets/wallet3.addr) \
  --tx-out $(cat /data/wallets/wallet3.addr)+2000000 \
  --tx-out $(cat /data/scripts/subscription.addr)+2000000 \
  --tx-out-datum-embed-file $DATUM2 \
  --testnet-magic $TESTNET_MAGIC_NUM \
  --protocol-params-file $PARAMS \
  --babbage-era \
  --out-file $TX_BODY

TX_SIGNED=$(mktemp)
cardano-cli transaction sign \
  --tx-body-file $TX_BODY \
  --signing-key-file /data/wallets/wallet3.skey \
  --testnet-magic $TESTNET_MAGIC_NUM \
  --out-file $TX_SIGNED

cardano-cli transaction submit \
  --tx-file $TX_SIGNED \
  --testnet-magic $TESTNET_MAGIC_NUM
