This Changelog only applies to notable changes to `helios.js` on the main branch.

# 2022/08/11
* ByteArray.slice (negative indices relative to end)
* ByteArray starts_with and ends_with
* Map + Map operator (note: map merge doesn't assert uniqueness of keys and simply acts as a concatenation of two lists)
* Map methods: all, all_keys, all_values, any, any_key, any_value, filter, filter_by_key, filter_by_value, fold, fold_keys, fold_values
* all methods named 'get...' or 'find...' throw errors if not found

# 2022/08/10
* Rust-like syntax, structs and enums can have methods
* No commas in struct/enum-member definitions
* No semicolon after const statement
* C#-like switch syntax
* TimeRange constructors: ALWAYS, NEVER, from, to
* TimeRange comparison: is_before(Time) and is_after(Time)
* Map literal construction, Map.length, Map.is_empty() and Map.get()
* Value.get_policy()

# 2022/07/15
* renamed to helios

## 2022/07/09
* all named variables in the Plutus-Light are prefixed with u_ when generating the untyped IR
