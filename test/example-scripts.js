#!/usr/bin/env node
//@ts-check
import * as helios from "../helios.js";
import { runIfEntryPoint } from "../utils/util.js";

helios.config.EXPERIMENTAL_CEK = true;

export default async function main() {
    async function runTestScriptWithArgs(src, argNames, expectedResult, expectedMessages) {
        let purposeName = helios.extractScriptPurposeAndName(src);

        if (purposeName == null) {
            throw new Error("invalid header");
        }

        let [purpose, name] = purposeName;
    
        if (purpose != "testing") {
            throw new Error(`${name} is not a test script`);
        }

        function checkResult(result_, simplified = false) {
            if (result_ instanceof Error && simplified) {
                return
            }

            let resStr = result_.toString();

            if (!resStr.includes(expectedResult)) {
                throw new Error(`unexpected result in ${name}: expected "${expectedResult}", got "${resStr}"`);
            }
        }

        try {
            let program = helios.Program.new(src);

            let args = argNames.map(n => program.evalParam(n));

            // test the transfer() function as well
            let [result, messages] = await program.compile(false).transfer(helios.UplcProgram).runWithPrint(args);
        
            if (expectedMessages.length > 0 && !expectedMessages.every(em => messages.some(m => m.includes(em)))) {
                throw new Error(`didn't find expected message ${expectedMessages} in ${messages}`);
            }

            checkResult(result);

            console.log(`integration test '${name}' succeeded`);

            // also try the simplified version (don't check for the message though because all trace calls will've been eliminated)

            // test the transfer() function as well
            [result, messages] = await program.compile(true).transfer(helios.UplcProgram).runWithPrint(args);

            if (messages.length != 0) {
                throw new Error("unexpected messages");
            }

            checkResult(result, true);
        } catch(e) {
            if (!(e instanceof helios.RuntimeError || e instanceof helios.UserError)) {
                throw e
            } else {
                checkResult(e);
            }
        }

        console.log(`integration test '${name}' succeeded (simplified)`);
    }

    async function runTestScript(src, expectedResult, expectedMessages) {
        await runTestScriptWithArgs(src, [], expectedResult, expectedMessages);
    }
   

    // start of integration tests

    // 1. hello_world_true
    await runTestScript(`
    testing hello_world_true
    func main() -> Bool {
        print("hello world");
        true
    }`, "data(1{})", ["hello world"]);

    // 2. hello_world_false
    await runTestScript(`
    testing hello_world_false
    func main() -> Bool {
        print("hello world");
        !true
    }`, "data(0{})", ["hello world"]);

    // 3. hello_number
    // * non-main function statement
    await runTestScript(`
    testing hello_number
    func print_message(a: Int) -> String {
        "hello number " + a.show()
    }
    func main() -> Bool {
        print(print_message(0) + "");
        !true
    }`, "data(0{})", ["hello number 0"]);

    // 4. my_struct
    // * struct statement
    // * struct literal
    // * struct getters
    await runTestScript(`
    testing my_struct
    struct MyStruct {
        a: Int
        b: Int
    }
    func main() -> Int {
        x: MyStruct = MyStruct{a: 1, b: 1};
        x.a + x.b
    }`, "data(2)", []);

    // 4. owner_value
    // * struct statement
    // * struct literal
    // * struct getters
    await runTestScript(`
    testing owner_value
    struct Datum {
        owner: PubKeyHash
        value: Value
    }
    func main() -> Bool {
        d = Datum{
            owner: PubKeyHash::new(#1234),
            value: Value::lovelace(100)
        };
        print(d.owner.show());
        d.value > Value::ZERO
    }`, "data(1{})", ["1234"]);

    // 5. fibonacci
    // * recursive function statement
    await runTestScript(`
    testing fibonacci
    func fibonacci(n: Int) -> Int {
        if (n < 2) {
            1
        } else {
            fibonacci(n-1) + fibonacci(n-2)
        }
    }
    func main() -> Int {
        fibonacci(5)
    }`, "data(8)", []);

    // 6. fibonacci2
    // * calling a non-function
    await runTestScript(`
    testing fibonacci2
    func fibonacci(n: Int) -> Int {
        if (n < 2) {
            1
        } else {
            fibonacci(n-1) + fibonacci(n-2)
        }
    }
    func main() -> Bool {
        x: ByteArray = #32423acd232;
        (fibonacci(1) == 1) && x.length() == 12
    }`, "expected function, got Int", []);

    // 7. mutual recursion
    // * mutual recursive struct statements in wrong order
    await runTestScript(`
    testing mutual_recursion

    struct Wrapper {
        a: Int

        func fn1(self) -> Int {
            self.fn2()
        }

        func fn2(self) -> Int {
            self.fn3()
        }

        func fn3(self) -> Int {
            self.a
        }
    }

    func main() -> Int {
        w = Wrapper{1};

        w.fn1()
    }`, "data(1)", []);

    // 8. list_get ok
    await runTestScript(`
    testing list_get
    func main() -> Bool {
        x: []Int = []Int{1, 2, 3};
        print(x.get(0).show());
        x.get(2) == 3
    }`, "data(1{})", ["1"]);

    // 9. list_get nok
    // * error thrown by builtin
    await runTestScript(`
    testing list_get
    func main() -> Bool {
        x = []Int{1, 2, 3};
        print(x.get(0).show());
        x.get(-1) == 3
    }`, "index out of range", ["1"]);

    // 10. multiple_args
    // * function that takes more than 1 arguments
    await runTestScript(`
    testing multiple_args
    func concat(a: String, b: String) -> String {
        a + b
    }
    func main() -> Bool {
        print(concat("hello ", "world"));
        true
    }`, "data(1{})", ["hello world"]);

    // 11. collatz recursion
    // * recursion
    await runTestScript(`
    testing collatz
    func collatz(current: Int, accumulator: []Int) -> []Int {
        if (current == 1) {
            accumulator.prepend(current) 
        } else if (current%2 == 0) {
            collatz(current/2, accumulator.prepend(current))
        } else {
            collatz(current*3 + 1, accumulator.prepend(current))      
        }
    }
    func main() -> []Int {
        collatz(3, []Int{})
    }`, "data([1, 2, 4, 8, 16, 5, 10, 3])", []);

    // 12. list_any
    // * member function as value
    await runTestScript(`
    testing list_any
    func main_inner(fnAny: ((Int) -> Bool) -> Bool) -> Bool {
        fnAny((i: Int) -> Bool {
            i == 10
        })
    }
    func main() -> Bool {
        main_inner([]Int{1,2,3,4,5,6,10}.any)
    }`, "data(1{})", []);
    
    // 13. value_get
    await runTestScript(`
    testing value_get
    func main() -> []Int {
        ac1: AssetClass = AssetClass::new(MintingPolicyHash::new(#1234), #1234);
        ac2: AssetClass = AssetClass::new(MintingPolicyHash::new(#5678), #5678);
        ac3: AssetClass = AssetClass::new(MintingPolicyHash::new(#9abc), #9abc);


        x: Value = Value::new(ac1, 100) + Value::new(ac2, 200) - Value::new(ac1, 50);

        []Int{x.get(ac1), x.get(ac2), x.get(ac3)}
    }`, "not found", []);

    // 14. switch_redeemer
    await runTestScript(`
    testing staking
    enum Redeemer {
        Unstake
        Reward
        Migrate
    }
    func main_internal(redeemer: Redeemer) -> Bool {
        redeemer.switch{
            Unstake => {false},
            Reward  => {true},
            Migrate => {false}
        }
    }
    func main() -> Bool {
        print(main_internal(Redeemer::Unstake).show());
        print(main_internal(Redeemer::Reward).show());
        print(main_internal(Redeemer::Migrate).show());
        true
    }`, "data(1{})", ["false", "true", "false"]);

    // 15. struct method recursion
    await runTestScript(`
    testing fibonacci_struct
    struct Fib {
        a: Int
        b: Int
        func calc_internal(self, n: Int) -> Fib {
            if (n == 0) {
                self
            } else {
                Fib{a: self.b, b: self.a + self.b}.calc_internal(n-1)
            }
        }
        func calc(self, n: Int) -> Int {
            res: Fib = self.calc_internal(n);
            res.a + res.b
        }
    }
    func main() -> Int {
        fib = Fib{a: 0, b: 1};
        fib.calc(5)
    }`, "data(13)", []);

    // 16. enum method recursion
    await runTestScript(`
    testing fibonacci_enum
    enum Fib {
        One{
            a: Int
            b: Int
        }
        Two{
            a: Int
            b: Int
        }
        func calc_internal(self, n: Int) -> Fib {
            self.switch{
                o: One => 
                    if (n == 0) {
                        o
                    } else {
                        Fib::One{a: o.b, b: o.a + o.b}.calc_internal(n-1)
                    },
                t: Two =>
                    if (n == 0) {
                        t
                    } else {
                        Fib::Two{a: t.b, b: t.a + t.b}.calc_internal(n-1)
                    }
            }  
        }
        func calc(self, n: Int) -> Int {
            res: Fib = self.calc_internal(n);

            res.switch{
                o: One => o.a + o.b,
                t: Two => t.a + t.b
            }
        }
    }
    func main() -> Int {
        fib = Fib::One{a: 0, b: 1};
        print(fib.calc(5).show());
        Fib::Two{a: 0, b: 1}.calc(6)
    }`, "data(21)", ["13"]);

    await runTestScript(`
    testing opt_args_wrong_syntax

    func opt_args(a: Int, b: Int, c: Int = 0) -> Int {
            a*b + c
    }

    func main() -> Int {
        opt_args(a: 10, 10)
    }
    `, "can't mix positional and named args", []);

    await runTestScript(`
    testing opt_args_wrong_syntax

    func opt_args(a: Int, b: Int, c: Int = 0) -> Int {
            a*b + c
    }

    func main() -> Int {
        fn: (a: Int, Int, ?Int) -> Int = opt_args;
        fn(10, 10)
    }
    `, "can't mix named and unnamed args in func type", []);

    await runTestScript(`
    testing mix_opt_and_multi

    func multi() -> (Int, Int) {
        (1, 2)
    }

    func opt(a: Int, b: Int = 3, c: Int = a*b) -> Int {
        b*a + c
    }

    func main() -> Int {
        fn: (Int, ?Int, ?Int) -> Int = opt;
        fn(multi()) + fn(2, multi()) + opt(a: 1, c: 10)
    }`, "data(21)", []);

    await runTestScript(`
    testing copy_1

    struct Datum {
        a: Int
        b: Int
        c: Int

        func sum(self) -> Int {
            self.a + self.b + self.c
        }
    }

    func main() -> Int {
        d = Datum{1, 2, 3};
        d0: Datum = d.copy(2);
        d1: Datum = d.copy(c: 10);
        d0.sum() + d1.sum()
    }`, "data(20)", []);

	await runTestScriptWithArgs(`testing nestNFT
    const NOTHING: Value = Value::lovelace(0)

	enum Redeemer{
		Convert {
			mph: MintingPolicyHash
			policyConverted: MintingPolicyHash 
		}
	}
	
	func main(redeemer: Redeemer, ctx: ScriptContext) -> Bool {
		tx: Tx = ctx.tx;

		datums: Int = tx.inputs.map((x: TxInput) -> Int{
			x.output.datum.switch{None => 0, else => 1}
		}).fold((sum:Int,x:Int) -> Int {sum+x}, 0);

		valueInputSC:Value=tx.inputs.map((x:TxInput) -> Value {
			x.output.datum.switch{
				Inline=> {x.output.value},
				else=>NOTHING    
			}
		}).fold((sum:Value,x:Value) -> Value {sum+x}, NOTHING);
	
	
		redeemer.switch{
			x: Convert => {
				assetName: ByteArray = valueInputSC.get_policy(x.mph).fold((sum:ByteArray, y:ByteArray, _) -> ByteArray {y+sum}, (#));

				mintedTotal:Value=tx.minted;

				userNFT: AssetClass = AssetClass::new(
					x.policyConverted, 
					(#000de140)+assetName
				);

				referenceNFT: AssetClass = AssetClass::new(
					x.policyConverted, 
					(#000643b0)+assetName
				);

				lockedNFT: AssetClass = AssetClass::new(
					x.mph, 
					assetName
				);
				
				valueToBurn: Value = Value::lovelace(0) - Value::new(userNFT, 1) - Value::new(referenceNFT, 1);

				(
					valueInputSC.contains(Value::new(referenceNFT, 1) + Value::new(lockedNFT, 1)) && 
					valueToBurn == mintedTotal &&
					datums == 1
				)
			}
		}
	}
	
	// a script context with a single input and a single output
	const PUB_KEY_HASH_BYTES: ByteArray = #01234567890123456789012345678901234567890123456789012345
	const TX_ID_IN_BYTES: ByteArray = #0123456789012345678901234567890123456789012345678901234567891234
	const TX_ID_IN: TxId = TxId::new(TX_ID_IN_BYTES)
	const CURRENT_VALIDATOR_BYTES: ByteArray = #01234567890123456789012345678901234567890123456789012346
	const CURRENT_VALIDATOR: ValidatorHash = ValidatorHash::new(CURRENT_VALIDATOR_BYTES)
	const MPH: MintingPolicyHash = MintingPolicyHash::new(CURRENT_VALIDATOR_BYTES)
	const HAS_STAKING_CRED_IN: Bool = false
	const STAKING_CRED_TYPE: Bool = false
	const SOME_STAKING_CRED_IN: StakingCredential = if (STAKING_CRED_TYPE) {
		StakingCredential::new_ptr(0, 0, 0)
	} else {
		StakingCredential::new_hash(StakingHash::new_stakekey(StakeKeyHash::new(PUB_KEY_HASH_BYTES)))
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
	const OUTPUT_DATUM: OutputDatum = OutputDatum::new_hash(DATUM_HASH_1)

	const CURRENT_TX_ID: TxId = TxId::new(#00112233445566778899001122334455667788990011223344556677)

	const FIRST_TX_INPUT: TxInput = TxInput::new(TX_OUTPUT_ID_IN, TxOutput::new(ADDRESS_IN, VALUE_IN + Value::new(AssetClass::new(MPH, #), 1), OutputDatum::new_inline(42)))
	const REF_INPUT: TxInput = TxInput::new(TxOutputId::new(TX_ID_IN, 1), TxOutput::new(ADDRESS_IN, Value::lovelace(0) + Value::new(AssetClass::new(MPH, #), 1), OutputDatum::new_inline(42)))
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
		Map[DatumHash]Int{},
        TxId::new(#9876543210012345678901234567890123456789012345678901234567891234)
	)
	const SCRIPT_CONTEXT: ScriptContext = ScriptContext::new_spending(TX, TX_OUTPUT_ID_IN)

	const REDEEMER: Redeemer = Redeemer::Convert{
		mph: MPH,
		policyConverted: MPH
	}`, ["REDEEMER", "SCRIPT_CONTEXT"], "data(0{})", []);

    await runTestScriptWithArgs(`
    testing handles_personalization

    enum Redeemer {
        UPDATE_NFT_HANDLE { 
            handle: String
        }
    }
    struct PzSettings {
        treasury_fee: Int
    }

    struct Datum {
        answer: Int
    }

    func loadSettings(ctx: ScriptContext) -> PzSettings {
        pz_input: TxInput = ctx.tx.ref_inputs.get(0);
        PzSettings::from_data(pz_input.output.datum.get_inline_data())
    }

    func main(datum: Datum, redeemer: Redeemer, ctx: ScriptContext) -> Bool {
        redeemer.switch {
            UPDATE_NFT_HANDLE => {
                settings: PzSettings = loadSettings(ctx);
                settings == settings
            },
            else => {
                datum == datum
            }
        }
    }

    const update_nft_redeemer_good: Redeemer = Redeemer::UPDATE_NFT_HANDLE { "xar12345" }

    const good_datum: Datum = Datum { 42 }

    const pz_settings: PzSettings = PzSettings {
        treasury_fee: 1
    }

    const good_owner_input: TxInput = TxInput::new(TxOutputId::new(TxId::new(#0123456789012345678901234567890123456789012345678901234567891235), 0),
        TxOutput::new(
            Address::new(Credential::new_validator(ValidatorHash::new(#01234567890123456789012345678901234567890123456789000002)), Option[StakingCredential]::None)
            , Value::lovelace(10000000)
            , OutputDatum::new_none()
        )
    )

    const good_ref_input_pz: TxInput = TxInput::new(TxOutputId::new(TxId::new(#0123456789012345678901234567890123456789012345678901234567891234), 0),
        TxOutput::new(
            Address::new(Credential::new_validator(ValidatorHash::new(#01234567890123456789012345678901234567890123456789000003)), Option[StakingCredential]::None)
            , Value::lovelace(10000000)
            , OutputDatum::new_inline(pz_settings)
        )
    )
    const good_owner_output: TxOutput = TxOutput::new(
        Address::new(Credential::new_validator(ValidatorHash::new(#01234567890123456789012345678901234567890123456789000003)), Option[StakingCredential]::None)
        , Value::lovelace(10000000)
        , OutputDatum::new_none()
    )

    const ctx_good_default: ScriptContext = ScriptContext::new_spending(
        Tx::new(
            []TxInput{good_owner_input},
            []TxInput{good_ref_input_pz},
            []TxOutput{good_owner_output},
            Value::lovelace(160000),
            Value::ZERO,
            []DCert{},
            Map[StakingCredential]Int{},
            TimeRange::from(Time::new(1001)),
            []PubKeyHash{PubKeyHash::new(#9876543210012345678901234567890123456789012345678901234567891234)},
            Map[ScriptPurpose]Data{},
            Map[DatumHash]Data{},
            TxId::new(#9876543210012345678901234567890123456789012345678901234567891234)
        ),
        TxOutputId::new(TxId::new(#0123456789012345678901234567890123456789012345678901234567891234), 0)
    )`, ["good_datum", "update_nft_redeemer_good", "ctx_good_default"], "data(1{})", []);
}

runIfEntryPoint(main, "example-scripts.js");
