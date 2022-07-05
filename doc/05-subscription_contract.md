# Part 5 of Plutus-Light how-to guide: Subscription contract
A subscription contract allows a beneficiary to withdraw a pre-specified amount from a script address at regular intervals.
The owner can cancel the contract at any time.

This contract can alternatively be called an 'allowance' contract.

## The script
```golang
data Datum {
    owner            PubKeyHash,
    beneficiary      PubKeyHash,
    total            Value, // remaining Value locked in script
    benefit          Value, 
    after            Time,  // must be incremented by 'interval' every time beneficiary withdraws
    interval         Duration
}

func main(datum Datum, ctx ScriptContext) Bool {
    tx Tx = getTx(ctx);

    if (isTxSignedBy(tx, datum.owner)) {
        true
    } else if (isTxSignedBy(tx, datum.beneficiary)) {
        now Time = getTimeRangeStart(getTxTimeRange(tx));
        if (now >= datum.after) {
             if (datum.benefit >= datum.total) {
                true
             } else {
                currentHash ValidatorHash = getCurrentValidatorHash(ctx);

                expectedRemaining Value = datum.total - datum.benefit;

                expectedDatum Datum = Datum{
                    owner:       datum.owner,
                    beneficiary: datum.beneficiary,
                    total:       expectedRemaining,
                    benefit:     datum.benefit,
                    after:       datum.after + datum.interval,
                    interval:    datum.interval
                };

                actualRemaining Value = valueLockedByDatum(tx, currentHash, expectedDatum);

                if (trace("actualRemaining: "  + show(getValueComponent(actualRemaining, AssetClass(#, "")))   + " lovelace", actualRemaining) >= 
                    trace("expectedRemaining " + show(getValueComponent(expectedRemaining, AssetClass(#, ""))) + " lovelace", expectedRemaining))
                {
                    true
                } else {
                    trace("too much", false)
                }
             }
        } else {
            trace("too soon", false)
        }
    } else {
        trace("unauthorized", false)
    }
}
```

We will use the `PubKeyHash` of wallet 2 as the beneficiary:
```bash
$ docker exec -it <container-id> bash

> cardano-cli address key-hash --payment-verification-key-file /data/wallets/wallet2.vkey
```

We can generate the datum similarly to the Time Lock example.

Now let's send 4 tAda to the script address using the datum we just generated:
```bash
$ docker exec -it <container-id> bash

> cardano-cli query utxo \
  --address $(cat /data/wallets/wallet1.addr) \
  --testnet-magic $TESTNET_MAGIC_NUM

...
# take note of a UTXO big enough to cover 2 tAda + fees

> DATUM1=$(mktemp)
> echo '{"constructor": 0, ...}' > $DATUM1

> DATUM1_HASH=$(cardano-cli transaction hash-script-data --script-data-file $DATUM1)

> TX_BODY=$(mktemp)
> cardano-cli transaction build \
  --tx-in <funding-utxo> \
  --tx-out $(cat /data/scripts/subscription.addr)+4000000 \
  --tx-out-datum-hash $DATUM1_HASH \
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

As before, query the script address until we see the UTXO appear:
```bash
> cardano-cli query utxo --address $(cat /data/scripts/subscription.addr) --testnet-magic $TESTNET_MAGIC_NUM
```

First we will try to retrieve all the funds using wallet 1:
```bash
> PARAMS=$(mktemp) # most recent protocol params
> cardano-cli query protocol-parameters --testnet-magic $TESTNET_MAGIC_NUM > $PARAMS

> TX_BODY=$(mktemp)
> cardano-cli transaction build \
  --tx-in <fee-utxo> \ # used for tx fee
  --tx-in <script-utxo \
  --tx-in-datum-file $DATUM1 \
  --tx-in-redeemer-value <arbitrary-redeemer-data> \
  --tx-in-script-file /data/scripts/subscription.json \
  --tx-in-collateral <fee-utxo> \ # used for script collateral
  --invalid-before <current-slot-no> \
  --required-signer /data/wallets/wallet1.skey \
  --change-address $(cat /data/wallets/wallet1.addr) \
  --tx-out $(cat /data/wallets/wallet1.addr)+4000000 \
  --out-file $TX_BODY \
  --testnet-magic $TESTNET_MAGIC_NUM \
  --protocol-params-file $PARAMS \
  --babbage-era

Estimated transaction fee: Lovelace ...

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

Next we need to test a beneficiary withdrawing from the subscription (doing this too soon, or with too much money, or with a wrong signature should fail the transaction):
```bash
> PARAMS=$(mktemp) # most recent protocol params
> cardano-cli query protocol-parameters --testnet-magic $TESTNET_MAGIC_NUM > $PARAMS

> TX_BODY=$(mktemp)
> cardano-cli transaction build \
  --tx-in <fee-utxo> \ # used for tx fee
  --tx-in <script-utxo> \
  --tx-in-datum-file $DATUM1 \
  --tx-in-redeemer-value <arbitrary-redeemer-data> \
  --tx-in-script-file /data/scripts/subscription.json \
  --tx-in-collateral <fee-utxo> \ # used for script collateral
  --invalid-before <current-slot-no> \
  --required-signer /data/wallets/wallet2.skey \
  --change-address $(cat /data/wallets/wallet2.addr) \
  --tx-out $(cat /data/wallets/wallet2.addr)+2000000 \
  --tx-out $(cat /data/scripts/subscription.addr)+2000000 \
  --tx-out-datum-embed-file $DATUM2 \
  --out-file $TX_BODY \
  --testnet-magic $TESTNET_MAGIC_NUM \
  --protocol-params-file $PARAMS \
  --babbage-era

Estimated transaction fee: Lovelace ...

> TX_SIGNED=$(mktemp)
> cardano-cli transaction sign \
  --tx-body-file $TX_BODY \
  --signing-key-file /data/wallets/wallet2.skey \
  --testnet-magic $TESTNET_MAGIC_NUM \
  --out-file $TX_SIGNED

> cardano-cli transaction submit \
  --tx-file $TX_SIGNED \
  --testnet-magic $TESTNET_MAGIC_NUM

Transaction successfully submitted
``` 