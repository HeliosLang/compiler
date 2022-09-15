#!/usr/bin/env node
import fs from "fs";
import * as helios from "./helios.js"

const networkParams = new helios.NetworkParams(JSON.parse(fs.readFileSync("./network-parameters/preview.json").toString()));

const helios_ = helios.exportedForTesting;

async function testBasic() {
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

    await tx.build(networkParams);

    console.log(JSON.stringify(tx.dump(), undefined, "    "));
}

async function testMinting(optimized = false) {
    const src = `
	minting testnft

	func main() -> Bool {
		true
	}`;

	const program = helios.Program.new(src).compile(optimized)

	console.log("MINTING_PROGRAM:", program.serialize());

	const hash = program.hash();

	console.log("MINTING_POLICY_HASH:", helios_.bytesToHex(hash));

	// wallet1 address: addr_test1vzzcg26lxj3twnnx889lrn60pqn0z3km2yahhsz0fvpyxdcj5qp8w
	// submit minting transaction:
	//  MINTING_POLICY_HASH=$(cardano-cli transaction policyid --script-file /data/scripts/minting
	//    0b61cc751e9512fef62362f00e6db61e70d719a567c6d4eb68095957 # for unoptimized
    //    919d4c2c9455016289341b1a14dedf697687af31751170d56a31466e # for optimized
	//  cardano-cli transaction build \
	//    --tx-in d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83#0 \ # used for fee
	//    --tx-out addr_test1vzzcg26lxj3twnnx889lrn60pqn0z3km2yahhsz0fvpyxdcj5qp8w+"1 0b61cc751e9512fef62362f00e6db61e70d719a567c6d4eb68095957." \
	//    --change-address addr_test1vzzcg26lxj3twnnx889lrn60pqn0z3km2yahhsz0fvpyxdcj5qp8w \
	//    --tx-in-collateral d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83#0 \
	//    --mint "1 0b61cc751e9512fef62362f00e6db61e70d719a567c6d4eb68095957." \
	//    --mint-script-file /data/scripts/minting/simple.json \
	//    --mint-redeemer-value "42" \ # arbitrary
	//    --testnet-magic 2 \
	//    --out-file /data/preview/transactions/202209101515.tx
	//    --cddl-format \
	//    --babbage-era
	//    --protocol-params-file <PARAMS>

	const cliTxHex = (!optimized) ? "84a60081825820d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83000d81825820d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83000182a200581d6085842b5f34a2b74e6639cbf1cf4f0826f146db513b7bc04f4b024337011b0000000253eaa6cca200581d6085842b5f34a2b74e6639cbf1cf4f0826f146db513b7bc04f4b02433701821a001e8480a1581c0b61cc751e9512fef62362f00e6db61e70d719a567c6d4eb68095957a14001021a0002b8b409a1581c0b61cc751e9512fef62362f00e6db61e70d719a567c6d4eb68095957a140010b5820af267b4418b11a9faa827f80301849ec4bd4565dbd95bae23f73918444eab395a206815453010000322233335734600693124c4c931251010581840100182a821909611a00094d78f5f6" : "84a60081825820d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83000d81825820d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83000182a200581d6085842b5f34a2b74e6639cbf1cf4f0826f146db513b7bc04f4b024337011b0000000253eaa985a200581d6085842b5f34a2b74e6639cbf1cf4f0826f146db513b7bc04f4b02433701821a001e8480a1581c919d4c2c9455016289341b1a14dedf697687af31751170d56a31466ea14001021a0002b5fb09a1581c919d4c2c9455016289341b1a14dedf697687af31751170d56a31466ea140010b5820686829109fc5e6342d9223537b91f804107c4dbfa8ba3288f80657be843acd51a2068147460100002249810581840100182a821903201a0002754cf5f6";

	const cliSignedTxHex = (!optimized) ? "84a60081825820d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83000d81825820d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83000182a200581d6085842b5f34a2b74e6639cbf1cf4f0826f146db513b7bc04f4b024337011b0000000253eaa6cca200581d6085842b5f34a2b74e6639cbf1cf4f0826f146db513b7bc04f4b02433701821a001e8480a1581c0b61cc751e9512fef62362f00e6db61e70d719a567c6d4eb68095957a14001021a0002b8b409a1581c0b61cc751e9512fef62362f00e6db61e70d719a567c6d4eb68095957a140010b5820af267b4418b11a9faa827f80301849ec4bd4565dbd95bae23f73918444eab395a30081825820a0e006bbd52e9db2dcd904e90c335212d2968fcae92ee9dd01204543c314359b5840684649bbe18d47cc58963877e777da9c7dab6206b4833c676f6301d974418b574f0d169723d7cedbd33e2cbcc07fac4a8cf32769816f8dc3153f5bdf6e510c0406815453010000322233335734600693124c4c931251010581840100182a821909611a00094d78f5f6" : "84a60081825820d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83000d81825820d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83000182a200581d6085842b5f34a2b74e6639cbf1cf4f0826f146db513b7bc04f4b024337011b0000000253eaa985a200581d6085842b5f34a2b74e6639cbf1cf4f0826f146db513b7bc04f4b02433701821a001e8480a1581c919d4c2c9455016289341b1a14dedf697687af31751170d56a31466ea14001021a0002b5fb09a1581c919d4c2c9455016289341b1a14dedf697687af31751170d56a31466ea140010b5820686829109fc5e6342d9223537b91f804107c4dbfa8ba3288f80657be843acd51a30081825820a0e006bbd52e9db2dcd904e90c335212d2968fcae92ee9dd01204543c314359b58409b4267e7691d160414f774f82942f08bbc3c64a19259a09b92350fe11ced5f73b64d99aa05f70cb68c730dc0d6ae718f739e5c2932eb843f2a9dcd69ff3c160c068147460100002249810581840100182a821903201a0002754cf5f6"

	console.log("SIGNED SIZE:", helios_.hexToBytes(cliSignedTxHex).length);

	const cliTxBytes = helios_.hexToBytes(cliTxHex);

	const cliTx = helios.Tx.fromCBOR(cliTxBytes);

	console.log(`BUILT_BY_CARDANO_CLI (${cliTx.toCBOR().length}):`, JSON.stringify(cliTx.dump(), undefined, 4));

	// build the same transaction using helios only
	const addr = helios.Address.fromBech32("addr_test1vzzcg26lxj3twnnx889lrn60pqn0z3km2yahhsz0fvpyxdcj5qp8w");
	let heliosTx = new helios.Tx();

	let mainInput = new helios.TxInput(
		helios.Hash.fromHex("d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83"),
		0n,
		new helios.TxOutput(
			addr,
            new helios.MoneyValue(10n*1000n*1000n*1000n),
		)
	);

	heliosTx.addInput(mainInput);

	let mph = new helios.Hash(program.hash());

	let tokens = [[[], 1n]];

	heliosTx.addMint(mph, tokens, new helios.IntData(42));

	heliosTx.addOutput(new helios.TxOutput(
		addr,
		new helios.MoneyValue(2n*1000n*1000n, new helios.MultiAsset([[mph, tokens]]))
	));

	heliosTx.setChangeAddress(addr);

	heliosTx.setCollateralInput(mainInput);

	heliosTx.addScript(program);


	await heliosTx.build(networkParams);

	console.log(`BUILT_BY_HELIOS (${heliosTx.toCBOR().length}):`, JSON.stringify(heliosTx.dump(), undefined, 4));
}

async function testInlineDatum() {
    const src = `
	spending always_succeeds

	func main() -> Bool {
		true
	}`;

	const program = helios.Program.new(src).compile(true);

	// wallet1 address: addr_test1vzzcg26lxj3twnnx889lrn60pqn0z3km2yahhsz0fvpyxdcj5qp8w
	// submit minting transaction:
	//  cardano-cli address build --payment-script-file /data/scripts/always_succeeds.json \
	//    --out-file /data/script/always_succeeds.addr \
	//    --testnet-magic $TESTNET_MAGIC
    //   addr_test1wpfvdtcvnd6yknhve6pc2w999n4325pck00x3c4m9750cdch6csfq
	//  cardano-cli transaction build \
	//    --tx-in d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83#0 \
	//    --tx-out $(cat /data/scripts/always_succeeds.addr)+2000000 \
	//    --tx-out-datum-file /data/scripts/datum_42.json \
	//    --change-address addr_test1vzzcg26lxj3twnnx889lrn60pqn0z3km2yahhsz0fvpyxdcj5qp8w \
	//    --tx-in-collateral d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83#0 \
	//    --testnet-magic 2 \
	//    --out-file /data/preview/transactions/202209142346.tx
	//    --cddl-format \
	//    --babbage-era
	//    --protocol-params-file <PARAMS>

	const unsignedHex = "84a400818258205d4bc6456f3bc6ac9f0c36ac25b0a4a9c2d793aaa5344355fcd2c8f647f2b55c000d818258205d4bc6456f3bc6ac9f0c36ac25b0a4a9c2d793aaa5344355fcd2c8f647f2b55c000182a200581d6085842b5f34a2b74e6639cbf1cf4f0826f146db513b7bc04f4b024337011b0000000253c6daafa300581d7052c6af0c9b744b4eecce838538a52ceb155038b3de68e2bb2fa8fc37011a001e8480028201d81842182a021a0002a09da0f5f6";

	const unsignedBytes = helios.hexToBytes(unsignedHex);

	let inlineDatum = new helios.InlineOutputDatum(new helios.IntData(42n));

	console.log(helios.bytesToHex(inlineDatum.toCBOR()));
	
	console.log(helios.bytesToHex(helios.CBORData.encodeHead(6, 24)));

	let tx = helios.Tx.fromCBOR(unsignedBytes);

	console.log(JSON.stringify(tx.dump(), undefined, 4));

}

async function main() {
    //await testBasic();

    //await testMinting();
    
    //await testMinting(true);

	await testInlineDatum();
}

main();
