#!/usr/bin/env node

import * as helios from "./helios.js";

const helios_ = helios.exportedForTesting;

function simplify(src) {
	let config = {stage: helios.CompilationStage.Simplify, simplify: true};

	let [orig, simplified] = helios.compile(src, config);

	console.log("ORIG:");
	console.log(new helios_.Source(orig).pretty());

	console.log("\nSIMPLIFIED:");
	console.log(simplified);
}

simplify(`
test add
func main(a: Int) -> Int {
	if (true) {
  		print("blablal" + "balbalb"); 1 + 1/2 + a
	} else {
		2
	}
}`);

simplify(`
test and
func main() -> Bool {
	false && true
}`);

simplify(`
test concat
func main() -> []Int {
	[]Int{1,2,3} + []Int{4,5,6}
}`);

simplify(`
test concat
func main(a: Int) -> []Int {
	[]Int{a,1,2} + []Int{}
}
`)

simplify(`
test value_is_zero
func main(a: Int) -> Bool {
	Value::lovelace(a).is_zero()
}
`);

simplify(`
mint_policy multi_nft

// a single transaction allows multiple minting policies to be used
// PREC_NFT is empty for the base multi_nft minting policy, 
// but can be set to the minting policy hash of the base multi_nft minting policy, and so forth, 
// if you want to mint multiple batches of the tokens (each batch having a different minting policy hash of course)
const PREC_NFT = #

enum Redeemer {
    Mint {
        ref: TxOutputId
    }
    Burn
}

func main(redeemer: Redeemer, ctx: ScriptContext) -> Bool {
    tx: Tx = ctx.tx;

    mph: MintingPolicyHash = ctx.get_current_minting_policy_hash();

    redeemer.switch { 
        Burn => {
            tx.minted.get_policy(mph).all_values((qty: Int) -> Bool {
                qty == -1
            })
        },
        m: Mint => {
            token_name_suffix: ByteArray = m.ref.serialize().sha3().slice(1, -1);

            // value.get_policy() returns a map of tokens in value
            mint_map: Map[ByteArray]Int = tx.minted.get_policy(mph);

            // check that all minted tokens have the required suffix
            mint_map.all((k: ByteArray, qty: Int) -> Bool {
                 qty == 1  && k.ends_with(token_name_suffix)
            }) && (PREC_NFT == # || mint_map == tx.minted.get_policy(MintingPolicyHash::new(PREC_NFT))) && (
                tx.inputs.any((input: TxInput) -> Bool {
                    input.output_id == m.ref
                })
            )
        }
    } 
}`)
