# Plutus-Light

Plutus-Light is Domain Specific Language that compiles to Plutus-Core (i.e. Cardano on-chain validator scripts).

This repository contains a reference compiler for Plutus-Light, written in javascript.


## Example
The following example is equivalent to the Plutus vesting contract from the Plutus playground:
```java
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
```
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

### If-Then-Else
The evaluation branches of builtin ifThenElse function calls are deferred by wrapping them in them in lambda expressions, and calling the returned lambda expression with zero arguments. The `&&` and `||` operators are treated similarly.

Branch deferral gives behaviour in line with most C-like languages.

### Untyped Plutus-Light
Plutus-Light is a typed language, and is internally converted into untyped Plutus-Light before final compilation into (untyped) Plutus-Core.

Untyped Plutus-Light is essentially an expansion of all the operators and all the semi-builtin functions. Semi-builtin functions are builtins provided by typed Plutus-Light, but not by Plutus-Core.
