# Part 2 of Plutus-Light how-to guide: Wallet setup and funding
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
