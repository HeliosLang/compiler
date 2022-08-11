This Changelog only applies to notable changes to `helios.js` on the main branch.

# 2022 08/10
* Rust-like syntax, structs and enums can have methods
* No commas in struct/enum-member definitions
* No semicolon after const statement
* C#-like switch syntax
* TimeRange constructors: ALWAYS, NEVER, from, to
* TimeRange comparison: is_before(Time) and is_after(Time)
* Map literal, Map.length, Map.is_empty() and Map.get()
* Value.get_policy()

# 2022/07/15
* renamed to helios

## 2022/07/09
* all named variables in the Plutus-Light are prefixed with u_ when generating the untyped IR
