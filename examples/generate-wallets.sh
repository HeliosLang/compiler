#!/bin/bash
cardano-cli address key-gen \
  --verification-key-file wallet1.vkey \
  --signing-key-file wallet1.skey
cardano-cli address build \
  --payment-verification-key-file wallet1.vkey \
  --out-file wallet1.addr \
  --testnet-magic $TESTNET_MAGIC_NUM
cat wallet1.addr

cardano-cli address key-gen \
  --verification-key-file wallet2.vkey \
  --signing-key-file wallet2.skey
cardano-cli address build \
  --payment-verification-key-file wallet2.vkey \
  --out-file wallet2.addr \
  --testnet-magic $TESTNET_MAGIC_NUM

cardano-cli address key-gen \
  --verification-key-file wallet3.vkey \
  --signing-key-file wallet3.skey
cardano-cli address build \
  --payment-verification-key-file wallet3.vkey \
  --out-file wallet3.addr \
  --testnet-magic $TESTNET_MAGIC_NUM
