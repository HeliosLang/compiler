import { strictEqual } from "node:assert"
import { describe, it } from "node:test"
import { ConstrData } from "@helios-lang/uplc"
import {
    bytes,
    compileAndRun,
    evalSingle,
    int,
    mixedOther,
    mixedSpending
} from "./utils.js"

const dummyBytes28_1 =
    "01234567890123456789012345678901234567890123456789012345"
const dummyBytes28_2 =
    "01234567890123456789012345678901234567890123456789012346"
const dummyBytes32_1 =
    "0000000000000000000000000000000000000000000000000000000000000000"

/**
 * ScriptContexts are usually generated using transaction builders, but here we only want to test the correctness of the ScriptContext related functionality, so it is easier to create a dummy ScriptContext using a testing script
 */

function genSimpleSpendingScriptContext() {
    const pubKeyHashBytes = dummyBytes28_1
    const txIdInBytes = dummyBytes32_1
    const inputLovelace = 2_000_000n
    const feeLovelace = 160_000n

    const src = `
    testing gen_simple_spending_scriptcontext

    import { new_spending } from ScriptContext

    func main() -> Data {
        pub_key_hash_bytes = #${pubKeyHashBytes};
        tx_id_in = TxId::new(#${txIdInBytes});
        address_in = Address::new(SpendingCredential::new_pubkey(PubKeyHash::new(pub_key_hash_bytes)), Option[StakingCredential]::None);
        address_out = address_in;
        input_lovelace = ${inputLovelace.toString()};
        input_value = Value::lovelace(input_lovelace);
        input_id = TxOutputId::new(tx_id_in, 0);

        new_spending(
            Tx::new(
                // inputs
                []TxInput{
                    TxInput::new(
                        input_id,
                        TxOutput::new(
                            address_in, 
                            input_value, 
                            TxOutputDatum::new_none()
                        )
                    )
                },
                // ref inputs
                []TxInput{},
                // outputs
                []TxOutput{
                    TxOutput::new(
                        address_out,
                        input_value - Value::lovelace(${feeLovelace.toString()}),
                        TxOutputDatum::new_none()
                    )
                },
                // fee
                Value::lovelace(${feeLovelace.toString()}),
                // minted
                Value::ZERO,
                // staking certs
                []DCert{},
                // withdrawals
                Map[StakingCredential]Int{},
                // validity time range
                TimeRange::ALWAYS,
                // signatories
                []PubKeyHash{},
                // redeemers
                Map[ScriptPurpose]Int{},
                // datums
                Map[DatumHash]Data{},
                // tx_id
                tx_id_in
            ),
            input_id
        )
    }`

    return {
        pubKeyHashBytes,
        txIdInBytes,
        inputLovelace,
        data: evalSingle(src)
    }
}

function genSimpleMintingScriptContext() {
    const pubKeyHashBytes = dummyBytes28_1
    const txIdInBytes = dummyBytes32_1
    const currentMphBytes = dummyBytes28_2
    const inputLovelace = 1000n
    const currentTokenName = "abcd"

    const src = `
    testing gen_simple_minting_scriptcontext

    import { new_minting } from ScriptContext

    func main() -> Data {
        pub_key_hash_bytes = #${pubKeyHashBytes};
        tx_id_in = TxId::new(#${txIdInBytes});
        current_mph_bytes = #${currentMphBytes};
        current_mph = MintingPolicyHash::new(current_mph_bytes);
        address_in = Address::new(SpendingCredential::new_pubkey(PubKeyHash::new(pub_key_hash_bytes)), Option[StakingCredential]::None);
        address_out = address_in;
        input_lovelace = ${inputLovelace.toString()};
        input_value = Value::lovelace(input_lovelace);
        minted_value = Value::new(AssetClass::new(current_mph, #${currentTokenName}), 1);

        new_minting(
            Tx::new(
                // inputs
                []TxInput{
                    TxInput::new(
                        TxOutputId::new(tx_id_in, 0),
                        TxOutput::new(
                            address_in, 
                            input_value, 
                            TxOutputDatum::new_none()
                        )
                    )
                },
                // ref inputs
                []TxInput{},
                // outputs
                []TxOutput{
                    TxOutput::new(
                        address_out,
                        input_value + minted_value,
                        TxOutputDatum::new_none()
                    )
                },
                // fee
                Value::lovelace(160_000),
                // minted
                minted_value,
                // staking certs
                []DCert{},
                // withdrawals
                Map[StakingCredential]Int{},
                // validity time range
                TimeRange::ALWAYS,
                // signatories
                []PubKeyHash{},
                // redeemers
                Map[ScriptPurpose]Int{},
                // datums
                Map[DatumHash]Data{},
                // tx_id
                tx_id_in
            ),
            current_mph
        )
    }`

    return {
        pubKeyHashBytes,
        txIdInBytes,
        currentMphBytes,
        inputLovelace,
        currentTokenName,
        data: evalSingle(src)
    }
}

describe("Entry points", () => {
    const mintingScriptContext = genSimpleMintingScriptContext()
    const spendingScriptContext = genSimpleSpendingScriptContext()

    it("data tag is 0", () => {
        const data = mintingScriptContext.data
        strictEqual(data instanceof ConstrData && data.tag == 0, true)
    })

    compileAndRun({
        description: "can call always succeeds minting script",
        main: `minting always_succeeds
        func main(_) -> Bool {
            true
        }`,
        inputs: [int(0), mintingScriptContext.data],
        output: "()"
    })

    compileAndRun({
        description: "can mint using mixed script",
        main: `mixed always_succeeds
        func main(_) -> Bool {
            true
        }`,
        inputs: [mixedOther(int(0)), mintingScriptContext.data],
        output: "()"
    })

    compileAndRun({
        description: "can spend using mixed script",
        main: `mixed always_succeeds
        func main(args: MixedArgs) -> Bool {
            args.switch{
                s: Spending => Int::from_data(s.datum) == 0 && Int::from_data(s.redeemer) == 0,
                _ => false
            }
        }`,
        inputs: [int(0), mixedSpending(int(0)), spendingScriptContext.data],
        output: "()"
    })

    compileAndRun({
        description: "can validate minting script based on tx",
        main: `minting always_succeeds
        import { tx } from ScriptContext
        func main(_unused_redeemer) -> Bool {
            tx.fee > Value::ZERO
        }`,
        inputs: [int(0), mintingScriptContext.data],
        output: "()"
    })

    const mintingApprovedByScript = `minting approved_by
    import { tx  } from ScriptContext
    func main(pkh: PubKeyHash) -> Bool {
        cred = SpendingCredential::new_pubkey(pkh);
        tx.is_approved_by(cred)
    }`

    compileAndRun({
        description: "wrong spending credential doesn't approve tx",
        main: mintingApprovedByScript,
        inputs: [bytes(""), mintingScriptContext.data],
        output: { error: "" }
    })

    compileAndRun({
        description: "correct spending credential approves tx",
        main: mintingApprovedByScript,
        inputs: [
            bytes(mintingScriptContext.pubKeyHashBytes),
            mintingScriptContext.data
        ],
        output: "()"
    })
})
