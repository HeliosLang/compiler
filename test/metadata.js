#!/usr/bin/env node
//@ts-check
import {
  Address,
  Assets,
  bytesToHex,
  hexToBytes,
  // MetadataItem,
  MintingPolicyHash,
  NetworkParams,
  Tx,
  TxOutput,
  UTxO,
  Value,
} from "../helios.js";
import fs from "fs";
import { correctDir, runIfEntryPoint } from "./util.js";

correctDir();

export default async function main() {
	const address = Address.fromBech32(
	  "addr_test1qrgqd6mhs05vjvtqk2at9pau3fhsd857dyxds27qk54gcvtnpkq9k63v7eue3u8u6pcvuzmwsk2hl46ceu9wxjxjvh4sj4drgd"
	);

	const tx = new Tx();

	tx.addMetadata(406, address.toHex());
	tx.addMetadata(409, {"map": [["a", 1234], ["other", "this is a test"]]});

	// Simulate CIP30 `getUtxos()`
	const walletUTXOs = [
	  "82825820283e9e5221ca6762e62ce35a69bdaf194e945238b28f21d48f5160cc9a568bfb0282583900d006eb7783e8c93160b2bab287bc8a6f069e9e690cd82bc0b52a8c31730d805b6a2cf67998f0fcd070ce0b6e85957fd758cf0ae348d265eb821a0011a008a1581c1cd7eb4b8635854f55bfaa2651d272264bb82dccdfe67dfb59345520a144474854311a00018691",
	  "828258205c7002ae246c77ee02586d800dd0545069c595cff2af056e74985d3c887122080182583900d006eb7783e8c93160b2bab287bc8a6f069e9e690cd82bc0b52a8c31730d805b6a2cf67998f0fcd070ce0b6e85957fd758cf0ae348d265eb1b000000024d42012d",
	];

	const txIn1 = UTxO.fromCbor(hexToBytes(walletUTXOs[0]));

	const txIn2 = UTxO.fromCbor(hexToBytes(walletUTXOs[1]));

	// @ts-ignore
	tx.addInputs([txIn1, txIn2]);

	tx.addOutput(
	  new TxOutput(
		Address.fromBech32(
		  "addr_test1qqjd0qg7h4a079lxhe9j773kw7yxl9shjulprxz4mgpnhww6hlww9sc4lmdsne9688dugdzcvcjhamjrmyczu0jtgqfsl7gefx"
		),
		new Value(
		  BigInt(5_000_000),
		  new Assets([
			[
			  MintingPolicyHash.fromHex(
				"1cd7eb4b8635854f55bfaa2651d272264bb82dccdfe67dfb59345520"
			  ),
			  [[hexToBytes("47485431"), BigInt(5)]],
			],
		  ])
		)
	  )
	);

	const networkParams = new NetworkParams(
	  JSON.parse(fs.readFileSync("./network-parameters-preprod.json").toString())
	);

	await tx.finalize(
	  networkParams,
	  Address.fromBech32(
		"addr_test1qrgqd6mhs05vjvtqk2at9pau3fhsd857dyxds27qk54gcvtnpkq9k63v7eue3u8u6pcvuzmwsk2hl46ceu9wxjxjvh4sj4drgd"
	  )
	);

	console.log(JSON.stringify(tx.dump(), null, 2));
	console.log(bytesToHex(tx.toCbor()));

	const tx2 = Tx.fromCbor(tx.toCbor());

	console.log(tx2.dump());
}

runIfEntryPoint(main, "metadata.js");
