// @ts-check

import crypto from "node:crypto"

import { 
    REAL_PRECISION,
    ByteArrayData,
    ConstrData,
    FuzzyTest,
    IntData,
    ListData,
    MapData,
    RuntimeError,
    UplcBool,
    UplcData,
    UplcDataValue,
    UserError,
    UplcValue,
    config,
    assertClass,
    bytesToBigInt,
    bytesToHex,
    bytesToText,
    setBlake2bDigestSize,
    setRawUsageNotifier
} from "helios"

/**
 * @typedef {import("helios").PropertyTest} PropertyTest
 */

const REAL_ONE = BigInt(Math.pow(10, REAL_PRECISION));

config.set({CHECK_CASTS: true});

// helper functions for script property tests
function asBool(value) {
    if (value instanceof UplcBool) {
        return value.bool;
    } else if (value instanceof ConstrData) {
        if (value.fields.length == 0) {
            if (value.index == 0) {
                return false;
            } else if (value.index == 1) {
                return true;
            } else {
                throw new Error(`unexpected ConstrData index ${value.index} (expected 0 or 1 for Bool)`);
            }
        } else {
            throw new Error(`expected ConstrData with 0 fields (Bool)`);
        }
    } else if (value instanceof UplcDataValue) {
        return asBool(value.data);
    } else {
        throw value;
    }

    throw new Error(`expected UplcBool, got ${value.toString()}`);
}

function asInt(value) {
    if (value instanceof IntData) {
        return value.value;
    } else if (value instanceof UplcDataValue) {
        let data = value.data;
        if (data instanceof IntData) {
            return data.value;
        }
    }

    throw new Error(`expected IntData, got ${value.toString()}`);
}

function asReal(value) {
    return Number(asInt(value))/1000000;
}

function asBytes(value) {
    if (value instanceof ByteArrayData) {
        return value.bytes;
    } else if (value instanceof UplcDataValue) {
        let data = value.data;
        if (data instanceof ByteArrayData) {
            return data.bytes;
        }
    }

    throw new Error(`expected ByteArrayData, got ${value.toString()}`);
}

function equalsList(a, b) {
    let n = a.length;
    return n == b.length && a.every((v, i) => b[i] === v);
}

function decodeCbor(bs) {
    return UplcData.fromCbor(bs);
}

function isValidString(value) {
    if (value instanceof ByteArrayData) {
        try {
            void bytesToText(value.bytes);

            return true;
        } catch(_) {
            return false;
        }
    } else if (value instanceof UplcDataValue) {
        let data = value.data;
        if (data instanceof ByteArrayData) {
            return isValidString(data);
        }
    }

    throw new Error(`expected ByteArrayData, got ${value.toString()}`);
}

/**
 * @param {any} value 
 * @returns {string}
 */
function asString(value) {
    if (value instanceof ByteArrayData) {
        return bytesToText(value.bytes);
    } else if (value instanceof UplcDataValue) {
        let data = value.data;
        if (data instanceof ByteArrayData) {
            return bytesToText(data.bytes);
        }
    }

    throw new Error(`expected ByteArrayData, got ${value.toString()}`);
}

/**
 * 
 * @param {any} value 
 * @returns {bigint[]}
 */
function asIntList(value) {
    if (value instanceof ListData) {
        let items = [];

        for (let item of value.list) {
            if (item instanceof IntData) {
                items.push(item.value);
            } else {
                throw new Error(`expected ListData of IntData, got ${value.toString()}`);
            }
        }

        return items;
    } else if (value instanceof UplcDataValue) {
        let data = value.data;
        
        return asIntList(data);
    }

    throw new Error(`expected ListData, got ${value.toString()}`);
}

/**
 * 
 * @param {any} value 
 * @returns {bigint[][]}
 */
function asNestedIntList(value) {
    if (value instanceof ListData) {
        let items = [];

        for (let item of value.list) {
            items.push(asIntList(item));
        }

        return items;
    } else if (value instanceof UplcDataValue) {
        let data = value.data;
        
        return asNestedIntList(data);
    }

    throw new Error(`expected ListData of ListData, got ${value.toString()}`);
}

/**
 * 
 * @param {any} value 
 * @returns {string[]}
 */
function asStringList(value) {
    if (value instanceof ListData) {
        let items = [];

        for (let item of value.list) {
            items.push(asString(item));
        }

        return items;
    } else if (value instanceof UplcDataValue) {
        let data = value.data;
        
        return asStringList(data);
    }

    throw new Error(`expected ListData, got ${value.toString()}`);
}

/**
 * @param {any} value 
 * @returns {number[][]}
 */
function asBytesList(value) {
    if (value instanceof ListData) {
        let items = [];

        for (let item of value.list) {
            items.push(asBytes(item));
        }

        return items;
    } else if (value instanceof UplcDataValue) {
        let data = value.data;
        
        return asBytesList(data);
    }

    throw new Error(`expected ListData, got ${value.toString()}`);
}

function asBoolList(value) {
    if (value instanceof ListData) {
        let items = [];

        for (let item of value.list) {
            if (item instanceof ConstrData && item.fields.length == 0 && (item.index == 0 || item.index == 1)) {
                items.push(item.index == 1);
            } else {
                throw new Error(`expected ListData of bool-like ConstrData, got ${value.toString()}`);
            }
        }

        return items;
    } else if (value instanceof UplcDataValue) {
        let data = value.data;
        if (data instanceof ListData) {
           return asBoolList(data);
        }
    }

    throw new Error(`expected ListData, got ${value.toString()}`);
}

function asData(value) {
    if (value instanceof UplcData) {
        return value;
    } else if (value instanceof UplcDataValue) {
        return value.data;
    } else if (value instanceof UserError) {
        throw value;
    } else {
        throw new Error("expected UplcDataValue or UplcData");
    }
}

function constrIndex(value) {
    if (value instanceof ConstrData) {
        return value.index;
    } else if (value instanceof UplcDataValue) {
        let data = value.data;
        if (data instanceof ConstrData) {
            return data.index;
        }
    }

    throw new Error(`expected ConstrIndex, got ${value.toString()}`);
}


/**
 * Throws an error if 'err' isn't en Error
 * @param {any} err 
 * @param {string} info 
 * @returns {boolean}
 */
function isError(err, info) {
    return err instanceof RuntimeError;
}

/**
 * @type {PropertyTest}
 */
const serializeProp = ([a], res) => {
    return decodeCbor(asBytes(res)).isSame(a.data);
};

/**
 * @param {boolean} useInlineDatum 
 * @returns {string}
 */
function spendingScriptContextParam(useInlineDatum) {
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
    `;
}

const mintingScriptContextParam = `
    // a script context with a single input and a single output
    const PUB_KEY_HASH_BYTES: ByteArray = #01234567890123456789012345678901234567890123456789012345
    const TX_ID_IN: TxId = TxId::new(#0000000000000000000000000000000000000000000000000000000000000000)
    const CURRENT_MPH_BYTES: ByteArray = #01234567890123456789012345678901234567890123456789012346
    const CURRENT_MPH: MintingPolicyHash = MintingPolicyHash::new(CURRENT_MPH_BYTES)
    const ADDRESS_IN: Address = Address::new(Credential::new_pubkey(PubKeyHash::new(PUB_KEY_HASH_BYTES)), Option[StakingCredential]::None)
    const ADDRESS_OUT: Address = ADDRESS_IN
    const QTY: Int = 1000
    const VALUE: Value = Value::lovelace(QTY)
    const MINTED: Value = Value::new(AssetClass::new(CURRENT_MPH, #abcd), 1)
    const SCRIPT_CONTEXT: ScriptContext = ScriptContext::new_minting(Tx::new(
        []TxInput{TxInput::new(TxOutputId::new(TX_ID_IN, 0), TxOutput::new(ADDRESS_IN, VALUE, OutputDatum::new_none()))},
        []TxInput{},
        []TxOutput{TxOutput::new(ADDRESS_OUT, VALUE + MINTED, OutputDatum::new_none())},
        Value::lovelace(160000),
        MINTED,
        []DCert{},
        Map[StakingCredential]Int{},
        TimeRange::ALWAYS,
        []PubKeyHash{},
        Map[ScriptPurpose]Int{},
        Map[DatumHash]Data{},
        TX_ID_IN
    ), CURRENT_MPH)
`;

const rewardingScriptContextParam = `
    // a script context with a single input and a single output
    const PUB_KEY_HASH_BYTES: ByteArray = #01234567890123456789012345678901234567890123456789012345
    const TX_ID_IN: TxId = TxId::new(#0000000000000000000000000000000000000000000000000000000000000000)
    const CURRENT_STAKING_CRED_BYTES: ByteArray = #01234567890123456789012345678901234567890123456789012346
    const CURRENT_STAKING_CRED: StakingCredential = StakingCredential::new_hash(StakingHash::new_stakekey(PubKeyHash::new(CURRENT_STAKING_CRED_BYTES)))
    const REWARD_QTY: Int = 2000
    const ADDRESS_IN: Address = Address::new(Credential::new_pubkey(PubKeyHash::new(PUB_KEY_HASH_BYTES)), Option[StakingCredential]::None)
    const ADDRESS_OUT: Address = ADDRESS_IN
    const QTY: Int = 1000
    const VALUE: Value = Value::lovelace(QTY)
    const SCRIPT_CONTEXT: ScriptContext = ScriptContext::new_rewarding(Tx::new(
        []TxInput{TxInput::new(TxOutputId::new(TX_ID_IN, 0), TxOutput::new(ADDRESS_IN, VALUE, OutputDatum::new_none()))},
        []TxInput{},
        []TxOutput{TxOutput::new(ADDRESS_OUT, VALUE + Value::lovelace(REWARD_QTY), OutputDatum::new_none())},
        Value::lovelace(160000),
        Value::ZERO,
        []DCert{},
        Map[StakingCredential]Int{
            CURRENT_STAKING_CRED: REWARD_QTY
        },
        TimeRange::ALWAYS,
        []PubKeyHash{},
        Map[ScriptPurpose]Int{},
        Map[DatumHash]Data{},
        TX_ID_IN
    ), CURRENT_STAKING_CRED)

    const STAKING_PURPOSE: StakingPurpose = SCRIPT_CONTEXT.get_staking_purpose()
`;

const certifyingScriptContextParam = `
    // a script context with a single input and a single output
    const PUB_KEY_HASH_BYTES: ByteArray = #01234567890123456789012345678901234567890123456789012345
    const TX_ID_IN: TxId = TxId::new(#0000000000000000000000000000000000000000000000000000000000000000)
    const CURRENT_STAKING_CRED_BYTES: ByteArray = #01234567890123456789012345678901234567890123456789012346
    const CURRENT_STAKING_CRED: StakingCredential = StakingCredential::new_hash(StakingHash::new_stakekey(PubKeyHash::new(CURRENT_STAKING_CRED_BYTES)))
    const ADDRESS_IN: Address = Address::new(Credential::new_pubkey(PubKeyHash::new(PUB_KEY_HASH_BYTES)), Option[StakingCredential]::None)
    const ADDRESS_OUT: Address = ADDRESS_IN
    const QTY_IN: Int = 1000
    const VALUE: Value = Value::lovelace(QTY_IN)
    const CURRENT_DCERT: DCert = DCert::new_register(CURRENT_STAKING_CRED)
    const DCERT_DEREGISTER: DCert = DCert::new_deregister(CURRENT_STAKING_CRED)
    const POOL_ID: PubKeyHash = PubKeyHash::new(#1253751235)
    const POOL_VFR: PubKeyHash = PubKeyHash::new(#125375123598)
    const EPOCH: Int = 370
    const DCERT_DELEGATE: DCert = DCert::new_delegate(CURRENT_STAKING_CRED, POOL_ID)
    const DCERT_REGISTER_POOL: DCert = DCert::new_register_pool(POOL_ID, POOL_VFR)
    const DCERT_RETIRE_POOL: DCert = DCert::new_retire_pool(POOL_ID, EPOCH)
    const SCRIPT_CONTEXT: ScriptContext = ScriptContext::new_certifying(Tx::new(
        []TxInput{TxInput::new(TxOutputId::new(TX_ID_IN, 0), TxOutput::new(ADDRESS_IN, VALUE, OutputDatum::new_none()))},
        []TxInput{},
        []TxOutput{TxOutput::new(ADDRESS_OUT, VALUE, OutputDatum::new_none())},
        Value::lovelace(0),
        Value::ZERO,
        []DCert{CURRENT_DCERT, DCERT_DEREGISTER, DCERT_DELEGATE, DCERT_REGISTER_POOL, DCERT_RETIRE_POOL},
        Map[StakingCredential]Int{},
        TimeRange::ALWAYS,
        []PubKeyHash{},
        Map[ScriptPurpose]Int{},
        Map[DatumHash]Data{},
        TX_ID_IN
    ), CURRENT_DCERT)
    const STAKING_PURPOSE: StakingPurpose = SCRIPT_CONTEXT.get_staking_purpose()
`;



async function testBuiltins() {
    const ft = new FuzzyTest(/*Math.random()*/42, 100, true);

    /////////////
    // Data tests
    /////////////

    /*await ft.test([ft.constr(ft.newRand())], `
    testing data_tag
    func main(a: Data) -> Int {
        a.tag
    }`, ([a], res) => BigInt(a.data.index) == asInt(res));*/
    

    ////////////
    // Int tests
    ////////////

    /*await ft.test([], `
    testing int_eq_1
    func main() -> Bool {
        0 == 0
    }`, ([_], res) => asBool(res));*/

    await ft.test([ft.int(), ft.int()], `
    testing int_eq_2
    func main(a: Int, b: Int) -> Bool {
        a == b
    }`, ([a, b], res) => (asInt(a) === asInt(b)) === asBool(res));

    await ft.test([ft.int()], `
    testing int_neq_1
    func main(a: Int) -> Bool {
        a != a
    }`, ([_], res) => !asBool(res));

    await ft.test([ft.int(), ft.int()], `
    testing int_neq_2
    func main(a: Int, b: Int) -> Bool {
        a != b
    }`, ([a, b], res) => (asInt(a) === asInt(b)) === (!asBool(res)));

    await ft.test([ft.int()], `
    testing int_neg
    func main(a: Int) -> Int {
        -a
    }`, ([a], res) => asInt(a) === -asInt(res));

    await ft.test([ft.int()], `
    testing int_pos
    func main(a: Int) -> Int {
        +a
    }`, ([a], res) => asInt(a) === asInt(res));

    
    await ft.test([ft.int()], `
    testing int_add_0
    func main(a: Int) -> Int {
        a + 0
    }`, ([a], res) => asInt(a) === asInt(res));

    await ft.test([ft.int(), ft.int()], `
    testing int_add_2
    func main(a: Int, b: Int) -> Int {
        a + b
    }`, ([a, b], res) => asInt(a) + asInt(b) === asInt(res));

    await ft.test([ft.int()], `
    testing int_sub_0
    func main(a: Int) -> Int {
        a - 0
    }`, ([a], res) => asInt(a) === asInt(res));

    await ft.test([ft.int()], `
    testing int_sub_0_alt
    func main(a: Int) -> Int {
        0 - a
    }`, ([a], res) => asInt(a) === -asInt(res));

    await ft.test([ft.int()], `
    testing int_sub_self
    func main(a: Int) -> Int {
        a - a
    }`, ([_], res) => 0n === asInt(res));

    await ft.test([ft.int(), ft.int()], `
    testing int_sub_2
    func main(a: Int, b: Int) -> Int {
        a - b
    }`, ([a, b], res) => asInt(a) - asInt(b) === asInt(res));

    await ft.test([ft.int()], `
    testing int_mul_0
    func main(a: Int) -> Int {
        a*0
    }`, ([_], res) => 0n === asInt(res));

    await ft.test([ft.int()], `
    testing int_mul_1
    func main(a: Int) -> Int {
        a*1
    }`, ([a], res) => asInt(a) === asInt(res));

    await ft.test([ft.int(), ft.int()], `
    testing int_mul_2
    func main(a: Int, b: Int) -> Int {
        a * b
    }`, ([a, b], res) => asInt(a) * asInt(b) === asInt(res));

    await ft.test([ft.int()], `
    testing int_div_0

    func main(a: Int) -> Int {
        a / 0
    }`, ([_], res) => isError(res, "division by zero"));

    await ft.test([ft.int()], `
    testing int_div_0_alt
    func main(a: Int) -> Int {
        0 / a
    }`, ([_], res) => 0n === asInt(res));

    await ft.test([ft.int()], `
    testing int_div_1
    func main(a: Int) -> Int {
        a / 1
    }`, ([a], res) => asInt(a) === asInt(res));

    await ft.test([ft.int(-10, 10)], `
    testing int_div_1_alt
    func main(a: Int) -> Int {
        1 / a
    }`, ([a], res) => 
        asInt(a) === 0n ?
        isError(res, "division by zero") :
        (
            asInt(a) === 1n ? 
            1n === asInt(res) :
            (
                asInt(a) === -1n ?
                -1n === asInt(res) :
                0n === asInt(res)
            )
        )
    );

    await ft.test([ft.int(-20, 20)], `
    testing int_div_1_self
    func main(a: Int) -> Int {
        a / a
    }`, ([a], res) => 
        asInt(a) === 0n ?
        isError(res, "division by zero") :
        1n === asInt(res)
    );

    await ft.test([ft.int(), ft.int()], `
    testing int_div_2
    func main(a: Int, b: Int) -> Int {
        a / b
    }`, ([a, b], res) => 
        asInt(b) === 0n ? 
        isError(res, "division by zero") :
        asInt(a) / asInt(b) === asInt(res)
    );

    await ft.test([ft.int()], `
    testing int_mod_0
    func main(a: Int) -> Int {
        a % 0
    }`, ([_], res) => isError(res, "division by zero"));

    await ft.test([ft.int()], `
    testing int_mod_0_alt
    func main(a: Int) -> Int {
        0 % a
    }`, ([_], res) => 0n === asInt(res));

    await ft.test([ft.int()], `
    testing int_mod_1
    func main(a: Int) -> Int {
        a % 1
    }`, ([_], res) => 0n === asInt(res));

    await ft.test([ft.int(-20, 20)], `
    testing int_mod_1_alt
    func main(a: Int) -> Int {
        1 % a
    }`, ([a], res) => 
        asInt(a) === 0n ? 
        isError(res, "division by zero") :
        (
            asInt(a) === -1n || asInt(a) === 1n ?
            0n === asInt(res) :
            1n === asInt(res)
        )
    );

    await ft.test([ft.int(-10, 10)], `
    testing int_mod_1_self
    func main(a: Int) -> Int {
        a % a
    }`, ([a], res) => 
        asInt(a) === 0n ?
        isError(res, "division by zero") :
        0n === asInt(res)
    );

    await ft.test([ft.int(), ft.int(-10, 10)], `
    testing int_mod_2
    func main(a: Int, b: Int) -> Int {
        a % b
    }`, ([a, b], res) => 
        asInt(b) === 0n ? 
        isError(res, "division by zero") :
        asInt(a) % asInt(b) === asInt(res)
    );

    await ft.test([ft.int()], `
    testing int_geq_1
    func main(a: Int) -> Bool {
        a >= a
    }`, ([_], res) => asBool(res));

    await ft.test([ft.int(), ft.int()], `
    testing int_geq_2
    func main(a: Int, b: Int) -> Bool {
        a >= b
    }`, ([a, b], res) => (asInt(a) >= asInt(b)) === asBool(res));

    await ft.test([ft.int()], `
    testing int_gt_1
    func main(a: Int) -> Bool {
        a > a
    }`, ([_], res) => !asBool(res));

    await ft.test([ft.int(), ft.int()], `
    testing int_gt_2
    func main(a: Int, b: Int) -> Bool {
        a > b
    }`, ([a, b], res) => (asInt(a) > asInt(b)) === asBool(res));

    await ft.test([ft.int()], `
    testing int_leq_1
    func main(a: Int) -> Bool {
        a <= a
    }`, ([_], res) => asBool(res));

    await ft.test([ft.int(), ft.int()], `
    testing int_leq_2
    func main(a: Int, b: Int) -> Bool {
        a <= b
    }`, ([a, b], res) => (asInt(a) <= asInt(b)) === asBool(res));

    await ft.test([ft.int()], `
    testing int_lt_1
    func main(a: Int) -> Bool {
        a < a
    }`, ([a], res) => !asBool(res));

    await ft.test([ft.int(), ft.int()], `
    testing int_lt_2
    func main(a: Int, b: Int) -> Bool {
        a < b
    }`, ([a, b], res) => (asInt(a) < asInt(b)) === asBool(res));

    await ft.test([ft.int(), ft.int()], `
    testing int_min
    func main(a: Int, b: Int) -> Int {
        Int::min(a, b)
    }`, ([a, b], res) => {
        if (asInt(a) < asInt(b)) {
            return asInt(a) == asInt(res);
        } else {
            return asInt(b) == asInt(res);
        }
    });

    await ft.test([ft.int(), ft.int()], `
    testing int_max
    func main(a: Int, b: Int) -> Int {
        Int::max(a, b)
    }`, ([a, b], res) => {
        if (asInt(a) > asInt(b)) {
            return asInt(a) == asInt(res);
        } else {
            return asInt(b) == asInt(res);
        }
    });

    await ft.test([ft.int(), ft.int()], `
    testing int_bound_max
    func main(a: Int, b: Int) -> Int {
        a.bound_max(b)
    }`, ([a, b], res) => {
        if (asInt(a) < asInt(b)) {
            return asInt(a) == asInt(res);
        } else {
            return asInt(b) == asInt(res);
        }
    });

    await ft.test([ft.int(), ft.int()], `
    testing int_bound_min
    func main(a: Int, b: Int) -> Int {
        a.bound_min(b)
    }`, ([a, b], res) => {
        if (asInt(a) > asInt(b)) {
            return asInt(a) == asInt(res);
        } else {
            return asInt(b) == asInt(res);
        }
    });

    await ft.test([ft.int(), ft.int(), ft.int()], `
    testing int_bound
    func main(a: Int, b: Int, c: Int) -> Int{
        a.bound(Int::min(b, c), Int::max(b, c))
    }`, ([a, b, c], res) => {
        const lower = asInt(b) < asInt(c) ? asInt(b) : asInt(c);
        const upper = asInt(b) > asInt(c) ? asInt(b) : asInt(c);

        if (asInt(a) < lower) {
            return lower == asInt(res)
        } else if (asInt(a) > upper) {
            return upper == asInt(res)
        } else {
            return asInt(a) == asInt(res);
        }
    });

    await ft.test([ft.int()], `
    testing int_abs
    
    func main(a: Int) -> Int {
        a.abs()
    }`, ([a], res) => {
        let ai = asInt(a);

        if (ai < 0n) {
            ai *= -1n;
        }

        return asInt(res) === ai
    });

    await ft.test([ft.int()], `
    testing int_sqrt
    
    func main(a: Int) -> Int {
        Int::sqrt(a)
    }`, ([a_], res) => {
        const a = asInt(a_);

        if (a < 0n) {
            return isError(res, "negative number in sqrt");
        } else {
            return BigInt(Math.floor(Math.sqrt(Number(a)))) == asInt(res)
        }
    });

    await ft.test([ft.int()], `
    testing int_encode_zigzag
    
    func main(a: Int) -> Int {
        a.encode_zigzag()
    }`, ([a], res) => {
        const ai = asInt(a);
        const ri = asInt(res);
        const expected = ai < 0n ? -2n*ai - 1n : 2n*ai;

        return ri >= 0n && ri === expected;
    });

    await ft.test([ft.int()], `
    testing int_decode_zigzag
    
    func main(a: Int) -> Int {
        a.decode_zigzag()
    }`, ([a], res) => {
        const ai = asInt(a);

        if (ai < 0n) {
            return isError(res, "expected positive int");
        } else {
            const ri = asInt(res);
            const expected = ai % 2n == 0n ? ai/2n : (ai + 1n)/(-2n);

            return ri === expected;
        }
    });

    await ft.test([ft.int()], `
    testing int_encode_decode_zigzag

    func main(a: Int) -> Bool {
        a.encode_zigzag().decode_zigzag() == a
    }`, ([_], res) => asBool(res));

    await ft.test([ft.int(-10, 10)], `
    testing int_to_bool
    func main(a: Int) -> Bool {
        a.to_bool()
    }`, ([a], res) => (asInt(a) === 0n) === !asBool(res));

    await ft.test([ft.int()], `
    testing int_to_hex
    func main(a: Int) -> String {
        a.to_hex()
    }`, ([a], res) => (asInt(a).toString(16) === asString(res)));

    await ft.test([ft.int(0)], `
    testing int_to_little_endian
    func main(a: Int) -> ByteArray {
        a.to_little_endian()
    }`, ([a], res) => {
        const bs = asBytes(res);
        
        return bytesToBigInt(bs.reverse()) === asInt(a);
    });

    await ft.test([ft.int(0)], `
    testing int_to_big_endian
    func main(a: Int) -> ByteArray {
        a.to_big_endian()
    }`, ([a], res) => {
        const bs = asBytes(res);

        return bytesToBigInt(bs) == asInt(a);
    });

    await ft.test([ft.int(0)], `
    testing int_to_from_little_endian
    func main(a: Int) -> Bool {
        Int::from_little_endian(a.to_little_endian()) == a
    }`, ([_], res) => asBool(res));

    await ft.test([ft.int(0)], `
    testing int_to_from_big_endian
    func main(a: Int) -> Bool {
        Int::from_big_endian(a.to_big_endian()) == a
    }`, ([_], res) => asBool(res));

    await ft.test([], `
    testing int_to_base58
    func main() -> String {
        a = 0x287fb4cd;
        a.to_base58()
    }`, ([_], res) => asString(res) == "233QC4", 1);

    await ft.test([], `
    testing int_from_base58
    func main() -> Int {
        a = "233QC4";
        Int::from_base58(a)
    }`, ([_], res) => asInt(res) == BigInt(0x287fb4cd), 1);

    await ft.test([ft.int(0)], `
    testing int_to_from_base58
    func main(a: Int) -> Bool {
        Int::from_base58(a.to_base58()) == a
    }`, ([_], res) => asBool(res));

    await ft.test([ft.int()], `
    testing int_show
    func main(a: Int) -> String {
        a.show()
    }`, ([a], res) => asInt(a).toString() === asString(res));

    await ft.test([ft.int()], `
    testing int_parse
    func main(a: Int) -> Bool {
        Int::parse(a.show()) == a
    }`, ([a], res) => asBool(res));

    await ft.test([ft.bytes(0, 10)], `
    testing int_from_little_endian
    func main(bytes: ByteArray) -> Int {
        Int::from_little_endian(bytes)
    }`, ([bytes], res) => {
        let sum = 0n;
        asBytes(bytes).forEach((b, i) => {sum += BigInt(b)*(1n << BigInt(i*8))});

        return asInt(res) === sum;
    });

    await ft.test([ft.bytes(0, 10)], `
    testing int_from_big_endian
    func main(bytes: ByteArray) -> Int {
        Int::from_big_endian(bytes)
    }`, ([bytes], res) => {
        let sum = 0n;
        asBytes(bytes).reverse().forEach((b, i) => {sum += BigInt(b)*(1n << BigInt(i*8))});

        return asInt(res) === sum;
    });

    await ft.test([ft.int()], `
    testing int_from_data
    func main(a: Data) -> Int {
        Int::from_data(a)
    }`, ([a], res) => asInt(a) === asInt(res));

    await ft.test([ft.int()], `
    testing int_serialize
    func main(a: Int) -> ByteArray {
        a.serialize()
    }`, serializeProp);


    ////////////
    // Real tests
    ////////////

    await ft.test([ft.int(999999, 1000001)], `
    testing real_eq_1_0
    func main(a: Real) -> Bool {
        a == 1.0
    }`, ([a], res) => {
        const b = asBool(res);

        if (asInt(a) == 1000000n) {
            return b;
        } else {
            return !b;
        }
    });

    await ft.test([ft.real()], `
    testing real_eq_1
    func main(a: Real) -> Bool {
        a == a
    }`, ([_], res) => asBool(res));

    await ft.test([ft.real(), ft.real()], `
    testing real_eq_2
    func main(a: Real, b: Real) -> Bool {
        a == b
    }`, ([a, b], res) => (asReal(a) === asReal(b)) === asBool(res));

    await ft.test([ft.real()], `
    testing real_neq_1
    func main(a: Real) -> Bool {
        a != a
    }`, ([_], res) => !asBool(res));

    await ft.test([ft.real(), ft.real()], `
    testing real_neq_2
    func main(a: Real, b: Real) -> Bool {
        a != b
    }`, ([a, b], res) => (asReal(a) === asReal(b)) === (!asBool(res)));

    await ft.test([ft.real()], `
    testing real_neg
    func main(a: Real) -> Real {
        -a
    }`, ([a], res) => asReal(a) === -asReal(res));

    await ft.test([ft.real()], `
    testing real_pos
    func main(a: Real) -> Real {
        +a
    }`, ([a], res) => asReal(a) === asReal(res));

    
    await ft.test([ft.real()], `
    testing real_add_0
    func main(a: Real) -> Real {
        a + 0.0
    }`, ([a], res) => asReal(a) === asReal(res));

    await ft.test([ft.real(), ft.real()], `
    testing real_add_2
    func main(a: Real, b: Real) -> Real {
        a + b
    }`, ([a, b], res) => {
        // use integers to avoid issues with rounding errors
        return asInt(a) + asInt(b) === asInt(res)
    });

    await ft.test([ft.real()], `
    testing real_sub_0
    func main(a: Real) -> Real {
        a - 0.0
    }`, ([a], res) => asReal(a) === asReal(res));

    await ft.test([ft.real()], `
    testing real_sub_0_alt
    func main(a: Real) -> Real {
        0.0 - a
    }`, ([a], res) => asReal(a) === -asReal(res));

    await ft.test([ft.real()], `
    testing real_sub_self
    func main(a: Real) -> Real {
        a - a
    }`, ([_], res) => 0.0 === asReal(res));

    await ft.test([ft.real(), ft.real()], `
    testing real_sub_2
    func main(a: Real, b: Real) -> Real {
        a - b
    }`, ([a, b], res) => {
        // use integers to avoid issues with rounding errors
        return asInt(a) - asInt(b) === asInt(res)
    });

    await ft.test([ft.real()], `
    testing real_mul_0
    func main(a: Real) -> Real {
        a*0.0
    }`, ([_], res) => 0.0 === asReal(res));

    await ft.test([ft.real()], `
    testing real_mul_1
    func main(a: Real) -> Real {
        a*1.0
    }`, ([a], res) => {
        return asReal(a) === asReal(res)
    });

    await ft.test([ft.real(), ft.real()], `
    testing real_mul_2
    func main(a: Real, b: Real) -> Real {
        a * b
    }`, ([a, b], res) => {
        return asInt(a) * asInt(b) / REAL_ONE === asInt(res)
    });

    await ft.test([ft.real()], `
    testing real_div_0
    func main(a: Real) -> Real {
        a / 0.0
    }`, ([_], res) => isError(res, "division by zero"));

    await ft.test([ft.real()], `
    testing real_div_0_alt
    func main(a: Real) -> Real {
        0.0 / a
    }`, ([_], res) => 0.0 === asReal(res));

    await ft.test([ft.real()], `
    testing real_div_1
    func main(a: Real) -> Real {
        a / 1.0
    }`, ([a], res) => asReal(a) === asReal(res));

    await ft.test([ft.real(-0.00002, 0.00002)], `
    testing real_div_1_self
    func main(a: Real) -> Real {
        a / a
    }`, ([a], res) => 
        asInt(a) === 0n ?
        isError(res, "division by zero") :
        REAL_ONE === asInt(res)
    );

    await ft.test([ft.real(), ft.real()], `
    testing real_div_2
    func main(a: Real, b: Real) -> Real {
        a / b
    }`, ([a, b], res) => 
        asInt(b) === 0n ? 
        isError(res, "division by zero") :
        asInt(a) * REAL_ONE / asInt(b) === asInt(res)
    );

    await ft.test([ft.real()], `
    testing real_trunc
    func main(a: Real) -> Int {
        a.trunc()
    }`, ([a], res) => {
        return Number(asInt(res)) === Math.trunc(Number(asInt(a)/REAL_ONE))
    });

    await ft.test([ft.real()], `
    testing real_sqrt
    
    func main(x: Real) -> Real {
        Real::sqrt(x)
    }`, ([a_], res) => {
        const a = asInt(a_);

        if (a < 0n) {
            return isError(res, "negative number in sqrt");
        } else {
            return Math.abs(Math.sqrt(Number(a)/1000000) - Number(asInt(res))/1000000) < 1e-5;
        }
    });


    /////////////
    // Bool tests
    /////////////

    await ft.test([ft.bool(), ft.bool()], `
    testing bool_and
    func main(a: Bool, b: Bool) -> Bool {
        a && b
    }`, ([a, b], res) => (asBool(a) && asBool(b)) === asBool(res));

    // test branch deferral as well
    await ft.test([ft.bool(), ft.bool()], `
    testing bool_and_alt
    func main(a: Bool, b: Bool) -> Bool {
        Bool::and(() -> Bool {
            a
        }, () -> Bool {
            b && (0 / 0 == 0)
        })
    }`, ([a, b], res) => 
        asBool(a) ? (
            asBool(b) ?
            isError(res, "division by zero") :
            false === asBool(res)
        ) :
        false === asBool(res)
    );

    await ft.test([ft.bool(), ft.bool()], `
    testing bool_or
    func main(a: Bool, b: Bool) -> Bool {
        a || b
    }`, ([a, b], res) => (asBool(a) || asBool(b)) === asBool(res));

    await ft.test([ft.bool(), ft.bool()], `
    testing bool_or_alt
    func main(a: Bool, b: Bool) -> Bool {
        Bool::or(() -> Bool {
            a
        }, () -> Bool {
            b || (0 / 0 == 0)
        }) 
    }`, ([a, b], res) => 
        asBool(a) ? 
        true === asBool(res) :
        (
            asBool(b) ?
            true === asBool(res) :
            isError(res, "division by zero")
        )
    );

    await ft.test([ft.bool()], `
    testing bool_eq_1
    func main(a: Bool) -> Bool {
        a == a
    }`, ([a], res) => asBool(res));

    await ft.test([ft.bool(), ft.bool()], `
    testing bool_eq_2
    func main(a: Bool, b: Bool) -> Bool {
        a == b
    }`, ([a, b], res) => (asBool(a) === asBool(b)) === asBool(res));

    await ft.test([ft.bool()], `
    testing bool_neq_1
    func main(a: Bool) -> Bool {
        a != a
    }`, ([a], res) => !asBool(res));

    await ft.test([ft.bool(), ft.bool()], `
    testing bool_neq_2
    func main(a: Bool, b: Bool) -> Bool {
        a != b
    }`, ([a, b], res) => (asBool(a) === asBool(b)) === !asBool(res));

    await ft.test([ft.bool()], `
    testing bool_not
    func main(a: Bool) -> Bool {
        !a
    }`, ([a], res) => asBool(a) === !asBool(res));

    await ft.test([ft.bool()], `
    testing bool_to_int
    func main(a: Bool) -> Int {
        a.to_int()
    }`, ([a], res) => (asBool(a) ? 1n : 0n) === asInt(res));

    await ft.test([ft.bool()], `
    testing bool_show
    func main(a: Bool) -> String {
        a.show()
    }`, ([a], res) => (asBool(a) ? "true": "false") === asString(res));

    await ft.test([ft.bool()], `
    testing bool_from_data
    func main(a: Data) -> Bool {
        Bool::from_data(a)
    }`, ([a], res) => constrIndex(a) === (asBool(res) ? 1 : 0));

    await ft.test([ft.bool()], `
    testing bool_serialize
    func main(a: Bool) -> ByteArray {
        a.serialize()
    }`, serializeProp);

    await ft.test([ft.bool()], `
    testing bool_trace
    func main(a: Bool) -> Bool {
        a.trace("prefix")
    }`, ([a], res) => asBool(a) === asBool(res));


    ///////////////
    // String tests
    ///////////////

    await ft.test([ft.string()], `
    testing string_eq_1
    func main(a: String) -> Bool {
        a == a
    }`, ([_], res) => asBool(res));

    await ft.test([ft.string(), ft.string()], `
    testing string_eq_2
    func main(a: String, b: String) -> Bool {
        a == b
    }`, ([a, b], res) => (asString(a) === asString(b)) === asBool(res));

    await ft.test([ft.string()], `
    testing string_neq_1
    func main(a: String) -> Bool {
        a != a
    }`, ([_], res) => !asBool(res));

    await ft.test([ft.string(), ft.string()], `
    testing string_neq_2
    func main(a: String, b: String) -> Bool {
        a != b
    }`, ([a, b], res) => (asString(a) === asString(b)) === !asBool(res));

    await ft.test([ft.string()], `
    testing string_add_1
    func main(a: String) -> String {
        a + ""
    }`, ([a], res) => asString(a) === asString(res));

    await ft.test([ft.string()], `
    testing string_add_1_alt
    func main(a: String) -> String {
        "" + a
    }`, ([a], res) => asString(a) === asString(res));

    await ft.test([ft.string(), ft.string()], `
    testing string_add_2
    func main(a: String, b: String) -> String {
        a + b
    }`, ([a, b], res) => {
        let sa = asString(a);
        let sb = asString(b);
        let sRes = asString(res);

        return {
            "length": (sa + sb).length === sRes.length,
            "concat": (sa + sb) === sRes
        };
    });

    await ft.test([ft.string(0, 10), ft.string(0, 10)], `
    testing string_starts_with_1
    func main(a: String, b: String) -> Bool {
        (a+b).starts_with(a)
    }`, ([a, b], res) => asBool(res));

    await ft.test([ft.string(0, 10), ft.string(0, 10)], `
    testing string_starts_with_2
    func main(a: String, b: String) -> Bool {
        (a+b).starts_with(b)
    }`, ([a, b], res) => {
        let sa = asString(a);
        let sb = asString(b);
        
        let s = sa + sb;

        return s.startsWith(sb) === asBool(res);
    });

    await ft.test([ft.string(0, 10), ft.string(0, 10)], `
    testing string_ends_with_1
    func main(a: String, b: String) -> Bool {
        (a+b).ends_with(b)
    }`, ([a, b], res) => asBool(res));

    await ft.test([ft.string(0, 10), ft.string(0, 10)], `
    testing string_ends_with_2
    func main(a: String, b: String) -> Bool {
        (a+b).ends_with(a)
    }`, ([a, b], res) => {
        let sa = asString(a);
        let sb = asString(b);
        
        let s = sa + sb;

        return s.endsWith(sa) === asBool(res);
    });

    await ft.test([ft.string()], `
    testing string_encode_utf8
    func main(a: String) -> ByteArray {
        a.encode_utf8()
    }`, ([a], res) => {
        let bsa = Array.from((new TextEncoder()).encode(asString(a)));
        return equalsList(asBytes(res), bsa);
    });

    await ft.test([ft.string()], `
    testing string_from_data
    func main(a: Data) -> String {
        String::from_data(a)
    }`, ([a], res) => asString(a) == asString(res));

    await ft.test([ft.string()], `
    testing string_serialize
    func main(a: String) -> ByteArray {
        a.serialize()
    }`, serializeProp);


    //////////////////
    // ByteArray tests
    //////////////////

    let testByteArray = true;

    if (testByteArray) {
        await ft.test([ft.bytes()], `
        testing bytearray_eq_1
        func main(a: ByteArray) -> Bool {
            a == a
        }`, ([_], res) => asBool(res));

        await ft.test([ft.bytes(), ft.bytes()], `
        testing bytearray_eq_2
        func main(a: ByteArray, b: ByteArray) -> Bool {
            a == b
        }`, ([a, b], res) => equalsList(asBytes(a), asBytes(b)) === asBool(res));

        await ft.test([ft.bytes()], `
        testing bytearray_neq_1
        func main(a: ByteArray) -> Bool {
            a != a
        }`, ([_], res) => !asBool(res));

        await ft.test([ft.bytes(), ft.bytes()], `
        testing bytearray_neq_2
        func main(a: ByteArray, b: ByteArray) -> Bool {
            a != b
        }`, ([a, b], res) => equalsList(asBytes(a), asBytes(b)) === !asBool(res));

        await ft.test([ft.bytes()], `
        testing bytearray_add_1
        func main(a: ByteArray) -> ByteArray {
            a + #
        }`, ([a], res) => equalsList(asBytes(a), asBytes(res)));

        await ft.test([ft.bytes()], `
        testing bytearray_add_1_alt
        func main(a: ByteArray) -> ByteArray {
            # + a
        }`, ([a], res) => equalsList(asBytes(a), asBytes(res)));

        await ft.test([ft.bytes(), ft.bytes()], `
        testing bytearray_add_2
        func main(a: ByteArray, b: ByteArray) -> ByteArray {
            a + b
        }`, ([a, b], res) => equalsList(asBytes(a).concat(asBytes(b)), asBytes(res)));

		await ft.test([ft.bytes(0, 5), ft.bytes(0, 5)], `
		testing bytearray_lt
		func main(a: ByteArray, b: ByteArray) -> Bool {
			(a < b) == !(a >= b)
		}`, ([a, b], res) => asBool(res));

		await ft.test([ft.bytes(0, 5), ft.bytes(0, 5)], `
		testing bytearray_gt
		func main(a: ByteArray, b: ByteArray) -> Bool {
			(a > b) == !(a <= b)
		}`, ([a, b], res) => asBool(res));

        await ft.test([ft.bytes()], `
        testing bytearray_length
        func main(a: ByteArray) -> Int {
            a.length
        }`, ([a], res) => BigInt(asBytes(a).length) === asInt(res));

        await ft.test([ft.bytes(0, 64), ft.int(-10, 100)], `
        testing bytearray_slice_1
        func main(a: ByteArray, b: Int) -> ByteArray {
            a.slice(b, -1)
        }`, ([a, b], res) => {
            let bsa = asBytes(a);
            let n = bsa.length;

            let start = asInt(b) < 0n ? n + 1 + Number(asInt(b)) : Number(asInt(b));
            if (start < 0) {
                start = 0;
            } else if (start > n) {
                start = n;
            }

            let expected = bsa.slice(start);

            return equalsList(expected, asBytes(res));
        });

        await ft.test([ft.bytes(0, 64), ft.int(-10, 100), ft.int(-10, 100)], `
        testing bytearray_slice_2
        func main(a: ByteArray, b: Int, c: Int) -> ByteArray {
            a.slice(b, c)
        }`, ([a, b, c], res) => {
            let bsa = asBytes(a);
            let n = bsa.length;

            let start = asInt(b) < 0n ? n + 1 + Number(asInt(b)) : Number(asInt(b));
            if (start < 0) {
                start = 0;
            } else if (start > n) {
                start = n;
            }

            let end = asInt(c) < 0n ? n + 1 + Number(asInt(c)) : Number(asInt(c));
            if (end < 0) {
                end = 0;
            } else if (end > n) {
                end = n;
            }

            let expected = bsa.slice(start, end);

            return equalsList(expected, asBytes(res));
        });

        await ft.test([ft.bytes(0, 10), ft.bytes(0, 10)], `
        testing bytearray_starts_with_1
        func main(a: ByteArray, b: ByteArray) -> Bool {
            (a+b).starts_with(a)
        }`, ([a, b], res) => asBool(res));

        await ft.test([ft.bytes(0, 10), ft.bytes(0, 10)], `
        testing bytearray_starts_with_2
        func main(a: ByteArray, b: ByteArray) -> Bool {
            (a+b).starts_with(b)
        }`, ([a, b], res) => {
            let bsa = asBytes(a);
            let bsb = asBytes(b);
            
            let bs = bsa.concat(bsb);

            for (let i = 0; i < Math.min(bs.length, bsb.length); i++) {
                if (bs[i] != bsb[i]) {
                    return !asBool(res);
                }
            }

            return asBool(res);
        });

        await ft.test([ft.bytes(0, 10), ft.bytes(0, 10)], `
        testing bytearray_ends_with_1
        func main(a: ByteArray, b: ByteArray) -> Bool {
            (a+b).ends_with(b)
        }`, ([a, b], res) => asBool(res));

        await ft.test([ft.bytes(0, 10), ft.bytes(0, 10)], `
        testing bytearray_ends_with_2
        func main(a: ByteArray, b: ByteArray) -> Bool {
            (a+b).ends_with(a)
        }`, ([a, b], res) => {
            let bsa = asBytes(a);
            let bsb = asBytes(b);
            
            let bs = bsa.concat(bsb);

            for (let i = 0; i < Math.min(bs.length, bsa.length); i++) {
                if (bs[bs.length - 1 - i] != bsa[bsa.length - 1 - i]) {
                    return !asBool(res);
                }
            }

            return asBool(res);
        });

        await ft.test([ft.int(), ft.bytes(0, 10)], `
        testing bytearray_prepend
        func main(byte: Int, b: ByteArray) -> ByteArray {
            b.prepend(byte)
        }`, ([a, b], res) => {
			const ai = asInt(a);

			if (ai < 0n || ai >= 256n) {
				return isError(res);
			} else {
				const bi = asBytes(b);
				bi.unshift(Number(ai));

				return equalsList(bi, asBytes(res));
			}
        });

        await ft.test([ft.utf8Bytes()], `
        testing bytearray_decode_utf8_utf8
        func main(a: ByteArray) -> String {
            a.decode_utf8()
        }`, ([a], res) => asString(a) == asString(res));

        await ft.test([ft.bytes()], `
        testing bytearray_decode_utf8
        func main(a: ByteArray) -> String {
            a.decode_utf8()
        }`, ([a], res) => 
            isValidString(a) ?
            asString(a) == asString(res) :
            isError(res, "invalid utf-8")
        );

        await ft.test([ft.bytes(0, 10)], `
        testing bytearray_sha2
        func main(a: ByteArray) -> ByteArray {
            a.sha2()
        }`, ([a], res) => {
            let hasher = crypto.createHash("sha256");

            hasher.update(new DataView((new Uint8Array(asBytes(a))).buffer));

            return equalsList(Array.from(hasher.digest()), asBytes(res));
        });

        await ft.test([ft.bytes(55, 70)], `
        testing bytearray_sha2_alt
        func main(a: ByteArray) -> ByteArray {
            a.sha2()
        }`, ([a], res) => {
            let hasher = crypto.createHash("sha256");

            hasher.update(new DataView((new Uint8Array(asBytes(a))).buffer));

            return equalsList(Array.from(hasher.digest()), asBytes(res));
        });

        await ft.test([ft.bytes(0, 10)], `
        testing bytearray_sha3
        func main(a: ByteArray) -> ByteArray {
            a.sha3()
        }`, ([a], res) => {
            let hasher = crypto.createHash("sha3-256");

            hasher.update(new DataView((new Uint8Array(asBytes(a))).buffer));

            return equalsList(Array.from(hasher.digest()), asBytes(res));
        });

        await ft.test([ft.bytes(130, 140)], `
        testing bytearray_sha3_alt
        func main(a: ByteArray) -> ByteArray {
            a.sha3()
        }`, ([a], res) => {
            let hasher = crypto.createHash("sha3-256");

            hasher.update(new DataView((new Uint8Array(asBytes(a))).buffer));

            return equalsList(Array.from(hasher.digest()), asBytes(res));
        });

        // the crypto library only supports blake2b512 (and not blake2b256), so temporarily set digest size to 64 bytes for testing
        setBlake2bDigestSize(64);

        await ft.test([ft.bytes(0, 10)], `
        testing bytearray_blake2b
        func main(a: ByteArray) -> ByteArray {
            a.blake2b()
        }`, ([a], res) => {
            let hasher = crypto.createHash("blake2b512");

            hasher.update(new DataView((new Uint8Array(asBytes(a))).buffer));

            return equalsList(Array.from(hasher.digest()), asBytes(res));
        });

        await ft.test([ft.bytes(130, 140)], `
        testing bytearray_blake2b_alt
        func main(a: ByteArray) -> ByteArray {
            a.blake2b()
        }`, ([a], res) => {
            let hasher = crypto.createHash("blake2b512");

            hasher.update(new DataView((new Uint8Array(asBytes(a))).buffer));

            return equalsList(Array.from(hasher.digest()), asBytes(res));
        });

        setBlake2bDigestSize(32);

        await ft.test([ft.bytes()], `
        testing bytearray_show
        func main(a: ByteArray) -> String {
            a.show()
        }`, ([a], res) => {
            let s = Array.from(asBytes(a), byte => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join('');

            return s === asString(res);
        });

        await ft.test([ft.bytes()], `
        testing bytearray_from_data
        func main(a: Data) -> ByteArray {
            ByteArray::from_data(a)
        }`, ([a], res) => equalsList(asBytes(a), asBytes(res)));

        await ft.test([ft.bytes(0, 1024)], `
        testing bytearray_serialize
        func main(a: ByteArray) -> ByteArray {
            a.serialize()
        }`, serializeProp);
    }

    /////////////
    // List tests
    /////////////

    let testList = true;

    if (testList) {
        await ft.test([ft.int(1, 20), ft.int()], `
        testing list_new_const
        func main(n: Int, b: Int) -> Bool {
            lst: []Int = []Int::new_const(n, b);
            if (n < 0) {
                lst.length == 0
            } else {
                lst.length == n && lst.all((v: Int) -> Bool {v == b})
            }
        }`, ([a, b], res) => asBool(res));

        await ft.test([ft.int(-20, 20)], `
        testing list_new
        func main(n: Int) -> []Int {
            []Int::new(n, (i: Int) -> Int {i})
        }`, ([a], res) => {
            let n = Number(asInt(a));
            if (n < 0) {
                n = 0;
            }

            let lRes = asIntList(res);

            return n == lRes.length && lRes.every((v, i) => BigInt(i) == v);
        });

        await ft.test([ft.int(-20, 20)], `
        testing list_new
        func main(n: Int) -> Bool {
            lst: []Int = []Int::new(n, (i: Int) -> Int {i});
            if (n < 0) {
                lst.length == 0
            } else {
                lst.length == n && (
                    sum: Int = lst.fold((acc: Int, v: Int) -> Int {acc + v}, 0);
                    sum == n*(n-1)/2
                )
            }
        }`, ([a, b], res) => asBool(res));

        await ft.test([ft.list(ft.int(), 0, 20)], `
        testing list_eq_1
        func main(a: []Int) -> Bool {
            a == a
        }`, ([_], res) => asBool(res));

        await ft.test([ft.list(ft.int(), 0, 20)], `
        testing list_wrong_data
        func main(a: []Bool) -> Bool {
            a.any((item: Bool) -> {item})
        }`, ([a], res) => {
            if (asIntList(a).length == 0) {
                return !asBool(res);
            } else {
                return isError(res, "")
            }
        });

        await ft.test([ft.list(ft.int()), ft.list(ft.int())], `
        testing list_eq_2
        func main(a: []Int, b: []Int) -> Bool {
            (a == b) == ((a.length == b.length) && (
                []Int::new(a.length, (i: Int) -> Int {i}).all((i: Int) -> Bool {
                    a.get(i) == b.get(i)
                })
            ))
        }`, ([a, b], res) => asBool(res));

        await ft.test([ft.list(ft.int())], `
        testing list_neq_1
        func main(a: []Int) -> Bool {
            a != a
        }`, ([_], res) => !asBool(res));

        await ft.test([ft.list(ft.int()), ft.list(ft.int())], `
        testing list_neq_2
        func main(a: []Int, b: []Int) -> Bool {
            (a != b) == ((a.length != b.length) || (
                []Int::new(a.length, (i: Int) -> Int{i}).any((i: Int) -> Bool {
                    a.get(i) != b.get(i)
                })
            ))
        }`, ([a, b], res) => asBool(res));

        await ft.test([ft.list(ft.int())], `
        testing list_add_1
        func main(a: []Int) -> Bool {
            newLst: []Int = a + []Int{};
            newLst == a
        }`, ([a], res) => asBool(res));

        await ft.test([ft.list(ft.int())], `
        testing list_add_1_alt
        func main(a: []Int) -> Bool {
            newLst: []Int = []Int{} + a;
            newLst == a
        }`, ([a], res) => asBool(res));

        await ft.test([ft.list(ft.int()), ft.list(ft.int())], `
        testing list_add_2
        func main(a: []Int, b: []Int) -> Bool {
            newLst: []Int = a + b;
            n: Int = a.length;

            []Int::new(newLst.length, (i: Int) -> Int {i}).all(
                (i: Int) -> Bool {
                    if (i < n) {
                        newLst.get(i) == a.get(i)
                    } else {
                        newLst.get(i) == b.get(i - n)
                    }
                }
            )
        }`, ([a, b], res) => asBool(res));

        await ft.test([ft.list(ft.int(), 0, 50)], `
        testing list_length
        func main(a: []Int) -> Bool {
            a.length == a.fold((acc:Int, v: Int) -> Int {
                acc + if (v == v) {1} else {0}
            }, 0)
        }`, ([a], res) => asBool(res));

        await ft.test([ft.list(ft.int())], `
        testing list_head
        func main(a: []Int) -> Bool {
            if (a.length == 0) {
                true
            } else {
                a.head == a.get(0)
            }
        }`, ([a], res) => asBool(res));

        await ft.test([ft.list(ft.int())], `
        testing list_head_iterator
        func main(a: []Int) -> Bool {
            if (a.length == 0) {
                true
            } else {
                a.to_iterator().head() == a.get(0)
            }
        }`, ([a], res) => asBool(res));

        await ft.test([ft.list(ft.int())], `
        testing list_tail
        func main(a: []Int) -> Bool {
            if (a.length == 0) {
                true
            } else {
                tl: []Int = a.tail;
                ([]Int::new(tl.length, (i: Int) -> Int{i})).all(
                    (i: Int) -> Bool {
                        tl.get(i) == a.get(i+1)
                    }
                )
            }
        }`, ([a], res) => asBool(res));

        await ft.test([ft.list(ft.int(), 0, 10)], `
        testing list_is_empty
        func main(a: []Int) -> Bool {
            a.is_empty() == (a.length == 0)
        }`, ([a], res) => asBool(res));

        await ft.test([ft.list(ft.int(), 0, 10)], `
        testing list_is_empty_iterator
        func main(a: []Int) -> Bool {
            a.to_iterator().is_empty() == (a.length == 0)
        }`, ([a], res) => asBool(res));

        await ft.test([ft.list(ft.int(), 0, 2)], `
        testing list_get_singleton
        func main(a: []Int) -> Int {
            a.get_singleton()
        }`, ([a], res, isSimplified) => {
            const lst = asIntList(a);

            if (lst.length == 1) {
                return asInt(res) == lst[0];
            } else if (lst.length == 0) {
                return isError(res, "empty list");
            } else {
                return isError(res, isSimplified ? "" : "not a singleton list");
            }
        });

        await ft.test([ft.list(ft.int(0, 5), 0, 5)], `
        testing list_filter_get_singleton
        func main(a: []Int) -> Int {
            a.map((item: Int) -> {item*2}).filter((item: Int) -> {item == 0}).get_singleton()
        }`, ([a], res, isSimplified) => {
            const lst = asIntList(a);

            if (lst.filter(i => i == 0n).length == 1) {
                return asInt(res) == 0n;
            } else {
                return isError(res, isSimplified ? "" : "not a singleton list") || isError(res, "empty list");
            }
        });

        await ft.test([ft.list(ft.int(0, 5), -5, 5)], `
        testing list_filter_option
        func main(a: []Int) -> []Int {
            a.map_option((item: Int) -> Option[Int] {
                if (item > 0) {
                    Option[Int]::Some{item}
                } else {
                    Option[Int]::None
                }
            })
        }`, ([a], res) => {
            const resLst = asIntList(res);

            return resLst.every(i => i > 0n);
        });

        await ft.test([ft.list(ft.int(0, 5), 0, 5)], `
        testing list_filter_get_singleton_iterator
        func main(a: []Int) -> Int {
            a
                .to_iterator()
                .map((item: Int) -> {item*2})
                .filter((item: Int) -> {item == 0})
                .get_singleton()
        }`, ([a], res, isSimplified) => {
            const lst = asIntList(a);

            if (lst.filter(i => i == 0n).length == 1) {
                return asInt(res) == 0n;
            } else {
                return isError(res, isSimplified ? "" : "not a singleton iterator") || isError(res, "empty iterator, not a singleton");
            }
        });

        await ft.test([ft.list(ft.int()), ft.int(-10, 32), ft.int()], `
        testing list_set
        func main(a: []Int, b: Int, c: Int) -> []Int {
            a.set(b, c)
        }`, ([a, b, c], res) => {
            const lst = asIntList(a);
            const idx = Number(asInt(b))
            const val = asInt(c)

            if (idx < 0 || idx >= lst.length) {
                return isError(res, "index out of range");
            } else {
                lst[Number(idx)] = val;

                const resLst = asIntList(res);

                return equalsList(resLst, lst);
            }
        });

        await ft.test([ft.list(ft.int(), 0, 10), ft.int(-5, 15)], `
        testing list_split_at
        func main(a: []Int, b: Int) -> []Int {
            (c: []Int, d: []Int) = a.split_at(b);

            c + d
        }`, ([a, b], res) => {
            const lst = asIntList(a);
            const idx = Number(asInt(b));

            if (idx < 0 || idx >= lst.length) {
                return isError(res, "index out of range");
            } else {
                const resLst = asIntList(res);

                return equalsList(lst, resLst);
            }
        });

        await ft.test([ft.list(ft.int(), 0, 10), ft.int(-10, 15)], `
        testing list_drop
        func main(a: []Int, n: Int) -> []Int {
            a.drop(n)
        }`, ([lst_, n_], res) => {
            const lst = asIntList(lst_);
            const n = Number(asInt(n_));

            if (n > lst.length) {
                return isError(res, "empty list");
            } else if (n < 0) {
                return isError(res, "negative n in drop");
            } else {
                const resLst = asIntList(res);
                
                return ((n + resLst.length) == lst.length) && equalsList(resLst, lst.slice(n));
            }
        });

        await ft.test([ft.list(ft.int(), 0, 10), ft.int(-10, 15)], `
        testing list_drop_iterator
        func main(a: []Int, n: Int) -> []Int {
            []Int::from_iterator(
                a.to_iterator().drop(n)
            )
        }`, ([lst_, n_], res) => {
            const lst = asIntList(lst_);
            const n = Number(asInt(n_));

            if (n <= 0) {
                return equalsList(lst, asIntList(res));
            } else if (n >= lst.length) {
                return asIntList(res).length == 0;
            } else {
                const resLst = asIntList(res);
                
                return ((n + resLst.length) == lst.length) && equalsList(resLst, lst.slice(n));
            }
        });

        await ft.test([ft.list(ft.int(), 0, 10), ft.int(-10, 15)], `
        testing list_take_end
        func main(a: []Int, n: Int) -> []Int {
            a.take_end(n)
        }`, ([lst_, n_], res) => {
            const lst = asIntList(lst_);
            const n = Number(asInt(n_));
            

            if (n > lst.length) {
                return isError(res, "list too short");
            } else if (n < 0) {
                return isError(res, "negative n in take_end");
            } else {
                const resLst = asIntList(res);
                
                return (n == resLst.length) && equalsList(resLst, lst.slice(lst.length - n));
            }
        });

        await ft.test([ft.list(ft.int(), 0, 10), ft.int(-10, 15)], `
        testing list_take
        func main(a: []Int, n: Int) -> []Int {
            a.take(n)
        }`, ([lst_, n_], res) => {
            const lst = asIntList(lst_);
            const n = Number(asInt(n_));
            

            if (n > lst.length) {
                return isError(res, "empty list");
            } else if (n < 0) {
                return isError(res, "negative n in take");
            } else {
                const resLst = asIntList(res);
                
                return (n == resLst.length) && equalsList(resLst, lst.slice(0, n));
            }
        });

        await ft.test([ft.list(ft.int(), 0, 10), ft.int(-10, 15)], `
        testing list_drop_end
        func main(a: []Int, n: Int) -> []Int {
            a.drop_end(n)
        }`, ([lst_, n_], res) => {
            const lst = asIntList(lst_);
            const n = Number(asInt(n_));
            

            if (n > lst.length) {
                return isError(res, "list too short");
            } else if (n < 0) {
                return isError(res, "negative n in drop_end");
            } else {
                const resLst = asIntList(res);
                
                return (n + resLst.length == lst.length) && equalsList(resLst, lst.slice(0, lst.length - n));
            }
        });

        await ft.test([ft.list(ft.int()), ft.int()], `
        testing list_prepend
        func main(a: []Int, b: Int) -> Bool {
            newList: []Int = a.prepend(b);

            ([]Int::new(newList.length, (i: Int) -> Int{i})).all(
                (i: Int) -> Bool {
                    if (i == 0) {
                        newList.get(i) == b
                    } else {
                        newList.get(i) == a.get(i-1)
                    }
                }
            )
        }`, ([a, b], res) => asBool(res));

        await ft.test([ft.list(ft.int())], `
        testing list_any
        func main(a: []Int) -> Bool {
            (a + []Int{1}).any((x: Int) -> Bool {x > 0})
        }`, ([a], res) => asBool(res));

        await ft.test([ft.list(ft.int())], `
        testing list_all
        func main(a: []Int) -> Bool {
            (a + []Int{-1}).all((x: Int) -> Bool {x > 0})
        }`, ([a], res) => !asBool(res));

        await ft.test([ft.list(ft.int())], `
        testing list_find
        func main(a: []Int) -> Int {
            a.find((x: Int) -> Bool {x > 0})
        }`, ([a], res) => {
            let la = asIntList(a);

            if (la.every(i => i <= 0n)) {
                return isError(res, "not found");
            } else {
                return asInt(res) == la.find(i => i > 0n);
            }
        });

        await ft.test([ft.list(ft.int())], `
        testing list_find_safe
        func main(a: []Int) -> Option[Int] {
            a.find_safe((x: Int) -> Bool {x > 0})
        }`, ([a], res) => {
            let la = asIntList(a);

            if (la.every(i => i <= 0n)) {
                return asData(res).index == 1;
            } else {
                return asData(res).index == 0 && (asInt(asData(res).fields[0]) == la.find(i => i > 0n));
            }
        });

        
        await ft.test([ft.list(ft.int())], `
        testing list_filter
        func main(a: []Int) -> []Int {
            a.filter((x: Int) -> Bool {x > 0})
        }`, ([a], res) => {
            let la = asIntList(a).filter(i => i > 0n);
            let lRes = asIntList(res);

            return (la.length == lRes.length) && la.every((a, i) => a == lRes[i]);
        });

        await ft.test([ft.list(ft.int())], `
        testing list_filter_iterator
        func main(a: []Int) -> []Int {
            iter: Iterator[Int] = a.to_iterator();
            filtered: Iterator[Int] = iter.filter((x: Int) -> {
                x > 0
            });
            []Int::from_iterator(filtered)
        }`, ([a], res) => {
            let la = asIntList(a).filter(i => i > 0n);
            let lRes = asIntList(res);

            return (la.length == lRes.length) && la.every((a, i) => a == lRes[i]);
        });

        await ft.test([ft.list(ft.int())], `
        testing list_for_each
        func main(a: []Int) -> Bool {
            a.for_each((x: Int) -> {
                assert(x >= 0, "neg x found")
            });
            true
        }`, ([a], res, isSimplified) => {
            let la = asIntList(a);

            if (la.every(i => i >= 0n)) {
                return asBool(res);
            } else {
                return isError(res, isSimplified ? "" : "neg x found");
            }
        });

        await ft.test([ft.list(ft.int())], `
        testing list_fold
        func main(a: []Int) -> Int {
            a.fold((sum: Int, x: Int) -> Int {sum + x}, 0)
        }`, ([a], res) => {
            let la = asIntList(a);

            return la.reduce((sum, i) => sum + i, 0n) === asInt(res);
        });

        await ft.test([ft.list(ft.int())], `
        testing list_fold2_verbose
        func main(a: []Int) -> Int {
            (sa: Int, sb: Int) = a.fold((sum: () -> (Int, Int), x: Int) -> () -> (Int, Int) {
                (sa_: Int, sb_: Int) = sum();
                () -> {(sa_ + x, sb_ + x)}
            }, () -> {(0, 0)})();
            (sa + sb)/2
        }
        `, ([a], res) => {
            let la = asIntList(a);

            return la.reduce((sum, i) => sum + i, 0n) === asInt(res);
        });

        await ft.test([ft.list(ft.int())], `
        testing list_fold2
        func main(a: []Int) -> Int {
            (sum0: Int, sum1: Int) = a.fold2((sum0: Int, sum1: Int, x: Int) -> {(sum0 + x, sum1 + x)}, 0, 0);
            (sum0 + sum1)/2
        }`, ([a], res) => {
            let la = asIntList(a);

            return la.reduce((sum, i) => sum + i, 0n) === asInt(res);
        });

        await ft.test([ft.list(ft.int(0, 1))], `
        testing list_fold_lazy_0
        func main(a: []Int) -> Int {
            a.fold_lazy((x: Int, next: () -> Int) -> Int { if (x == 0) { 0 } else { x / next() } }, 0)
        }`, (_, res) => {
            return 0n === asInt(res);
        });

        await ft.test([ft.list(ft.int())], `
        testing list_fold_lazy
        func main(a: []Int) -> Int {
            a.fold_lazy((item: Int, sum: () -> Int) -> Int {item + sum()}, 0)
        }`, ([a], res) => {
            let la = asIntList(a);

            return la.reduce((sum, i) => sum + i, 0n) === asInt(res);
        });

        await ft.test([ft.list(ft.int())], `
        testing list_fold2_lazy
        func main(a: []Int) -> Int {
            (sum0: Int, sum1: Int) = a.fold2_lazy((item: Int, sum: () -> (Int, Int)) -> {
                (sum0: Int, sum1: Int) = sum(); 
                (item + sum0, item + sum1)
            }, 0, 0);
            (sum0 + sum1)/2
        }`, ([a], res) => {
            let la = asIntList(a);

            return la.reduce((sum, i) => sum + i, 0n) === asInt(res);
        });

        await ft.test([ft.list(ft.int())], `
        testing list_fold_lazy_prepend
        func main(a: []Int) -> []Int {
            a.fold_lazy((item: Int, next: () -> []Int) -> []Int {next().prepend(item)}, []Int{})
        }`, ([a], res) => {
            let la = asIntList(a);
            let lRes = asIntList(res);

            return la.every((x, i) => lRes[i] === x);
        });

        await ft.test([ft.list(ft.int())], `
        testing list_map
        func main(a: []Int) -> []Int {
            a.map((x: Int) -> Int {
                x*2
            })
        }`, ([a], res) => {
            let la = asIntList(a);
            let lRes = asIntList(res);

            return la.every((v, i) => v*2n == lRes[i]);
        });

        await ft.test([ft.list(ft.int())], `
        testing list_map_iterator
        func main(a: []Int) -> []Int {
            []Int::from_iterator(
                a.to_iterator().map((x: Int) -> Int {
                    x*2
                })
            )
        }`, ([a], res) => {
            let la = asIntList(a);
            let lRes = asIntList(res);

            return la.every((v, i) => v*2n == lRes[i]);
        });

        await ft.test([ft.list(ft.int())], `
        testing list_sort
        func main(lst: []Int) -> []Int {
            lst.sort((a: Int, b: Int) -> Bool {a < b})
        }`, ([a], res) => {
            let la = asIntList(a);
            let lRes = asIntList(res);

            la.sort((a, b) => Number(a - b));

            return la.every((v, i) => (v === lRes[i]));
        });

        await ft.test([ft.list(ft.int())], `
        testing list_from_data
        func main(a: Data) -> []Int {
            []Int::from_data(a)
        }`, ([a], res) => {
            let la = asIntList(a);
            let lRes = asIntList(res);

            return la.length == lRes.length && la.every((v, i) => v == lRes[i]);
        });

        await ft.test([ft.list(ft.int())], `
        testing list_serialize
        func main(a: []Int) -> ByteArray {
            a.serialize()
        }`, serializeProp);

        await ft.test([ft.list(ft.int())], `
        testing list_sum_int
        func main(a: []Int) -> Int {
            a.sum()
        }`, ([a], res) => {
            let la = asIntList(a);

            return la.reduce((sum, i) => sum + i, 0n) === asInt(res);
        });

        await ft.test([ft.list(ft.int())], `
        testing list_sum2_int_recurse
        func rec(a: []Int, b: []Int) -> Int {
            if (a.is_empty() || b.is_empty()) {
                0
            } else {
                a.head + b.head + rec(a.tail, b.tail)
            }
        }

        func main(a: []Int) -> Int {
            s: Int = rec(a, a);
            s/2
        }`, ([a], res) => {
            let la = asIntList(a);

            return la.reduce((sum, i) => sum + i, 0n) === asInt(res);
        });

        await ft.test([ft.list(ft.int())], `
        testing list_sum2_int_iterator
        func main(a: []Int) -> Int {
            s: Int = a.zip(a).fold((prev: Int, b: Int, c: Int) -> {prev+b+c}, 0);
            s/2
        }`, ([a], res) => {
            let la = asIntList(a);

            return la.reduce((sum, i) => sum + i, 0n) === asInt(res);
        });

        await ft.test([ft.list(ft.real())], `
        testing list_sum_real
        func main(a: []Real) -> Real {
            a.sum()
        }`, ([a], res) => {
            let la = asIntList(a);
    
            return la.reduce((sum, i) => sum + i, 0n) === asInt(res);
        });

        await ft.test([ft.list(ft.string(), 0, 4)], `
        testing list_join_string
        func main(a: []String) -> String {
            a.join()
        }`, ([a], res) => {
            let la = asStringList(a);

            return la.join("") === asString(res);
        });

        await ft.test([ft.list(ft.string(), 0, 4)], `
        testing list_join_string
        func main(a: []String) -> String {
            a.join(", ")
        }`, ([a], res) => {
            let la = asStringList(a);

            return la.join(", ") === asString(res);
        });

        await ft.test([ft.list(ft.bytes(), 0, 4)], `
        testing list_join_bytes
        func main(a: []ByteArray) -> ByteArray {
            a.join(#ff)
        }`, ([a], res) => {
            let la = asBytesList(a);

            /**
             * @type {number[]}
             */
            let flattened = [];

            for (let i = 0; i < la.length; i++) {
                if (i > 0) {
                    flattened.push(255);
                }

                flattened = flattened.concat(la[i]);
            }

            return equalsList(flattened, asBytes(res));
        });

        await ft.test([ft.list(ft.bytes(), 0, 4)], `
        testing list_join_bytes
        func main(a: []ByteArray) -> ByteArray {
            a.join(#00)
        }`, ([a], res) => {
            let la = asBytesList(a);

            /**
             * @type {number[]}
             */
            let flattened = [];

            for (let i = 0; i < la.length; i++) {
                if (i > 0) {
                    flattened.push(0);
                }

                flattened = flattened.concat(la[i]);
            }

            return equalsList(flattened, asBytes(res));
        });

        await ft.test([ft.list(ft.list(ft.int(), 0, 4), 0, 4)], `
        testing list_flatten
        func main(a: [][]Int) -> []Int {
            a.flatten()
        }`, ([a], res) => {
            let la = asNestedIntList(a);

            /**
             * @type {bigint[]}
             */
            let flattened = [];

            for (let item of la ) {
                flattened = flattened.concat(item);
            }

            return equalsList(flattened, asIntList(res));
        });


    }


    ////////////
    // Map tests
    ////////////

    const testMap = true;

    if (testMap) {
        await ft.test([ft.map(ft.int(), ft.int())], `
        testing map_eq
        func main(a: Map[Int]Int) -> Bool {
            a == a
        }`, ([_], res) => {
            return asBool(res);
        });

        await ft.test([ft.map(ft.int(), ft.int())], `
        testing map_neq
        func main(a: Map[Int]Int) -> Bool {
            a != a
        }`, ([_], res) => !asBool(res));

        await ft.test([ft.map(ft.int(), ft.int(), 0, 10), ft.map(ft.int(), ft.int(), 0, 10)], `
        testing map_add
        func main(a: Map[Int]Int, b: Map[Int]Int) -> Map[Int]Int {
            a + b
        }`, ([a, b], res) => asData(res).isSame(new MapData(a.data.map.concat(b.data.map))));

        await ft.test([ft.map(ft.int(), ft.int(), 0, 10), ft.int(), ft.int()], `
        testing map_prepend
        func main(a: Map[Int]Int, k: Int, v: Int) -> Map[Int]Int {
            a.prepend(k, v)
        }`, ([a, k, v], res) => {
            let expected = a.data.map;
            expected.unshift([new IntData(asInt(k)), new IntData(asInt(v))]);
            return asData(res).isSame(new MapData(expected));
        });

        await ft.test([ft.map(ft.int(), ft.int())], `
        testing map_head_key
        func main(a: Map[Int]Int) -> Int {
            a.head_key
        }
        `, ([a], res) => {
            if (a.data.map.length == 0) {
                return isError(res, "empty list");
            } else {
                return asInt(res) === asInt(a.data.map[0][0]);
            }
        });

        await ft.test([ft.map(ft.int(), ft.int())], `
        testing map_head_key_alt
        func main(a: Map[Int]Int) -> Int {
            (k: Int, _) = a.head(); k
        }
        `, ([a], res) => {
            if (a.data.map.length == 0) {
                return isError(res, "empty list");
            } else {
                return asInt(res) === asInt(a.data.map[0][0]);
            }
        });

        await ft.test([ft.map(ft.int(), ft.int())], `
        testing map_head_value
        func main(a: Map[Int]Int) -> Int {
            a.head_value
        }
        `, ([a], res) => {
            if (a.data.map.length == 0) {
                return isError(res, "empty list");
            } else {
                return asInt(res) === asInt(a.data.map[0][1]);
            }
        });

        await ft.test([ft.map(ft.int(), ft.int())], `
        testing map_head_value_alt
        func main(a: Map[Int]Int) -> Int {
            (_, v: Int) = a.head(); v
        }
        `, ([a], res) => {
            if (a.data.map.length == 0) {
                return isError(res, "empty list");
            } else {
                return asInt(res) === asInt(a.data.map[0][1]);
            }
        });

        await ft.test([ft.map(ft.int(), ft.int())], `
        testing map_length
        func main(a: Map[Int]Int) -> Int {
            a.length
        }`, ([a], res) => a.data.map.length == Number(asInt(res)));

        await ft.test([ft.map(ft.int(), ft.int())], `
        testing map_tail
        func main(a: Map[Int]Int) -> Map[Int]Int {
            a.tail
        }`, ([a], res) => {
            if (a.data.map.length == 0) {
                return isError(res, "empty list");
            } else {
                let la = a.data.map.slice(1);
                let lRes = asData(res).map.slice();

                return la.length == lRes.length && la.every(([k,v], i) => asInt(k) === asInt(lRes[i][0]) && asInt(v) === asInt(lRes[i][1]));
            }
        });

        await ft.test([ft.map(ft.int(), ft.int(), 0, 10)], `
        testing map_is_empty
        func main(a: Map[Int]Int) -> Bool {
            a.is_empty()
        }`, ([a], res) => (a.data.map.length == 0) === asBool(res));

        await ft.test([ft.int(), ft.int(), ft.int(), ft.int()], `
        testing map_get
        func main(a: Int, b: Int, c: Int, d: Int) -> Int {
            m = Map[Int]Int{a: b, c: d};
            m.get(c)
        }`, ([a, b, c, d], res) => asInt(d) === asInt(res));

        await ft.test([ft.int(), ft.int(), ft.int(), ft.int()], `
        testing map_get_safe_1
        func main(a: Int, b: Int, c: Int, d: Int) -> Bool {
            m = Map[Int]Int{a: b, c: d};
            m.get_safe(c) == Option[Int]::Some{d}
        }`, ([a, b, c, d], res) => asBool(res));

        await ft.test([ft.int(), ft.int(), ft.int(), ft.int()], `
        testing map_get_safe_2
        func main(a: Int, b: Int, c: Int, d: Int) -> Bool {
            m = Map[Int]Int{a: b, c: d};
            m.get_safe(d) == Option[Int]::None
        }`, ([a, b, c, d], res) => asBool(res));

        await ft.test([ft.map(ft.int(), ft.int())], `
        testing map_all
        func main(a: Map[Int]Int) -> Bool {
            a.all((k: Int, v: Int) -> Bool {
                k < v
            })
        }`, ([a], res) => (a.data.map.every(([k, v]) => asInt(k) < asInt(v))) === asBool(res));

        await ft.test([ft.map(ft.int(), ft.int())], `
        testing map_all_keys
        func main(a: Map[Int]Int) -> Bool {
            a.all((k: Int, _) -> Bool {
                k > 0
            })
        }`, ([a], res) => (a.data.map.every(([k, _]) => asInt(k) > 0n)) === asBool(res));

        await ft.test([ft.map(ft.int(), ft.int())], `
        testing map_all_values
        func main(a: Map[Int]Int) -> Bool {
            a.all((_, v: Int) -> Bool {
                v > 0
            })
        }`, ([a], res) => (a.data.map.every(([_, v]) => asInt(v) > 0n)) === asBool(res));

        await ft.test([ft.map(ft.int(), ft.int())], `
        testing map_any
        func main(a: Map[Int]Int) -> Bool {
            a.any((k: Int, v: Int) -> Bool {
                k < v
            })
        }`, ([a], res) => (a.data.map.some(([k, v]) => asInt(k) < asInt(v))) === asBool(res));

        await ft.test([ft.map(ft.int(), ft.int())], `
        testing map_any_key
        func main(a: Map[Int]Int) -> Bool {
            a.any((k: Int, _) -> Bool {
                k > 0
            })
        }`, ([a], res) => (a.data.map.some(([k, _]) => asInt(k) > 0n)) === asBool(res));

        await ft.test([ft.map(ft.int(), ft.int())], `
        testing map_any_value
        func main(a: Map[Int]Int) -> Bool {
            a.any((_, v: Int) -> Bool {
                v > 0
            })
        }`, ([a], res) => (a.data.map.some(([_, v]) => asInt(v) > 0n)) === asBool(res));

        await ft.test([ft.map(ft.int(), ft.int())], `
        testing map_filter
        func main(a: Map[Int]Int) -> Map[Int]Int {
            a.filter((k: Int, v: Int) -> Bool {
                k < v
            })
        }`, ([_], res) => asData(res).map.every(([k, v]) => asInt(k) < asInt(v)));

        await ft.test([ft.map(ft.int(), ft.int())], `
        testing map_filter_iterator
        func main(a: Map[Int]Int) -> Map[Int]Int {
            Map[Int]Int::from_iterator(
                a.to_iterator().filter((k: Int, v: Int) -> Bool {
                    k < v
                })
            )
        }`, ([_], res) => asData(res).map.every(([k, v]) => asInt(k) < asInt(v)));

        await ft.test([ft.map(ft.int(), ft.int())], `
        testing map_filter_by_key
        func main(a: Map[Int]Int) -> Map[Int]Int {
            a.filter((k: Int, _) -> Bool {
                k > 0
            })
        }`, ([_], res) => asData(res).map.every(([k, _]) => asInt(k) > 0n));

        await ft.test([ft.map(ft.int(), ft.int())], `
        testing map_filter_by_value
        func main(a: Map[Int]Int) -> Map[Int]Int {
            a.filter((_, v: Int) -> Bool {
                v > 0
            })
        }`, ([_], res) => asData(res).map.every(([_, v]) => asInt(v) > 0n));

        await ft.test([ft.map(ft.int(), ft.int())], `
        testing map_fold
        func main(a: Map[Int]Int) -> Int {
            a.fold((prev: Int, k: Int, v: Int) -> Int {
                prev + k + v
            }, 0)
        }`, ([a], res) => {
            let sum = 0n;
            a.data.map.forEach(([k, v]) => {
                sum += asInt(k) + asInt(v);
            });

            return sum === asInt(res);
        });

        await ft.test([ft.map(ft.int(), ft.int())], `
        testing map_fold_keys
        func main(a: Map[Int]Int) -> Int {
            a.fold((prev: Int, k: Int, _) -> Int {
                prev + k
            }, 0)
        }`, ([a], res) => {
            let sum = 0n;
            a.data.map.forEach(([k, _]) => {
                sum += asInt(k);
            });

            return sum === asInt(res);
        });

        await ft.test([ft.map(ft.int(), ft.int())], `
        testing map_fold_values
        func main(a: Map[Int]Int) -> Int {
            a.fold((prev: Int, _, v: Int) -> Int {
                prev + v
            }, 0)
        }`, ([a], res) => {
            let sum = 0n;
            a.data.map.forEach(([_, v]) => {
                sum += asInt(v);
            });

            return sum === asInt(res);
        });

        await ft.test([ft.map(ft.int(), ft.int())], `
        testing map_fold_lazy
        func main(a: Map[Int]Int) -> Int {
            a.fold_lazy((k: Int, v: Int, next: () -> Int) -> Int {
                k + v + next()
            }, 0)
        }`, ([a], res) => {
            let sum = 0n;
            a.data.map.forEach(([k, v]) => {
                sum += asInt(k) + asInt(v);
            });

            return sum === asInt(res);
        });

        await ft.test([ft.map(ft.int(), ft.int())], `
        testing map_fold_keys_lazy
        func main(a: Map[Int]Int) -> Int {
            a.fold_lazy((k: Int, _, next: () -> Int) -> Int {
                k + next()
            }, 0)
        }`, ([a], res) => {
            let sum = 0n;
            a.data.map.forEach(([k, _]) => {
                sum += asInt(k);
            });

            return sum === asInt(res);
        });

        await ft.test([ft.map(ft.int(), ft.int())], `
        testing map_fold_values_lazy
        func main(a: Map[Int]Int) -> Int {
            a.fold_lazy((_, v: Int, next: () -> Int) -> Int {
                v + next()
            }, 0)
        }`, ([a], res) => {
            let sum = 0n;
            a.data.map.forEach(([_, v]) => {
                sum += asInt(v);
            });

            return sum === asInt(res);
        });

        await ft.test([ft.map(ft.int(), ft.int())], `
        testing map_for_each
        func main(a: Map[Int]Int) -> Bool {
            a.for_each((key: Int, value: Int) -> {
                assert(key >= 0 && value >= 0, "neg key or value found")
            });
            true
        }`, ([a], res, isSimplified) => {
            let failed = false;

            a.data.map.forEach(([k, v]) => {
                if (asInt(k) < 0n || asInt(v) < 0n) {
                    failed = true;
                }
            });

            if (failed) {
                return isError(res, isSimplified ? "" : "neg key or value found");
            } else {
                return asBool(res);
            }
        });

        await ft.test([ft.map(ft.int(0, 10), ft.int())], `
        testing map_find_key
        func main(a: Map[Int]Int) -> Int {
            a.find_key((k: Int) -> Bool {k == 0})
        }`, ([a], res) => {
            if (a.data.map.some(([k, _]) => asInt(k) == 0n)) {
                return asInt(res) === 0n;
            } else {
                return isError(res, "not found");
            }
        });

        await ft.test([ft.map(ft.int(0, 10), ft.int())], `
        testing map_find_key_safe
        func main(a: Map[Int]Int) -> Option[Int] {
            a.find_key_safe((k: Int) -> Bool {k == 0})
        }`, ([a], res) => {            
            if (a.data.map.some(([k, _]) => asInt(k) == 0n)) {
                return asData(res).index == 0 && asInt(asData(res).fields[0]) === 0n;
            } else {
                return asData(res).index == 1;
            }
        });

        await ft.test([ft.map(ft.int(0, 10), ft.int())], `
        testing map_find_by_key
        func main(a: Map[Int]Int) -> Map[Int]Int {
            (k: Int, v: Int) = a.find((k: Int, _) -> {
                k == 0
            }); 
            Map[Int]Int{k: v}
        }`, ([a], res) => {
            if (a.data.map.some(([k, _]) => asInt(k) == 0n)) {
                return asData(res).map.length == 1 && asInt(asData(res).map[0][0]) === 0n;
            } else {
                return isError(res, "not found");
            }
        });

        await ft.test([ft.map(ft.int(0, 10), ft.int())], `
        testing map_find_value
        func main(a: Map[Int]Int) -> Int {
            (_, v: Int) = a.find((_, v: Int) -> Bool {v == 0}); v
        }`, ([a], res) => {
            if (a.data.map.some(([_, v]) => asInt(v) == 0n)) {
                return asInt(res) === 0n;
            } else {
                return isError(res, "not found");
            }
        });

        await ft.test([ft.map(ft.int(0, 10), ft.int())], `
        testing map_find_value_safe
        func main(a: Map[Int]Int) -> Option[Int] {
            (result: () -> (Int, Int), ok: Bool) = a.find_safe((_, v: Int) -> Bool {v == 0}); 
            if (ok) {
                (_, v: Int) = result(); 
                Option[Int]::Some{v}
            } else {
                Option[Int]::None
            }
        }`, ([a], res) => {            
            if (a.data.map.some(([_, v]) => asInt(v) == 0n)) {
                return asData(res).index == 0 && asInt(asData(res).fields[0]) === 0n;
            } else {
                return asData(res).index == 1;
            }
        });

        await ft.test([ft.map(ft.int(0, 10), ft.int())], `
        testing map_find_by_value
        func main(a: Map[Int]Int) -> Map[Int]Int {
            (result: () -> (Int, Int), ok: Bool) = a.find_safe((_, v: Int) -> Bool {v == 0});
            if (ok) {
                (k: Int, v: Int) = result();
                Map[Int]Int{k: v}
            } else {
                Map[Int]Int{}
            }
        }`, ([a], res) => {
            if (a.data.map.some(([_, v]) => asInt(v) == 0n)) {
                return asData(res).map.length == 1 && asInt(asData(res).map[0][1]) === 0n;
            } else {
                return asData(res).map.length == 0;
            }
        });

        await ft.test([ft.map(ft.int(), ft.int())], `
        testing map_map_keys
        func main(a: Map[Int]Int) -> Map[Int]Int {
            a.map((key: Int, value: Int) -> (Int, Int) {
                (key*2, value)
            })
        }`, ([a], res) => {
            let lRes = asData(res).map;

            return a.data.map.every(([k, _], i) => {
                return asInt(k)*2n === asInt(lRes[i][0]);
            });
        });

        await ft.test([ft.map(ft.int(), ft.int())], `
        testing map_map_values
        func main(a: Map[Int]Int) -> Map[Int]Int {
            a.map((key: Int, value: Int) -> (Int, Int) {
                (key, value*2)
            })
        }`, ([a], res) => {
            let lRes = asData(res).map;

            return a.data.map.every(([_, v], i) => {
                return asInt(v)*2n === asInt(lRes[i][1]);
            });
        });

        await ft.test([ft.map(ft.int(), ft.int())], `
        testing map_map_values_iterator
        func main(a: Map[Int]Int) -> Map[Int]Int {
            Map[Int]Int::from_iterator(
                a.to_iterator().map2((key: Int, value: Int) -> (Int, Int) {
                    (key, value*2)
                })
            )
        }`, ([a], res) => {
            let lRes = asData(res).map;

            return a.data.map.every(([_, v], i) => {
                return asInt(v)*2n === asInt(lRes[i][1]);
            });
        });

        await ft.test([ft.map(ft.int(0, 3), ft.int()), ft.int(0, 3)], `
        testing map_delete
        func main(m: Map[Int]Int, key: Int) -> Map[Int]Int {
            m.delete(key)
        }`, ([_, key], res) => {
            return asData(res).map.every((pair) => {
                return asInt(pair[0]) !== asInt(key);
            });
        });

        await ft.test([ft.map(ft.int(), ft.int()), ft.int(), ft.int()], `
        testing map_set
        func main(m: Map[Int]Int, key: Int, value: Int) -> Map[Int]Int {
            m.delete(key).set(key, value)
        }`, ([_, key, value], res) => {
            return asData(res).map.some((pair) => {
                return (asInt(pair[0]) === asInt(key)) && (asInt(pair[1]) === asInt(value));
            });
        });
            
        await ft.test([ft.map(ft.int(0, 10), ft.int()), ft.int(0, 10), ft.int()], `
        testing map_update
        func main(m: Map[Int]Int, key: Int, value: Int) -> Map[Int]Int {
            m.update(key, (old: Int) -> Int {old + value})
        }`, ([m, key, value], res) => {
            const inpMap = asData(m).map;

            if (inpMap.some(pair => asInt(pair[0]) == asInt(key))) {
                const resMap = asData(res).map;

                let ok = true;
                let first = true;

                inpMap.forEach((pair, i) => {
                    if (asInt(pair[0]) == asInt(key) && first) {
                        if (asInt(resMap[i][1]) != asInt(pair[1]) + asInt(value)) {
                            ok = false;
                        }

                        first = false;
                    } else if (asInt(resMap[i][1]) != asInt(pair[1])) {
                        ok = false;
                    }
                });

                return ok;
            } else {
                return isError(res, "key not found");
            }
        });

        await ft.test([ft.map(ft.int(), ft.int()), ft.int(), ft.int()], `
        testing map_update_safe
        func main(m: Map[Int]Int, key: Int, value: Int) -> Map[Int]Int {
            m.update_safe(key, (old: Int) -> Int {old + value})
        }`, ([m, key, value], res) => {
            const resMap = asData(res).map;

            return asData(m).map.every((pair, i) => {
                if (asInt(pair[0]) != asInt(resMap[i][0])) {
                    return false;
                }

                if (asInt(pair[0]) == asInt(key)) {
                    return asInt(resMap[i][1]) == asInt(pair[1]) + asInt(value);
                } else {
                    return asInt(resMap[i][1]) == asInt(pair[1]);
                }
            });
        });

        await ft.test([ft.map(ft.int(), ft.int())], `
        testing map_sort
        func main(m: Map[Int]Int) -> Map[Int]Int {
            m.sort((ak: Int, av: Int, bk: Int, bv: Int) -> Bool {
                ak + av < bk + bv
            })
        }`, ([_], res) => {
            return asData(res).map.every(([k, v], i) => {
                if (i > 0) {
                    let [kPrev, vPrev] = asData(res).map[i-1];

                    return (asInt(kPrev) + asInt(vPrev)) <= (asInt(k) + asInt(v));
                } else {
                    return true;
                }
            });
        });

        await ft.test([ft.map(ft.int(), ft.int())], `
        testing map_sort_by_key
        func main(m: Map[Int]Int) -> Map[Int]Int {
            m.sort((a: Int, _, b: Int, _) -> Bool {
                a < b
            })
        }`, ([_], res) => {
            return asData(res).map.every(([k, _], i) => {
                if (i > 0) {
                    let [kPrev, _] = asData(res).map[i-1];

                    return asInt(kPrev) <= asInt(k);
                } else {
                    return true;
                }
            });
        });

        await ft.test([ft.map(ft.int(), ft.int())], `
        testing map_sort_by_value
        func main(m: Map[Int]Int) -> Map[Int]Int {
            m.sort((_, a: Int, _, b: Int) -> Bool {
                a < b
            })
        }`, ([_], res) => {
            return asData(res).map.every(([_, v], i) => {
                if (i > 0) {
                    let [_, vPrev] = asData(res).map[i-1];

                    return asInt(vPrev) <= asInt(v);
                } else {
                    return true;
                }
            });
        });

        await ft.test([ft.map(ft.int(), ft.int())], `
        testing map_from_data
        func main(a: Data) -> Map[Int]Int {
            Map[Int]Int::from_data(a)
        }`, ([a], res) => a.data.isSame(asData(res)));

        await ft.test([ft.map(ft.int(), ft.int())], `
        testing map_serialize
        func main(a: Map[Int]Int) -> ByteArray {
            a.serialize()
        }`, serializeProp);
    }


    ///////////////
    // Option tests
    ///////////////

    await ft.test([ft.option(ft.int())], `
    testing option_eq_1
    func main(a: Option[Int]) -> Bool {
        a == a
    }`, ([_], res) => asBool(res));

    await ft.test([ft.option(ft.int(0, 5)), ft.option(ft.int(0, 5))], `
    testing option_eq_2
    func main(a: Option[Int], b: Option[Int]) -> Bool {
        a == b
    }`, ([a, b], res) => a.data.isSame(b.data) === asBool(res));

    await ft.test([ft.option(ft.int(0, 5)), ft.option(ft.int(0, 5))], `
    testing option_eq_2_alt
    func main(a: Option[Int], b: Option[Int]) -> Bool {
        a.switch{
            s: Some => s == b,
            n: None => n == b
        }
    }`, ([a, b], res) => a.data.isSame(b.data) === asBool(res));

    await ft.test([ft.option(ft.int())], `
    testing option_neq_1
    func main(a: Option[Int]) -> Bool {
        a != a
    }`, ([_], res) => !asBool(res));

    await ft.test([ft.option(ft.int(0, 5)), ft.option(ft.int(0, 5))], `
    testing option_neq_2
    func main(a: Option[Int], b: Option[Int]) -> Bool {
        a != b
    }`, ([a, b], res) => a.data.isSame(b.data) === !asBool(res));

    await ft.test([ft.option(ft.int(0, 5)), ft.option(ft.int(0, 5))], `
    testing option_neq_2_alt
    func main(a: Option[Int], b: Option[Int]) -> Bool {
        a.switch{
            s: Some => s != b,
            n: None => n != b
        }
    }`, ([a, b], res) => a.data.isSame(b.data) === !asBool(res));

    await ft.test([ft.option(ft.int())], `
    testing option_some
    func main(a: Option[Int]) -> Int {
        a.switch{
            s: Some => s.some,
            None    => -1
        }
    }`, ([a], res) => {
        if (a.data.index == 1) {
            return -1n === asInt(res);
        } else {
            return asInt(a.data.fields[0]) === asInt(res);
        }
    });

    await ft.test([ft.option(ft.int())], `
    testing option_unwrap
    func main(a: Option[Int]) -> Int {
        a.unwrap()
    }`, ([a], res) => {
        if (a.data.index == 1) {
            return isError(res, "empty list");
        } else {
            return asInt(a.data.fields[0]) === asInt(res);
        }
    });

    await ft.test([ft.option(ft.int())], `
    testing option_map
    func main(a: Option[Int]) -> Option[Int] {
        a.map((x: Int) -> {x*2})
    }`, ([a], res) => {
        if (a.data.index == 1) {
            return assertClass(res, UplcValue).data.index == 1;
        } else {
            return asInt(assertClass(res, UplcValue).data.fields[0]) == 2n*asInt(a.data.fields[0])
        }
    });

    await ft.test([ft.option(ft.int())], `
    testing option_map_to_bool
    func main(a: Option[Int]) -> Option[Bool] {
        a.map((x: Int) -> {x > 0})
    }`, ([a], res) => {
        if (a.data.index == 1) {
            return assertClass(res, UplcValue).data.index == 1;
        } else {
            return asBool(assertClass(res, UplcValue).data.fields[0]) == (asInt(a.data.fields[0]) > 0n)
        }
    });

    await ft.test([ft.option(ft.int())], `
    testing option_from_data
    func main(a: Data) -> Option[Int] {
        Option[Int]::from_data(a)
    }`, ([a], res) => a.data.isSame(asData(res)));

    await ft.test([ft.option(ft.int())], `
    testing option_serialize
    func main(a: Option[Int]) -> ByteArray {
        a.serialize()
    }`, serializeProp);

    await ft.test([ft.option(ft.int())], `
    testing option_sub_serialize
    func main(a: Option[Int]) -> ByteArray {
        a.switch{
            s: Some => s.serialize(),
            n: None => n.serialize()
        }
    }`, serializeProp);


    /////////////
    // Hash tests
    /////////////

    // all hash types are equivalent, so we only need to test one
    
    await ft.test([ft.bytes(0, 1)], `
    testing hash_new
    func main(a: PubKeyHash) -> Bool {
        []ByteArray{#70, #71, #72, #73, #74, #75, #76, #77, #78, #79, #7a, #7b, #7c, #7d, #7e, #7f}.any((ba: ByteArray) -> Bool {
            PubKeyHash::new(ba) == a
        })
    }`, ([a], res) => {
        return [[0x70], [0x71], [0x72], [0x73], [0x74], [0x75], [0x76], [0x77], [0x78], [0x79], [0x7a], [0x7b], [0x7c], [0x7d], [0x7e], [0x7f]].some(ba => equalsList(asBytes(a), ba)) === asBool(res);
    });

    await ft.test([ft.bytes()], `
    testing hash_eq_1
    func main(a: PubKeyHash) -> Bool {
        a == a
    }`, ([_], res) => asBool(res));

    await ft.test([ft.bytes(), ft.bytes()], `
    testing hash_eq_2
    func main(a: PubKeyHash, b: PubKeyHash) -> Bool {
        a == b
    }`, ([a, b], res) => equalsList(asBytes(a), asBytes(b)) === asBool(res));

    await ft.test([ft.bytes()], `
    testing hash_neq_1
    func main(a: PubKeyHash) -> Bool {
        a != a
    }`, ([_], res) => !asBool(res));

    await ft.test([ft.bytes(), ft.bytes()], `
    testing hash_neq_2
    func main(a: PubKeyHash, b: PubKeyHash) -> Bool {
        a != b
    }`, ([a, b], res) => equalsList(asBytes(a), asBytes(b)) === !asBool(res));

    await ft.test([ft.bytes(0, 5), ft.bytes(0, 5)], `
    testing hash_lt_geq
    func main(a: PubKeyHash, b: PubKeyHash) -> Bool {
        (a < b) != (a >= b)
    }`, ([a, b], res) => asBool(res));

    await ft.test([ft.bytes(0, 5), ft.bytes(0, 5)], `
    testing hash_gt_leq
    func main(a: PubKeyHash, b: PubKeyHash) -> Bool {
        (a > b) != (a <= b)
    }`, ([a, b], res) => asBool(res));

    await ft.test([ft.bytes(0, 10)], `
    testing hash_show
    func main(a: PubKeyHash) -> String {
        a.show()
    }`, ([a], res) => {
        let s = Array.from(asBytes(a), byte => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join('');

        return s === asString(res);
    });

    await ft.test([ft.bytes()], `
    testing hash_from_data
    func main(a: Data) -> PubKeyHash {
        PubKeyHash::from_data(a)
    }`, ([a], res) => a.data.isSame(asData(res)));

    await ft.test([ft.bytes()], `
    testing hash_serialize
    func main(a: PubKeyHash) -> ByteArray {
        a.serialize()
    }`, serializeProp);


    ///////////////////
    // AssetClass tests
    ///////////////////

    await ft.test([ft.bytes(0, 1), ft.bytes(0, 1)], `
    testing assetclass_new
    func main(a: ByteArray, b: ByteArray) -> Bool {
        AssetClass::new(MintingPolicyHash::new(a), b) == 
        AssetClass::ADA
    }`, ([a, b], res) => (asBytes(a).length == 0 && asBytes(b).length == 0) === asBool(res));

    await ft.test([ft.bytes(0, 1), ft.bytes(0, 1)], `
    testing assetclass_new
    func main(a: ByteArray, b: ByteArray) -> Bool {
        AssetClass::new(MintingPolicyHash::new(a), b) != AssetClass::ADA
    }`, ([a, b], res) => (asBytes(a).length == 0 && asBytes(b).length == 0) === !asBool(res));

    await ft.test([ft.bytes(), ft.bytes()], `
    testing assetclass_mph
    func main(a: MintingPolicyHash, b: ByteArray) -> Bool {
        AssetClass::new(a, b).mph == a
    }`, (_, res) => asBool(res));

    await ft.test([ft.bytes(), ft.bytes()], `
    testing assetclass_token_name
    func main(a: MintingPolicyHash, b: ByteArray) -> Bool {
        AssetClass::new(a, b).token_name == b
    }`, (_, res) => asBool(res));

    await ft.test([ft.constr(0, ft.bytes(), ft.bytes())], `
    testing assetclass_from_data
    func main(a: Data) -> AssetClass {
        AssetClass::from_data(a)
    }`, ([a], res) => a.data.isSame(asData(res)));

    await ft.test([ft.bytes(), ft.bytes()], `
    testing assetclass_serialize
    func main(a: ByteArray, b: ByteArray) -> ByteArray {
        AssetClass::new(MintingPolicyHash::new(a), b).serialize()
    }`, ([a, b], res) => {
        let ref = new ConstrData(0, [new ByteArrayData(asBytes(a)), new ByteArrayData(asBytes(b))]);
        return decodeCbor(asBytes(res)).isSame(ref);
    });


    ///////////////////
    // MoneyValue tests
    ///////////////////

    let testValue = true;

    if (testValue) {
        await ft.test([ft.int(-5, 5)], `
        testing value_is_zero
        func main(a: Int) -> Bool {
            Value::lovelace(a).is_zero()
        }`, ([a], res) => (asInt(a) === 0n) === asBool(res));

        await ft.test([ft.int()], `
        testing value_eq_1
        func main(a: Int) -> Bool {
            Value::lovelace(a) == Value::lovelace(a)
        }`, ([_], res) => asBool(res));

        await ft.test([ft.int(), ft.int()], `
        testing value_eq_2
        func main(a: Int, b: Int) -> Bool {
            Value::lovelace(a) == Value::lovelace(b)
        }`, ([a, b], res) => (asInt(a) === asInt(b)) === asBool(res));

        await ft.test([ft.int()], `
        testing value_neq_1
        func main(a: Int) -> Bool {
            Value::lovelace(a) != Value::lovelace(a)
        }`, ([_], res) => !asBool(res));

        await ft.test([ft.int(), ft.int()], `
        testing value_neq_2
        func main(a: Int, b: Int) -> Bool {
            Value::lovelace(a) != Value::lovelace(b)
        }`, ([a, b], res) => (asInt(a) === asInt(b)) === (!asBool(res)));

        await ft.test([ft.int()], `
        testing value_add_0
        func main(a: Int) -> Int {
            (Value::lovelace(a) + Value::ZERO).get(AssetClass::ADA)
        }`, ([a], res) => asInt(a) === asInt(res));

        await ft.test([ft.int(), ft.int()], `
        testing value_add_2
        func main(a: Int, b: Int) -> Int {
            (Value::lovelace(a) + Value::lovelace(b)).get(AssetClass::ADA)
        }`, ([a, b], res) => asInt(a) + asInt(b) === asInt(res));

        await ft.test([ft.int(), ft.int()], `
        testing value_sum
        func main(a: Int, b: Int) -> Int {
            Value::sum([]Value{Value::lovelace(a), Value::lovelace(b)}).get(AssetClass::ADA)
        }`, ([a, b], res) => asInt(a) + asInt(b) === asInt(res));

        await ft.test([ft.int()], `
        testing value_sub_0
        func main(a: Int) -> Int {
            (Value::lovelace(a) - Value::ZERO).get(AssetClass::ADA)
        }`, ([a], res) => asInt(a) === asInt(res));

        await ft.test([ft.int()], `
        testing value_sub_0_alt
        func main(a: Int) -> Int {
            (Value::ZERO - Value::lovelace(a)).get(AssetClass::ADA)
        }`, ([a], res) => asInt(a) === -asInt(res));

        await ft.test([ft.int()], `
        testing value_sub_self
        func main(a: Int) -> Bool {
            (Value::lovelace(a) - Value::lovelace(a)).is_zero()
        }`, ([_], res) => asBool(res));

        await ft.test([ft.int(), ft.int()], `
        testing value_sub_2
        func main(a: Int, b: Int) -> Int {
            (Value::lovelace(a) - Value::lovelace(b)).get(AssetClass::ADA)
        }`, ([a, b], res) => asInt(a) - asInt(b) === asInt(res));

        await ft.test([ft.int()], `
        testing value_mul_1
        func main(a: Int) -> Int {
            (Value::lovelace(a)*1).get(AssetClass::ADA)
        }`, ([a], res) => asInt(a) === asInt(res));

        await ft.test([ft.int(), ft.int()], `
        testing value_mul_2
        func main(a: Int, b: Int) -> Int {
            (Value::lovelace(a)*b).get(AssetClass::ADA)
        }`, ([a, b], res) => asInt(a)*asInt(b) === asInt(res));

        await ft.test([ft.int(), ft.int(), ft.int()], `
        testing value_mul_3
        const MY_NFT: AssetClass = AssetClass::new(MintingPolicyHash::new(#abc), #abc)
        func main(a: Int, b: Int, c: Int) -> Int {
            ((Value::lovelace(a) + Value::new(MY_NFT, b))*c).get(AssetClass::ADA)
        }`, ([a, b, c], res) => asInt(a)*asInt(c) === asInt(res));

        await ft.test([ft.int()],`
        testing value_div_1
        func main(a: Int) -> Int {
            (Value::lovelace(a)/1).get(AssetClass::ADA)
        }`, ([a], res) => asInt(a) === asInt(res));

        await ft.test([ft.int(), ft.int()],`
        testing value_div_2
        func main(a: Int, b: Int) -> Int {
            (Value::lovelace(a)/b).get(AssetClass::ADA)
        }`, ([a, b], res) => {
            if (asInt(b) === 0n) {
                return isError(res, "division by zero");
            } else {
                return asInt(a)/asInt(b) === asInt(res);
            }
        });

        await ft.test([ft.int(), ft.int(), ft.int()],`
        testing value_div_3
        const MY_NFT: AssetClass = AssetClass::new(MintingPolicyHash::new(#abc), #abc)
        func main(a: Int, b: Int, c: Int) -> Int {
            ((Value::lovelace(a) + Value::new(MY_NFT, b))/c).get(AssetClass::ADA)
        }`, ([a, b, c], res) => {
            if (asInt(c) === 0n) {
                return isError(res, "division by zero");
            } else {
                return asInt(a)/asInt(c) === asInt(res);
            }
        });

        await ft.test([ft.int()], `
        testing value_geq_1
        func main(a: Int) -> Bool {
            Value::lovelace(a) >= Value::lovelace(a)
        }`, ([_], res) => asBool(res));

        await ft.test([ft.int(), ft.int()], `
        testing value_geq_2
        func main(a: Int, b: Int) -> Bool {
            Value::lovelace(a) >= Value::lovelace(b)
        }`, ([a, b], res) => (asInt(a) >= asInt(b)) === asBool(res));

        await ft.test([ft.int(), ft.int()], `
        testing value_contains
        func main(a: Int, b: Int) -> Bool {
            Value::lovelace(a).contains(Value::lovelace(b))
        }`, ([a, b], res) => (asInt(a) >= asInt(b)) === asBool(res));

        await ft.test([ft.int()], `
        testing value_gt_1
        func main(a: Int) -> Bool {
            Value::lovelace(a) > Value::lovelace(a)
        }`, ([_], res) => !asBool(res));

        await ft.test([ft.int(), ft.int()], `
        testing value_gt_2
        func main(a: Int, b: Int) -> Bool {
            Value::lovelace(a) > Value::lovelace(b)
        }`, ([a, b], res) => (asInt(a) > asInt(b)) === asBool(res));

        await ft.test([ft.int()], `
        testing value_leq_1
        func main(a: Int) -> Bool {
            Value::lovelace(a) <= Value::lovelace(a)
        }`, ([_], res) => asBool(res));

        await ft.test([ft.int(), ft.int()], `
        testing value_leq_2
        func main(a: Int, b: Int) -> Bool {
            Value::lovelace(a) <= Value::lovelace(b)
        }`, ([a, b], res) => (asInt(a) <= asInt(b)) === asBool(res));

        await ft.test([ft.int()], `
        testing value_lt_1
        func main(a: Int) -> Bool {
            Value::lovelace(a) < Value::lovelace(a)
        }`, ([a], res) => !asBool(res));

        await ft.test([ft.int(), ft.int()], `
        testing value_lt_2
        func main(a: Int, b: Int) -> Bool {
            Value::lovelace(a) < Value::lovelace(b)
        }`, ([a, b], res) => (asInt(a) < asInt(b)) === asBool(res));

        await ft.test([ft.int()], `
        testing value_get
        func main(a: Int) -> Int {
            Value::lovelace(a).get(AssetClass::ADA)
        }`, ([a], res) => asInt(a) === asInt(res));

        await ft.test([ft.int()], `
        testing value_get_safe
        func main(a: Int) -> Int {
            Value::new(AssetClass::new(MintingPolicyHash::new(#1234), #1234), a).get_safe(AssetClass::ADA)
        }`, ([a], res) => 0n === asInt(res));

        await ft.test([ft.int()], `
        testing value_get_lovelace
        func main(a: Int) -> Int {
            v: Value = Value::new(AssetClass::new(MintingPolicyHash::new(#1234), #1234), a) + Value::lovelace(a*2);
            v.get_lovelace()
        }`, ([a], res) => asInt(a)*2n === asInt(res), 10);

        await ft.test([ft.int()], `
        testing value_get_assets
        func main(a: Int) -> Value {
            v: Value = Value::new(AssetClass::new(MintingPolicyHash::new(#1234), #1234), a) + Value::lovelace(a*2);
            v.get_assets()
        }`, ([a], res) => {
            if (res instanceof UplcValue) {
                return res.data.map.length == 1 && res.data.map[0][1].map[0][1].int == asInt(a);
            } else {
                return false;
            }
        });

        await ft.test([ft.bytes(10, 10), ft.string(5,5), ft.int(), ft.string(3,3), ft.int()], `
        testing value_get_policy
        func main(mph_bytes: ByteArray, tn_a: ByteArray, qty_a: Int, tn_b: ByteArray, qty_b: Int) -> Bool {
            sum: Value = Value::new(AssetClass::new(MintingPolicyHash::new(mph_bytes), tn_a), qty_a) + Value::new(AssetClass::new(MintingPolicyHash::new(mph_bytes), tn_b), qty_b);
            sum.get_policy(MintingPolicyHash::new(mph_bytes)) == Map[ByteArray]Int{tn_a: qty_a, tn_b: qty_b}
        }`, ([_], res) => asBool(res));

        await ft.test([ft.bool(), ft.bytes(11, 11), ft.bytes(10, 10), ft.string(5,5), ft.int(), ft.string(3,3), ft.int()], `
        testing value_contains_policy
        func main(pick1: Bool, mph_bytes1: ByteArray, mph_bytes2: ByteArray, tn_a: ByteArray, qty_a: Int, tn_b: ByteArray, qty_b: Int) -> Bool {
            mph_bytes: ByteArray = if (pick1) {mph_bytes1} else {mph_bytes2};
            sum: Value = Value::new(AssetClass::new(MintingPolicyHash::new(mph_bytes1), tn_a), qty_a) + Value::new(AssetClass::new(MintingPolicyHash::new(mph_bytes1), tn_b), qty_b);
            sum.contains_policy(MintingPolicyHash::new(mph_bytes))
        }`, ([pick1, _], res) => asBool(pick1) === asBool(res));

        await ft.test([ft.bytes(11, 11), ft.bytes(10, 10), ft.string(5,5), ft.int(), ft.string(3,3), ft.int()], `
        testing value_show
        func main(mph_bytes1: ByteArray, mph_bytes2: ByteArray, tn_a: ByteArray, qty_a: Int, tn_b: ByteArray, qty_b: Int) -> String {
            sum: Value = Value::new(AssetClass::new(MintingPolicyHash::new(mph_bytes1), tn_a), qty_a) + Value::new(AssetClass::new(MintingPolicyHash::new(mph_bytes2), tn_b), qty_b);
            sum.show()
        }`, ([mph1, mph2, tn_a, qty_a, tn_b, qty_b], res) => {
            const expected = [
                `${bytesToHex(asBytes(mph1))}.${bytesToHex(asBytes(tn_a))}: ${asInt(qty_a)}`,
                `${bytesToHex(asBytes(mph2))}.${bytesToHex(asBytes(tn_b))}: ${asInt(qty_b)}`
            ].join("\n");
            
            const got = bytesToText(asBytes(res));

            return got.trim() == expected.trim();
        }, 5);

        await ft.test([ft.map(ft.bytes(), ft.map(ft.bytes(), ft.int()))], `
        testing value_from_data
        func main(a: Data) -> Value {
            Value::from_data(a)
        }`, ([a], res) => a.data.isSame(asData(res)));

        await ft.test([ft.map(ft.bytes(), ft.map(ft.bytes(), ft.int()))], `
        testing value_from_map
        func main(a: Map[MintingPolicyHash]Map[ByteArray]Int) -> Value {
            Value::from_map(a)
        }`, ([a], res) => a.data.isSame(asData(res)));

        await ft.test([ft.map(ft.bytes(), ft.map(ft.bytes(), ft.int()))], `
        testing value_to_map
        func main(a: Value) -> Int {
            a.to_map().length
        }`, ([a], res) => a.data.map.length === Number(asInt(res)));

        await ft.test([ft.int(), ft.bytes(), ft.bytes()], `
        testing value_serialize
        func main(qty: Int, mph: ByteArray, name: ByteArray) -> ByteArray {
            Value::new(AssetClass::new(MintingPolicyHash::new(mph), name), qty).serialize()
        }`, ([qty, mph, name], res) => {
            let ref = new MapData([
                [
                    new ByteArrayData(asBytes(mph)),
                    new MapData([[
                        new ByteArrayData(asBytes(name)),
                        new IntData(asInt(qty)),
                    ]])
                ]
            ]);
            
            return decodeCbor(asBytes(res)).isSame(ref);
        });
    }


    ///////////////
    // Ledger tests
    ///////////////

    const testScriptContext = true;

    if (testScriptContext) {
        await ft.testParams({"QTY": ft.int()}, ["SCRIPT_CONTEXT"], `
        testing scriptcontext_eq
        func main(ctx: ScriptContext) -> Bool {
            ctx == ctx
        }
        ${spendingScriptContextParam(false)}
        `, ([_], res) => asBool(res), 10);

        await ft.testParams({"QTY": ft.int()}, ["SCRIPT_CONTEXT"], `
        testing scriptcontext_neq
        func main(ctx: ScriptContext) -> Bool {
            ctx != ctx
        }
        ${spendingScriptContextParam(false)}
        `, ([_], res) => !asBool(res), 10);

        await ft.testParams({"QTY": ft.int()}, ["SCRIPT_CONTEXT"], `
        testing scriptcontext_tx
        func main(ctx: ScriptContext) -> Tx {
            ctx.tx
        }
        ${spendingScriptContextParam(false)}
        `, ([ctx], res) => ctx.data.fields[0].isSame(asData(res)), 10);

        await ft.testParams({"QTY": ft.int()}, ["SCRIPT_CONTEXT"], `
        testing scriptcontext_get_spending_purpose_output_id
        func main(ctx: ScriptContext) -> TxOutputId {
            ctx.get_spending_purpose_output_id()
        }
        ${spendingScriptContextParam(false)}
        `, ([ctx], res) => ctx.data.fields[1].fields[0].isSame(asData(res)), 10);

        await ft.testParams({"TX_ID_IN_BYTES": ft.bytes()}, ["FIRST_TX_INPUT", "SCRIPT_CONTEXT"], `
        testing scriptcontext_get_current_input
        func main(input: TxInput, ctx: ScriptContext) -> Bool {
            ctx.get_current_input() == input
        }
        ${spendingScriptContextParam(false)}
        `, ([ctx], res) => asBool(res), 10);

        await ft.testParams({"CURRENT_VALIDATOR_BYTES": ft.bytes(), "QTY_2": ft.int()}, ["QTY_2", "SCRIPT_CONTEXT"], `
        testing scriptcontext_get_cont_outputs
        func main(lovelace: Int, ctx: ScriptContext) -> Bool {
            outputs: []TxOutput = ctx.get_cont_outputs();
            outputs.length == 1 && outputs.head.value == Value::lovelace(lovelace)
        }
        ${spendingScriptContextParam(false)}
        `, ([ctx], res) => asBool(res), 5);

        await ft.testParams({"CURRENT_VALIDATOR_BYTES": ft.bytes()}, ["CURRENT_VALIDATOR", "SCRIPT_CONTEXT"], `
        testing scriptcontext_get_current_validator_hash
        func main(hash: ValidatorHash, ctx: ScriptContext) -> Bool {
            ctx.get_current_validator_hash() == hash
        }
        ${spendingScriptContextParam(false)}
        `, ([ctx], res) => asBool(res), 10);

        await ft.testParams({"CURRENT_MPH_BYTES": ft.bytes()}, ["CURRENT_MPH", "SCRIPT_CONTEXT"], `
        testing scriptcontext_get_current_minting_policy_hash
        func main(hash: MintingPolicyHash, ctx: ScriptContext) -> Bool {
            ctx.get_current_minting_policy_hash() == hash
        }
        ${mintingScriptContextParam}
        `, ([ctx], res) => asBool(res), 10);

        await ft.testParams({"CURRENT_STAKING_CRED_BYTES": ft.bytes()}, ["CURRENT_STAKING_CRED", "SCRIPT_CONTEXT"], `
        testing scriptcontext_get_staking_purpose
        func main(cred: StakingCredential, ctx: ScriptContext) -> Bool {
            ctx.get_staking_purpose().switch{
                r: Rewarding => r.credential == cred,
                Certifying => false
            }
        }
        ${rewardingScriptContextParam}
        `, ([ctx], res) => asBool(res), 10);

        await ft.testParams({"CURRENT_VALIDATOR_BYTES": ft.bytes()}, ["SCRIPT_CONTEXT"], `
        testing scriptcontext_from_data
        func main(ctx: Data) -> ScriptContext {
            ScriptContext::from_data(ctx)
        }
        ${spendingScriptContextParam(false)}
        `, ([ctx], res) => asData(res).isSame(ctx.data), 10);

        await ft.testParams({"CURRENT_VALIDATOR_BYTES": ft.bytes()}, ["SCRIPT_CONTEXT"], `
        testing scriptcontext_serialize
        func main(ctx: ScriptContext) -> ByteArray {
            ctx.serialize()
        }
        ${spendingScriptContextParam(false)}
        `, serializeProp, 10);
    }

    const testStakingPurpose = true;

    if (testStakingPurpose) {
        await ft.testParams({"CURRENT_STAKING_CRED_BYTES": ft.bytes()}, ["SCRIPT_CONTEXT"], `
        testing stakingpurpose_eq
        func main(ctx: ScriptContext) -> Bool {
            sp: StakingPurpose = ctx.get_staking_purpose();
            sp == sp
        }
        ${rewardingScriptContextParam}
        `, ([_], res) => asBool(res), 5);

        await ft.testParams({"CURRENT_STAKING_CRED_BYTES": ft.bytes()}, ["SCRIPT_CONTEXT"], `
        testing stakingpurpose_neq
        func main(ctx: ScriptContext) -> Bool {
            sp: StakingPurpose = ctx.get_staking_purpose();
            sp != sp
        }
        ${certifyingScriptContextParam}
        `, ([_], res) => !asBool(res), 5);

        await ft.testParams({"CURRENT_STAKING_CRED_BYTES": ft.bytes()}, ["STAKING_PURPOSE"], `
        testing stakingpurpose_from_data
        func main(sp: Data) -> StakingPurpose {
            StakingPurpose::from_data(sp)
        }
        ${rewardingScriptContextParam}
        `, ([sp], res) => sp.data.isSame(asData(res)), 5);

        await ft.testParams({"CURRENT_STAKING_CRED_BYTES": ft.bytes()}, ["SCRIPT_CONTEXT"], `
        testing stakingpurpose_serialize
        func main(ctx: ScriptContext) -> ByteArray {
            ctx.get_staking_purpose().serialize()
        }
        ${rewardingScriptContextParam}
        `, ([ctx], res) => {
            return decodeCbor(asBytes(res)).isSame(ctx.data.fields[1]);
        }, 5);

        await ft.testParams({"CURRENT_STAKING_CRED_BYTES": ft.bytes()}, ["STAKING_PURPOSE"], `
        testing stakingpurpose_rewarding_eq
        func main(sp: StakingPurpose::Rewarding) -> Bool {
            sp == sp
        }
        ${rewardingScriptContextParam}
        `, ([_], res) => asBool(res), 5);

        await ft.testParams({"CURRENT_STAKING_CRED_BYTES": ft.bytes()}, ["STAKING_PURPOSE"], `
        testing stakingpurpose_rewarding_neq
        func main(sp: StakingPurpose::Rewarding) -> Bool {
            sp != sp
        }
        ${rewardingScriptContextParam}
        `, ([_], res) => !asBool(res), 5);

        await ft.testParams({"CURRENT_STAKING_CRED_BYTES": ft.bytes()}, ["STAKING_PURPOSE"], `
        testing stakingpurpose_rewarding_serialize
        func main(sp: StakingPurpose::Rewarding) -> ByteArray {
        sp.serialize()
        }
        ${rewardingScriptContextParam}
        `, serializeProp, 5);

        await ft.testParams({"CURRENT_STAKING_CRED_BYTES": ft.bytes()}, ["STAKING_PURPOSE"], `
        testing stakingpurpose_certifying_eq
        func main(sp: StakingPurpose::Certifying) -> Bool {
            sp == sp
        }
        ${certifyingScriptContextParam}
        `, ([_], res) => asBool(res), 5);

        await ft.testParams({"CURRENT_STAKING_CRED_BYTES": ft.bytes()}, ["STAKING_PURPOSE"], `
        testing stakingpurpose_certifying_neq
        func main(sp: StakingPurpose::Certifying) -> Bool {
            sp != sp
        }
        ${certifyingScriptContextParam}
        `, ([_], res) => !asBool(res), 5);

        await ft.testParams({"CURRENT_STAKING_CRED_BYTES": ft.bytes()}, ["STAKING_PURPOSE"], `
        testing stakingpurpose_dcert
        func main(sp: StakingPurpose::Certifying) -> Bool {
            sp.dcert == sp.dcert
        }
        ${certifyingScriptContextParam}
        `, ([_], res) => asBool(res), 5);

        await ft.testParams({"CURRENT_STAKING_CRED_BYTES": ft.bytes()}, ["STAKING_PURPOSE"], `
        testing stakingpurpose_certifying_serialize
        func main(sp: StakingPurpose::Certifying) -> ByteArray {
        sp.serialize()
        }
        ${certifyingScriptContextParam}
        `, serializeProp, 5);
    }

    const testDCert = true;

    if (testDCert) {
        await ft.testParams({"CURRENT_STAKING_CRED_BYTES": ft.bytes()}, ["CURRENT_DCERT"], `
        testing dcert_eq
        func main(ca: DCert) -> Bool {
            ca == ca
        }
        ${certifyingScriptContextParam}
        `, ([_], res) => asBool(res), 5);

        await ft.testParams({"CURRENT_STAKING_CRED_BYTES": ft.bytes()}, ["CURRENT_DCERT"], `
        testing dcert_neq
        func main(ca: DCert) -> Bool {
            ca != ca
        }
        ${certifyingScriptContextParam}
        `, ([_], res) => !asBool(res), 5);

        await ft.testParams({"CURRENT_STAKING_CRED_BYTES": ft.bytes()}, ["CURRENT_DCERT"], `
        testing dcert_from_data
        func main(ca: Data) -> DCert {
            DCert::from_data(ca)
        }
        ${certifyingScriptContextParam}
        `, ([a], res) => a.data.isSame(asData(res)), 5);

        await ft.testParams({"CURRENT_STAKING_CRED_BYTES": ft.bytes()}, ["CURRENT_DCERT"], `
        testing dcert_serialize
        func main(ca: DCert) -> ByteArray {
            ca.serialize()
        }
        ${certifyingScriptContextParam}
        `, serializeProp, 5);

        await ft.testParams({"CURRENT_STAKING_CRED_BYTES": ft.bytes()}, ["SCRIPT_CONTEXT"], `
        testing dcert_member_eq
        func main(ctx: ScriptContext) -> Bool {
            ctx.tx.dcerts.all((dcert: DCert) -> Bool {
                dcert.switch{
                    r: Register => r == r,
                    d: Deregister => d == d,
                    del: Delegate => del == del,
                    rp: RegisterPool => rp == rp,
                    ret: RetirePool => ret == ret
                }
            })
        }
        ${certifyingScriptContextParam}
        `, ([_], res) => asBool(res), 5);

        await ft.testParams({"CURRENT_STAKING_CRED_BYTES": ft.bytes()}, ["SCRIPT_CONTEXT"], `
        testing dcert_member_neq
        func main(ctx: ScriptContext) -> Bool {
            ctx.tx.dcerts.any((dcert: DCert) -> Bool {
                dcert.switch{
                    r: Register => r != r,
                    d: Deregister => d != d,
                    del: Delegate => del != del,
                    rp: RegisterPool => rp != rp,
                    ret: RetirePool => ret != ret
                }
            })
        }
        ${certifyingScriptContextParam}
        `, ([_], res) => !asBool(res), 5);

        await ft.testParams({"CURRENT_STAKING_CRED_BYTES": ft.bytes()}, ["CURRENT_STAKING_CRED", "POOL_ID", "POOL_VFR", "EPOCH", "SCRIPT_CONTEXT"], `
        testing dcert_member_fields
        func main(staking_cred: StakingCredential, pool_id: PubKeyHash, pool_vrf: PubKeyHash, epoch: Int, ctx: ScriptContext) -> Bool {
            ctx.tx.dcerts.any((dcert: DCert) -> Bool {
                dcert.switch{
                    r: Register => r.credential == staking_cred,
                    d: Deregister => d.credential == staking_cred,
                    del: Delegate => del.delegator == staking_cred && del.pool_id == pool_id,
                    rp: RegisterPool => rp.pool_id == pool_id && rp.pool_vrf == pool_vrf,
                    ret: RetirePool => ret.pool_id == pool_id && ret.epoch == epoch
                }
            })
        }
        ${certifyingScriptContextParam}
        `, ([a], res) => asBool(res), 5);

        await ft.testParams({"CURRENT_STAKING_CRED_BYTES": ft.bytes()}, ["SCRIPT_CONTEXT"], `
        testing dcert_member_serialize
        func main(ctx: ScriptContext) -> []ByteArray {
            ctx.tx.dcerts.map((dcert: DCert) -> ByteArray {
                dcert.switch{
                    r: Register => r.serialize(),
                    d: Deregister => d.serialize(),
                    del: Delegate => del.serialize(),
                    rp: RegisterPool => rp.serialize(),
                    ret: RetirePool => ret.serialize()
                }
            })
        }
        ${certifyingScriptContextParam}
        `, ([ctx], res) => {
            return asData(res).list.every((d, i) => {
                let ref = ctx.data.fields[0].fields[5].list[i];
                return decodeCbor(asBytes(d)).isSame(ref);
            });
        }, 5);
    }

    const testTx = true;

    if (testTx) {
        await ft.testParams({"QTY": ft.int()}, ["SCRIPT_CONTEXT"], `
        testing tx_eq
        func main(ctx: ScriptContext) -> Bool {
            ctx.tx == ctx.tx
        }
        ${spendingScriptContextParam(false)}
        `, ([_], res) => asBool(res), 10);

        await ft.testParams({"QTY": ft.int()}, ["SCRIPT_CONTEXT"], `
        testing tx_neq
        func main(ctx: ScriptContext) -> Bool {
            ctx.tx != ctx.tx
        }
        ${spendingScriptContextParam(false)}
        `, ([_], res) => !asBool(res), 10);

        // test if transaction is balanced (should always be true)
        await ft.testParams({"QTY": ft.int()}, ["SCRIPT_CONTEXT"], `
        testing tx_is_balanced
        func main(ctx: ScriptContext) -> Bool {
            ctx.tx.inputs.fold((a: Value, b: TxInput) -> Value {
                a + b.output.value
            }, Value::ZERO) + ctx.tx.minted == ctx.tx.fee + ctx.tx.outputs.fold((a: Value, b: TxOutput) -> Value {
                a + b.value
            }, Value::ZERO)
        }
        ${spendingScriptContextParam(false)}
        `, ([_], res) => asBool(res), 3);

        await ft.testParams({"PUB_KEY_HASH_BYTES": ft.bytes()}, ["SCRIPT_CONTEXT"], `
        testing tx_ref_inputs
        func main(ctx: ScriptContext) -> Bool {
            ctx.tx.ref_inputs.length > 0
        }
        ${spendingScriptContextParam(false)}
        `, ([_], res) => asBool(res), 5);

        // test if a signatory also sent some outputs self
        await ft.testParams({"PUB_KEY_HASH_BYTES": ft.bytes()}, ["SCRIPT_CONTEXT"], `
        testing tx_signatories
        func main(ctx: ScriptContext) -> Bool {
            ctx.tx.signatories.all((s: PubKeyHash) -> Bool {
                ctx.tx.outputs.any((o: TxOutput) -> Bool {
                    o.address.credential.switch{
                        c: PubKey => c.hash == s,
                        else => false
                    }
                })
            })
        }
        ${spendingScriptContextParam(false)}
        `, ([_], res) => asBool(res), 4);

        await ft.testParams({"QTY": ft.int(200000, 3000000)}, ["CURRENT_TX_ID", "SCRIPT_CONTEXT"], `
        testing tx_id
        func main(tx_id: TxId, ctx: ScriptContext) -> Bool {
            ctx.tx.id == tx_id
        }
        ${spendingScriptContextParam(false)}
        `, ([ctx], res) => asBool(res), 5);

        await ft.testParams({"QTY": ft.int()}, ["SCRIPT_CONTEXT"], `
        testing tx_time_range
        func main(ctx: ScriptContext) -> Bool {
            ctx.tx.time_range.contains(ctx.tx.time_range.start + Duration::new(10))
        }
        ${spendingScriptContextParam(false)}
        `, ([_], res) => asBool(res), 10);

        await ft.testParams({"QTY": ft.int()}, ["SCRIPT_CONTEXT"], `
        testing tx_time_range
        func main(ctx: ScriptContext) -> Bool {
            ctx.tx.time_range.contains(ctx.tx.time_range.end - Duration::new(10))
        }
        ${spendingScriptContextParam(false)}
        `, ([_], res) => asBool(res), 10);

        await ft.testParams({"CURRENT_STAKING_CRED_BYTES": ft.bytes()}, ["SCRIPT_CONTEXT"], `
        testing tx_dcerts
        func main(ctx: ScriptContext) -> Bool {
            ctx.tx.dcerts.length > 0
        }
        ${certifyingScriptContextParam}
        `, ([_], res) => asBool(res), 5);

        await ft.testParams({"CURRENT_STAKING_CRED_BYTES": ft.bytes()}, ["SCRIPT_CONTEXT"], `
        testing tx_withdrawals
        func main(ctx: ScriptContext) -> Bool {
            ctx.tx.withdrawals.length > 0
        }
        ${rewardingScriptContextParam}
        `, ([_], res) => asBool(res), 5);
        
        await ft.testParams({"PUB_KEY_HASH_BYTES": ft.bytes()}, ["SCRIPT_CONTEXT"], `
        testing tx_outputs_sent_to
        func main(ctx: ScriptContext) -> Bool {
            if (ctx.tx.signatories.is_empty()) {
                true
            } else {
                ctx.tx.outputs_sent_to(ctx.tx.signatories.head).length > 0
            }
        }
        ${spendingScriptContextParam(false)}
        `, ([_], res) => asBool(res), 5);

        
        await ft.testParams({"PUB_KEY_HASH_BYTES": ft.bytes()}, ["SCRIPT_CONTEXT"], `
        testing tx_outputs_sent_to_datum
        func main(ctx: ScriptContext) -> Bool {
            if (ctx.tx.signatories.is_empty()) {
                true
            } else {
                ctx.tx.outputs_sent_to_datum(ctx.tx.signatories.head, 42, false).length > 0
            }
        }
        ${spendingScriptContextParam(false)}
        `, ([_], res) => asBool(res), 5);

        await ft.testParams({"PUB_KEY_HASH_BYTES": ft.bytes()}, ["SCRIPT_CONTEXT"], `
        testing tx_outputs_sent_to_datum
        func main(ctx: ScriptContext) -> Bool {
            if (ctx.tx.signatories.is_empty()) {
                true
            } else {
                ctx.tx.outputs_sent_to_datum(ctx.tx.signatories.head, 42, true).length > 0
            }
        }
        ${spendingScriptContextParam(true)}
        `, ([_], res) => asBool(res), 5);


        await ft.testParams({"PUB_KEY_HASH_BYTES": ft.bytes()}, ["SCRIPT_CONTEXT"], `
        testing tx_outputs_locked_by
        func main(ctx: ScriptContext) -> Bool {
            h: ValidatorHash = ctx.get_current_validator_hash();
            ctx.tx.outputs_locked_by(h) == ctx.tx.outputs.filter((o: TxOutput) -> Bool {
                o.address.credential.switch{
                    Validator => true,
                    else => false
                }
            })
        }
        ${spendingScriptContextParam(false)}
        `, ([_], res) => asBool(res), 5);

        await ft.testParams({"PUB_KEY_HASH_BYTES": ft.bytes()}, ["SCRIPT_CONTEXT"], `
        testing tx_outputs_locked_by_datum
        func main(ctx: ScriptContext) -> Bool {
            h: ValidatorHash = ctx.get_current_validator_hash();
            ctx.tx.outputs_locked_by_datum(h, 42, false) == ctx.tx.outputs.filter((o: TxOutput) -> Bool {
                o.address.credential.switch{
                    Validator => true,
                    else => false
                }
            })
        }
        ${spendingScriptContextParam(false)}
        `, ([_], res) => asBool(res), 5);

        await ft.testParams({"PUB_KEY_HASH_BYTES": ft.bytes()}, ["SCRIPT_CONTEXT"], `
        testing tx_outputs_locked_by_datum
        func main(ctx: ScriptContext) -> Bool {
            h: ValidatorHash = ctx.get_current_validator_hash();
            ctx.tx.outputs_locked_by_datum(h, 42, true) == ctx.tx.outputs.filter((o: TxOutput) -> Bool {
                o.address.credential.switch{
                    Validator => true,
                    else => false
                }
            })
        }
        ${spendingScriptContextParam(true)}
        `, ([_], res) => asBool(res), 5);

        await ft.testParams({"PUB_KEY_HASH_BYTES": ft.bytes()}, ["SCRIPT_CONTEXT"], `
        testing tx_value_sent_to
        func main(ctx: ScriptContext) -> Bool {
            if (ctx.tx.signatories.is_empty()) {
                true
            } else {
                h: PubKeyHash = ctx.tx.signatories.head;
                ctx.tx.value_sent_to(h) == ctx.tx.outputs.fold((sum: Value, o: TxOutput) -> Value {
                    sum + if (o.address.credential.switch{p: PubKey => p.hash == h, else => false}) {o.value} else {Value::ZERO}
                }, Value::ZERO)
            }
        }
        ${spendingScriptContextParam(false)}
        `, ([_], res) => asBool(res), 5);

        await ft.testParams({"PUB_KEY_HASH_BYTES": ft.bytes()}, ["DATUM_HASH_1", "SCRIPT_CONTEXT"], `
        testing tx_value_sent_to_datum
        func main(datum_hash: DatumHash, ctx: ScriptContext) -> Bool {
            if (ctx.tx.signatories.is_empty()) {
                true
            } else {
                h: PubKeyHash = ctx.tx.signatories.head;
                ctx.tx.value_sent_to_datum(h, 42, false) == ctx.tx.outputs.fold((sum: Value, o: TxOutput) -> Value {
                    sum + if (
                        o.address.credential.switch{p: PubKey => p.hash == h, else => false} && 
                        o.datum.switch{ha: Hash => ha.hash == datum_hash, None => false, Inline => false}
                    ) {
                        o.value
                    } else {
                        Value::ZERO
                    }
                }, Value::ZERO)
            }
        }
        ${spendingScriptContextParam(false)}
        `, ([_], res) => asBool(res), 5);

        await ft.testParams({"PUB_KEY_HASH_BYTES": ft.bytes()}, ["DATUM_1", "SCRIPT_CONTEXT"], `
        testing tx_value_sent_to_datum
        func main(datum: Int, ctx: ScriptContext) -> Bool {
            if (ctx.tx.signatories.is_empty()) {
                true
            } else {
                h: PubKeyHash = ctx.tx.signatories.head;
                ctx.tx.value_sent_to_datum(h, 42, true) == ctx.tx.outputs.fold((sum: Value, o: TxOutput) -> Value {
                    sum + if (
                        o.address.credential.switch{p: PubKey => p.hash == h, else => false} && 
                        o.datum.switch{Hash => false, None => false, in: Inline => Int::from_data(in.data) == datum}
                    ) {
                        o.value
                    } else {
                        Value::ZERO
                    }
                }, Value::ZERO)
            }
        }
        ${spendingScriptContextParam(true)}
        `, ([_], res) => asBool(res), 5);

        await ft.testParams({"PUB_KEY_HASH_BYTES": ft.bytes()}, ["SCRIPT_CONTEXT"], `
        testing tx_value_locked_by
        func main(ctx: ScriptContext) -> Bool {
            h: ValidatorHash = ctx.get_current_validator_hash();
            ctx.tx.value_locked_by(h) == ctx.tx.outputs.fold((sum: Value, o: TxOutput) -> Value {
                sum + if (o.address.credential.switch{v: Validator => v.hash == h, else => false}) {o.value} else {Value::ZERO}
            }, Value::ZERO)
        }
        ${spendingScriptContextParam(false)}
        `, ([_], res) => asBool(res), 5);

        await ft.testParams({"PUB_KEY_HASH_BYTES": ft.bytes()}, ["DATUM_HASH_1", "SCRIPT_CONTEXT"],`
        testing tx_value_locked_by_datum
        func main(datum_hash: DatumHash, ctx: ScriptContext) -> Bool {
            h: ValidatorHash = ctx.get_current_validator_hash();
            (ctx.tx.value_locked_by_datum(h, 42, false) == ctx.tx.outputs.fold((a: Value, o: TxOutput) -> Value {
                a + if (
                    o.address.credential.switch{v: Validator => v.hash == h, else => false} && 
                    o.datum.switch{ha: Hash => ha.hash == datum_hash, None => false, Inline => false}
                ) {
                    o.value
                } else {
                    Value::ZERO
                }
            }, Value::ZERO))
        }
        ${spendingScriptContextParam(false)}
        `, ([_], res) => asBool(res), 5);

        await ft.testParams({"PUB_KEY_HASH_BYTES": ft.bytes()}, ["DATUM_1", "SCRIPT_CONTEXT"],`
        testing tx_value_locked_by_datum
        func main(datum: Int, ctx: ScriptContext) -> Bool {
            h: ValidatorHash = ctx.get_current_validator_hash();
            (ctx.tx.value_locked_by_datum(h, 42, true) == ctx.tx.outputs.fold((a: Value, o: TxOutput) -> Value {
                a + if (
                    o.address.credential.switch{v: Validator => v.hash == h, else => false} && 
                    o.datum.switch{Hash => false, None => false, in: Inline => Int::from_data(in.data) == datum}
                ) {
                    o.value
                } else {
                    Value::ZERO
                }
            }, Value::ZERO))
        }
        ${spendingScriptContextParam(true)}
        `, ([_], res) => asBool(res), 5);


        await ft.testParams({"PUB_KEY_HASH_BYTES": ft.bytes()}, ["SCRIPT_CONTEXT"], `
        testing tx_is_signed_by
        func main(ctx: ScriptContext) -> Bool {
            if (ctx.tx.signatories.is_empty()) {
                true
            } else {
                ctx.tx.is_signed_by(ctx.tx.signatories.head)
            }
        }
        ${spendingScriptContextParam(false)}
        `, ([ctx], res) => asBool(res), 5);

        await ft.testParams({"PUB_KEY_HASH_BYTES": ft.bytes()}, ["TX"], `
        testing tx_from_data
        func main(tx: Data) -> Tx {
            Tx::from_data(tx)
        }
        ${spendingScriptContextParam(false)}
        `, ([tx], res) => asData(res).isSame(tx.data), 5);

        await ft.testParams({"PUB_KEY_HASH_BYTES": ft.bytes()}, ["SCRIPT_CONTEXT"], `
        testing tx_serialize
        func main(ctx: ScriptContext) -> ByteArray {
            ctx.tx.serialize()
        }
        ${spendingScriptContextParam(false)}
        `, ([ctx], res) => {
            return decodeCbor(asBytes(res)).isSame(ctx.data.fields[0]);
        }, 5);

        await ft.testParams({"DATUM_1": ft.int()}, ["DATUM_1", "SCRIPT_CONTEXT"], `
        testing tx_get_datum_data_hash
        func main(data: Data, ctx: ScriptContext) -> Bool {
            ctx.tx.get_datum_data(ctx.tx.outputs.tail.head) == data
        }
        ${spendingScriptContextParam(false)}
        `, ([d, ctx], res) => {
            return asBool(res);
        }, 2);

        await ft.testParams({"DATUM_1": ft.int()}, ["DATUM_1", "SCRIPT_CONTEXT"], `
        testing tx_get_datum_data_inline
        func main(data: Data, ctx: ScriptContext) -> Bool {
            ctx.tx.get_datum_data(ctx.tx.outputs.tail.head) == data
        }
        ${spendingScriptContextParam(true)}
        `, ([d, ctx], res) => {
            return asBool(res);
        }, 2);
    }

    await ft.testParams({"QTY": ft.int()}, ["SCRIPT_CONTEXT"], `
    testing txid_eq
    func main(ctx: ScriptContext) -> Bool {
        ctx.tx.id == ctx.tx.id
    }
    ${spendingScriptContextParam(false)}
    `, ([_], res) => asBool(res), 2);

    await ft.testParams({"QTY": ft.int()}, ["SCRIPT_CONTEXT"], `
    testing txid_neq
    func main(ctx: ScriptContext) -> Bool {
        ctx.tx.id != ctx.tx.id
    }
    ${spendingScriptContextParam(false)}
    `, ([_], res) => !asBool(res), 2);

    await ft.test([ft.bytes(0, 3), ft.bytes(0, 3)], `
    testing txid_lt_geq
    func main(as: ByteArray, bs: ByteArray) -> Bool {
        a = TxId::new(as);
        b = TxId::new(bs);
        (a < b) != (a >= b)
    }`, ([a, b], res) => asBool(res));

    await ft.test([ft.bytes(0, 3), ft.bytes(0, 3)], `
    testing txid_gt_leq
    func main(as: ByteArray, bs: ByteArray) -> Bool {
        a = TxId::new(as);
        b = TxId::new(bs);
        (a > b) != (a <= b)
    }`, ([a, b], res) => asBool(res));

    await ft.test([ft.bytes()], `
    testing txid_show
    func main(bs: ByteArray) -> String {
        TxId::new(bs).show()
    }`, ([a], res) => {
        return bytesToHex(asBytes(a)) === asString(res);
    });
    await ft.testParams({"QTY": ft.int()}, ["CURRENT_TX_ID"], `
    testing txid_from_data
    func main(tx_id: Data) -> TxId {
        TxId::from_data(tx_id)
    }
    ${spendingScriptContextParam(false)}
    `, ([txId], res) => asData(res).isSame(txId.data), 2);

    await ft.testParams({"QTY": ft.int()}, ["CURRENT_TX_ID"], `
    testing txid_serialize
    func main(tx_id: TxId) -> ByteArray {
        tx_id.serialize()
    }
    ${spendingScriptContextParam(false)}
    `, serializeProp, 2);

    await ft.testParams({"PUB_KEY_HASH_BYTES": ft.bytes()}, ["SCRIPT_CONTEXT"], `
    testing txinput_eq_neq
    func main(ctx: ScriptContext) -> Bool {
        if (ctx.tx.inputs.length == 1) {
            ctx.tx.inputs.head == ctx.tx.inputs.get(0)
        } else {
            ctx.tx.inputs.head != ctx.tx.inputs.get(1)
        }
    }
    ${spendingScriptContextParam(false)}
    `, ([_], res) => asBool(res), 5);

    await ft.testParams({"PUB_KEY_HASH_BYTES": ft.bytes()}, ["FIRST_TX_INPUT"], `
    testing txinput_from_data
    func main(txinput: Data) -> TxInput {
        TxInput::from_data(txinput)
    }
    ${spendingScriptContextParam(false)}
    `, ([a], res) => a.data.isSame(asData(res)), 5);

    await ft.testParams({"PUB_KEY_HASH_BYTES": ft.bytes()}, ["SCRIPT_CONTEXT"], `
    testing txinput_serialize
    func main(ctx: ScriptContext) -> ByteArray {
        ctx.tx.inputs.head.serialize()
    }
    ${spendingScriptContextParam(false)}
    `, ([ctx], res) => {
        return decodeCbor(asBytes(res)).isSame(ctx.data.fields[0].fields[0].list[0]);
    }, 5);

    await ft.testParams({"PUB_KEY_HASH_BYTES": ft.bytes()}, ["SCRIPT_CONTEXT"], `
    testing txoutput_eq_neq
    func main(ctx: ScriptContext) -> Bool {
        if (ctx.tx.outputs.length == 1) {
            ctx.tx.outputs.head == ctx.tx.outputs.get(0)
        } else {
            ctx.tx.outputs.head != ctx.tx.outputs.get(1)
        }
    }
    ${spendingScriptContextParam(false)}
    `, ([_], res) => asBool(res), 5);

    await ft.testParams({"PUB_KEY_HASH_BYTES": ft.bytes()}, ["SCRIPT_CONTEXT"], `
    testing txoutput_datum
    func main(ctx: ScriptContext) -> Bool {
        ctx.tx.outputs.head.datum.switch{
            n: None => n == n,
            h: Hash => h == h && h.hash == h.hash,
            i: Inline => i == i && i.data == i.data
        }
    }
    ${spendingScriptContextParam(false)}
    `, ([_], res) => asBool(res), 5);

    await ft.testParams({"PUB_KEY_HASH_BYTES": ft.bytes()}, ["SCRIPT_CONTEXT"], `
    testing txoutput_datum
    func main(ctx: ScriptContext) -> Bool {
        ctx.tx.outputs.head.datum.switch{
            n: None => n == n,
            h: Hash => h == h && h.hash == h.hash,
            i: Inline => i == i && i.data == i.data
        }
    }
    ${spendingScriptContextParam(true)}
    `, ([_], res) => asBool(res), 5);

    await ft.testParams({"PUB_KEY_HASH_BYTES": ft.bytes()}, ["FIRST_TX_OUTPUT"], `
    testing txoutput_from_data
    func main(data: Data) -> TxOutput {
        TxOutput::from_data(data)
    }
    ${spendingScriptContextParam(false)}
    `, ([a], res) => a.data.isSame(asData(res)), 5);

    await ft.testParams({"PUB_KEY_HASH_BYTES": ft.bytes()}, ["SCRIPT_CONTEXT"], `
    testing txoutput_serialize
    func main(ctx: ScriptContext) -> ByteArray {
        ctx.tx.outputs.head.serialize()
    }
    ${spendingScriptContextParam(false)}
    `, ([ctx], res) => {
        return decodeCbor(asBytes(res)).isSame(ctx.data.fields[0].fields[2].list[0]);
    }, 5);

    const testOutputDatum = true;

    if (testOutputDatum) {
        await ft.testParams({"PUB_KEY_HASH_BYTES": ft.bytes()}, ["SCRIPT_CONTEXT"], `
        testing outputdatum_eq
        func main(ctx: ScriptContext) -> Bool {
            od: OutputDatum = ctx.tx.outputs.head.datum;
            od == od
        }
        ${spendingScriptContextParam(false)}
        `, ([_], res) => asBool(res), 2);

        await ft.testParams({"PUB_KEY_HASH_BYTES": ft.bytes()}, ["SCRIPT_CONTEXT"], `
        testing outputdatum_eq
        func main(ctx: ScriptContext) -> Bool {
            od: OutputDatum = ctx.tx.outputs.head.datum;
            od == od
        }
        ${spendingScriptContextParam(true)}
        `, ([_], res) => asBool(res), 2);

        await ft.testParams({"PUB_KEY_HASH_BYTES": ft.bytes()}, ["SCRIPT_CONTEXT"], `
        testing outputdatum_neq
        func main(ctx: ScriptContext) -> Bool {
            od: OutputDatum = ctx.tx.outputs.head.datum;
            od != od
        }
        ${spendingScriptContextParam(false)}
        `, ([_], res) => !asBool(res), 2);

        await ft.testParams({"PUB_KEY_HASH_BYTES": ft.bytes()}, ["SCRIPT_CONTEXT"], `
        testing outputdatum_neq
        func main(ctx: ScriptContext) -> Bool {
            od: OutputDatum = ctx.tx.outputs.head.datum;
            od != od
        }
        ${spendingScriptContextParam(true)}
        `, ([_], res) => !asBool(res), 2);

        await ft.testParams({"INLINE_DATUM": ft.int()}, ["OUTPUT_DATUM"], `
        testing outputdatum_from_data
        func main(data: Data) -> OutputDatum {
            OutputDatum::from_data(data)
        }
        const INLINE_DATUM: Int = 0

        const OUTPUT_DATUM: OutputDatum = OutputDatum::new_inline(INLINE_DATUM)
        `, ([a], res) => a.data.isSame(asData(res)), 5);

        await ft.testParams({"INLINE_DATUM": ft.int()}, ["OUTPUT_DATUM"], `
        testing outputdatum_serialize
        func main(od: OutputDatum) -> ByteArray {
            od.serialize()
        }
        const INLINE_DATUM: Int = 0

        const OUTPUT_DATUM: OutputDatum = OutputDatum::new_inline(INLINE_DATUM)
        `, serializeProp, 5);

        const outputDatumParam = `
        const CONSTR_INDEX: Int = 0
        const INLINE_DATA: Int = 0
        const DATUM_HASH_BYTES: ByteArray = #
        const DATUM_HASH: DatumHash = DatumHash::new(DATUM_HASH_BYTES)

        const OUTPUT_DATUM: OutputDatum = if (CONSTR_INDEX == 0) {
            OutputDatum::new_none()
        } else if (CONSTR_INDEX == 1) {
            OutputDatum::new_hash(DATUM_HASH)
        } else {
            OutputDatum::new_inline(INLINE_DATA)
        }`;

        await ft.testParams({"CONSTR_INDEX": ft.int(0, 3), "INLINE_DATA": ft.int(), "DATUM_HASH_BYTES": ft.bytes()}, ["DATUM_HASH", "INLINE_DATA", "OUTPUT_DATUM"], `
        testing outputdatum_eq
        func main(datum_hash: DatumHash, inline_data: Data, od: OutputDatum) -> Bool {
            od.switch{
                n: None => n == n,
                dh: Hash => dh == dh && dh.hash == datum_hash,
                in: Inline => in == in && in.data == inline_data && inline_data == od.get_inline_data()
            }
        }
        ${outputDatumParam}
        `, ([_], res) => asBool(res), 10);

        await ft.testParams({"CONSTR_INDEX": ft.int(0, 3), "INLINE_DATA": ft.int(), "DATUM_HASH_BYTES": ft.bytes()}, ["OUTPUT_DATUM"], `
        testing outputdatum_neq
        func main(od: OutputDatum) -> Bool {
            od.switch{
                n: None => n != n,
                dh: Hash => dh != dh,
                in: Inline => in != in
            }
        }
        ${outputDatumParam}
        `, ([_], res) => !asBool(res), 10);

        await ft.testParams({"CONSTR_INDEX": ft.int(0, 3), "INLINE_DATA": ft.int(), "DATUM_HASH_BYTES": ft.bytes()}, ["OUTPUT_DATUM"], `
        testing outputdatum_serialize
        func main(od: OutputDatum) -> ByteArray {
            od.switch{
                n: None => n.serialize(),
                dh: Hash => dh.serialize(),
                in: Inline => in.serialize()
            }
        }
        ${outputDatumParam}
        `, serializeProp, 10);
    }

    await ft.testParams({"DATA": ft.int()}, ["DATA"], `
    testing data_eq
    func main(data: Data) -> Bool {
        data == data
    }
    const DATA: Int = 0
    `, ([_], res) => asBool(res), 10);

    await ft.testParams({"DATA": ft.int()}, ["DATA"], `
    testing data_neq
    func main(data: Data) -> Bool {
        data != data
    }
    const DATA: Int = 0
    `, ([_], res) => !asBool(res), 10);

    await ft.testParams({"DATA": ft.int()}, ["DATA"], `
    testing data_serialize
    func main(data: Data) -> ByteArray {
        data.serialize()
    }
    const DATA: Int = 0
    `, serializeProp, 10);

    await ft.testParams({"PUB_KEY_HASH_BYTES": ft.bytes()}, ["SCRIPT_CONTEXT"], `
    testing txoutputid_eq_neq
    func main(ctx: ScriptContext) -> Bool {
        if (ctx.tx.inputs.length == 1) {
            ctx.tx.inputs.head.output_id == ctx.tx.inputs.get(0).output_id
        } else {
            ctx.tx.inputs.head.output_id != ctx.tx.inputs.get(1).output_id
        }
    }
    ${spendingScriptContextParam(false)}
    `, ([_], res) => asBool(res), 5);

    await ft.test([ft.bytes(0, 3), ft.int(0, 2)], `
    testing txoutputid_txid
    func main(as: ByteArray, ai: Int) -> Bool {
        a = TxOutputId::new(TxId::new(as), ai);
        TxId::new(as) == a.tx_id
    }`, ([a, b], res) => asBool(res));

    await ft.test([ft.bytes(0, 3), ft.int(0, 2)], `
    testing txoutputid_index
    func main(as: ByteArray, ai: Int) -> Bool {
        a = TxOutputId::new(TxId::new(as), ai);
        ai == a.index
    }`, ([a, b], res) => asBool(res));

    await ft.test([ft.bytes(0, 3), ft.int(0, 2), ft.bytes(0, 3), ft.int(0, 2)], `
    testing txoutputid_lt_geq
    func main(as: ByteArray, ai: Int, bs: ByteArray, bi: Int) -> Bool {
        a = TxOutputId::new(TxId::new(as), ai);
        b = TxOutputId::new(TxId::new(bs), bi);
        (a < b) != (a >= b)
    }`, ([a, b], res) => asBool(res));

    await ft.test([ft.bytes(0, 3), ft.int(0, 2), ft.bytes(0, 3), ft.int(0, 2)], `
    testing txoutputid_gt_leq
    func main(as: ByteArray, ai: Int, bs: ByteArray, bi: Int) -> Bool {
        a = TxOutputId::new(TxId::new(as), ai);
        b = TxOutputId::new(TxId::new(bs), bi);
        (a > b) != (a <= b)
    }`, ([a, b], res) => asBool(res));

    await ft.testParams({"PUB_KEY_HASH_BYTES": ft.bytes()}, ["SCRIPT_CONTEXT"], `
    testing txoutputid_new
    func main(ctx: ScriptContext) -> Bool {
        ctx.tx.inputs.head.output_id != TxOutputId::new(TxId::new(#1234), 0)
    }
    ${spendingScriptContextParam(false)}
    `, ([_], res) => asBool(res), 5);

    await ft.testParams({"PUB_KEY_HASH_BYTES": ft.bytes()}, ["TX_OUTPUT_ID_IN"], `
    testing txoutputid_from_data
    func main(data: Data) -> TxOutputId {
        TxOutputId::from_data(data)
    }
    ${spendingScriptContextParam(false)}
    `, ([a], res) => a.data.isSame(asData(res)), 5);

    await ft.testParams({"PUB_KEY_HASH_BYTES": ft.bytes()}, ["SCRIPT_CONTEXT"], `
    testing txoutputid_serialize
    func main(ctx: ScriptContext) -> ByteArray {
        ctx.tx.inputs.head.output_id.serialize()
    }
    ${spendingScriptContextParam(false)}
    `, ([ctx], res) => {
        return decodeCbor(asBytes(res)).isSame(ctx.data.fields[0].fields[0].list[0].fields[0]);
    }, 5);

    await ft.test([], `
    testing address_new_empty
    func main() -> Bool {
        a = Address::new_empty();
        a.credential.switch{
            pk: PubKey => pk.hash == PubKeyHash::new(#),
            else => error("unexpected")
        } &&
        a.staking_credential.switch{
            None => true,
            else => error("unexpected")
        }
    }`, ([], res) => asBool(res), 1);

    await ft.testParams({"PUB_KEY_HASH_BYTES": ft.bytes()}, ["SCRIPT_CONTEXT"], `
    testing address_eq
    func main(ctx: ScriptContext) -> Bool {
        ctx.tx.inputs.head.output.address == ctx.tx.inputs.get(0).output.address
    }
    ${spendingScriptContextParam(false)}
    `, ([_], res) => asBool(res), 5);

    await ft.testParams({"PUB_KEY_HASH_BYTES": ft.bytes()}, ["SCRIPT_CONTEXT"], `
    testing address_neq
    func main(ctx: ScriptContext) -> Bool {
        ctx.tx.inputs.head.output.address != ctx.tx.inputs.get(0).output.address
    }
    ${spendingScriptContextParam(false)}
    `, ([_], res) => !asBool(res), 5);

    await ft.testParams({"PUB_KEY_HASH_BYTES": ft.bytes()}, ["STAKING_CRED_IN", "SCRIPT_CONTEXT"], `
    testing address_staking_credential
    func main(staking_cred: Option[StakingCredential], ctx: ScriptContext) -> Bool {
        ctx.tx.inputs.head.output.address.staking_credential == staking_cred
    }
    ${spendingScriptContextParam(false)}
    `, ([a], res) => asBool(res), 3);

    await ft.testParams({"PUB_KEY_HASH_BYTES": ft.bytes()}, ["ADDRESS"], `
    testing address_from_data
    func main(data: Data) -> Address {
        Address::from_data(data)
    }
    const PUB_KEY_HASH_BYTES: ByteArray = #
    const ADDRESS: Address = Address::new(Credential::new_pubkey(PubKeyHash::new(PUB_KEY_HASH_BYTES)), Option[StakingCredential]::None)
    `, ([a], res) => a.data.isSame(asData(res)), 10);

    await ft.testParams({"PUB_KEY_HASH_BYTES": ft.bytes()}, ["SCRIPT_CONTEXT"], `
    testing address_serialize
    func main(ctx: ScriptContext) -> ByteArray {
        ctx.tx.inputs.head.output.address.serialize()
    }
    ${spendingScriptContextParam(false)}
    `, ([ctx], res) => {
        return decodeCbor(asBytes(res)).isSame(ctx.data.fields[0].fields[0].list[0].fields[1].fields[0])
    }, 5);

    await ft.testParams({"PUB_KEY_HASH_BYTES": ft.bytes()}, ["SCRIPT_CONTEXT"], `
    testing credential_eq
    func main(ctx: ScriptContext) -> Bool {
        ctx.tx.inputs.head.output.address.credential == ctx.tx.inputs.get(0).output.address.credential
    }
    ${spendingScriptContextParam(false)}
    `, ([_], res) => asBool(res), 5);

    await ft.testParams({"PUB_KEY_HASH_BYTES": ft.bytes()}, ["SCRIPT_CONTEXT"], `
    testing credential_neq
    func main(ctx: ScriptContext) -> Bool {
        ctx.tx.inputs.head.output.address.credential != ctx.tx.inputs.get(0).output.address.credential
    }
    ${spendingScriptContextParam(false)}
    `, ([_], res) => !asBool(res), 5);

    await ft.testParams({"PUB_KEY_HASH_BYTES": ft.bytes()}, ["CURRENT_VALIDATOR_CRED"], `
    testing credential_from_data
    func main(data: Data) -> Credential {
        Credential::from_data(data)
    }
    ${spendingScriptContextParam(false)}
    `, ([a], res) => a.data.isSame(asData(res)), 3);

    await ft.testParams({"PUB_KEY_HASH_BYTES": ft.bytes()}, ["SCRIPT_CONTEXT"], `
    testing credential_serialize
    func main(ctx: ScriptContext) -> ByteArray {
        ctx.tx.inputs.head.output.address.credential.serialize()
    }
    ${spendingScriptContextParam(false)}
    `, ([ctx], res) => {
        return decodeCbor(asBytes(res)).isSame(ctx.data.fields[0].fields[0].list[0].fields[1].fields[0].fields[0]);
    }, 3);

    await ft.testParams({"PUB_KEY_HASH_BYTES": ft.bytes()}, ["SCRIPT_CONTEXT"], `
    testing credential_member_eq
    func main(ctx: ScriptContext) -> Bool {
        ctx.tx.outputs.head.address.credential.switch{
            p: PubKey => p == p && p.hash == p.hash,
            v: Validator => v == v && v.hash == v.hash
        }
    }
    ${spendingScriptContextParam(false)}
    `, ([_], res) => asBool(res), 5);

    await ft.testParams({"PUB_KEY_HASH_BYTES": ft.bytes()}, ["SCRIPT_CONTEXT"], `
    testing credential_member_neq
    func main(ctx: ScriptContext) -> Bool {
        ctx.tx.outputs.head.address.credential.switch{
            p: PubKey => p != p,
            v: Validator => v != v
        }
    }
    ${spendingScriptContextParam(false)}
    `, ([_], res) => !asBool(res), 5);

    await ft.testParams({"PUB_KEY_HASH_BYTES": ft.bytes()}, ["SCRIPT_CONTEXT"], `
    testing credential_member_serialize
    func main(ctx: ScriptContext) -> ByteArray {
        ctx.tx.inputs.head.output.address.credential.switch{
            p: PubKey => p.serialize(),
            v: Validator => v.serialize()
        }
    }
    ${spendingScriptContextParam(false)}
    `, ([ctx], res) => {
        return decodeCbor(asBytes(res)).isSame(ctx.data.fields[0].fields[0].list[0].fields[1].fields[0].fields[0]);
    }, 5);

    await ft.testParams({"HAS_STAKING_CRED_IN": ft.bool()}, ["SCRIPT_CONTEXT"], `
    testing staking_credential_eq
    func main(ctx: ScriptContext) -> Bool {
        ctx.tx.inputs.head.output.address.staking_credential.switch{
            s: Some => s.some == s.some,
            n: None => n == n
        }
    }
    ${spendingScriptContextParam(false)}
    `, ([_], res) => asBool(res), 5);

    await ft.testParams({"HAS_STAKING_CRED_IN": ft.bool()}, ["SCRIPT_CONTEXT"], `
    testing staking_credential_neq
    func main(ctx: ScriptContext) -> Bool {
        ctx.tx.inputs.head.output.address.staking_credential.switch{
            s: Some => s.some != s.some,
            n: None => n != n
        }
    }
    ${spendingScriptContextParam(false)}
    `, ([_], res) => !asBool(res), 5);

    await ft.testParams({"HAS_STAKING_CRED_IN": ft.bool()}, ["SOME_STAKING_CRED_IN"], `
    testing staking_credential_from_data
    func main(data: Data) -> StakingCredential {
        StakingCredential::from_data(data)
    }
    ${spendingScriptContextParam(false)}
    `, ([a], res) => a.data.isSame(asData(res)), 2);

    await ft.testParams({"HAS_STAKING_CRED_IN": ft.bool()}, ["SCRIPT_CONTEXT"], `
    testing staking_credential_serialize
    func main(ctx: ScriptContext) -> Bool {
        ctx.tx.inputs.head.output.address.staking_credential.switch{
            s: Some => s.some.serialize().length > 0,
            n: None => n.serialize().length > 0
        }
    }
    ${spendingScriptContextParam(false)}
    `, ([ctx], res) => asBool(res), 5);

    await ft.testParams({"HAS_STAKING_CRED_IN": ft.bool(), "STAKING_CRED_TYPE": ft.bool()}, ["SCRIPT_CONTEXT"], `
    testing staking_credential_eq
    func main(ctx: ScriptContext) -> Bool {
        ctx.tx.inputs.head.output.address.staking_credential.switch{
            s: Some => s.some.switch{
                sp: Ptr => sp == sp,
                sh: Hash => sh == sh
            },
            n: None => n == n
        }
    }
    ${spendingScriptContextParam(false)}
    `, ([_], res) => asBool(res), 5);

    await ft.testParams({"HAS_STAKING_CRED_IN": ft.bool(), "STAKING_CRED_TYPE": ft.bool()}, ["SCRIPT_CONTEXT"], `
    testing staking_credential_neq
    func main(ctx: ScriptContext) -> Bool {
        ctx.tx.inputs.head.output.address.staking_credential.switch{
            s: Some => s.some.switch{
                sp: Ptr => sp != sp,
                sh: Hash => sh != sh
            },
            n: None => n != n
        }
    }
    ${spendingScriptContextParam(false)}
    `, ([_], res) => !asBool(res), 5);

    await ft.testParams({"HAS_STAKING_CRED_IN": ft.bool(), "STAKING_CRED_TYPE": ft.bool()}, ["SCRIPT_CONTEXT"], `
    testing staking_credential_serialize
    func main(ctx: ScriptContext) -> Bool {
        ctx.tx.inputs.head.output.address.staking_credential.switch{
            s: Some => s.some.switch{
                sp: Ptr => sp.serialize().length > 0,
                sh: Hash => sh.serialize().length > 0
            },
            n: None => n.serialize().length > 0
        }
    }
    ${spendingScriptContextParam(false)}
    `, ([ctx], res) => asBool(res), 5);

    await ft.test([ft.int()], `
    testing time_eq_1
    func main(a: Int) -> Bool {
        Time::new(a) == Time::new(a)
    }`, ([_], res) => asBool(res));

    await ft.test([ft.int(), ft.int()], `
    testing time_eq_2
    func main(a: Int, b: Int) -> Bool {
        Time::new(a) == Time::new(b)
    }`, ([a, b], res) => (asInt(a) === asInt(b)) === asBool(res));

    await ft.test([ft.int()], `
    testing time_neq_1
    func main(a: Int) -> Bool {
        Time::new(a) != Time::new(a)
    }`, ([_], res) => !asBool(res));

    await ft.test([ft.int(), ft.int()], `
    testing time_neq_2
    func main(a: Int, b: Int) -> Bool {
        Time::new(a) != Time::new(b)
    }`, ([a, b], res) => (asInt(a) === asInt(b)) === (!asBool(res)));

    await ft.test([ft.int(), ft.int()], `
    testing time_add_2
    func main(a: Int, b: Int) -> Time {
        Time::new(a) + Duration::new(b)
    }`, ([a, b], res) => asInt(a) + asInt(b) === asInt(res));

    await ft.test([ft.int()], `
    testing time_sub_0
    func main(a: Int) -> Duration {
        Time::new(a) - Time::new(0)
    }`, ([a], res) => asInt(a) === asInt(res));

    await ft.test([ft.int()], `
    testing time_sub_self
    func main(a: Int) -> Duration {
        Time::new(a) - Time::new(a)
    }`, ([_], res) => 0n === asInt(res));

    await ft.test([ft.int(), ft.int()], `
    testing time_sub_2
    func main(a: Int, b: Int) -> Duration {
        Time::new(a) - Time::new(b)
    }`, ([a, b], res) => asInt(a) - asInt(b) === asInt(res));

    await ft.test([ft.int()], `
    testing time_geq_1
    func main(a: Int) -> Bool {
        Time::new(a) >= Time::new(a)
    }`, ([_], res) => asBool(res));

    await ft.test([ft.int(), ft.int()], `
    testing time_geq_2
    func main(a: Int, b: Int) -> Bool {
        Time::new(a) >= Time::new(b)
    }`, ([a, b], res) => (asInt(a) >= asInt(b)) === asBool(res));

    await ft.test([ft.int()], `
    testing time_gt_1
    func main(a: Int) -> Bool {
        Time::new(a) > Time::new(a)
    }`, ([_], res) => !asBool(res));

    await ft.test([ft.int(), ft.int()], `
    testing time_gt_2
    func main(a: Int, b: Int) -> Bool {
        Time::new(a) > Time::new(b)
    }`, ([a, b], res) => (asInt(a) > asInt(b)) === asBool(res));

    await ft.test([ft.int()], `
    testing time_leq_1
    func main(a: Int) -> Bool {
        Time::new(a) <= Time::new(a)
    }`, ([_], res) => asBool(res));

    await ft.test([ft.int(), ft.int()], `
    testing time_leq_2
    func main(a: Int, b: Int) -> Bool {
        Time::new(a) <= Time::new(b)
    }`, ([a, b], res) => (asInt(a) <= asInt(b)) === asBool(res));

    await ft.test([ft.int()], `
    testing time_lt_1
    func main(a: Int) -> Bool {
        Time::new(a) < Time::new(a)
    }`, ([a], res) => !asBool(res));

    await ft.test([ft.int(), ft.int()], `
    testing time_lt_2
    func main(a: Int, b: Int) -> Bool {
        Time::new(a) < Time::new(b)
    }`, ([a, b], res) => (asInt(a) < asInt(b)) === asBool(res));

    await ft.test([ft.int()], `
    testing time_show
    func main(a: Int) -> String {
        Time::new(a).show()
    }`, ([a], res) => asInt(a).toString() === asString(res));

    await ft.test([ft.int()], `
    testing time_from_data
    func main(data: Data) -> Bool {
        Time::from_data(data) == Time::new(Int::from_data(data))
    }`, ([_], res) => asBool(res));

    await ft.test([ft.int()], `
    testing time_serialize
    func main(a: Int) -> ByteArray {
        Time::new(a).serialize()
    }`, serializeProp);

    await ft.test([ft.int()], `
    testing duration_eq_1
    func main(a: Int) -> Bool {
        Duration::new(a) == Duration::new(a)
    }`, ([_], res) => asBool(res));

    await ft.test([ft.int(), ft.int()], `
    testing duration_eq_2
    func main(a: Int, b: Int) -> Bool {
        Duration::new(a) == Duration::new(b)
    }`, ([a, b], res) => (asInt(a) === asInt(b)) === asBool(res));

    await ft.test([ft.int()], `
    testing duration_neq_1
    func main(a: Int) -> Bool {
        Duration::new(a) != Duration::new(a)
    }`, ([_], res) => !asBool(res));

    await ft.test([ft.int(), ft.int()], `
    testing duration_neq_2
    func main(a: Int, b: Int) -> Bool {
        Duration::new(a) != Duration::new(b)
    }`, ([a, b], res) => (asInt(a) === asInt(b)) === (!asBool(res)));

    await ft.test([ft.int()], `
    testing duration_add_0
    func main(a: Int) -> Duration {
        Duration::new(a) + Duration::new(0)
    }`, ([a], res) => asInt(a) === asInt(res));

    await ft.test([ft.int(), ft.int()], `
    testing duration_add_2
    func main(a: Int, b: Int) -> Duration {
        Duration::new(a) + Duration::new(b)
    }`, ([a, b], res) => asInt(a) + asInt(b) === asInt(res));

    await ft.test([ft.int()], `
    testing duration_sub_0
    func main(a: Int) -> Duration {
        Duration::new(a) - Duration::new(0)
    }`, ([a], res) => asInt(a) === asInt(res));

    await ft.test([ft.int()], `
    testing duration_sub_0_alt
    func main(a: Int) -> Duration {
        Duration::new(0) - Duration::new(a)
    }`, ([a], res) => asInt(a) === -asInt(res));

    await ft.test([ft.int()], `
    testing duration_sub_self
    func main(a: Int) -> Duration {
        Duration::new(a) - Duration::new(a)
    }`, ([_], res) => 0n === asInt(res));

    await ft.test([ft.int(), ft.int()], `
    testing duration_sub_2
    func main(a: Int, b: Int) -> Duration {
        Duration::new(a) - Duration::new(b)
    }`, ([a, b], res) => asInt(a) - asInt(b) === asInt(res));

    await ft.test([ft.int()], `
    testing duration_mul_0
    func main(a: Int) -> Duration {
        Duration::new(a)*0
    }`, ([_], res) => 0n === asInt(res));

    await ft.test([ft.int()], `
    testing duration_mul_0_swap
    func main(a: Int) -> Duration {
        0*Duration::new(a)
    }`, ([_], res) => 0n === asInt(res));

    await ft.test([ft.int()], `
    testing duration_mul_1
    func main(a: Int) -> Duration {
        Duration::new(a)*1
    }`, ([a], res) => asInt(a) === asInt(res));

    await ft.test([ft.int()], `
    testing duration_mul_1_swap
    func main(a: Int) -> Duration {
        1*Duration::new(a)
    }`, ([a], res) => asInt(a) === asInt(res));

    await ft.test([ft.int(), ft.int()], `
    testing duration_mul_2
    func main(a: Int, b: Int) -> Duration {
        Duration::new(a) * b
    }`, ([a, b], res) => asInt(a) * asInt(b) === asInt(res));

    await ft.test([ft.int(), ft.int()], `
    testing duration_mul_2_swap
    func main(a: Int, b: Int) -> Duration {
        b*Duration::new(a)
    }`, ([a, b], res) => asInt(a) * asInt(b) === asInt(res));

    await ft.test([ft.int()], `
    testing duration_div_0
    func main(a: Int) -> Duration {
        Duration::new(a) / 0
    }`, ([_], res) => isError(res, "division by zero"));

    await ft.test([ft.int()], `
    testing duration_div_1
    func main(a: Int) -> Duration {
        Duration::new(a) / 1
    }`, ([a], res) => asInt(a) === asInt(res));

    await ft.test([ft.int(-20, 20)], `
    testing duration_div_1_self
    func main(a: Int) -> Duration {
        Duration::new(a) / a
    }`, ([a], res) => 
        asInt(a) === 0n ?
        isError(res, "division by zero") :
        1n === asInt(res)
    );

    await ft.test([ft.int(-20, 20)], `
    testing duration_div_1_self_alt
    func main(a: Int) -> Int {
        Duration::new(a) / Duration::new(a)
    }`, ([a], res) => 
        asInt(a) === 0n ?
        isError(res, "division by zero") :
        1n === asInt(res)
    );

    await ft.test([ft.int(), ft.int()], `
    testing duration_div_2
    func main(a: Int, b: Int) -> Duration {
        Duration::new(a) / b
    }`, ([a, b], res) => 
        asInt(b) === 0n ? 
        isError(res, "division by zero") :
        asInt(a) / asInt(b) === asInt(res)
    );

    await ft.test([ft.int()], `
    testing duration_mod_0
    func main(a: Int) -> Duration {
        Duration::new(a) % Duration::new(0)
    }`, ([_], res) => isError(res, "division by zero"));

    await ft.test([ft.int()], `
    testing duration_mod_1
    func main(a: Int) -> Duration {
        Duration::new(a) % Duration::new(1)
    }`, ([_], res) => 0n === asInt(res));

    await ft.test([ft.int(-20, 20)], `
    testing duration_mod_1_alt
    func main(a: Int) -> Duration {
        Duration::new(1) % Duration::new(a)
    }`, ([a], res) => 
        asInt(a) === 0n ? 
        isError(res, "division by zero") :
        (
            asInt(a) === -1n || asInt(a) === 1n ?
            0n === asInt(res) :
            1n === asInt(res)
        )
    );

    await ft.test([ft.int(-10, 10)], `
    testing duration_mod_1_self
    func main(a: Int) -> Duration {
        Duration::new(a) % Duration::new(a)
    }`, ([a], res) => 
        asInt(a) === 0n ?
        isError(res, "division by zero") :
        0n === asInt(res)
    );

    await ft.test([ft.int(), ft.int(-10, 10)], `
    testing duration_mod_2
    func main(a: Int, b: Int) -> Duration {
        Duration::new(a) % Duration::new(b)
    }`, ([a, b], res) => 
        asInt(b) === 0n ? 
        isError(res, "division by zero") :
        asInt(a) % asInt(b) === asInt(res)
    );

    await ft.test([ft.int()], `
    testing duration_geq_1
    func main(a: Int) -> Bool {
        Duration::new(a) >= Duration::new(a)
    }`, ([_], res) => asBool(res));

    await ft.test([ft.int(), ft.int()], `
    testing duration_geq_2
    func main(a: Int, b: Int) -> Bool {
        Duration::new(a) >= Duration::new(b)
    }`, ([a, b], res) => (asInt(a) >= asInt(b)) === asBool(res));

    await ft.test([ft.int()], `
    testing duration_gt_1
    func main(a: Int) -> Bool {
        Duration::new(a) > Duration::new(a)
    }`, ([_], res) => !asBool(res));

    await ft.test([ft.int(), ft.int()], `
    testing duration_gt_2
    func main(a: Int, b: Int) -> Bool {
        Duration::new(a) > Duration::new(b)
    }`, ([a, b], res) => (asInt(a) > asInt(b)) === asBool(res));

    await ft.test([ft.int()], `
    testing duration_leq_1
    func main(a: Int) -> Bool {
        Duration::new(a) <= Duration::new(a)
    }`, ([_], res) => asBool(res));

    await ft.test([ft.int(), ft.int()], `
    testing duration_leq_2
    func main(a: Int, b: Int) -> Bool {
        Duration::new(a) <= Duration::new(b)
    }`, ([a, b], res) => (asInt(a) <= asInt(b)) === asBool(res));

    await ft.test([ft.int()], `
    testing duration_lt_1
    func main(a: Int) -> Bool {
        Duration::new(a) < Duration::new(a)
    }`, ([a], res) => !asBool(res));

    await ft.test([ft.int(), ft.int()], `
    testing duration_lt_2
    func main(a: Int, b: Int) -> Bool {
        Duration::new(a) < Duration::new(b)
    }`, ([a, b], res) => (asInt(a) < asInt(b)) === asBool(res));
    
    await ft.test([ft.int()], `
    testing duration_from_data
    func main(a: Data) -> Bool {
        Duration::from_data(a) == Duration::new(Int::from_data(a))
    }`, ([_], res) => asBool(res));

    await ft.test([ft.int()], `
    testing duration_serialize
    func main(a: Int) -> ByteArray {
        Duration::new(a).serialize()
    }`, serializeProp);

    await ft.test([ft.int()], `
    testing duration_SECOND
    func main(a: Int) -> Duration {
        Duration::SECOND*a
    }`, ([a], res) => asInt(a)*1000n == asInt(res), 5);

    await ft.test([ft.int()], `
    testing duration_MINUTE
    func main(a: Int) -> Duration {
        Duration::MINUTE*a
    }`, ([a], res) => asInt(a)*1000n*60n == asInt(res), 5);

    await ft.test([ft.int()], `
    testing duration_HOUR
    func main(a: Int) -> Duration {
        Duration::HOUR*a
    }`, ([a], res) => asInt(a)*1000n*60n*60n == asInt(res), 5);

    await ft.test([ft.int()], `
    testing duration_DAY
    func main(a: Int) -> Duration {
        Duration::DAY*a
    }`, ([a], res) => asInt(a)*1000n*60n*60n*24n == asInt(res), 5);


    await ft.test([ft.int()], `
    testing duration_WEEK
    func main(a: Int) -> Duration {
        Duration::WEEK*a
    }`, ([a], res) => asInt(a)*1000n*60n*60n*24n*7n == asInt(res), 5);

    await ft.test([ft.int()], `
    testing timerange_always
    func main(a: Int) -> Bool {
        TimeRange::ALWAYS.contains(Time::new(a))
    }`, ([_], res) => asBool(res));

    await ft.test([ft.int()], `
    testing timerange_never
    func main(a: Int) -> Bool {
        TimeRange::NEVER.contains(Time::new(a))
    }`, ([_], res) => !asBool(res));

    await ft.test([ft.int(), ft.int()], `
    testing timerange_from
    func main(a: Int, b: Int) -> Bool {
        TimeRange::from(Time::new(a)).contains(Time::new(b))
    }`, ([a, b], res) => (asInt(b) >= asInt(a)) === asBool(res));

    await ft.test([ft.int(), ft.int()], `
    testing timerange_to
    func main(a: Int, b: Int) -> Bool {
        TimeRange::to(Time::new(a)).contains(Time::new(b))
    }`, ([a, b], res) => (asInt(b) <= asInt(a)) === asBool(res));

    await ft.test([ft.int(), ft.int()], `
    testing timerange_eq_1
    func main(a: Int, b: Int) -> Bool {
        TimeRange::new(Time::new(a), Time::new(b)) == TimeRange::new(Time::new(a), Time::new(b))
    }`, ([_], res) => asBool(res));

    await ft.test([ft.int(), ft.int(), ft.int(), ft.int()], `
    testing timerange_eq_2
    func main(a: Int, b: Int, c: Int, d: Int) -> Bool {
        TimeRange::new(Time::new(a), Time::new(b)) == TimeRange::new(Time::new(c), Time::new(d))
    }`, ([a, b, c, d], res) => ((asInt(a) == asInt(c)) && (asInt(b) == asInt(d))) === asBool(res));

    await ft.test([ft.int(), ft.int()], `
    testing timerange_neq_1
    func main(a: Int, b: Int) -> Bool {
        TimeRange::new(Time::new(a), Time::new(b)) != TimeRange::new(Time::new(a), Time::new(b))
    }`, ([_], res) => !asBool(res));

    await ft.test([ft.int(), ft.int(), ft.int(), ft.int()], `
    testing timerange_neq_2
    func main(a: Int, b: Int, c: Int, d: Int) -> Bool {
        TimeRange::new(Time::new(a), Time::new(b)) != TimeRange::new(Time::new(c), Time::new(d))
    }`, ([a, b, c, d], res) => ((asInt(a) == asInt(c)) && (asInt(b) == asInt(d))) === !asBool(res));

    await ft.test([ft.int(), ft.int()], `
    testing timerange_contains
    func main(a: Int, b: Int) -> Bool {
        TimeRange::new(Time::new(a), Time::new(b)).contains(Time::new((a+b)/2))
    }`, ([a, b], res) => (asInt(a) < asInt(b) - 1n) === asBool(res));

    await ft.test([ft.int()], `
    testing timerange_is_after_1
    func main(a: Int) -> Bool {
        TimeRange::NEVER.is_after(Time::new(a))
    }`, ([_], res) => asBool(res));

    await ft.test([ft.int()], `
    testing timerange_is_after_2
    func main(a: Int) -> Bool {
        TimeRange::ALWAYS.is_after(Time::new(a))
    }`, ([_], res) => !asBool(res));

    await ft.test([ft.int(), ft.int()], `
    testing timerange_is_after_3
    func main(a: Int, b: Int) -> Bool {
        TimeRange::to(Time::new(a)).is_after(Time::new(b))
    }`, ([a, b], res) => !asBool(res));

    await ft.test([ft.int(), ft.int()], `
    testing timerange_is_after_4
    func main(a: Int, b: Int) -> Bool {
        TimeRange::from(Time::new(a)).is_after(Time::new(b))
    }`, ([a, b], res) => (asInt(b) < asInt(a)) === asBool(res));

    await ft.test([ft.int(), ft.int(), ft.int()], `
    testing timerange_is_after_5
    func main(a: Int, b: Int, c: Int) -> Bool {
        TimeRange::new(Time::new(a), Time::new(b)).is_after(Time::new(c))
    }`, ([a, _, c], res) => (asInt(c) < asInt(a)) === asBool(res));

    await ft.test([ft.int()], `
    testing timerange_is_before_1
    func main(a: Int) -> Bool {
        TimeRange::NEVER.is_before(Time::new(a))
    }`, ([_], res) => asBool(res));

    await ft.test([ft.int()], `
    testing timerange_is_before_2
    func main(a: Int) -> Bool {
        TimeRange::ALWAYS.is_before(Time::new(a))
    }`, ([_], res) => !asBool(res));

    await ft.test([ft.int(), ft.int()], `
    testing timerange_is_before_3
    func main(a: Int, b: Int) -> Bool {
        TimeRange::to(Time::new(a)).is_before(Time::new(b))
    }`, ([a, b], res) => (asInt(a) < asInt(b)) === asBool(res));

    await ft.test([ft.int(), ft.int()], `
    testing timerange_is_before_4
    func main(a: Int, b: Int) -> Bool {
        TimeRange::from(Time::new(a)).is_before(Time::new(b))
    }`, ([a, b], res) => !asBool(res));

    await ft.test([ft.int(), ft.int(), ft.int()], `
    testing timerange_is_before_5
    func main(a: Int, b: Int, c: Int) -> Bool {
        TimeRange::new(Time::new(a), Time::new(b)).is_before(Time::new(c))
    }`, ([_, b, c], res) => (asInt(b) < asInt(c)) === asBool(res));

    await ft.test([ft.int(), ft.int()], `
    testing timerange_show
    func main(a: Int, b: Int) -> String {
        TimeRange::new(Time::new(a), Time::new(b)).show()
    }`, ([a, b], res) => {
        return asString(res) == `[${asInt(a).toString()},${asInt(b).toString()}]`
    }, 5);

    await ft.test([ft.int()], `
    testing timerange_show_from
    func main(a: Int) -> String {
        TimeRange::from(Time::new(a)).show()
    }`, ([a], res) => asString(res) == `[${asInt(a).toString()},+inf]`, 5);

    await ft.test([ft.int()], `
    testing timerange_show_to
    func main(a: Int) -> String {
        TimeRange::to(Time::new(a)).show()
    }`, ([a], res) => asString(res) == `[-inf,${asInt(a).toString()}]`, 5);

    await ft.test([], `
    testing timerange_show_inf
    func main() -> Bool {
        TimeRange::NEVER.show() == "[+inf,-inf]" &&
        TimeRange::ALWAYS.show() == "[-inf,+inf]"
    }`, ([_], res) => asBool(res), 1);

    await ft.testParams({"START": ft.int(), "DUR": ft.int()}, ["TR"], `
    testing timerange_from_data
    func main(a: Data) -> TimeRange {
        TimeRange::from_data(a)
    }
    const START: Int = 0
    const DUR: Int = 100

    const TR: TimeRange = TimeRange::new(Time::new(START), Time::new(START + DUR))
    `, ([a], res) => a.data.isSame(asData(res)));


    await ft.test([ft.int(), ft.int()], `
    testing timerange_serialize
    func main(a: Int, b: Int) -> Bool {
        tr: TimeRange = TimeRange::new(Time::new(a), Time::new(b));
        tr.serialize() == tr.serialize()
    }`, ([a, b], res) => asBool(res));
}

export default async function main() {
    let stats = new Map();

    setRawUsageNotifier(function (name, n) {
        if (!stats.has(name)) {
            stats.set(name, 0);
        }

        if (n != 0) {
            stats.set(name, stats.get(name) + n);
        }
    });

    await testBuiltins();

    // print statistics
    console.log("helios builtin coverage:");
    for (let [name, n] of stats) {
        console.log(n, name);
    }
}
