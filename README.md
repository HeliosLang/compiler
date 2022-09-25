# Helios Lang

Helios is a Domain Specific Language that compiles to Plutus-Core (i.e. Cardano on-chain validator scripts). Helios is a non-Haskell alternative to Plutus.

Helios is purely functional, strongly typed, and has a simple curly braces syntax. It notably supports closures, compile-time evaluation, and enums as tagged unions.

The Helios library contains a reference compiler for the Helios language, as well as transaction building functions. Everything is written in Javascript.

Use the following tutorial to learn how to use Helios with cardano-cli:
  1. [Cardano-node setup](doc/tutorial_01-environment_setup.md)
  2. [Wallet setup and funding](doc/tutorial_02-wallet_setup.md)
  3. [*Always Succeeds* contract](doc/tutorial_03-always_succeeds.md)
  4. [*Time Lock* contract](doc/tutorial_04-time_lock.md)
  5. [*Subscription* contract](doc/tutorial_05-subscription_contract.md)
  6. [Minting policy scripts](doc/tutorial_06-minting.md)
  7. [*English Auction* contract](doc/tutorial_07-english_auction.md)

We are in the process of migrating these tutorials [here](https://hyperion-bt.github.io/Helios-Book/).
There is an online coding [playground](http://helios-playground.s3-website.us-east-2.amazonaws.com?share=bd071424ebb752c3bbb2e2e45074c195).


## Acknowledgements

* [Ch1n3du](https://github.com/Ch1n3du): improved syntax, documentation
* [Tanyalouise](https://github.com/tanthehack): designs
* [Cnftacademy](https://cnftacademy.com/): testing
* [mikky-j](https://github.com/mikky-j): documentation


## Quick start examples

### 1. Vesting contract example
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
    now: Time = tx.now();
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

You can explore this example on the [Helios playground](http://helios-playground.s3-website.us-east-2.amazonaws.com/?share=7860030a9fc194f87488ad8273fcadde).

### 2. Deserialize Plutus-Core
```javascript
import * as helios from "helios.js"

const plutusCoreJson = `{"type": "PlutusScriptV1", ...}`;

// dump Plutus-Core AST
console.log(helios.deserializePlutusCore(plutusCoreJson));
```

## Helios user guide and language reference

Can be found [here](https://hyperion-bt.github.io/Helios-Book/).
