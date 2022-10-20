# Helios Lang

Helios is a Domain Specific Language that compiles to Plutus-Core (i.e. Cardano on-chain validator scripts). Helios is a non-Haskell alternative to Plutus.

Helios is purely functional, strongly typed, and has a simple curly braces syntax. It notably supports closures, compile-time evaluation, and enums as tagged unions.

The Helios library contains a reference compiler for the Helios language, as well as transaction building functions. Everything is written in Javascript.

## User guide and language reference

The Helios language and Helios API are covered extensively by the online [book](https://hyperion-bt.github.io/Helios-Book).

## Online playground

There is an online coding [playground](https://www.hyperion-bt.org/Helios-Playground?share=bd071424ebb752c3bbb2e2e45074c195).

## Sponsoring

For sponsoring we prefer using the Cardano blockchain itself (instead of Patreon or Github's sponsor system).

Our Cardano address is the same one where the `helioslang` [adahandle](https://adahandle.com/) is located:

```
addr1qxyd3shxugqkrkdpwgjq522cu7h4lkr8qnz9uemd4w68p970n6h44fq8ujuyu807vll9atjpc8z6zl0pyv6n2neezysqv5rjvd
```

Please join our [Discord](https://discord.gg/XTwPrvB25q) and tell us what you'd like your sponsorship to be used for before sending funds.

## Example

The following Helios example is equivalent to the Plutus vesting contract from the Plutus playground:

```golang
spending vesting

struct VestingTranche {
    time:  Time // 'amount' is available after 'time'
    amount: Value

    func available_from(self, time: Time) -> Value {
        if (time >= self.time) {
            self.amount
        } else {
            Value::ZERO
        }
    }

    func remaining_from(self, time: Time) -> Value {
        self.amount - self.available_from(time)
    }
}

struct VestingParams {
    tranche1: VestingTranche
    tranche2: VestingTranche
    owner:    PubKeyHash

    func remaining_from(self, time: Time) -> Value {
        self.tranche1.remaining_from(time) + self.tranche2.remaining_from(time)
    }
}

const PARAMS: VestingParams = VestingParams{
    /*parameters interpolated from surrounding js*/
}

// the compiler is smart enough to add an empty Datum and empty Redeemer as arguments to the actual main entrypoint function
func main(ctx: ScriptContext) -> Bool {
    tx: Tx = ctx.tx;
    now: Time = tx.time_range.start;
    remaining_actual: Value = tx.value_locked_by(ctx.get_current_validator_hash());
    remaining_expected: Value = PARAMS.remaining_from(now);
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

console.log(helios.Program.new(src).compile().serialize());
// the output can be saved to a file, and that file can be used directly by cardano-cli
```

You can explore this example on the [Helios playground](https://www.hyperion-bt.org/Helios-Playground?share=3f2f31a38b1e80d8858cfea3fbc9dde1).

## Acknowledgements

* [Ch1n3du](https://github.com/Ch1n3du): improved syntax, documentation
* [Tanyalouise](https://github.com/tanthehack): designs
* [Cnftacademy](https://cnftacademy.com/): testing
* [mikky-j](https://github.com/mikky-j): documentation