This Changelog only applies to notable changes of `helios.js` on the main branch.

# 2022/10/21
* ScriptPurpose type, with members Minting, Spending, Rewarding and Certifying
* `ScriptContext.get_script_purpose()`
* `Tx.redeemers`
* `Int::parse`
* unused struct/enum fields, and unused enum variants, are now allowed
* `Option.unwrap()`

# 2022/10/11
* added `Value::from_map`
* removed `tx.now()` (in favor of `tx.time_range.start` and `tx.time_range.end`)
* changed `time_range.get_start()` to `time_range.start` (is a getter!)
* added `time_range.end` (is a getter!)
* added `map.map_keys()` and `map.map_values()`
* support for operator overloading (internally), with `Time - Duration -> Time` and `Duration/Duration -> Int` as new overloads
* `+` and `*` operators are now commutative in case left and right types differ

# 2022/09/19
* toSchemaJSON renamed to toSchemaJson
* tx.outputs_sent_to_datum, tx.value_sent_to_datum, tx.outputs_locked_by_datum, tx.value_locked_by_datum: now take 'isInline' as a third boolean argument

# 2022/09/16
* PlutusCore renamed to UPLC everywhere
* helios.d.ts file generated

# 2022/08/26
* program.changeParam accepts both jsons strings and PlutusCoreValue is value

# 2022/08/25
* `[]a.new` method uses `func(Int) -> a` as second arg (first arg is length), List.new_const introduced that uses `a` as second arg (first arg is length).

# 2022/08/22
* TxOutput can have inline datum
* TxOutput.datum returns OutputDatum enum (replaces the .datum_hash field)
* OutputDatum enum has members None, Hash and Inline
* generic Data type introduced (used by inline datum)
* All types have builtin associated ::from_data() method that converts `Data` into that type
* Map.get_safe() method that returns Option
* staking script purpose
* StakingPurpose enum, with members Rewarding and Certifying, returned by ScriptContext.get_staking_purpose() (only available in staking/testing script)
* DCert enum with members Register, Deregister, Delegate, RegisterPool, RetirePool (DCertGenesis and DCertMir ignored)
* New fields for Tx: Tx.ref_inputs, Tx.dcerts and Tx.withdrawals (constructor for Tx also changed accordingly)
* ScriptContext constructors have been renamed: new_spending, new_minting, new_rewarding and new_certifying

# 2022/08/19
* Library interface changed to something more object-like
* Script purpose keywords changed to 'testing', 'spending' and 'minting'
* Macro-like builtins whichs are only allowed after 'main': ValidatorHash::CURRENT, MintingPolicyHash::CURRENT, ScriptContext::new, Tx::new, TxID::CURRENT, TxInput::new, TxOutput::new
* Generally usable constructors: TxId::new, Address::new, Credential::new_pubkey, Credential::new_validator, StakingCredential::new_hash, StakingCredential::new_ptr
* First argument of AssetClass::new must be MintingPolicyHash (was ByteArray previously)

# 2022/08/17
* Cost calculation of a plutus-core program run

# 2022/08/16
* 'simplify' boolean flag in config object that is passed to compile()
* Map key can't be bool type (makes it easier to use bool as primitive in plutus-core, instead of as data type)
* `Value*Int` (not commutative) and `Value/Int` operators
* tx methods: 'outputs_sent_to_datum', 'outputs_locked_by_datum' and 'value_sent_to_datum' (not yet property tested)

# 2022/08/11
* ByteArray.slice (negative indices relative to end)
* ByteArray starts_with and ends_with
* String starts_with and ends_with
* Map + Map operator (note: map merge doesn't assert uniqueness of keys and simply acts as a concatenation of two lists)
* Map methods: all, all_keys, all_values, any, any_key, any_value, filter, filter_by_key, filter_by_value, fold, fold_keys, fold_values
* all methods named 'get...' or 'find...' throw errors if not found
* TokenName in AssetClass is now ByteArray in order to align with Plutus-Ledger-API (used to be String)

# 2022/08/10
* Rust-like syntax, structs and enums can have methods
* No commas in struct/enum-member definitions
* No semicolon after const statement
* C#-like switch syntax
* TimeRange constructors: ALWAYS, NEVER, from, to
* TimeRange comparison: is_before(Time) and is_after(Time)
* Map literal construction, Map.length, Map.is_empty() and Map.get()
* Value.get_policy()

# 2022/07/15
* renamed to helios

## 2022/07/09
* all named variables in the Plutus-Light are prefixed with u_ when generating the untyped IR
