import { describe } from "node:test"
import { False, True, compileAndRunMany, int } from "./utils.js"

describe("Value", () => {
    const intLovelaceIsZeroScript = `testing lovelace_is_zero
    func main(a: Int) -> Bool {
        Value::lovelace(a).is_zero()
    }`

    const dummyLovelaceEqScript = `testing lovelace_dummy_eq
    func main(a: Int) -> Bool {
        Value::lovelace(a) == Value::lovelace(a)
    }`

    const lovelaceEqScript = `testing lovelace_eq
    func main(a: Int, b: Int) -> Bool {
        Value::lovelace(a) == Value::lovelace(b)
    }`

    const dummyLovelaceNeqScript = `testing lovelace_dummy_neq
    func main(a: Int) -> Bool {
        Value::lovelace(a) != Value::lovelace(a)
    }`

    const lovelaceNeqScript = `testing lovelace_neq
    func main(a: Int, b: Int) -> Bool {
        Value::lovelace(a) != Value::lovelace(b)
    }`

    const lovelaceAddZeroScript = `testing lovelace_add_zero
    func main(a: Int) -> Int {
        (Value::lovelace(a) + Value::ZERO).get(AssetClass::ADA)
    }`

    const lovelaceAddScript = `testing lovelace_add
    func main(a: Int, b: Int) -> Int {
        (Value::lovelace(a) + Value::lovelace(b)).get(AssetClass::ADA)
    }`

    const lovelaceSumScript = `testing lovelace_sum
    func main(a: Int, b: Int) -> Int {
        Value::sum([]Value{Value::lovelace(a), Value::lovelace(b)}).get(AssetClass::ADA)
    }`

    const lovelaceSubZeroScript = `testing lovelace_sub_zero
    func main(a: Int) -> Int {
        (Value::lovelace(a) - Value::ZERO).get(AssetClass::ADA)
    }`

    const zeroSubLovelaceScript = `testing zero_sub_lovelace
    func main(a: Int) -> Int {
        (Value::ZERO - Value::lovelace(a)).get(AssetClass::ADA)
    }`

    compileAndRunMany([
        {
            description: "1 lovelace isn't zero",
            main: intLovelaceIsZeroScript,
            inputs: [int(1)],
            output: False
        },
        {
            description: "0 lovelace is zero",
            main: intLovelaceIsZeroScript,
            inputs: [int(0)],
            output: True
        },
        {
            description: "lovelace comparison to self is always true",
            main: dummyLovelaceEqScript,
            inputs: [int(-100)],
            output: True
        },
        {
            description: "1000000 lovelace is equal to 1000000 lovelace",
            main: lovelaceEqScript,
            inputs: [int(1_000_000), int(1_000_000)],
            output: True
        },
        {
            description: "1000001 lovelace isn't equal to 1000000 lovelace",
            main: lovelaceEqScript,
            inputs: [int(1_000_001), int(1_000_000)],
            output: False
        },
        {
            description: "lovelace neq comparison with self is always false",
            main: dummyLovelaceNeqScript,
            inputs: [int(0)],
            output: False
        },
        {
            description: "1_000_000 lovelace neq to 1_000_000 returns false",
            main: lovelaceNeqScript,
            inputs: [int(1_000_000), int(1_000_000)],
            output: False
        },
        {
            description: "1_000_001 lovelace neq to 1_000_000 returns true",
            main: lovelaceNeqScript,
            inputs: [int(1_000_001), int(1_000_000)],
            output: True
        },
        {
            description:
                "adding zero to 1_000_000 lovelace returns 1_000_000 lovelace",
            main: lovelaceAddZeroScript,
            inputs: [int(1_000_000)],
            output: int(1_000_000)
        },
        {
            description:
                "adding 1 to 1_000_000 lovelace returns 1_000_001 lovelace",
            main: lovelaceAddScript,
            inputs: [int(1), int(1_000_000)],
            output: int(1_000_001)
        },
        {
            description:
                "summing 1 and 1_000_000 lovelace returns 1_000_001 lovelace",
            main: lovelaceSumScript,
            inputs: [int(1), int(1_000_000)],
            output: int(1_000_001)
        },
        {
            description:
                "subtracting zero from 1_000_000 lovelace returns 1_000_000 lovelace",
            main: lovelaceSubZeroScript,
            inputs: [int(1_000_000)],
            output: int(1_000_000)
        },
        {
            description: "subtracting 1_000_000 from zero returns -1_000_000",
            main: zeroSubLovelaceScript,
            inputs: [int(1_000_000)],
            output: int(-1_000_000)
        }
    ])
})
