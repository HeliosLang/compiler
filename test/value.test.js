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

    const dummyLovelaceSubScript = `testing dummy_lovelace_sub
    func main(a: Int) -> Bool {
        (Value::lovelace(a) - Value::lovelace(a)).is_zero()
    }`

    const lovelaceSubScript = `testing lovelace_sub
    func main(a: Int, b: Int) -> Int {
        (Value::lovelace(a) - Value::lovelace(b)).get(AssetClass::ADA)
    }`

    const dummyLovelaceMulScript = `testing dummy_lovelace_mul
    func main(a: Int) -> Int {
        (Value::lovelace(a)*1).get(AssetClass::ADA)
    }`

    const lovelaceMulScript = `testing lovelace_mul
    func main(a: Int, b: Int) -> Int {
        (Value::lovelace(a)*b).get(AssetClass::ADA)
    }`

    const valueAddMulScript = `testing value_add_mul
    const MY_NFT: AssetClass = AssetClass::new(MintingPolicyHash::new(#abcd), #abcd)
    func main(a: Int, b: Int, c: Int) -> Int {
        ((Value::lovelace(a) + Value::new(MY_NFT, b))*c).get(AssetClass::ADA)
    }`

    const dummyLovelaceDivScript = `testing dummy_lovelace_div
    func main(a: Int) -> Int {
        (Value::lovelace(a)/1).get(AssetClass::ADA)
    }`

    const lovelaceDivScript = `testing lovelace_div
    func main(a: Int, b: Int) -> Int {
        (Value::lovelace(a)/b).get(AssetClass::ADA)
    }`

    const valueAddDivScript = `testing value_add_div
    const MY_NFT: AssetClass = AssetClass::new(MintingPolicyHash::new(#abcd), #abcd)
    func main(a: Int, b: Int, c: Int) -> Int {
        ((Value::lovelace(a) + Value::new(MY_NFT, b))/c).get(AssetClass::ADA)
    }`

    const dummyLovelaceGeqScript = `testing dummy_lovelace_geq
    func main(a: Int) -> Bool {
        Value::lovelace(a) >= Value::lovelace(a)
    }`

    const lovelaceGeqScript = `testing lovelace_geq
    func main(a: Int, b: Int) -> Bool {
        Value::lovelace(a) >= Value::lovelace(b)
    }`

    const lovelaceContainsScript = `testing lovelace_contains
    func main(a: Int, b: Int) -> Bool {
        Value::lovelace(a).contains(Value::lovelace(b))
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
        },
        {
            description: "lovelace subtracted from self is always zero",
            main: dummyLovelaceSubScript,
            inputs: [int(-1_000_001)],
            output: True
        },
        {
            description: "subtracting 1_000_000 from 1_000_001 returns 1",
            main: lovelaceSubScript,
            inputs: [int(1_000_001), int(1_000_000)],
            output: int(1)
        },
        {
            description: "1_000_000 lovelace multiplied by 1 returns 1_000_000",
            main: dummyLovelaceMulScript,
            inputs: [int(1_000_000)],
            output: int(1_000_000)
        },
        {
            description:
                "1_000_000 lovelace multiplied by 3 returns 3_000_000 lovelace",
            main: lovelaceMulScript,
            inputs: [int(1_000_000), int(3)],
            output: int(3_000_000)
        },
        {
            description:
                "1_000_000 lovelace multipled by 3 after adding an NFT returns 3_000_000 lovelace as well",
            main: valueAddMulScript,
            inputs: [int(1_000_000), int(1), int(3)],
            output: int(3_000_000)
        },
        {
            description:
                "1_000_000 lovelace divided by 1 returns 1_000_000 lovelace",
            main: dummyLovelaceDivScript,
            inputs: [int(1_000_000)],
            output: int(1_000_000)
        },
        {
            description: "1_000_000 lovelace divided by zero throws error",
            main: lovelaceDivScript,
            inputs: [int(1_000_000), int(0)],
            output: { error: "" }
        },
        {
            description:
                "1_000_000 lovelace divided by -1 returns -1_000_000 lovelace",
            main: lovelaceDivScript,
            inputs: [int(1_000_000), int(-1)],
            output: int(-1_000_000)
        },
        {
            description:
                "3_000_000 lovelace divided by -3 after adding an NFT still returns -1_000_000 lovelace",
            main: valueAddDivScript,
            inputs: [int(3_000_000), int(1), int(-3)],
            output: int(-1_000_000)
        },
        {
            description: "lovelace >= self always returns true",
            main: dummyLovelaceGeqScript,
            inputs: [int(1_000_000)],
            output: True
        },
        {
            description: "0 lovelace >= 0 lovelace return true",
            main: lovelaceGeqScript,
            inputs: [int(0), int(0)],
            output: True
        },
        {
            description: "-1 lovelace >= 0 lovelace return false",
            main: lovelaceGeqScript,
            inputs: [int(-1), int(0)],
            output: False
        },
        {
            description: "1 lovelace >= 0 lovelace return true",
            main: lovelaceGeqScript,
            inputs: [int(1), int(0)],
            output: True
        },
        {
            description: "1_000_000 lovelace contains 999_999 lovelace",
            main: lovelaceContainsScript,
            inputs: [int(1_000_000), int(999_999)],
            output: True
        }
    ])
})
