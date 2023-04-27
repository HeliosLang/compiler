# Helios Lang

Helios is a Domain Specific Language that compiles to Plutus-Core (i.e. Cardano on-chain validator scripts). Helios is a non-Haskell alternative to Plutus.

Helios is purely functional, strongly typed, and has a simple curly braces syntax. It notably supports closures, functions with multiple return values, OOP-like methods, and enums as tagged unions.

The Helios library is written in Javascript, with complete Typescript type-coverage through JSDoc comments. This library lets you compile Cardano smart contracts and create Cardano transactions. Helios is all you need to build 100% client-side dApps for Cardano.

## Example: time-lock

```
spending time_lock

struct Datum {
    lockUntil:   Time
    owner:       PubKeyHash // the owner can always unlock the assets
    beneficiary: PubKeyHash // beneficiary can only unlock the assets after 'lockUntil'
}

func main(datum: Datum, _, ctx: ScriptContext) -> Bool {
    tx: Tx = ctx.tx;
    now: Time = tx.time_range.start;

    tx.is_signed_by(datum.owner) || (
        tx.is_signed_by(datum.beneficiary) &&
        now > datum.lockUntil
    )
}
```

## User guide

The Helios language and Helios API are covered extensively by the online [book](https://www.hyperion-bt.org/helios-book).

## Online playground

There is an online coding [playground](https://www.hyperion-bt.org/helios-playground?share=bd071424ebb752c3bbb2e2e45074c195).

## VSCode plugin

There is a VSCode plugin called *Helios* that can be installed through the extensions marketplace. Currently it only supports syntax highlighting and syntax error diagnostics. Please help us improve this extension by contributing to the [*helios-ide-plugins* repository](https://github.com/hyperion-bt/helios-ide-plugins).

## Sponsoring

For sponsoring we prefer using the Cardano blockchain itself (instead of Patreon or Github's sponsor system).

Our Cardano address is the same one where the `helioslang` [adahandle](https://adahandle.com/) is located:

```
addr1qxyd3shxugqkrkdpwgjq522cu7h4lkr8qnz9uemd4w68p970n6h44fq8ujuyu807vll9atjpc8z6zl0pyv6n2neezysqv5rjvd
```

Please join our [Discord](https://discord.gg/XTwPrvB25q) and tell us what you'd like your sponsorship to be used for before sending funds.

## Acknowledgements

Early contributors who deserve special acknowledgement:

* [Ch1n3du](https://github.com/Ch1n3du): improved syntax, documentation
* [Tanyalouise](https://github.com/tanthehack): logo
* [Cnftacademy](https://cnftacademy.com/): testing
* [mikky-j](https://github.com/mikky-j): documentation
