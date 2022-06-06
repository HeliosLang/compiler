# Plutus-Core-Deserializer
This small javascript library decodes *flat*-encoded Cardano Plutus-Core scripts into an AST of untyped Plutus-Core terms.

Example Plutus-Core v1.0.0 scripts from the following two repositories were used for testing this decoder:

* [github.com/chris-moreton/plutus-scripts](https://github.com/chris-moreton/plutus-scripts)
* [github.com/input-output-hk/plutus-apps](https://github.com/input-output-hk/plutus-apps)

## Usage
Load the `PCD` namespace into your browser/nodejs project.

Deserialize a *cborHex* encoded script using the following function:
```
let result = PCD.deserializePlutusCoreCborHexString(<string>);
```

The `result` is a string representation of the Plutus-Core AST.
