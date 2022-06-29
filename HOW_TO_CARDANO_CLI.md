# How to use Plutus-Light with cardano-cli
You will need a Linux environment with *docker* for this.

## *cardano-node* setup
Start a *cardano-node* docker container:
```bash
$ docker run -d \
  -e NETWORK=testnet \
  -e TESTNET_MAGIC_NUM=1097911063 \
  -e CARDANO_NODE_SOCKET_PATH=/ipc/node.socket \
  -v cardano-testnet-data:/data \
  inputoutput/cardano-node:latest
```

This command will automatically download the latest *cardano-node* image, and create a named docker volume for storing the blockchain state.

Check that the *cardano-node* container is running using the following command:
```bash
$ docker ps
```
Take note of the container id.

You can stop the container any time:
```bash
$ docker stop <container-id>
```
I recommend using `docker stop` and not `docker rm -f` as it allows *cardano-node* processes to receive the more graceful `SIGTERM` signal (instead of just `SIGKILL`).

You can clean up stopped containers if you are running low on system resources:
```bash
$ docker system prune
```

About 30 seconds after starting the *cardano-node* container, `/ipc/node.socket` should've been created and you can start using `cardano-cli` to query the blockchain.

Check the blockchain synchronization status using the following command:
```bash
$ docker exec <container-id> cardano-cli query tip --testnet-magic 1097911063
```

It can take up to 10 hours for your *cardano-node* to fully synchronize.

## Wallet setup and funding
Start an interactive shell in the *cardano-node* container:
```bash
$ docker exec -it <container-id> bash
```

Create the directory where we will store the wallet keys:
```bash
> mkdir -p /data/wallets
```

Create two wallets, each with an associated payment address:
```bash
> cd /data/wallets

> cardano-cli address key-gen \
  --verification-key-file wallet1.vkey \
  --signing-key-file wallet1.skey
> cardano-cli address build \
  --payment-verification-key-file wallet1.vkey \
  --out-file wallet1.addr \
  --testnet-magic $TESTNET_MAGIC_NUM
> cat wallet1.addr

addr_test1vqwj9w0...

> cardano-cli address key-gen \
  --verification-key-file wallet2.vkey \
  --signing-key-file wallet2.skey
> cardano-cli address build \
  --payment-verification-key-file wallet2.vkey \
  --out-file wallet2.addr \
  --testnet-magic $TESTNET_MAGIC_NUM
```

Take note of the payment address of wallet 1, and go to [testnets.cardano.org/en/testnets/cardano/tools/faucet/](https://testnets.cardano.org/en/testnets/cardano/tools/faucet/) to add some funds.

After adding some funds, check the balance of the wallet 1's payment address:
```bash
> cardano-cli query utxo \
  --address $(cat /data/wallets/wallet1.addr) \
  --testnet-magic $TESTNET_MAGIC_NUM

...
```

## Always succeeds script
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
  --tx-in <utxo-id> \
  --tx-out $(cat /data/scripts/always-succeeds.addr)+2000000 \
  --tx-out-datum-hash $DATUM_HASH \
  --change-address $(cat /data/wallets/wallet1.addr) \
  --testnet-magic $TESTNET_MAGIC_NUM \
  --out-file $TX_BODY \
  --alonzo-era

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
  --tx-in <left-over-utxo-id> \ # used for fees
  --tx-in <script-utxo-with-our-datum-hash> \
  --tx-in-datum-value "42" \
  --tx-in-redeemer-value <arbitrary redeemer data> \
  --tx-in-script-file /data/scripts/always-succeeds.json \
  --tx-in-collateral <left-over-utxo-id> \ # used for collateral
  --change-address $(cat /data/wallets/wallet1.addr) \
  --tx-out $(cat /data/wallets/wallet1.addr)+2000000 \
  --out-file $TX_BODY \
  --testnet-magic $TESTNET_MAGIC_NUM \
  --protocol-params-file $PARAMS \
  --alonzo-era

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


## Time Lock script

A more useful example is a time-lock validator script. Actors send UTXOs to the time-lock address with a datum that contains a *lock-until* time. An optional nonce can be included in the datum to allow only the actors who know the nonce value to retrieve the UTXOs. The wallet from which the original UTXOs were sent is also able to retrieve the UTXOs at any time.

The Plutus-Light script:
```golang
data Datum {
    lockUntil Time,
    nonce     Integer // doesn't actually need be checked here
}

func getInitiatorHash(ctx ScriptContext) PubKeyHash {
    getCredentialPubKeyHash(getAddressCredential(getTxOutputAddress(getTxInputOutput(getCurrentTxInput(ctx)))))
}

func main(datum Datum, ctx ScriptContext) Bool {
    tx Tx = getTx(ctx);
    now Time = getTimeRangeStart(getTxTimeRange(tx));
    now > datum.lockUntil || isTxSignedBy(tx, getInitiatorHash(ctx))
}
```

UTXOs can be sent into the time-lock script arbitrarily as long as the datum has the correct format. UTXOs can be retrieved any time by the wallet that initiated the time-lock. UTXOs can be retrieved after the time-lock by anyone who knows the expiration time and the nonce.


Once we have written the script, we generate the CBOR hex, and then calculate the script address using cardano-cli:
```bash
$ nodejs

> var PL; import("./plutus-light.js").then(m=>{PL=m});

> const src = "data Datum {lockUntil...";

> console.log(PL.compilePlutusLightProgram(src))

590329590...
```
```bash
$ docker exec -it <container-id> bash

> echo '{
  "PlutusScriptV1": "",
  "description": "",
  "cborHex": "590329590...",
}' > /data/scripts/time-lock.json

> cardano-cli address build \
  --payment-script-file /data/scripts/time-lock.json \
  --out-file /data/scripts/time-lock.addr \
  --testnet-magic $TESTNET_MAGIC_NUM

> cat time-lock.addr

addr_test1wrr0t2vyt56tyheas6m60r7dtmeluh7rm5ss6erceahqt4gqfymmj
```

We also need a datum, so lets choose to lock UTXOs until 30 minutes from now:
```bash
$ nodejs

> var PL; import("./plutus-light.js").then(m=>{PL=m});

> const src = "data Datum {lockUntil...";

> console.log(PL.compilePlutusLightData(src, `Datum{lockUntil: Time(${(new Date()).getTime() + 1000*60*30}), nonce: 42}`));

{"constructors":0, "fields": [{"int": 16564....}, {"int": 42}]}
```

Now let's send 2 tAda to the script address using the datum we just generated:
```bash
$ docker exec -it <container-id> bash

> cardano-cli query utxo \
  --address $(cat /data/wallets/wallet1.addr) \
  --testnet-magic $TESTNET_MAGIC_NUM

...
# take note of a UTXO big enough to cover 2 tAda + fees

> DATUM=$(mktemp)
> echo '{"constructors":0, "fields": [{"int": 16564....}, {"int": 42}]}' > $DATUM

> DATUM_HASH=$(cardano-cli transaction hash-script-data --script-data-file $DATUM)

> TX_BODY=$(mktemp)
> cardano-cli transaction build \
  --tx-in <utxo-id> \
  --tx-out $(cat /data/scripts/time-lock.addr)+2000000 \
  --tx-out-datum-hash $DATUM_HASH \
  --change-address $(cat /data/wallets/wallet1.addr) \
  --testnet-magic $TESTNET_MAGIC_NUM \
  --out-file $TX_BODY \
  --alonzo-era

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

Wait for the transaction to propagate through the network, and query the script address to see the locked UTXO(s).

First thing we should test is returing the UTXO back into wallet 1. So we submit another transaction:
```bash
> cardano-cli transaction build \
  --tx-in <left-over-utxo-id> \ # used for fees
  --tx-in <script-utxo-with-our-datum-hash> \
  --tx-in-datum-file $DATUM \
  --tx-in-redeemer-value <arbitrary redeemer data> \
  --tx-in-script-file /data/scripts/time-lock.json \
  --tx-in-collateral <left-over-utxo-id> \ # used for collateral
  --invalid-before <current-slot-no> \
  --change-address $(cat /data/wallets/wallet1.addr) \
  --tx-out $(cat /data/wallets/wallet1.addr)+2000000 \
  --out-file $TX_BODY \
  --testnet-magic $TESTNET_MAGIC_NUM \
  --protocol-params-file $PARAMS \
  --alonzo-era

Estimated transaction fee: Lovelace 178405

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

Note that here the transaction build command differs slightly from that for the *Always succeeds* script. We added the `--invalid-before <current-slot-no>` argument so the transaction is aware of the current time (via the start of the valid time-range). It might seem weird to specify (an approximation of) the current time at this point, as someone might be able to cheat the time-lock by specifying a time far into the future. But the slot-leader checks the time-range as well, and rejects any transaction whose time-range doesn't contain the current slot.