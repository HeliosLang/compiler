# Part 6 of Helios tutorial: Minting policy scripts

Minting policy scripts are very similar to validator scripts for spending. They don't accept a `Datum` argument though, only `Redeemer` and/or `ScriptContext`.

The most trivial minting policy would allow any number of tokens to be minted (or burned):
```golang
minting my_nft

func main() Bool { // compiler is smart enough to add dummy Redeemer and ScriptContext arguments to final program
    true
}
```

A slightly more elaborate minting policy allows a single centralized actor to mint (or burn) any number of tokens:
```golang
minting my_nft

func main(ctx: ScriptContext) Bool {
    tx: Tx = ctx.tx;

    tx.is_signed_by(PubKeyHash::new(#a14f...))
}
```

For NFTs, or public-sale tokens, the minting policy needs to be provably single-use. UTXOs are guaranteed to be unique, and can be used for this purpose:
```golang
minting my_nft

func main(ctx: ScriptContext) -> Bool {
    tx: Tx = ctx.tx;

    // assume a single input
    tx_input: TxInput = tx.inputs.head;

    // we also check the total minted
    tx_input.output_id == TxOutputId::new(#<utxo-id>, 0) && tx.minted == Value::new(AssetClass::new(ctx.get_current_minting_policy_hash(), "MyNFT"), 1)
}
```
Note that this minting policy can't be used for burning.

Let's use the script above to mint an NFT. Choose a good UTXO before compiling the minting policy. The UTXO must be large enough to cover the transaction fee (and collateral), and have enough *lovelace* left-over to send back along with the newly minted asset (each UTXO must contain some *lovelace*).

Compile the minting policy script:
```bash
> var helios; import("./helios.js").then(m=>{helios=m});

> console.log(helios.Program.new("minting my_nft func main(ctx: ScriptContext) -> Bool {...}").compile().serialize());

{"type": "PlutusScriptV1", "description": "", "cborHex" :" 5..."}
```

We can now mint the NFT by submitting the following transaction:
```bash
$ docker exec -it <container-id> bash

> MINTING_POLICY_HASH=$(cardano-cli transaction policyid --script-file /data/scripts/minting.json)
> TOKEN_NAME="4d794e4654" # 'MyNFT' in hex

> PARAMS=$(mktemp)
> cardano-cli query protocol-parameters --testnet-magic $TESTNET_MAGIC_NUM > $PARAMS

> TX_BODY=$(mktemp)
> cardano-cli transaction build \
  --tx-in <utxo-id> \ # used for both fees and authenticating the minting
  --tx-out $(cat /data/wallets/wallet1.addr)+1500000+"1 ${MINTING_POLICY_HASH}.${TOKEN_NAME}" \
  --change-address $(cat /data/wallets/wallet1.addr) \
  --tx-in-collateral <utxo-id> \
  --mint "1 ${MINTING_POLICY_HASH}.${TOKEN_NAME}" \
  --mint-script-file /data/scripts/minting.json \
  --mint-redeemer-value "42" \
  --testnet-magic $TESTNET_MAGIC_NUM \
  --out-file $TX_BODY \
  --protocol-params-file $PARAMS \
  --babbage-era
# note the dummy redeemer value

Estimated transaction fees: Lovelace 263442

> TX_SIGNED=$(mktemp)
> cardano-cli transaction sign \
  --tx-body-file $TX_BODY \
  --signing-key-file /data/wallets/wallet1.skey \
  --out-file $TX_SIGNED

> cardano-cli transaction submit \
  --tx-file $TX_SIGNED \
  --testnet-magic $TESTNET_MAGIC_NUM

Transaction successfully submitted.
```

After a while you will notice the new UTXO in wallet 1, containing the NFT.
