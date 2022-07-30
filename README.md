# Helios

Helios is a Domain Specific Language that compiles to Plutus-Core (i.e. Cardano on-chain validator scripts). Helios is a non-Haskell alternative to Plutus.

Helios is purely functional, strongly typed, and has a Rusty curly braces syntax. It notably supports closures, compile-time const statements, and enums as tagged unions.

This repository contains a reference compiler for Helios, written in Javascript.

Use the following tutorial to learn how to use Helios with cardano-cli:
  1. [Cardano-node setup](doc/tutorial_01-environment_setup.md)
  2. [Wallet setup and funding](doc/tutorial_02-wallet_setup.md)
  3. [*Always Succeeds* contract](doc/tutorial_03-always_succeeds.md)
  4. [*Time Lock* contract](doc/tutorial_04-time_lock.md)
  5. [*Subscription* contract](doc/tutorial_05-subscription_contract.md)
  6. [Minting policy scripts](doc/tutorial_06-minting.md)
  7. [*English Auction* contract](doc/tutorial_07-english_auction.md)

We are in the process of migrating these docs [here](https://hyperion-bt.github.io/Helios-Book/).

Note that the Helios library also contains a function to deserialize existing Plutus-Core scripts (see second example below).


## Acknowledgements

* [Ch1n3du](https://github.com/Ch1n3du): improved syntax, documentation
* [Tanyalouise](https://github.com/tanthehack): designs
* [Cnftacademy](https://cnftacademy.com/): testing
* [mikky-j](https://github.com/mikky-j): documentation


## Quick start examples

### 1. Vesting contract example
The following Helios example is equivalent to the Plutus vesting contract from the Plutus playground (demonstration of syntax only, shouldn't be used in production!):
```golang
validator vesting;

struct VestingTranche {
    time:  Time, // 'amount' is available after 'time'
    amount: Value
}

struct VestingParams {
    tranche1: VestingTranche,
    tranche2: VestingTranche,
    owner:    PubKeyHash
}

const PARAMS: VestingParams = VestingParams{
    /*parameters interpolated from surrounding js*/
};


func available_from(tranche: VestingTranche, time: Time) -> Value {
    if (time >= tranche.time) {
        tranche.amount
    } else {
        Value::ZERO
    }
}

func remaining_from(tranche: VestingTranche, time: Time) -> Value {
    tranche.amount - available_from(tranche, time)
}

// the compiler is smart enough to add an empty Datum and empty Redeemer as arguments to the actual main entrypoint function
func main(ctx: ScriptContext) -> Bool {
    tx: Tx = ctx.tx;
    now: Time = tx.now();
    remaining_actual: Value = tx.value_locked_by(ctx.current_validator_hash());
    remaining_expected: Value = remaining_from(PARAMS.tranche1, now) + remaining_from(PARAMS.tranche2, now);
    remaining_actual >= remaining_expected && tx.is_signed_by(PARAMS.owner)
}
```

You can compile this source into Plutus-Core using the `helios.js` library:
```javascript
import * as helios from "helios.js"

const src = `struct VestingTranche {
...
...
`;

console.log(helios.compile(src));
// the output can be saved to a file, and that file can be used directly by cardano-cli
```

### 2. Deserialize Plutus-Core
```javascript
import * as helios from "helios.js"

const plutusCoreJson = `{"type": "PlutusScriptV1", ...}`;

// dump Plutus-Core AST
console.log(helios.deserializePlutusCore(plutusCoreJson));
```

## Helios user guide

### Syntax
Helios has a C-like syntax. A function body is a single expression. There are no statements, and consequently no `return` statements. 

`=` combined with `;` is a ternary operator. `x = upstream; downstream...` is syntactic sugar for `func(x){downstream...}(upstream)`.

### Primitive types
Each primitive type has associated literal expressions:
 * `Bool`: `true` or `false`
 * `Int`: `123` or `0b1111011` or `0o173` or `0x7b`
 * `String`: `"..."` or `'...'`
 * `ByteArray`: `#abcdef0123456789` (i.e. pound symbol followed by lower-case hexadecimal sequence)

### List types
For now Helios only offers one builtin container type: lists. (We might implement a Map type at some point in the future).

The syntax for list types and literal list expressions is the same as in Golang:
```golang
numbers: []Int = []Int{1, 2, 3};
...
```

### (WiP) Option type
What the `Option` type might look like:
* `Option[T]`
* `Option[T]::Some`
* `Option[T]::None`

### Other builtin types
Besides primitive types, some other opaque builtin types are defined:
 * `ScriptContext`
 * `Tx`
 * `TxInput`
 * `TxOutput`
 * `TxId`
 * `TxOutputId`
 * `PubKeyHash`
 * `ValidatorHash`
 * `MintingPolicyHash`
 * `DatumHash`
 * `Time`
 * `TimeRange`
 * `Duration`
 * `Value`
 * `Data`
 * `AssetClass`
 * `Address`
 * `Credential`
 * `Credential::PubKey`
 * `Credential::Validator`
 * `StakingCredential`
 
These types require special builtin functions to access their content. Some also have builtin constructors. User defined struct an enum-types automatically generate a *cast* function allowing `Data` to be cast into that particular type.

### Struct-types
User defined struct-types are defined as follows:
```golang
struct Redeemer {
    mode:      Int,
    message:   String,
    recipient: PubKeyHash
}
```

### Enum-types
Helios supports tagged unions through `enum`. These are useful for datums and redeemers with differing content depending on how the script is used. In Haskell tagged unions are called Algeabraic Data Types. Tagged union `enum`s are declared using the following syntax:
```golang
enum Datum {
    Submission{...}, // content of Submission has the same syntax as a regular struct-type
    Queue{...},
    Post{...}
}
```

A `switch` expression can be used to 'unwrap' enum-type instances:
```golang
switch (expr) {
    case (x: Datum::Submission) { // double-colon to reference the sub-type
        ... // expression must use x
    } case Datum::Queue {
        ... // x not used, so can't be declared
    } default { // default must come last if all sub-types of Datum aren't handled explicitely
        true
    }
}
```

Direct explicit downcasting is also possible (a runtime error will be thrown if the type doesn't match):
```golang
datum: Datum = Datum::Submission{...}; // implicit upcasting
s_datum: Datum::Submission = Datum::Submission::cast(datum); // explicit downcasting (cast associated member is automatically generated)
...
```

### Branching
Branching expressions look like C `if else` branching statements, but must always have the `else` branch defined:
```golang
if (code == 0) { // expression to convert an Int code into a String
    "Success"
} else if (code == 1) {
    "Error"
} else {
    "Unhandled"
}
```

The Helios `if else` expression is syntactic sugar for nested Plutus-Core `ifThenElse` calls. Internally the branches of Plutus-Core's `ifThenElse` are deferred by wrapping them in lambda expressions, and then calling the returned lambda expression with zero arguments (actually a 'unit' argument). `&&` and `||` also defer calculation of their right-hand arguments.

Branch deferral is the expected behaviour for conventional programming languages.

Each branch must evaluate to the same type.

### Function expressions
Helios supports anonymous function expressions with the following syntax:
```golang
my_add_integers: (Int, Int) -> Int = (a: Int, b: Int) -> Int {a + b}; ...
```

Note how the type expression for a function resembles the right-hand function value expression itself.

Function values aren't entirely first class: they can't be put in containers (so not in lists nor in any fields of a `struct` or `enum` type).

### (WiP) Type inference
If the type of the right-hand-side of an assignment is a literal (constructor or primitive) or a builtin cast, the type can be infered:
```golang
my_number = 42;

my_add_integers = (a: Int, b: Int) -> Int {a + b}; ...

my_value = Value::new(AssetClass::ADA, my_number)
```

### (WiP) Builtin operators
Operators that can be used in compile-time `const` statements are marked with '^'.
 * `a == a -> Bool` (anything except function)
 * `a != a -> Bool`
 * `! Bool -> Bool`
 * `Bool || Bool -> Bool`
 * `Bool && Bool -> Bool`
 * `- Int -> Int` ^
 * `+ Int -> Int` ^
 * `Int >= Int -> Bool`
 * `Int > Int -> Bool`
 * `Int <= Int -> Bool`
 * `Int < Int -> Bool`
 * `Int + Int -> Int` ^
 * `Int - Int -> Int` ^
 * `Int * Int -> Int` ^
 * `Int / Int -> Int` ^
 * `Int % Int -> Int`
 * `ByteArray >= ByteArray -> Bool`
 * `ByteArray > ByteArray -> Bool`
 * `ByteArray <= ByteArray -> Bool`
 * `ByteArray < ByteArray -> Bool`
 * `ByteArray + ByteArray -> ByteArray` (concatenation)
 * `String + String -> String` (concatenation)
 * `Time >= Time -> Bool`
 * `Time > Time -> Bool`
 * `Time <= Time -> Bool`
 * `Time < Time -> Bool`
 * `Time + Duration -> Time`
 * `Time - Duration -> Time`
 * `Duration + Duration -> Duration`
 * `Duration - Duration -> Duration` (note that `Duration` can be negative)
 * `Duration * Int -> Duration`
 * `Duration / Int -> Duration`
 * `Value + Value -> Value` ^
 * `Value - Value -> Value`
 * `Value >= Value -> Bool` (strictly greater-or-equals for each component, NOT the same as `!(a < b)`)
 * `Value > Value -> Bool` (strictly greater-than for each component, NOT the same as `!(a <= b)`)
 * `Value < Value -> Bool` (strictly less-than for each component, NOT the same as `!(a >= b)`)
 * `Value <= Value -> Bool` (strictly less-or-equals for each component, NOT the same as `!(a > b)`)

### (WiP) Builtin functions

 * `to_int(self: Bool) -> Int` (`false` -> `0`, `true` -> `1`)
 * `to_bool(self: Int) -> Bool`
 * `encode_utf8(self: String) -> ByteArray`
 * `decode_utf8(self: ByteArray) -> String`
 * `show(self: Int) -> String` (string representation of integer)
 * `to_hex(self: Int) -> String`
 * `show(self: Bool) -> String` (`"true"` or `"false"`)
 * `show(self: Time) -> String` (string representation of milliseconds since epoch)
 * `show(self: ByteArray) -> String` (hex representation of bytearray)
 * `Time::new(Int) -> Time` (milliseconds since epoch)
 * `Duration::new(Int) -> Duration` (milliseconds)
 * `PubKeyHash::new(ByteArray) -> PubKeyHash`
 * `ValidatorHash::new(ByteArray) -> ValidatorHash`
 * `DatumHash::new(ByteArray) -> DatumHash`
 * `MintingPolicyHash::new(ByteArray) -> MintingPolicyHash`
 * `show(self: PubKeyHash) -> String`
 * `show(self: ValidatorHash) -> String`
 * `show(self: DatumHash) -> String`
 * `show(self: MintingPolicyHash) -> String`
 * `TxOutputId::new(ByteArray, Int) -> TxOutputId`
 * `fold[b, a](self: []b, a, (a, b) -> a) -> a`
 * `map[a, b](self: []a, (a) -> b) -> []b`
 * `filter[a](self: []a, (a) -> Bool) -> []a`
 * `find[a](self: []a, (a) -> Bool) -> a` (returns first found, throws error if nothing found)
 * `any[a](self: []a, (a) -> Bool) -> Bool`
 * `all[a](self: []a, (a) -> Bool) -> Bool`
 * `ByteArray.length -> Int`
 * `[]a.length -> Int`
 * `prepend[a](self: []a, a) -> []a`
 * `get[a](self: []a, Int) -> a` (throws error if out of range)
 * `[]a.head -> a` (first element of list, throws error if list is empty)
 * `[]a.tail -> []a` (rest of list without first element, throws error if list is empty)
 * `is_empty[a](self: []a) -> Bool`
 * `ScriptContext.tx -> Tx`
 * `spending_purpose_output_id(self: ScriptContext) -> TxOutputId`
 * `Tx.time_range -> TimeRange`
 * `Tx.inputs -> []TxInput`
 * `Tx.outputs -> []TxOutput`
 * `outputs_sent_to(self: Tx, PubKeyHash) -> []TxOutput` (outputs being sent to regular payment address)
 * `outputs_locked_by(self: Tx, ValidatorHash) -> []TxOutput` (outputs being sent to script `Address` with specified validator credential hash)
 * `TimeRange.get_start() -> Time` (throws error if time range start is open)
 * `Tx.signatories -> []PubKeyHash`
 * `Tx.id -> TxId`
 * `is_signed_by(self: Tx, PubKeyHash) -> Bool`
 * `TxInput.output_id -> TxOutputId`
 * `TxInput.output -> TxOutput` (original `TxOutput` that is now being used as `TxInput`)
 * `TxOutput.address -> Address`
 * `TxOutput.value -> Value`
 * `TxOutput.datum_hash -> Option[DatumHash]`
 * `Address.credential -> Credential`
 * `Credential::Validator.hash -> ValidatorHash`
 * `Credential::PubKey.hash -> PubKeyHash`
 * `get_current_input(self: ScriptContext) -> TxInput`
 * `get_current_validator_hash(self: ScriptContext) -> ValidatorHash` (hash of current validator script)
 * `get_current_minting_policy_hash(self: ScriptContext) -> MintingPolicyHash` (hash of curreny minting script)
 * `get(self: Value, AssetClass) -> Int`
 * `is_zero(self: Value) -> Bool`
 * `Value::ZERO -> Value` (`impl` can have associated `const` members)
 * `value_sent_to(self: Tx, PubKeyHash) -> Value` (`Value` sent to regular paymant address)
 * `value_locked_by(self: Tx, ValidatorHash) -> Value` (`Value` sent to script `Address` with given validator credential hash)
 * `value_locked_by_datum(self: Tx, ValidatorHash, a) -> Value` (`Value` sent to script with given datum of type `a`, `a` must be a user-defined type, throws an error if datum isn't found)
 * `AssetClass::new(ByteArray, String) -> AssetClass`
 * `AssetClass::ADA -> AssetClass`
 * `Value::new(AssetClass, Int) -> Value` ^
 * `Value::lovelace(Int) -> Value` ^
 * `find_datum_data(self: Tx, DatumHash) -> Data`
 * `find_datum_hash(self: Tx, a) -> DatumHash` (`a` must be a user-defined type)
 * `serialize(self: a) -> ByteArray` (`a` can be anything except a function type)
 * `sha2(self: ByteArray) -> ByteArray` (32 bytes)
 * `sha3(self: ByteArray) -> ByteArray` (32 bytes)
 * `blake2b(self: ByteArray) -> ByteArray` (32 bytes)


## Helios developer guide

### Design principles
* The Helios DSL is a C-like language, so it can be read by almost any programmer.
* Whitespace is obviously insignificant.
* For everything there should be one, and only one, obvious way of doing it.
* Each symbol/operator has only one kind of functionality. Only standard symbols/operators should be used (so nothing weird like in Haskell).
* Brackets are only used for builtin parametric types (List-type and perhaps at some point in the future Map, Option etc.). Brackets aren't used for indexing (use `.get` builtin instead).
* Semi-colons are operators and are part of assignment expressions. They can't be used as separators.
* Similarly the equals-sign is part of assignment expressions, and can't be used as other 'special' syntax.
* Because expressions can contain assignments all distinct expressions should be visibly scoped (inside parentheses or braces, so no leaving out the parentheses of `if else`-conditions like in Golang). 
* The colon and comma act as separators, never as operators.
* No name shadowing, no keyword shadowing.
* Every variable declaration must be fully typed.
* No type aliases: some users might expect automatic up-and-down-casting, and others won't expect that.
* Every declared name (local or global) must be used when `main()` is evaluated. Unused names must be eliminated from the source-code.
* All members of an enum-type must also be used.
* Conditions of `if else` expressions can't evaluate to a compile-time constant.
* Top-level `const` statements allow compile-time evaluation into primitive values (not available for all builtin function calls yet). Expressions are otherwise never simplified/optimized.


### Untyped Helios
Helios is a typed language, and is internally converted into untyped Helios before final compilation into (untyped) Plutus-Core.

Untyped Helios is essentially an expansion of all the operators and all the semi-builtin functions (semi-builtin functions are builtins provided by typed Helios, but not by Plutus-Core).
