# Plutus-Light

Plutus-Light is Domain Specific Language that compiles to Plutus-Core (i.e. Cardano on-chain validator scripts).

This repository contains a reference compiler for Plutus-Light, written in javascript.

The Plutus-Light library also contains a function to deserialize existing Plutus-Core script.

## Examples

### DSL Example
The following example is equivalent to the Plutus vesting contract from the Plutus playground:
```go
data VestingTranche {
    time   Time, // amount is available after time
    amount Value
}

data VestingParams {
    tranche1 VestingTranche,
    tranche2 VestingTranche,
    owner    Hash
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
    remainingActual Value = valueLockedBy(tx, getOwnHash(ctx));
    remainingExpected Value = remainingFrom(vestingParams.tranche1, now) + remainingFrom(vestingParams.tranche2, now);
    isStrictlyGeq(remainingActual, remainingExpected) && isTxSignedBy(tx, vestingParams.owner)
}
```

You can compile this source into Plutus-Core using the `plutus-light.js` library:
```javascript
import * as PL from "plutus-light.js"

const src = `data VestingTrance {...`;

let cborHex = PL.compilePlutusLightProgram(src);

let plutusObject = {
    "type": "PlutusScriptV1",
    "description": "",
    "cborHex": cborHex,
}

// write JSON.stringify(plutusObject) to a file to be able to use it with cardano-cli
```

### Deserialize Plutus-Core
```javascript
import * as PL from "plutus-light.js"

const cborHex = "...";

// dump Plutus-Core AST
console.log(PL.deserializePlutusCoreCborHexString(cborHex));
```

## Details

### Syntax
Plutus-Light has a C-like syntax, heavily inspired by Golang. A function body is a single expression. There are no statements, and consequently no `return` statement. 

`=` combined with `;` is a ternary operator. `x = upstream; downstream...` is syntactic sugar for `func(x){downstream...}(upstream)`.

Branching expressions look like conventional branching statements, but must always have the `else` branch defined.

### Primitive types
Each primitive type has associated literal expressions:
 * `Bool`: `true` or `false`
 * `Integer`: `123` or `0b1111011` or `0o173` or `0x7b`
 * `String`: `"..."` or `'...'`
 * `ByteArray`: `#abcdef0123456789` (i.e. a pound symbol followed by a lower-case hexadecimal sequence)

### Other builtin types
Besides primitive types, some other opaque builtin types are defined:
 * `ScriptContext`
 * `Tx`
 * `TxInput`
 * `TxOutput`
 * `TxId`
 * `TxOutputId`
 * `Hash`
 * `Time`
 * `TimeRange`
 * `Value`
 * `AssetClass`
 * `Address`
 * `Credential`

These types require special builtin functions to access their content. Some have builtin constructors.

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
 * `Time == Time -> Bool`
 * `Time != Time -> Bool`
 * `Time >= Time -> Bool`
 * `Time > Time -> Bool`
 * `Time <= Time -> Bool`
 * `Time < Time -> Bool`
 * `TxId == TxId -> Bool`
 * `TxId != TxId -> Bool`
 * `TxOutputId == TxOutputId -> Bool`
 * `TxOutputId != TxOutputId -> Bool`
 * `Hash == Hash -> Bool`
 * `Hash != Hash -> Bool`
 * `Value + Value -> Value`
 * `Value - Value -> Value`

### Builtin functions
 * `Integer(Bool) -> Integer`
 * `ByteArray(String) -> ByteArray` (encodes utf8)
 * `String(ByteArray) -> String` (decodes utf8)
 * `Time(Integer) -> Time` (milliseconds since epoch)
 * `Hash(ByteArray) -> Hash`
 * `fold(func(a, b) a, a, []b) -> a`
 * `filter(func(a) Bool, []a) -> []a`
 * `find(func(a) Bool, []a) -> a` (throws error if not found)
 * `contains(func(a) Bool, []a) -> Bool`
 * `len(ByteArray) -> Integer`
 * `len([]a) -> Integer`
 * `getTx(ScriptContext) -> Tx`
 * `getTxTimeRange(Tx) -> TimeRange`
 * `getTxInputs(Tx) -> []TxInput`
 * `getTxOutputs(Tx) -> []TxOutput`
 * `getTxOutputsAt(Tx, Hash) -> []TxOutput` (outputs begin sent to `Address` with specified credential hash)
 * `getTimeRangeStart(TimeRange) -> Time` (throws error if time range start is open )
 * `getTxSignatories(Tx) -> []Hash`
 * `getTxId(Tx) -> TxId`
 * `isTxSignedBy(Tx, Hash) -> Bool`
 * `getTxInputOutputId(TxInput) -> TxOutputId`
 * `getTxInputOutput(TxInput) -> TxOutput` (original `TxOutput` that is now being used as `TxInput`)
 * `getTxOutputAddress(TxOutput) -> Address`
 * `getTxOutputValue(TxOutput) -> Value`
 * `getAddressCredential(Address) -> Credential`
 * `isStakedAddress(Address) -> Bool`
 * `isPubKeyCredential(Credential) -> Bool`
 * `isScriptCredential(Credential) -> Bool`
 * `getCredentialHash(Credential) -> Hash`
 * `getCurrentTxInput(ScriptContext) -> TxInput`
 * `getOwnHash(ScriptContext) -> Hash` (hash of current script)
 * `getValueComponent(Value, AssetClass) -> Integer`
 * `isZero(Value) -> Bool`
 * `zero() -> Value`
 * `isStrictlyGeq(Value, Value) -> Bool`
 * `isStrictlyGt(Value, Value) -> Bool`
 * `isStrictlyLeq(Value, Value) -> Bool`
 * `isStrictlyLt(Value, Value) -> Bool`
 * `isStrictlyEq(Value, Value) -> Bool`
 * `valueLockedBy(Tx, Hash) -> Value` (`Value` sent to `Address` with given credential hash)
 * `AssetClass(ByteArray, String) -> AssetClass`
 * `Value(AssetClass, Integer) -> Integer`
 * `lovelace(Integer) -> Value`

### If-Then-Else
The evaluation branches of builtin ifThenElse function calls are deferred by wrapping them in them in lambda expressions, and calling the returned lambda expression with zero arguments. The `&&` and `||` operators are treated similarly.

Branch deferral gives behaviour in line with most C-like languages.

### Untyped Plutus-Light
Plutus-Light is a typed language, and is internally converted into untyped Plutus-Light before final compilation into (untyped) Plutus-Core.

Untyped Plutus-Light is essentially an expansion of all the operators and all the semi-builtin functions. Semi-builtin functions are builtins provided by typed Plutus-Light, but not by Plutus-Core.
