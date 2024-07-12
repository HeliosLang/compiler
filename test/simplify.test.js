//@ts-check

import fs from "fs"

import {
    IRProgram,
    NetworkParams,
    Program,
    Source,
    ToIRContext,
    UplcProgram,
    assert
} from "helios"

const networkParams = new NetworkParams(
    JSON.parse(fs.readFileSync("./network-parameters-preview.json").toString())
)

function simplify(src, expectedSize = null) {
    let program = Program.new(src)

    let ir = program.toIR(new ToIRContext(false))

    let irProgram0 = IRProgram.new(ir, "testing", false)
    let irProgram1 = IRProgram.new(ir, "testing", true)

    console.log(`ORIG (${irProgram0.calcSize()} bytes):`)
    console.log(new Source(irProgram0.toString(), "").pretty())

    let size = irProgram1.calcSize()
    console.log(`\nSIMPLIFIED (${size} bytes):`)
    console.log(new Source(irProgram1.toString(), "").pretty(), "\n\n")

    if (expectedSize !== null) {
        assert(
            size === expectedSize,
            `unexpected size, expected ${expectedSize} but got ${size}`
        )
    }
}

/**
 * @param {string} src
 * @param {string[]} argNames
 * @param {any | null} expected
 */
async function profile(src, argNames, expected = null) {
    let program = Program.new(src)

    let args = argNames.map((name) => program.evalParam(name))

    let irProgram1 = IRProgram.new(
        program.toIR(new ToIRContext(false)),
        "testing",
        true
    )
    let size = irProgram1.calcSize()
    console.log(`\nSIMPLIFIED (${size} bytes):`)
    console.log(new Source(irProgram1.toString(), "").pretty(), "\n\n")

    // also test the transfer() function
    let profileResult = await program
        .compile(true)
        .transfer(UplcProgram)
        .profile(args, networkParams)
    console.log(profileResult)

    if (expected !== null) {
        assert(profileResult.mem === expected.mem, "unexpected mem")
        assert(profileResult.cpu === expected.cpu, "unexpected cpu")
        assert(profileResult.size === expected.size, "unexpected size")
    }
}

export default async function main() {
    simplify(`
	testing list_new
	func main(a: Int, b: Int) -> []Int {
		[]Int::new_const(a, b)
	}`)

    simplify(`
	testing add
	func main(a: Int) -> Int {
		if (true) {
			print("blablal" + "balbalb"); 1 + 1/2 + a
		} else {
			2
		}
	}`)

    simplify(`
	testing and
	func main() -> Bool {
		false && true
	}`)

    simplify(`
	testing concat
	func main() -> []Int {
		[]Int{1,2,3} + []Int{4,5,6}
	}`)

    simplify(`
	testing concat
	func main(a: Int) -> []Int {
		[]Int{a,1,2} + []Int{}
	}
	`)

    simplify(`
	testing value_is_zero
	func main(a: Int) -> Bool {
		Value::lovelace(a).is_zero()
	}
	`)

    simplify(`
	minting multi_nft

	// a single transaction allows multiple minting policies to be used
	// PREC_NFT is empty for the base multi_nft minting policy, 
	// but can be set to the minting policy hash of the base multi_nft minting policy, and so forth, 
	// if you want to mint multiple batches of the tokens (each batch having a different minting policy hash of course)
	const PREC_NFT: ByteArray = #

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
				tx.minted.get_policy(mph).all((_, qty: Int) -> Bool {
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
	}

	const RANDOM: String = "aksjdkjasd"

	const LIST: []Int = []Int{1,2,3} + []Int{5,6,7}
	`)

    simplify(`testing equals
	func main(a: Int) -> Bool {
		a+1 == a+2
	}`)

    await profile(
        `
	testing profile

	func main(a: Int, b: Int) -> Int {
		a + b + b
	}

	const A: Int = 1
	const B: Int = 1
	const C: Int = main(A, B)
	`,
        ["A", "B"]
    )

    simplify(`testing one_field
	struct Datum {
		b: Bool
	}

	func main(a: Bool) -> Bool {
		Datum{a}.b
	}`)
}
