#!/usr/bin/env node
import fs from "fs";
import * as helios from "./helios.js"

const networkParams = new helios.NetworkParams(JSON.parse(fs.readFileSync("./network-parameters/preview.json").toString()));

const helios_ = helios.exportedForTesting;

// send 10 tAda on preview net from wallet1 to wallet 2
// wallet1 address: addr_test1vzzcg26lxj3twnnx889lrn60pqn0z3km2yahhsz0fvpyxdcj5qp8w
// wallet2 address: addr_test1vqzhgmkqsyyzxthk7vzxet4283wx8wwygu9nq0v94mdldxs0d56ku
// input utxo: d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83#0
// command: cardano-cli transaction build --tx-in d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83#0 --tx-out addr_test1vqzhgmkqsyyzxthk7vzxet4283wx8wwygu9nq0v94mdldxs0d56ku+10000000 --change-address addr_test1vzzcg26lxj3twnnx889lrn60pqn0z3km2yahhsz0fvpyxdcj5qp8w --testnet-magic 2 --out-file /data/preview/transactions/202209042119.tx --babbage-era --cddl-format
// outputHex: 
const unsignedHex = "84a30081825820d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83000182a200581d6085842b5f34a2b74e6639cbf1cf4f0826f146db513b7bc04f4b024337011b000000025370c627a200581d6005746ec08108232ef6f3046caeaa3c5c63b9c4470b303d85aedbf69a011a00989680021a00028759a0f5f6";

const signedHex= "84a30081825820d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83000182a200581d6085842b5f34a2b74e6639cbf1cf4f0826f146db513b7bc04f4b024337011b000000025370c627a200581d6005746ec08108232ef6f3046caeaa3c5c63b9c4470b303d85aedbf69a011a00989680021a00028759a10081825820a0e006bbd52e9db2dcd904e90c335212d2968fcae92ee9dd01204543c314359b584073afc3d75355883cd9a83140ed6480354578148f861f905d65a75b773d004eca5869f7f2a580c6d9cc7d54da3b307aa6cb1b8d4eb57603e37eff83ca56ec620cf5f6";

const unsignedBytes = helios_.hexToBytes(unsignedHex);

const signedBytes = helios_.hexToBytes(signedHex);

const unsignedTx = helios_.Tx.fromCBOR(unsignedBytes);

const signedTx = helios_.Tx.fromCBOR(signedBytes);

console.log("UNSIGNED:\n", JSON.stringify(unsignedTx.dump(), undefined, "    "));

console.log("\nSIGNED:\n", JSON.stringify(signedTx.dump(), undefined, "    "));

console.log("UNSIGNED SIZE:", unsignedBytes.length.toString());
console.log("SIGNED SIZE:", signedBytes.length.toString());
console.log("ESTIMATED TX SIZE:", signedTx.estimateFee(networkParams));

console.log("CBOR ENCODING:", helios_.bytesToHex(signedTx.toCBOR()));

console.log("INV:", JSON.stringify(helios_.Tx.fromCBOR(signedTx.toCBOR()).dump(), undefined, "    "));

// build same transaction using helios only:
let tx = new helios.Tx();

tx.addInput(new helios.TxInput(
    helios.Hash.fromHex("d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83"),
    0n,
    new helios.TxOutput(
        helios.Address.fromBech32("addr_test1vzzcg26lxj3twnnx889lrn60pqn0z3km2yahhsz0fvpyxdcj5qp8w"),
        new helios.MoneyValue(10n*1000n*1000n*1000n),
    )
));

tx.addOutput(new helios.TxOutput(
    helios.Address.fromBech32("addr_test1vqzhgmkqsyyzxthk7vzxet4283wx8wwygu9nq0v94mdldxs0d56ku"),
    new helios.MoneyValue(10n*1000n*1000n),
));

tx.setChangeAddress(helios.Address.fromBech32("addr_test1vzzcg26lxj3twnnx889lrn60pqn0z3km2yahhsz0fvpyxdcj5qp8w"));

tx.build(networkParams);

console.log(JSON.stringify(tx.dump(), undefined, "    "));