# Part 3 of Plutus-Light how-to guide: Always Succeeds contract
Start a nodejs repl on your development computer, and import the Plutus-Light library:
```bash
$ cd ./plutus-light
$ nodejs
```
```javascript
> var PL; import("./plutus-light.js").then(m=>{PL=m});
```

Compile the Always Succeeds script and take note of the resulting CBOR hex:
```javascript
> console.log(PL.compilePlutusLightProgram("func main() Bool {true}"))

581358110100002223333573464945262498992601
```

Start an interactive shell in the *cardano-node* container and create a JSON file representing the script:
```bash
$ docket exec -it <container-id> bash

> mkdir -p /data/scripts
> cd /data/scripts

> echo '{
  "type": "PlutusScriptV1", 
  "description": "", 
  "cborHex": "581358110100002223333573464945262498992601"
}' > always-succeeds.json

```

Generate the script address:
```bash
> cardano-cli address build \
  --payment-script-file /data/scripts/always-succeeds.json \
  --out-file /data/scripts/always-succeeds.addr \
  --testnet-magic $TESTNET_MAGIC_NUM

> cat /data/scripts/always-succeeds.addr

addr_test1wzlmzvrx48rnk9js2z6c0gnul2063hl2ptadw9cdzvvq7vgy4qmsu
```

We need a datum, which can be chosen arbitrarily in this case:
```bash
> DATUM_HASH=$(cardano-cli transaction hash-script-data --script-data-value "42")
> echo $DATUM_HASH

9e1199a988ba72ffd6e9c269cadb3b53b5f360ff99f112d9b2ee30c4d74ad88b
```

We also need to select some UTXOs as inputs to the transaction. At this point we should have one UTXO sitting in wallet 1. We can query this using the following command:
```bash
> cardano-cli query utxo \
  --address $(cat /data/wallets/wallet1.addr) \
  --testnet-magic $TESTNET_MAGIC_NUM

TxHash             TxIx  Amount
-------------------------------------------------------------
4f3d0716b07d75...  0     1000000000 lovelace + TxOutDatumNone
```
`4f3d...` is the transaction id. The UTXO id in this case is `<tx-id>#0`.

We now have everything we need to build a transaction and submit it.

Let's send 2 tAda (2 million lovelace) to the script address:
```bash
> TX_BODY=$(mktemp)
> cardano-cli transaction build \
  --tx-in <funding-utxo> \
  --tx-out $(cat /data/scripts/always-succeeds.addr)+2000000 \
  --tx-out-datum-hash $DATUM_HASH \
  --change-address $(cat /data/wallets/wallet1.addr) \
  --testnet-magic $TESTNET_MAGIC_NUM \
  --out-file $TX_BODY \
  --babbage-era

Estimated transaction fee: Lovelace 167217

> TX_SIGNED=$(mktemp)
> cardano-cli transaction sign \
  --tx-body-file $TX_BODY \
  --signing-key-file /data/wallets/wallet1.skey \
  --testnet-magic $TESTNET_MAGIC_NUM \
  --out-file $TX_SIGNED

> cardano-cli transaction submit \
  --tx-file $TX_SIGNED \
  --testnet-magic $TESTNET_MAGIC_NUM

Transaction successfully submitted
```

If you check the wallet 1 payment address balance after a few minutes you will noticed that it has decreased by 2 tAda + fee. Note the left-over UTXO id, we will need it to pay fees when retrieving funds.


You can also try to check the balance of the script address:
```bash
> cardano-cli query utxo \
  --address $(cat /data/scripts/always-succeeds.addr) \
  --testnet-magic $TESTNET_MAGIC_NUM

...
```
The table should list at least one UTXO with your specific datum hash.

We can now try and get our funds back from the script by building, signing and submitting another transaction:
```bash
> PARAMS=$(mktemp) # most recent protocol parameters
> cardano-cli query protocol-parameters --testnet-magic $TESTNET_MAGIC_NUM > $PARAMS

> TX_BODY=$(mktemp)
> cardano-cli transaction build \
  --tx-in <fee-utxo> \ # used for tx fee
  --tx-in <script-utxo> \
  --tx-in-datum-value "42" \
  --tx-in-redeemer-value <arbitrary-redeemer-data> \
  --tx-in-script-file /data/scripts/always-succeeds.json \
  --tx-in-collateral <fee-utxo> \ # used for script collateral
  --change-address $(cat /data/wallets/wallet1.addr) \
  --tx-out $(cat /data/wallets/wallet1.addr)+2000000 \
  --out-file $TX_BODY \
  --testnet-magic $TESTNET_MAGIC_NUM \
  --protocol-params-file $PARAMS \
  --babbage-era

Estimated transaction fee: Lovelace 178405

> TX_SIGNED=$(mktemp)
> cardano-cli transaction sign \
  --tx-body-file $TX_BODY \
  --signing-key-file /data/wallets/wallet1.skey \
  --testnet-magic $TESTNET_MAGIC_NUM \
  --out-file $TX_SIGNED

> cardano-cli transaction submit \
  --tx-file $TX_SIGNED \
  --testnet-magic $TESTNET_MAGIC_NUM

Transaction successfully submitted
```

If you now check the balance of wallet 1 you should see two UTXOs, and the total value should be your starting value minus the two fees you paid. 

Note that *collateral* is only paid if you submit to a bad script, but cardano-cli does some checks when building the transaction and should throw an error before you are able to to so.
