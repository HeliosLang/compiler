# Plutus-Light

Plutus-Light is a Domain Specific Language that compiles to Plutus-Core (i.e. Cardano on-chain validator scripts). Plutus-Light is a non-Haskell alternative to Plutus.

Plutus-Light is purely functional, strongly typed, and uses a conventional curly braces syntax. It notably supports closures, compile-time const statements, and enums as tagged unions.

This repository contains a reference compiler for Plutus-Light, written in Javascript.

Use the following tutorial to learn how to use Plutus-Light with cardano-cli:
  1. [Cardano-node setup](doc/01-environment_setup.md)
  2. [Wallet setup and funding](doc/02-wallet_setup.md)
  3. [*Always Succeeds* contract](doc/03-always_succeeds_contract.md)
  4. [*Time Lock* contract](doc/04-time_lock_contract.md)
  5. [*Subscription* contract](doc/05-subscription_contract.md)
  6. [Minting policy scripts](doc/06-minting_policy_scripts.md)
  7. [*English Auction* contract](doc/07-english_auction_contract.md)

Note that the Plutus-Light library also contains a function to deserialize existing Plutus-Core scripts (see second example below).

## Quick start examples

### 1. Vesting contract example
The following Plutus-Light example is equivalent to the Plutus vesting contract from the Plutus playground (demonstration of syntax only, shouldn't be used in production!):
```golang
data VestingTranche {
    time:  Time, // 'amount' is available after 'time'
    amount: Value
}

data VestingParams {
    tranche1: VestingTranche,
    tranche2: VestingTranche,
    owner:    PubKeyHash
}

const PARAMS: VestingParams = VestingParams{
    /*parameters interpolated from surrounding js*/
};


func availableFrom(tranche: VestingTranche, time: Time) -> Value {
    if (time >= tranche.time) {
        tranche.amount
    } else {
        zero()
    }
}

func remainingFrom(tranche: VestingTranche, time: Time) -> Value {
    tranche.amount - availableFrom(tranche, time)
}

// the compiler is smart enough to add an empty Datum and empty Redeemer as arguments to the actual main entrypoint function
func main(ctx: ScriptContext) -> Bool {
    tx: Tx = getTx(ctx);
    now: Time = getTimeRangeStart(getTxTimeRange(tx));
    remainingActual: Value = valueLockedBy(tx, getCurrentValidatorHash(ctx));
    remainingExpected: Value = remainingFrom(PARAMS.tranche1, now) + remainingFrom(PARAMS.tranche2, now);
    remainingActual >= remainingExpected && isTxSignedBy(tx, PARAMS.owner)
}
```

You can compile this source into Plutus-Core using the `plutus-light.js` library:
```javascript
import * as PL from "plutus-light.js"

const src = `data VestingTranche {
...
...
`;

console.log(PL.compilePlutusLightProgram(src));
// the output can be saved to a file, and that file can be used directly by cardano-cli
```

### 2. Deserialize Plutus-Core
```javascript
import * as PL from "plutus-light.js"

const cborHex = "...";

// dump Plutus-Core AST
console.log(PL.deserializePlutusCoreCborHexString(cborHex));
```

## Plutus-Light user guide

### Syntax
Plutus-Light has a C-like syntax. A function body is a single expression. There are no statements, and consequently no `return` statements. 

`=` combined with `;` is a ternary operator. `x = upstream; downstream...` is syntactic sugar for `func(x){downstream...}(upstream)`.

### Primitive types
Each primitive type has associated literal expressions:
 * `Bool`: `true` or `false`
 * `Integer`: `123` or `0b1111011` or `0o173` or `0x7b`
 * `String`: `"..."` or `'...'`
 * `ByteArray`: `#abcdef0123456789` (i.e. pound symbol followed by lower-case hexadecimal sequence)

### List types
For now Plutus-Light only offers one builtin container type: lists. (We might implement a Map type at some point in the future).

The syntax for list types and literal list expressions is the same as in Golang:
```golang
numbers: []Integer = []Integer{1, 2, 3};
...
```

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

These types require special builtin functions to access their content. Some also have builtin constructors. User defined data-types automatically generate a *cast* function allowing `Data` to be cast into that particular type.

### Data-types
User defined data-types look like struct definitions in C, but use the `data` keyword instead:
```golang
data Redeemer {
    mode:      Integer,
    message:   String,
    recipient: PubKeyHash
}
```

### Enum-types
Plutus-Light supports tagged unions through `enum`. These are useful for datums and redeemers with differing content depending on how the script is used. In Haskell tagged unions are called Algeabraic Data Types. Tagged union `enum`s are declared using the following syntax:
```golang
enum Datum {
    Submission{...}, // content of Submission has the same syntax as a regular data-type
    Queue{...},
    Post{...}
}
```

A `select` expression can be used to 'unwrap' enum-type instances:
```golang
select (expr) {
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
sDatum: Datum::Submission = Datum::Submission(datum); // explicit downcasting
...
```

### Branching
Branching expressions look like C `if else` branching statements, but must always have the `else` branch defined:
```golang
if (code == 0) { // expression to convert an Integer code into a String
    "Success"
} else if (code == 1) {
    "Error"
} else {
    "Unhandled"
}
```

The Plutus-Light `if else` expression is syntactic sugar for nested Plutus-Core `ifThenElse` calls. Internally the branches of Plutus-Core's `ifThenElse` are deferred by wrapping them in lambda expressions, and then calling the returned lambda expression with zero arguments (actually a 'unit' argument). `&&` and `||` also defer calculation of their right-hand arguments.

Branch deferral is the expected behaviour for conventional programming languages.

Each branch must evaluate to the same type.

### Function expressions
Plutus-Light supports anonymous function expressions with the following syntax:
```go
myAddIntegers: (Integer, Integer) -> Integer = (a: Integer, b: Integer) -> Integer {a + b}; ...
```

Note how the type expression for a function resembles the right-hand function value expression itself.

Function values aren't entirely first class: they can't be put in containers (so not in lists nor in any fields of a `data` or `enum` type).

### Builtin operators
Operators that can be used in compile-time `const` statements are marked with '^'.

 * `! Bool -> Bool`
 * `Bool || Bool -> Bool`
 * `Bool && Bool -> Bool`
 * `- Integer -> Integer` ^
 * `+ Integer -> Integer` ^
 * `Integer == Integer -> Bool`
 * `Integer != Integer -> Bool`
 * `Integer >= Integer -> Bool`
 * `Integer > Integer -> Bool`
 * `Integer <= Integer -> Bool`
 * `Integer < Integer -> Bool`
 * `Integer + Integer -> Integer` ^
 * `Integer - Integer -> Integer` ^
 * `Integer * Integer -> Integer` ^
 * `Integer / Integer -> Integer` ^
 * `Integer % Integer -> Integer`
 * `ByteArray == ByteArray -> Bool`
 * `ByteArray != ByteArray -> Bool`
 * `ByteArray >= ByteArray -> Bool`
 * `ByteArray > ByteArray -> Bool`
 * `ByteArray <= ByteArray -> Bool`
 * `ByteArray < ByteArray -> Bool`
 * `ByteArray + ByteArray -> ByteArray` (concatenation)
 * `String + String -> String` (concatenation)
 * `Time == Time -> Bool`
 * `Time != Time -> Bool`
 * `Time >= Time -> Bool`
 * `Time > Time -> Bool`
 * `Time <= Time -> Bool`
 * `Time < Time -> Bool`
 * `Time + Duration -> Time`
 * `Time - Duration -> Time`
 * `Duration == Duration -> Bool`
 * `Duration != Duration -> Bool`
 * `Duration + Duration -> Duration`
 * `Duration - Duration -> Duration` (note that `Duration` can be negative)
 * `TxId == TxId -> Bool`
 * `TxId != TxId -> Bool`
 * `TxOutputId == TxOutputId -> Bool`
 * `TxOutputId != TxOutputId -> Bool`
 * `PubKeyHash == PubKeyHash -> Bool`
 * `PubKeyHash != PubKeyHash -> Bool`
 * `ValidatorHash == ValidatorHash -> Bool`
 * `ValidatorHash != ValidatorHash -> Bool`
 * `DatumHash == DatumHash -> Bool`
 * `DatumHash != DatumHash -> Bool`
 * `MintingPolicyHash == MintingPolicyHash -> Bool`
 * `MintingPolicyHash != MintingPolicyHash -> Bool`
 * `Value + Value -> Value` ^
 * `Value - Value -> Value`
 * `Value == Value -> Bool`
 * `Value != Value -> Bool`
 * `Value >= Value -> Bool` (strictly greater-or-equals for each component, NOT the same as `!(a < b)`)
 * `Value > Value -> Bool` (strictly greater-than for each component, NOT the same as `!(a <= b)`)
 * `Value < Value -> Bool` (strictly less-than for each component, NOT the same as `!(a >= b)`)
 * `Value <= Value -> Bool` (strictly less-or-equals for each component, NOT the same as `!(a > b)`)

### Builtin functions
Note that builtin functions can't be referenced, and must be called immediately (wrap them in closures as a work-around). Builtin functions that can be used in compile-time `const` statements are marked with '^'. 

 * `Integer(Bool) -> Integer` (`false` -> `0`, `true` -> `1`)
 * `ByteArray(String) -> ByteArray` (encodes utf8)
 * `String(ByteArray) -> String` (decodes utf8)
 * `show(Integer) -> String` (string representation of integer) ^
 * `show(Bool) -> String` (`"true"` or `"false"`) ^
 * `show(Time) -> String` (string representation of milliseconds since epoch) ^
 * `show(ByteArray) -> String` (hex representation of bytearray) ^
 * `Time(Integer) -> Time` (milliseconds since epoch) ^
 * `Duration(Integer) -> Duration` (milliseconds) ^
 * `PubKeyHash(ByteArray) -> PubKeyHash` ^
 * `ValidatorHash(ByteArray) -> ValidatorHash` ^
 * `DatumHash(ByteArray) -> DatumHash` ^
 * `MintingPolicyHash(ByteArray) -> MintingPolicyHash` ^
 * `TxOutputId(ByteArray, Integer) -> TxOutputId` ^
 * `fold(func(a, b) a, a, []b) -> a`
 * `filter(func(a) Bool, []a) -> []a`
 * `find(func(a) Bool, []a) -> a` (returns first found, throws error if nothing found)
 * `contains(func(a) Bool, []a) -> Bool`
 * `len(ByteArray) -> Integer`
 * `len([]a) -> Integer`
 * `prepend(a, []a) -> []a`
 * `getIndex([]a, Integer) -> a` (throws error if out of range)
 * `head([]a) -> a` (first element of list, throws error if list is empty)
 * `tail([]a) -> []a` (rest of list without first element, throws error if list is empty)
 * `isEmpty([]a) -> Bool`
 * `trace(String, a) -> a` (print a debug message while returning a value)
 * `getTx(ScriptContext) -> Tx`
 * `getSpendingPurposeTxOutputId(ScriptContext) -> TxOutputId`
 * `getTxTimeRange(Tx) -> TimeRange`
 * `getTxInputs(Tx) -> []TxInput`
 * `getTxOutputs(Tx) -> []TxOutput`
 * `getTxOutputsSentTo(Tx, PubKeyHash) -> []TxOutput` (outputs being sent to regular payment address)
 * `getTxOutputsLockedBy(Tx, ValidatorHash) -> []TxOutput` (outputs being sent to script `Address` with specified validator credential hash)
 * `getTimeRangeStart(TimeRange) -> Time` (throws error if time range start is open)
 * `getTxSignatories(Tx) -> []PubKeyHash`
 * `getTxId(Tx) -> TxId`
 * `isTxSignedBy(Tx, PubKeyHash) -> Bool`
 * `getTxInputOutputId(TxInput) -> TxOutputId`
 * `getTxInputOutput(TxInput) -> TxOutput` (original `TxOutput` that is now being used as `TxInput`)
 * `getTxOutputAddress(TxOutput) -> Address`
 * `getTxOutputValue(TxOutput) -> Value`
 * `hasDatumHash(TxOutput) -> Bool`
 * `getTxOutputDatumHash(TxOutput) -> DatumHash` (returns an empty `DatumHash` if the tx output doesn't have one)
 * `getAddressCredential(Address) -> Credential`
 * `isStakedAddress(Address) -> Bool`
 * `isPubKeyCredential(Credential) -> Bool`
 * `isScriptCredential(Credential) -> Bool`
 * `getCredentialValidatorHash(Credential) -> ValidatorHash`
 * `getCredentialPubKeyHash(Credential) -> PubKeyHash`
 * `getCurrentTxInput(ScriptContext) -> TxInput`
 * `getCurrentValidatorHash(ScriptContext) -> ValidatorHash` (hash of current validator script)
 * `getCurrentMintingPolicyHash(ScriptContext) -> MintingPolicyHash` (hash of curreny minting script)
 * `getValueComponent(Value, AssetClass) -> Integer`
 * `isZero(Value) -> Bool`
 * `zero() -> Value`
 * `valueSentTo(Tx, PubKeyHash) -> Value` (`Value` sent to regular paymant address)
 * `valueLockedBy(Tx, ValidatorHash) -> Value` (`Value` sent to script `Address` with given validator credential hash)
 * `valueLockedByDatum(Tx, ValidatorHash, a) -> Value` (`Value` sent to script with given datum of type `a`, `a` must be a user-defined data-type, throws an error if datum isn't found)
 * `AssetClass(ByteArray, String) -> AssetClass`
 * `Value(AssetClass, Integer) -> Value` ^
 * `lovelace(Integer) -> Value` ^
 * `findDatumData(Tx, DatumHash) -> Data`
 * `findDatumHash(Tx, a) -> DatumHash` (`a` must be a user-defined data-type)
 * `serialize(a) -> ByteArray` (`a` can be anything except a function type)
 * `sha2(ByteArray) -> ByteArray` (32 bytes)
 * `sha3(ByteArray) -> ByteArray` (32 bytes)
 * `blake2b(ByteArray) -> ByteArray` (32 bytes)


## Plutus-Light developer guide

### Design principles
* The Plutus-Light DSL is a C-like language, so it can be read by almost any programmer.
* Whitespace is obviously insignificant.
* For everything there should be one, and only one, obvious way of doing it.
* Each symbol/operator has only one kind of functionality. Only standard symbols/operators should be used (so nothing weird like in Haskell).
* Brackets are only used for builtin parametric types (List-type and perhaps at some point in the future Map, Maybe etc.). Brackets aren't used for indexing (use `getIndex` builtin instead).
* Semi-colons are operators and are part of assignment expressions. They can't be used as separators.
* Similarly the equals-sign is part of assignment expressions, and can't be used as other 'special' syntax.
* Because expressions can contain assignments all distinct expressions should be visibly scoped (inside parentheses or braces, so no leaving out the parentheses of `if else`-conditions like in Golang). 
* The colon and comma act as separators, never as operators.
* No name shadowing, no keyword shadowing.
* Every variable declaration must be fully typed.
* No type aliases: some users might expect automatic up-and-down-casting, and others won't expect that.
* Every declared name (local or global) must be used when `main()` is evaluated. Unused names must be eliminated from the source-code.
* All data-types inside a enum-type must also be used.
* Conditions of `if else` expressions can't evaluate to a compile-time constant.
* Top-level `const` statements allow compile-time evaluation into primitive values (not available for all builtin function calls yet). Expressions are otherwise never simplified/optimized.


### Untyped Plutus-Light
Plutus-Light is a typed language, and is internally converted into untyped Plutus-Light before final compilation into (untyped) Plutus-Core.

Untyped Plutus-Light is essentially an expansion of all the operators and all the semi-builtin functions (semi-builtin functions are builtins provided by typed Plutus-Light, but not by Plutus-Core).