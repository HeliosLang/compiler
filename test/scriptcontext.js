/**
 * @param {boolean} useInlineDatum
 * @returns {string}
 */
export function spendingScriptContextParam(useInlineDatum) {
    return `
        // a script context with a single input and a single output
        const PUB_KEY_HASH_BYTES: ByteArray = #01234567890123456789012345678901234567890123456789012345
        const TX_ID_IN_BYTES: ByteArray = #0123456789012345678901234567890123456789012345678901234567891234
        const TX_ID_IN: TxId = TxId::new(TX_ID_IN_BYTES)
        const CURRENT_VALIDATOR_BYTES: ByteArray = #01234567890123456789012345678901234567890123456789012346
        const CURRENT_VALIDATOR: ValidatorHash = ValidatorHash::new(CURRENT_VALIDATOR_BYTES)
        const HAS_STAKING_CRED_IN: Bool = false
        const STAKING_CRED_TYPE: Bool = false
        const SOME_STAKING_CRED_IN: StakingCredential = if (STAKING_CRED_TYPE) {
            StakingCredential::new_ptr(0, 0, 0)
        } else {
            StakingCredential::new_hash(StakingHash::new_stakekey(PubKeyHash::new(PUB_KEY_HASH_BYTES)))
        }
        const STAKING_CRED_IN: Option[StakingCredential] = if (HAS_STAKING_CRED_IN) {
            Option[StakingCredential]::Some{SOME_STAKING_CRED_IN}
        } else {
            Option[StakingCredential]::None
        }
        const CURRENT_VALIDATOR_CRED: Credential = Credential::new_validator(CURRENT_VALIDATOR)
        const ADDRESS_IN: Address = Address::new(CURRENT_VALIDATOR_CRED, STAKING_CRED_IN)
        const TX_OUTPUT_ID_IN: TxOutputId = TxOutputId::new(TX_ID_IN, 0)
        const ADDRESS_OUT: Address = Address::new(Credential::new_pubkey(PubKeyHash::new(PUB_KEY_HASH_BYTES)), Option[StakingCredential]::None)
        const ADDRESS_OUT_1: Address = Address::new(Credential::new_validator(CURRENT_VALIDATOR), Option[StakingCredential]::None)
        const QTY: Int = 200000
        const QTY_1: Int = 100000
        const QTY_2: Int = 100000

        const FEE: Int = 160000
        const VALUE_IN: Value = Value::lovelace(QTY + QTY_1 + QTY_2)
        const VALUE_OUT: Value = Value::lovelace(QTY - FEE)
        const VALUE_OUT_1: Value = Value::lovelace(QTY_1)
        const VALUE_OUT_2: Value = Value::lovelace(QTY_2)

        const DATUM_1: Int = 42
        const DATUM_HASH_1: DatumHash = DatumHash::new(DATUM_1.serialize().blake2b())
        const OUTPUT_DATUM: OutputDatum = ${useInlineDatum ? "OutputDatum::new_inline(DATUM_1)" : "OutputDatum::new_hash(DATUM_HASH_1)"}

        const CURRENT_TX_ID: TxId = TxId::new(#0000000000000000000000000000000000000000000000000000000000000000)

        const FIRST_TX_INPUT: TxInput = TxInput::new(TX_OUTPUT_ID_IN, TxOutput::new(ADDRESS_IN, VALUE_IN, OutputDatum::new_none()))
        const REF_INPUT: TxInput = TxInput::new(TxOutputId::new(TX_ID_IN, 1), TxOutput::new(ADDRESS_IN, Value::lovelace(0), OutputDatum::new_inline(42)))
        const FIRST_TX_OUTPUT: TxOutput = TxOutput::new(ADDRESS_OUT, VALUE_OUT, OutputDatum::new_none())
        const TX: Tx = Tx::new(
            []TxInput{FIRST_TX_INPUT},
            []TxInput{REF_INPUT},
            []TxOutput{
                FIRST_TX_OUTPUT,
                TxOutput::new(ADDRESS_OUT, VALUE_OUT_1, OUTPUT_DATUM),
                TxOutput::new(ADDRESS_OUT_1, VALUE_OUT_2, OUTPUT_DATUM)
            },
            Value::lovelace(FEE),
            Value::ZERO,
            []DCert{},
            Map[StakingCredential]Int{},
            TimeRange::new(Time::new(0), Time::new(100)),
            []PubKeyHash{PubKeyHash::new(PUB_KEY_HASH_BYTES)},
            Map[ScriptPurpose]Int{},
            Map[DatumHash]Int{${useInlineDatum ? "" : "DATUM_HASH_1: DATUM_1"}},
            CURRENT_TX_ID
        )
        const SCRIPT_CONTEXT: ScriptContext = ScriptContext::new_spending(TX, TX_OUTPUT_ID_IN)
    `
}
