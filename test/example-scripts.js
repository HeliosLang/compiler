#!/usr/bin/env node
//@ts-check
import fs from "fs";
import crypto from "crypto";
import * as helios from "../helios.js";
import { runIfEntryPoint } from "./util.js";

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

        function checkResult(result_) {
            let resStr = result_.toString();
            if (result_ instanceof Error) {
                let parts = resStr.split(":");
                resStr = parts[parts.length-1].trim();
            } 
        
            if (resStr != expectedResult) {
                throw new Error(`unexpected result in ${name}: expected "${expectedResult}", got "${resStr}"`);
            }
        }

        try {
            let program = helios.Program.new(src);

            let args = argNames.map(n => program.evalParam(n));

            let [result, messages] = await program.compile().runWithPrint(args);
        
            checkResult(result);
        
            if (messages.length != expectedMessages.length) {
                throw new Error(`unexpected number of messages in ${name}: expected ${expectedMessages.length}, got ${messages.length}`);
            } 
        
            for (let i = 0; i < messages.length; i++) {
                if (messages[i] != expectedMessages[i]) {
                    throw new Error(`unexpected message ${i} in ${name}`);
                }
            }   

            console.log(`integration test '${name}' succeeded`);

            // also try the simplified version (don't check for the message though because all trace calls will've been eliminated)

            [result, messages] = await program.compile(true).runWithPrint(args);

            if (messages.length != 0) {
                throw new Error("unexpected messages");
            }

            checkResult(result);
        } catch(e) {
            if (!(e instanceof helios.UserError)) {
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
    }`, "true", ["hello world"]);

    // 2. hello_world_false
    await runTestScript(`
    testing hello_world_false
    func main() -> Bool {
        print("hello world");
        !true
    }`, "false", ["hello world"]);

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
    }`, "false", ["hello number 0"]);

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
    }`, "true", ["1234"]);

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
    }`, "not callable", []);

    // 7. list_get ok
    await runTestScript(`
    testing list_get
    func main() -> Bool {
        x: []Int = []Int{1, 2, 3};
        print(x.get(0).show());
        x.get(2) == 3
    }`, "true", "1");

    // 8. list_get nok
    // * error thrown by builtin
    await runTestScript(`
    testing list_get
    func main() -> Bool {
        x = []Int{1, 2, 3};
        print(x.get(0).show());
        x.get(-1) == 3
    }`, "index out of range", "1");

    // 9. multiple_args
    // * function that takes more than 1 arguments
    await runTestScript(`
    testing multiple_args
    func concat(a: String, b: String) -> String {
        a + b
    }
    func main() -> Bool {
        print(concat("hello ", "world"));
        true
    }`, "true", ["hello world"]);

    // 10. collatz recursion
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

    // 11. list_any
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
    }`, "true", []);
    
    // 12. value_get
    await runTestScript(`
    testing value_get
    func main() -> []Int {
        ac1: AssetClass = AssetClass::new(MintingPolicyHash::new(#1234), #1234);
        ac2: AssetClass = AssetClass::new(MintingPolicyHash::new(#5678), #5678);
        ac3: AssetClass = AssetClass::new(MintingPolicyHash::new(#9abc), #9abc);


        x: Value = Value::new(ac1, 100) + Value::new(ac2, 200) - Value::new(ac1, 50);

        []Int{x.get(ac1), x.get(ac2), x.get(ac3)}
    }`, "policy not found", []);

    // 13. switch_redeemer
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
    }`, "true", ["false", "true", "false"]);

    // 14. struct method recursion
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

    // 15. enum method recursion
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

	await runTestScriptWithArgs(`testing nestNFT
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

		nothing: Value = Value::lovelace(0);

		valueInputSC:Value=tx.inputs.map((x:TxInput) -> Value {
			x.output.datum.switch{
				Inline=> {x.output.value},
				else=>nothing    
			}
		}).fold((sum:Value,x:Value) -> Value {sum+x}, nothing);
	
	
		redeemer.switch{
			x: Convert => {
				assetName: ByteArray = valueInputSC.get_policy(x.mph).fold_keys((sum:ByteArray,y:ByteArray) -> ByteArray {y+sum}, (#));

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
	const TX_ID_IN_BYTES = #0123456789012345678901234567890123456789012345678901234567891234
	const TX_ID_IN: TxId = TxId::new(TX_ID_IN_BYTES)
	const CURRENT_VALIDATOR_BYTES = #01234567890123456789012345678901234567890123456789012346
	const CURRENT_VALIDATOR: ValidatorHash = ValidatorHash::new(CURRENT_VALIDATOR_BYTES)
	const MPH: MintingPolicyHash = MintingPolicyHash::new(CURRENT_VALIDATOR_BYTES)
	const HAS_STAKING_CRED_IN = false
	const STAKING_CRED_TYPE = false
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
	const QTY = 200000
	const QTY_1 = 100000
	const QTY_2 = 100000

	const FEE = 160000
	const VALUE_IN: Value = Value::lovelace(QTY + QTY_1 + QTY_2)
	const VALUE_OUT: Value = Value::lovelace(QTY - FEE)
	const VALUE_OUT_1: Value = Value::lovelace(QTY_1)
	const VALUE_OUT_2: Value = Value::lovelace(QTY_2)

	const DATUM_1: Int = 42
	const DATUM_HASH_1: DatumHash = DatumHash::new(DATUM_1.serialize().blake2b())
	const OUTPUT_DATUM: OutputDatum = OutputDatum::new_hash(DATUM_HASH_1)

	const CURRENT_TX_ID: TxId = TxId::CURRENT

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
		Map[DatumHash]Int{}
	)
	const SCRIPT_CONTEXT: ScriptContext = ScriptContext::new_spending(TX, TX_OUTPUT_ID_IN)

	const REDEEMER = Redeemer::Convert{
		mph: MPH,
		policyConverted: MPH
	}`, ["REDEEMER", "SCRIPT_CONTEXT"], "false", []);
}

runIfEntryPoint(main, "example-scripts.js");
