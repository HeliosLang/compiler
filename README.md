# Plutus-Light

Plutus-Light is a Domain Specific Language that compiles to Plutus-Core (i.e. Cardano on-chain validator scripts). Plutus-Light is a non-Haskell alternative to Plutus.

This repository contains a reference compiler for Plutus-Light, written in javascript.

Use following step-by-step guide to learn how to use Plutus-Light with cardano-cli:
  1. [Cardano-node setup](doc/01-environment_setup.md)
  2. [Wallet setup and funding](doc/02-wallet_setup.md)
  3. [*Always Succeeds* contract](doc/03-always_succeeds_contract.md)
  4. [*Time Lock* contract](doc/04-time_lock_contract.md)
  5. [*Subscription* contract](doc/05-subscription_contract.md)

Note that the Plutus-Light library also contains a function to deserialize existing Plutus-Core scripts (see second example below).

## Quick start examples

### 1. Vesting contract example
The following DSL example is equivalent to the Plutus vesting contract from the Plutus playground:
```go
data VestingTranche {
    time   Time, // amount is available after time
    amount Value
}

data VestingParams {
    tranche1 VestingTranche,
    tranche2 VestingTranche,
    owner    PubKeyHash
}

func availableFrom(tranche VestingTranche, time Time) Value {
    if (time >= tranche.time) {
        tranche.amount
    } else {
        zero()
    }
}

func remainingFrom(tranche VestingTranche, time Time) Value {
    tranche.amount - availableFrom(tranche, time)
}

// the compiler is smart enough to add an empty Datum and empty Redeemer as arguments to the actual main entrypoint function
func main(ctx ScriptContext) Bool {
    vestingParams VestingParams = VestingParams{/*parameters interpolated from surrounding js*/};
    tx Tx = getTx(ctx);
    now Time = getTimeRangeStart(getTxTimeRange(tx));
    remainingActual Value = valueLockedBy(tx, getCurrentValidatorHash(ctx));
    remainingExpected Value = remainingFrom(vestingParams.tranche1, now) + remainingFrom(vestingParams.tranche2, now);
    remainingActual >= remainingExpected && isTxSignedBy(tx, vestingParams.owner)
}
```

You can compile this source into Plutus-Core using the `plutus-light.js` library:
```javascript
import * as PL from "plutus-light.js"

const src = `data VestingTrance {
...
...
`;

let cborHex = PL.compilePlutusLightProgram(src);

let plutusObject = {
    "type": "PlutusScriptV1",
    "description": "",
    "cborHex": cborHex,
}

// write JSON.stringify(plutusObject) to a file to be able to use it with cardano-cli
```

### 2. Deserialize Plutus-Core
```javascript
import * as PL from "plutus-light.js"

const cborHex = "...";

// dump Plutus-Core AST
console.log(PL.deserializePlutusCoreCborHexString(cborHex));
```

## Plutus-Light details

### Syntax
Plutus-Light has a C-like syntax, heavily inspired by Golang. A function body is a single expression. There are no statements, and consequently no `return` statements. 

`=` combined with `;` is a ternary operator. `x = upstream; downstream...` is syntactic sugar for `func(x){downstream...}(upstream)`.

Branching expressions look like conventional branching statements, but must always have the `else` branch defined.

### Primitive types
Each primitive type has associated literal expressions:
 * `Bool`: `true` or `false`
 * `Integer`: `123` or `0b1111011` or `0o173` or `0x7b`
 * `String`: `"..."` or `'...'`
 * `ByteArray`: `#abcdef0123456789` (i.e. pound symbol followed by a lower-case hexadecimal sequence)

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
 * `DatumHash`
 * `Time`
 * `TimeRange`
 * `Duration`
 * `Value`
 * `Data`
 * `AssetClass`
 * `Address`
 * `Credential`

These types require special builtin functions to access their content. Some also have builtin constructors. User-defined data types automatically generate a *cast* function allowing `Data` to be cast into that particular type.

### Builtin operators
 * `! Bool -> Bool`
 * `Bool || Bool -> Bool`
 * `Bool && Bool -> Bool`
 * `- Integer -> Integer`
 * `+ Integer -> Integer`
 * `Integer == Integer -> Bool`
 * `Integer != Integer -> Bool`
 * `Integer >= Integer -> Bool`
 * `Integer > Integer -> Bool`
 * `Integer <= Integer -> Bool`
 * `Integer < Integer -> Bool`
 * `Integer + Integer -> Integer`
 * `Integer - Integer -> Integer`
 * `Integer * Integer -> Integer`
 * `Integer / Integer -> Integer`
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
 * `Value + Value -> Value`
 * `Value - Value -> Value`
 * `Value == Value -> Bool`
 * `Value != Value -> Bool`
 * `Value >= Value -> Bool` (strictly greater-or-equals for each component, NOT the same as `!(a < b)`)
 * `Value > Value -> Bool` (strictly greater-than for each component, NOT the same as `!(a <= b)`)
 * `Value < Value -> Bool` (strictly less-than for each component, NOT the same as `!(a >= b)`)
 * `Value <= Value -> Bool` (strictly less-or-equals for each component, NOT the same as `!(a > b)`)

### Builtin functions
 * `Integer(Bool) -> Integer` (`false` -> `0`, `true` -> `1`)
 * `ByteArray(String) -> ByteArray` (encodes utf8)
 * `String(ByteArray) -> String` (decodes utf8)
 * `show(Integer) -> String` (string representation of integer)
 * `show(Bool) -> String` ("true" or "false")
 * `show(Time) -> String` (string representation of milliseconds since epoch)
 * `show(ByteArray) -> String` (hex representation of bytearray)
 * `Time(Integer) -> Time` (milliseconds since epoch)
 * `Duration(Integer) -> Duration` (milliseconds)
 * `PubKeyHash(ByteArray) -> PubKeyHash`
 * `ValidatorHash(ByteArray) -> ValidatorHash`
 * `DatumHash(ByteArray) -> DatumHash`
 * `fold(func(a, b) a, a, []b) -> a`
 * `filter(func(a) Bool, []a) -> []a`
 * `find(func(a) Bool, []a) -> a` (throws error if not found)
 * `contains(func(a) Bool, []a) -> Bool`
 * `len(ByteArray) -> Integer`
 * `len([]a) -> Integer`
 * `prepend(a, []a) -> []a`
 * `trace(String, a) -> a` (print a debug message while returning a value)
 * `getTx(ScriptContext) -> Tx`
 * `getSpendingPurposeTxOutputId(ScriptContext) -> TxOutputId`
 * `getTxTimeRange(Tx) -> TimeRange`
 * `getTxInputs(Tx) -> []TxInput`
 * `getTxOutputs(Tx) -> []TxOutput`
 * `getTxOutputsLockedBy(Tx, ValidatorHash) -> []TxOutput` (outputs begin sent to script `Address` with specified validator credential hash)
 * `getTimeRangeStart(TimeRange) -> Time` (throws error if time range start is open )
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
 * `getCurrentValidatorHash(ScriptContext) -> ValidatorHash` (hash of current script)
 * `getValueComponent(Value, AssetClass) -> Integer`
 * `isZero(Value) -> Bool`
 * `zero() -> Value`
 * `valueLockedBy(Tx, ValidatorHash) -> Value` (`Value` sent to script `Address` with given validator credential hash)
 * `valueLockedByDatum(Tx, ValidatorHash, a) -> Value` (`Value` sent to script with given datum, `a` must be a user-defined data-type)
 * `AssetClass(ByteArray, String) -> AssetClass`
 * `Value(AssetClass, Integer) -> Integer`
 * `lovelace(Integer) -> Value`
 * `findDatumData(Tx, DatumHash) -> Data`
 * `findDatumHash(Tx, a) -> DatumHash` (`a` must be a user-defined data-type)

### If-Then-Else
The branches of `ifThenElse` are deferred by wrapping them in lambda expressions, and calling the returned lambda expression with zero arguments. `&&` and `||` operate similarly.

Branch deferral is the expected behaviour for C-like languages.

### Function expressions
Plutus-Light supports anonymous function expressions with the following syntax:
```go
myAddIntegers func(Integer, Integer) Integer = func(a Integer, b Integer) Integer {a + b}; ...
```

Note how the type expression for a function resembles the right-hand function value expression itself.

Function values aren't entirely first class: they can't be put in containers (so not in lists nor in any fields of a `data` type).

### Untyped Plutus-Light
Plutus-Light is a typed language, and is internally converted into untyped Plutus-Light before final compilation into (untyped) Plutus-Core.

Untyped Plutus-Light is essentially an expansion of all the operators and all the semi-builtin functions (semi-builtin functions are builtins provided by typed Plutus-Light, but not by Plutus-Core).

