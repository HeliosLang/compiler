# How to use Plutus-Light with cardano-cli
You will need a Linux environment with *docker* for this.

## *cardano-node* setup
Start a *cardano-node* docker container:
```bash
$ docker run -d -e NETWORK=testnet -e TESTNET_MAGIC_NUM=1097911063 -e CARDANO_NODE_SOCKET_PATH=/ipc/node.socket -v cardano-testnet-data:/data inputoutput/cardano-node:latest
```

This command will automatically download the latest *cardano-node* image, and create a named docker volume for storing the blockchain synchronization data.

Check that the *cardano-node* container is running using the following command:
```bash
$ docker ps
```
Note the container id.

You can stop the container any time:
```bash
$ docker stop <container-id>
```
I recommend using `docker stop` and not `docker rm -f` as it allows `cardano-node` processes to receive the more graceful `SIGTERM` signal (instead of just `SIGKILL`).

You can clean up stopped containers if you are running low on system resources:
```bash
$ docker system prune
```

After about 30 seconds `/ipc/node.socket` should've been created and you can start using `cardano-cli` to query the blockchain.

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

Note the payment addresses of wallet 1, and go to [testnets.cardano.org/en/testnets/cardano/tools/faucet/](https://testnets.cardano.org/en/testnets/cardano/tools/faucet/) to add some funds.

Check the balance of the payment address belonging to wallet 1:
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

Compile the Always Succeeds script and note resulting CBOR:
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

Let's send 10 tAda (10 million lovelace) to the script address:
```bash
> TX_BUILD=$(mktemp)
> cardano-cli transaction build \
  --tx-in <utxo-id> \
  --tx-out $(cat /data/scripts/always-succeeds.addr)+10000000 \
  --tx-out-datum-hash $DATUM_HASH \
  --change-address $(cat /data/wallets/wallet1.addr) \
  --testnet-magic $TESTNET_MAGIC_NUM \
  --out-file $TX_BUILD \
  --alonzo-era

Estimated transaction fee: Lovelace 167217

> TX_SIGNED=$(mktemp)
> cardano-cli transaction sign \
  --tx-body-file $TX_BUILD \
  --signing-key-file /data/wallets/wallet1.skey \
  --testnet-magic $TESTNET_MAGIC_NUM \
  --out-file $TX_SIGNED

> cardano-cli transaction submit \
  --tx-file $TX_SIGNED \
  --testnet-magic $TESTNET_MAGIC_NUM

Transaction successfully submitted
```

If you check the wallet 1 payment address balance after a few minutes you will noticed that it has decreased by 10 tAda + fee. Note the left-over UTXO id, we will need it to pay fees when retrieving funds.


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

> TX_BUILD=$(mktemp)
> cardano-cli transaction build \
  --tx-in <left-over-utxo-id> \ # used for fees
  --tx-in <script-utxo-with-our-datum-hash> \
  --tx-in-datum-value "42" \
  --tx-in-redeemer-value <arbitrary redeemer data> \
  --tx-in-script-file /data/scripts/always-succeeds.json \
  --tx-in-collateral <left-over-utxo-id> \ # used for collateral
  --change-address $(cat /data/wallets/wallet1.addr) \
  --tx-out $(cat /data/wallets/wallet1.addr)+10000000 \
  --tx-out-datum-hash $DATUM_HASH \
  --out-file $TX_BUILD \
  --tesnet-magic $TESTNET_MAGIC_NUM \
  --protocol-params-file $PARAMS \
  --alonzo-era

Estimated transaction fee: Lovelace 178405

> TX_SIGNED=$(mktemp)
> cardano-cli transaction sign \
  --tx-body-file $TX_BUILD \
  --signing-key-file /data/wallets/wallet1.skey \
  --testnet-magic $TESTNET_MAGIC_NUM \
  --out-file $TX_SIGNED

> cardano-cli transaction submit \
  --tx-file $TX_SIGNED \
  --testnet-magic $TESTNET_MAGIC_NUM

Transaction successfully submitted
```

If you now check the balance of wallet 1 you should see two UTXOs, and the total value should be your starting value minus the two fees you paid. 

Note that *collateral* is only paid if you submit a bad script, but cardano-cli does some checks when building the transaction and should throw an error before you are able to to so.
