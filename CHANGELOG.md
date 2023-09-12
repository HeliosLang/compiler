This Changelog only applies to notable changes of language related features in `helios.js` on the main branch.

# 2023/09/12
* cleanup of IR simplication (might change some script hashes)
* StakeKeyHash replaced by PubKeyHash everywhere (has almost exactly the same functionality, so makes little sense for it to be a different type)

# 2023/05/21
* Generic typing for functions, enums and structs
* `map.update` and `map.update_safe`
* `const` statements always require typing, but value is optional (throws error if value is unset before compilation)
* `Any`, `<empty>` and `Valuable` typeclasses
* `[]Int.sum`, `[]Real.sum`, `[]String.join`, `[]ByteArray.join`, `[][]ItemType.flatten`

# 2023/04/29
* `List.drop`, `.take`, `.drop_end` and `.take_end` implemented

# 2023/04/27
* `Real` fixed point number type with most basic math operators
* auto-set tx validity time_range if tx.time_range is called in any of the scripts

# 2023/04/25
* `List.get_singleton()`
* Destructuring enum instances into enum variants throws runtime errors instead of compile-time errors

# 2023/04/13
* `Int` methods: `abs`, `encode_zigzag`, `decode_zigzag`, `to_little_endian`, `to_big_endian`, `to_base58`
* `Int::from_big_endian` and `from_base58` associated functions
* `ByteArray.prepend`

# 2023/04/12
* Destructuring syntax for assignments and for switch cases

# 2023/04/10
* `Duration::SECOND`, `MINUTE`, `HOUR`, `DAY`, `WEEK`

# 2023/04/03
* `AssetClass.mph` and `AssetClass.token_name`

# 2023/03/27
* `TimeRange.show`

# 2023/03/13
* Functions can have optional arguments
* `Value.show`
* `copy` automatically defined on all user structs and user enum variants

# 2023/03/06
* Addition of `ctx.get_cont_outputs()`
* Addition of `value.get_assets()`
* Addition of `option.map()`

# 2023/03/05
* Addition of `Map.for_each`
* Addition of `Int::min`, `Int::max`, `int.bound()`, `int.bound_min()`, `int.bound_max()`
* Addition of `tx.get_datum_data(output: TxOutput)`
* Addition of `Value.get_lovelace()`

# 2023/02/17
* Addition of `Data.tag`
* Addition of `List.for_each()`

# 2023/01/18
* IR: Removed simplify calls from inline methods. Slight decrease in optimization performance, huge increase in compiler speed.

# 2023/01/11
* TxId, TxOutputId and hash-type comparison operators and `show`
* Functions can return void `()` by using `print`, `error` or `assert` as final expressions
* Function expressions return type is optional `(...) -> {...}`
* `OutputDataum.inline_data`
* `Address::new_empty`
* `Wallet`, `Cip30Wallet`, `WalletHelper`, `Network` and `BlockfrostV0` for interacting with browser wallets and the blockchain
* `CoinSelection` class with static method `pickSmallest`
* `HeliosData` instances which can be assigned directly to `Program.parameters`
* Builtin `HeliosData` types: `Int`, `Bool`, `ByteArray`, `HeliosString`, `Address`, `TxId`, hash-types, `Time`, `Duration`, `TxOutputId`, `Value`
* Builtin `List`, `HeliosMap` and `Option` `HeliosData`-type generators.
* Helios structs and enums are avaible as `HeliosData` types through `program.types`

# 2022/12/21
* Addition of `Map.prepend`
* Addition of comparisons for ByteArray: `<`, `>`, `<=` and `>=`
* Function definitions can ignore (all but one) argument with `_`
* Functions can returns multiple values, assignments can assign multi-value rhs to multiple variables (not `const` though), and multi-value expressions are automatically flattened when used in a call

# 2022/12/18
* Addition of `Map.delete`, `Map.set`, `Map.find`, `Map.find_by_key`, `Map.find_by_value`
* Addition of `Map.head_key`, `Map.head_value`, `Map.tail`

# 2022/12/17
* Addition of `List.fold_lazy`, `Map.fold_lazy`, `Map.fold_keys_lazy`, `Map.fold_values_lazy`
* Printing of messages when redemption computation throws an error

# 2022/12/13
* Addition of `List.sort`
* Addition of `StakingHash::Validator.hash` and `StakingHash::StakeKey.hash`
* Addition of `Map.find_key`, `Map.find_key_safe`, `Map.find_value`, `Map.find_value_safe`
* Addition of `Map.sort`, `Map.sort_by_key`, `Map.sort_by_value`

# 2022/12/12
* Addition of `Value.get_safe`.

# 2022/12/10
* Addition of `ScriptHash`, `StakingHash`, `StakingHash::StakeKey`, `StakingHash::Validator`, `StakeKeyHash`, `StakingValidatorHash` (on-chain)
* `TxOutput.ref_script_hash -> Option[ScriptHash]` getter (on-chain)
* `(ValidatorHash|MintingPolicyHash|StakingValidatorHash).from_script_hash()` (on-chain)
* Addition StakeAddress, StakeKeyHash and StakingValidatorHash (off-chain)
* Address construction distinguishes between StakeKeyHash and StakingValidatorHash

# 2022/12/08
* `Value.to_map()`

# 2022/12/03
* Switch expression works over Data
* Type inference for literal enum member constructors that have zero fields
* `PubKey` builtin type, and `PubKey.verify` method (aka verifyEd25519Signature)

# 2022/11/25
* Structs with 1 field are represented directly by their contained field in Uplc
* Structs with more than 1 field are represented as a list of data in Uplc (no longer as ConstrData)
* IR functions with zero arguments become Delay terms in Uplc
* IR calls with zero arguments become Force terms in Uplc
* Core cast functions are extracted as high up as possible
* Special syntax for throwing errors inside switch/if-else branches: `error("...")` 

# 2022/11/22
* Added `Int::from_little_endian()`

# 2022/11/20
* Added `Value.contains_policy()` method

# 2022/11/06
* Modules functionality with `import`

# 2022/10/30
* Added `TxRefInput` export

# 2022/10/27
* Added `new` constructor for `ScriptPurpose` members
* Added list.`find_safe` method

# 2022/10/26
* `redeemers` field added to `Tx::new` constructor

# 2022/10/25
* Better error message when catching `RuntimeError` inside `evalParam`

# 2022/10/23
* HashedDatum and InlineDatum no longer exported
* TxId and DatumHash exported, `Hash` no longer exported
* changeParam handles Hash type literals

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
