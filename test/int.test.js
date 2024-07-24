import { describe } from "node:test"
import { IntData } from "@helios-lang/uplc"
import {
    False,
    True,
    bool,
    bytes,
    cbor,
    compileAndRunMany,
    int,
    ratio,
    str
} from "./utils.js"
import { encodeIntBE } from "@helios-lang/codec-utils"

describe("Int", () => {
    const intEqScript = `testing int_eq
    func main(a: Int, b: Int) -> Bool {
        a == b
    }`

    const intNeqScript = `testing int_neq
    func main(a: Int, b: Int) -> Bool {
        a != b
    }`

    const intNegateScript = `testing int_negate
    func main(a: Int) -> Int {
        -a
    }`

    const intPosScript = `testing int_pos
    func main(a: Int) -> Int {
        +a
    }`

    const intAddScript = `testing int_add
    func main(a: Int, b: Int) -> Int {
        a + b
    }`

    const intSubScript = `testing int_sub
    func main(a: Int, b: Int) -> Int {
        a - b
    }`

    const intMulScript = `testing int_mul
    func main(a: Int, b: Int) -> Int {
        a * b
    }`

    const intDivScript = `testing int_div
    func main(a: Int, b: Int) -> Int {
        a / b
    }`

    const intModScript = `testing int_mod
    func main(a: Int, b: Int) -> Int {
        a % b
    }`

    const intGeqScript = `testing int_geq
    func main(a: Int, b: Int) -> Bool {
        a >= b
    }`

    const intGtScript = `testing int_geq
    func main(a: Int, b: Int) -> Bool {
        a > b
    }`

    const intLeqScript = `testing int_leq
    func main(a: Int, b: Int) -> Bool {
        a <= b
    }`

    const intLtScript = `testing int_lt
    func main(a: Int, b: Int) -> Bool {
        a < b
    }`

    const intMinScript = `testing int_min
    func main(a: Int, b: Int) -> Int {
        Int::min(a, b)
    }`

    const intMaxScript = `testing int_max
    func main(a: Int, b: Int) -> Int {
        Int::max(a, b)
    }`

    const intBoundMinScript = `testing int_bound_min
    func main(a: Int, b: Int) -> Int {
        a.bound_min(b)
    }`

    const intBoundMaxScript = `testing int_bound_max
    func main(a: Int, b: Int) -> Int {
        a.bound_max(b)
    }`

    const intBoundScript = `testing int_bound
    func main(a: Int, b: Int, c: Int) -> Int {
        a.bound(b, c)
    }`

    const intAbsScript = `testing int_abs
    func main(a: Int) -> Int {
        a.abs()
    }`

    const intSqrtScript = `testing int_sqrt
    func main(a: Int) -> Int {
        Int::sqrt(a)
    }`

    const intEncodeZigzagScript = `testing int_encode_zigzag
    func main(a: Int) -> Int {
        a.encode_zigzag()
    }`

    const intDecodeZigzagScript = `testing int_decode_zigzag
    func main(a: Int) -> Int {
        a.decode_zigzag()
    }`

    const intZigzagRoundtripScript = `testing int_zigzag
    func main(a: Int) -> Int {
        a.encode_zigzag().decode_zigzag()
    }`

    const intToBoolScript = `testing int_to_bool
    func main(a: Int) -> Bool {
        a.to_bool()
    }`

    const intToHexScript = `testing int_to_hex
    func main(a: Int) -> String {
        a.to_hex()
    }`

    const intToLittleEndianScript = `testing int_to_little_endian
    func main(a: Int) -> ByteArray {
        a.to_little_endian()
    }`

    const intFromLittleEndianScript = `testing int_from_little_endian
    func main(a: ByteArray) -> Int {
        Int::from_little_endian(a)
    }`

    const intToBigEndianScript = `testing int_to_big_endian
    func main(a: Int) -> ByteArray {
        a.to_big_endian()
    }`

    const intFromBigEndianScript = `testing int_from_big_endian
    func main(a: ByteArray) -> Int {
        Int::from_big_endian(a)
    }`

    const intLittleEndianRoundtripScript = `testing int_little_endian_roundtrip
    func main(a: Int) -> Bool {
        Int::from_little_endian(a.to_little_endian()) == a
    }`

    const intBigEndianRoundtripScript = `testing int_big_endian_roundtrip
    func main(a: Int) -> Bool {
        Int::from_big_endian(a.to_big_endian()) == a
    }`

    const intToBase58Script = `testing int_to_base58
    func main(a: Int) -> String {
        a.to_base58()
    }`

    const intFromBase58Script = `testing int_from_base58
    func main(a: String) -> Int {
        Int::from_base58(a)
    }`

    const intBase58RoundtripScript = `testing int_base58_roundtrip
    func main(a: Int) -> Bool {
        Int::from_base58(a.to_base58()) == a
    }`

    const intShowScript = `testing int_show
    func main(a: Int) -> String {
        a.show()
    }`

    const intShowParseRoundtripScript = `testing int_show_parse_roundtrip
    func main(a: Int) -> Bool {
        Int::parse(a.show()) == a
    }`

    const intParseScript = `testing int_parse
    func main(a: String) -> Int {
        Int::parse(a)
    }`

    const intFromDataScript = `testing int_from_data
    func main(a: Data) -> Int {
        Int::from_data(a)
    }`

    const intSerializeScript = `testing int_serialize
    func main(a: Int) -> ByteArray {
        a.serialize()
    }`

    const intToRatioScript = `testing int_to_ratio
    func main(a: Int) -> Ratio {
        a.to_ratio()
    }`

    compileAndRunMany([
        {
            description: "Literal 0",
            main: `testing litint0
            func main() -> Int {
                0
            }`,
            inputs: [],
            output: int(0)
        },
        {
            description: "Literal -1",
            main: `testing litintminus1
            func main() -> Int {
                -1
            }`,
            inputs: [],
            output: int(-1)
        },
        {
            description: "(x == x) == true",
            main: `testing int_eq_identity
            func main(x: Int) -> Bool {
                x == x
            }`,
            inputs: [int(1)],
            output: True
        },
        {
            description: "(1 == 1) == true",
            main: intEqScript,
            inputs: [int(1), int(1)],
            output: True
        },
        {
            description: "(1 == 0) == false",
            main: intEqScript,
            inputs: [int(1), int(0)],
            output: False
        },
        {
            description: "(x == x) == false",
            main: `testing int_neq_identity
            func main(x: Int) -> Bool {
                x != x
            }`,
            inputs: [int(1)],
            output: False
        },
        {
            description: "(1 != 1) == false",
            main: intNeqScript,
            inputs: [int(1), int(1)],
            output: False
        },
        {
            description: "(1 != 0) == true",
            main: intNeqScript,
            inputs: [int(1), int(0)],
            output: True
        },
        {
            description: "-(1) == -1",
            main: intNegateScript,
            inputs: [int(1)],
            output: int(-1)
        },
        {
            description: "-(0) == 0",
            main: intNegateScript,
            inputs: [int(0)],
            output: int(0)
        },
        {
            description: "+(1) == 1",
            main: intPosScript,
            inputs: [int(1)],
            output: int(1)
        },
        {
            description: "+(0) == 0",
            main: intPosScript,
            inputs: [int(0)],
            output: int(0)
        },
        {
            description: "1 + Literal 0 == 1",
            main: `testing int_add_lit_0
            func main(x: Int) -> Int {
                x + 0
            }`,
            inputs: [int(1)],
            output: int(1)
        },
        {
            description: "1 + 1 == 2",
            main: intAddScript,
            inputs: [int(1), int(1)],
            output: int(2)
        },
        {
            description: "1 + (-1) == 0",
            main: intAddScript,
            inputs: [int(1), int(-1)],
            output: int(0)
        },
        {
            description: "1 - Literal 0 == 1",
            main: `testing int_sub_lit_0
            func main(x: Int) -> Int {
                x - 0
            }`,
            inputs: [int(1)],
            output: int(1)
        },
        {
            description: "Literal 0 - 1 == -1",
            main: `testing int_lit_0_sub
            func main(x: Int) -> Int {
                0 - x
            }`,
            inputs: [int(1)],
            output: int(-1)
        },
        {
            description: "1 - 1 == 0",
            main: intSubScript,
            inputs: [int(1), int(1)],
            output: int(0)
        },
        {
            description: "1 - 2 == -1",
            main: intSubScript,
            inputs: [int(1), int(2)],
            output: int(-1)
        },
        {
            description: "Literal 0 * 1 == 0",
            main: `testing int_lit_0_mul
            func main(x: Int) -> Int {
                0 * x
            }`,
            inputs: [int(1)],
            output: int(0)
        },
        {
            description: "Literal 1 * 10 == 10",
            main: `testing int_lit_1_mul
            func main(x: Int) -> Int {
                1 * x
            }`,
            inputs: [int(10)],
            output: int(10)
        },
        {
            description: "1 * 1 == 1",
            main: intMulScript,
            inputs: [int(1), int(1)],
            output: int(1)
        },
        {
            description: "10 * 10 == 100",
            main: intMulScript,
            inputs: [int(10), int(10)],
            output: int(100)
        },
        {
            description: "10 * 0 == 0",
            main: intMulScript,
            inputs: [int(10), int(0)],
            output: int(0)
        },
        {
            description: "10 * (-1) == -10",
            main: intMulScript,
            inputs: [int(10), int(-1)],
            output: int(-10)
        },
        {
            description: "1 / (Literal 0) == error",
            main: `testing int_div_lit_0
            func main(a: Int) -> Int {
                a / 0
            }`,
            inputs: [int(1)],
            output: { error: "" }
        },
        {
            description: "(Literal 0) / 1 == 0",
            main: `testing int_lit_0_div
            func main(a: Int) -> Int {
                0 / a
            }`,
            inputs: [int(1)],
            output: int(0)
        },
        {
            description: "2 / 2 == 1",
            main: intDivScript,
            inputs: [int(2), int(2)],
            output: int(1)
        },
        {
            description: "10 / 1 == 10",
            main: intDivScript,
            inputs: [int(10), int(1)],
            output: int(10)
        },
        {
            description: "1 / 10 == 0",
            main: intDivScript,
            inputs: [int(1), int(10)],
            output: int(0)
        },
        {
            description: "-1 / 10 == 0",
            main: intDivScript,
            inputs: [int(-1), int(10)],
            output: int(0)
        },
        {
            description: "-9 / 10 == 0",
            main: intDivScript,
            inputs: [int(-9), int(10)],
            output: int(0)
        },
        {
            description: "-10 / 10 == -1",
            main: intDivScript,
            inputs: [int(-10), int(10)],
            output: int(-1)
        },
        {
            description: "1 % (Literal 0) == error",
            main: `testing int_mod_lit_0
            func main(x: Int) -> Int {
                x % 0
            }`,
            inputs: [int(1)],
            output: { error: "" }
        },
        {
            description: "1 % 1 == 0",
            main: intModScript,
            inputs: [int(1), int(1)],
            output: int(0)
        },
        {
            description: "2 % 3 == 2",
            main: intModScript,
            inputs: [int(2), int(3)],
            output: int(2)
        },
        {
            description: "1 >= Literal 0 == true",
            main: `testing int_geq_lit_0
            func main(x: Int) -> Bool {
                x >= 0
            }`,
            inputs: [int(1)],
            output: True
        },
        {
            description: "1 >= 1 == true",
            main: intGeqScript,
            inputs: [int(1), int(1)],
            output: True
        },
        {
            description: "-1 >= 1 == false",
            main: intGeqScript,
            inputs: [int(-1), int(1)],
            output: False
        },
        {
            description: "1 > 1 == false",
            main: intGtScript,
            inputs: [int(1), int(1)],
            output: False
        },
        {
            description: "2 > 1 == true",
            main: intGtScript,
            inputs: [int(2), int(1)],
            output: True
        },
        {
            description: "1 <= 1 == true",
            main: intLeqScript,
            inputs: [int(1), int(1)],
            output: True
        },
        {
            description: "2 <= 1 == false",
            main: intLeqScript,
            inputs: [int(2), int(1)],
            output: False
        },
        {
            description: "0 < 1 == true",
            main: intLtScript,
            inputs: [int(0), int(1)],
            output: True
        },
        {
            description: "1 < 1 == false",
            main: intLtScript,
            inputs: [int(1), int(1)],
            output: False
        },
        {
            description: "2 < 1 == false",
            main: intLtScript,
            inputs: [int(2), int(1)],
            output: False
        },
        {
            description: "Int::min(0, 1) == 0",
            main: intMinScript,
            inputs: [int(0), int(1)],
            output: int(0)
        },
        {
            description: "Int::min(100,-100) == -100",
            main: intMinScript,
            inputs: [int(100), int(-100)],
            output: int(-100)
        },
        {
            description: "Int::max(0, 1) == 1",
            main: intMaxScript,
            inputs: [int(0), int(1)],
            output: int(1)
        },
        {
            description: "Int::max(100,-100) == 100",
            main: intMaxScript,
            inputs: [int(100), int(-100)],
            output: int(100)
        },
        {
            description: "1.bound_min(0) == 1",
            main: intBoundMinScript,
            inputs: [int(1), int(0)],
            output: int(1)
        },
        {
            description: "0.bound_min(1) == 1",
            main: intBoundMinScript,
            inputs: [int(0), int(1)],
            output: int(1)
        },
        {
            description: "1.bound_max(0) == 0",
            main: intBoundMaxScript,
            inputs: [int(1), int(0)],
            output: int(0)
        },
        {
            description: "0.bound_max(1) == 0",
            main: intBoundMaxScript,
            inputs: [int(0), int(1)],
            output: int(0)
        },
        {
            description: "10.bound(15, 20) == 15",
            main: intBoundScript,
            inputs: [int(10), int(15), int(20)],
            output: int(15)
        },
        {
            description: "17.bound(15, 20) == 17",
            main: intBoundScript,
            inputs: [int(17), int(15), int(20)],
            output: int(17)
        },
        {
            description: "22.bound(15, 20) == 20",
            main: intBoundScript,
            inputs: [int(22), int(15), int(20)],
            output: int(20)
        },
        {
            description: "-1.abs() == 1",
            main: intAbsScript,
            inputs: [int(-1)],
            output: int(1)
        },
        {
            description: "-100.abs() == 100",
            main: intAbsScript,
            inputs: [int(-100)],
            output: int(100)
        },
        {
            description: "0.abs() == 0",
            main: intAbsScript,
            inputs: [int(0)],
            output: int(0)
        },
        {
            description: "1.abs() == 1",
            main: intAbsScript,
            inputs: [int(1)],
            output: int(1)
        },
        {
            description: "100.abs() == 100",
            main: intAbsScript,
            inputs: [int(100)],
            output: int(100)
        },
        {
            description: "sqrt(-1) == error",
            main: intSqrtScript,
            inputs: [int(-1)],
            output: { error: "" }
        },
        {
            description: "sqrt(0) == 0",
            main: intSqrtScript,
            inputs: [int(0)],
            output: int(0)
        },
        {
            description: "sqrt(1) == 1",
            main: intSqrtScript,
            inputs: [int(1)],
            output: int(1)
        },
        {
            description: "sqrt(4) == 2",
            main: intSqrtScript,
            inputs: [int(4)],
            output: int(2)
        },
        {
            description: "sqrt(9) == 3",
            main: intSqrtScript,
            inputs: [int(9)],
            output: int(3)
        },
        {
            description: "sqrt(8) == 2",
            main: intSqrtScript,
            inputs: [int(8)],
            output: int(2)
        },
        {
            description: "sqrt(1024) == 32",
            main: intSqrtScript,
            inputs: [int(1024)],
            output: int(32)
        },
        {
            description: "sqrt(1048576) == 1024",
            main: intSqrtScript,
            inputs: [int(1048576)],
            output: int(1024)
        },
        {
            description: "sqrt(1048575) == 1023",
            main: intSqrtScript,
            inputs: [int(1048575)],
            output: int(1023)
        },
        {
            description: "encode_zigzag(0) == 0",
            main: intEncodeZigzagScript,
            inputs: [int(0)],
            output: int(0)
        },
        {
            description: "encode_zigzag(-1) == 1",
            main: intEncodeZigzagScript,
            inputs: [int(-1)],
            output: int(1)
        },
        {
            description: "encode_zigzag(1) == 2",
            main: intEncodeZigzagScript,
            inputs: [int(1)],
            output: int(2)
        },
        {
            description: "encode_zigzag(-2) == 3",
            main: intEncodeZigzagScript,
            inputs: [int(-2)],
            output: int(3)
        },
        {
            description: "encode_zigzag(2) == 4",
            main: intEncodeZigzagScript,
            inputs: [int(2)],
            output: int(4)
        },
        {
            description: "encode_zigzag(-3) == 5",
            main: intEncodeZigzagScript,
            inputs: [int(-3)],
            output: int(5)
        },
        {
            description: "encode_zigzag(3) == 6",
            main: intEncodeZigzagScript,
            inputs: [int(3)],
            output: int(6)
        },
        {
            description: "decode_zigzag(-1) == error",
            main: intDecodeZigzagScript,
            inputs: [int(-1)],
            output: { error: "" }
        },
        {
            description: "decode_zigzag(0) == 0",
            main: intDecodeZigzagScript,
            inputs: [int(0)],
            output: int(0)
        },
        {
            description: "decode_zigzag(1) == -1",
            main: intDecodeZigzagScript,
            inputs: [int(1)],
            output: int(-1)
        },
        {
            description: "decode_zigzag(2) == 1",
            main: intDecodeZigzagScript,
            inputs: [int(2)],
            output: int(1)
        },
        {
            description: "decode_zigzag(3) == -2",
            main: intDecodeZigzagScript,
            inputs: [int(3)],
            output: int(-2)
        },
        {
            description: "decode_zigzag(4) == 2",
            main: intDecodeZigzagScript,
            inputs: [int(4)],
            output: int(2)
        },
        {
            description: "decode_zigzag(5) == -3",
            main: intDecodeZigzagScript,
            inputs: [int(5)],
            output: int(-3)
        },
        {
            description: "encode_zigzag(6) == 3",
            main: intDecodeZigzagScript,
            inputs: [int(6)],
            output: int(3)
        },
        {
            description: "decode_zigzag(encode_zigzag(-100)) == -100",
            main: intZigzagRoundtripScript,
            inputs: [int(-100)],
            output: int(-100)
        },
        {
            description: "0.to_bool() == false",
            main: intToBoolScript,
            inputs: [int(0)],
            output: False
        },
        {
            description: "1.to_bool() == true",
            main: intToBoolScript,
            inputs: [int(1)],
            output: True
        },
        {
            description: "-1.to_bool() == true",
            main: intToBoolScript,
            inputs: [int(-1)],
            output: True
        },
        {
            description: '(-16).to_hex() == "-10"',
            main: intToHexScript,
            inputs: [int(-16)],
            output: str("-10")
        },
        {
            description: '(-15).to_hex() == "-f"',
            main: intToHexScript,
            inputs: [int(-15)],
            output: str("-f")
        },
        {
            description: '(-1).to_hex() == "-1"',
            main: intToHexScript,
            inputs: [int(-1)],
            output: str("-1")
        },
        {
            description: '0.to_hex() == "0"',
            main: intToHexScript,
            inputs: [int(0)],
            output: str("0")
        },
        {
            description: '1.to_hex() == "1"',
            main: intToHexScript,
            inputs: [int(1)],
            output: str("1")
        },
        {
            description: '15.to_hex() == "f"',
            main: intToHexScript,
            inputs: [int(15)],
            output: str("f")
        },
        {
            description: '16.to_hex() == "10"',
            main: intToHexScript,
            inputs: [int(16)],
            output: str("10")
        },
        {
            description: '128.to_hex() == "80"',
            main: intToHexScript,
            inputs: [int(128)],
            output: str("80")
        },
        {
            description: '255.to_hex() == "ff"',
            main: intToHexScript,
            inputs: [int(255)],
            output: str("ff")
        },
        {
            description: "1024.to_little_endian() == JS-equiv",
            main: intToLittleEndianScript,
            inputs: [int(1024)],
            output: bytes(encodeIntBE(1024).reverse())
        },
        {
            description: "0.to_little_endian() == #00",
            main: intToLittleEndianScript,
            inputs: [int(0)],
            output: bytes("00")
        },
        {
            description: "-1.to_little_endian() throws an error",
            main: intToLittleEndianScript,
            inputs: [int(-1)],
            output: { error: "" }
        },
        {
            description: "# from little endian == 0",
            main: intFromLittleEndianScript,
            inputs: [bytes("")],
            output: int(0)
        },
        {
            description: "#00 from little endian == 0",
            main: intFromLittleEndianScript,
            inputs: [bytes("00")],
            output: int(0)
        },
        {
            description: "#ff from little endian == 255",
            main: intFromLittleEndianScript,
            inputs: [bytes("ff")],
            output: int(255)
        },
        {
            description: "1024.to_big_endian() == JS-equiv",
            main: intToBigEndianScript,
            inputs: [int(1024)],
            output: bytes(encodeIntBE(1024))
        },
        {
            description: "0.to_big_endian() == #00",
            main: intToBigEndianScript,
            inputs: [int(0)],
            output: bytes("00")
        },
        {
            description: "-1.to_big_endian() throws an error",
            main: intToBigEndianScript,
            inputs: [int(-1)],
            output: { error: "" }
        },
        {
            description: "# from big endian == 0",
            main: intFromBigEndianScript,
            inputs: [bytes("")],
            output: int(0)
        },
        {
            description: "#00 from big endian == 0",
            main: intFromBigEndianScript,
            inputs: [bytes("00")],
            output: int(0)
        },
        {
            description: "#ff from big endian == 255",
            main: intFromBigEndianScript,
            inputs: [bytes("ff")],
            output: int(255)
        },
        {
            description: "123 little endian roundtrip",
            main: intLittleEndianRoundtripScript,
            inputs: [int(123)],
            output: True
        },
        {
            description: "1234567890 little endian roundtrip",
            main: intLittleEndianRoundtripScript,
            inputs: [int(1234567890)],
            output: True
        },
        {
            description: "123 big endian roundtrip",
            main: intBigEndianRoundtripScript,
            inputs: [int(123)],
            output: True
        },
        {
            description: "1234567890 big endian roundtrip",
            main: intBigEndianRoundtripScript,
            inputs: [int(1234567890)],
            output: True
        },
        {
            description: '(0x287fb4cd).to_base58() == "233QC4"',
            main: intToBase58Script,
            inputs: [int(0x287fb4cd)],
            output: str("233QC4")
        },
        {
            description: 'Int::from_base58("233QC4") == 0x287fb4cd',
            main: intFromBase58Script,
            inputs: [str("233QC4")],
            output: int(0x287fb4cd)
        },
        {
            description: "123 base58 roundtrip",
            main: intBase58RoundtripScript,
            inputs: [int(123)],
            output: True
        },
        {
            description: "1234567890 base58 roundtrip",
            main: intBase58RoundtripScript,
            inputs: [int(1234567890)],
            output: True
        },
        {
            description: '0.show() == "0"',
            main: intShowScript,
            inputs: [int(0)],
            output: str("0")
        },
        {
            description: '1.show() == "1"',
            main: intShowScript,
            inputs: [int(1)],
            output: str("1")
        },
        {
            description: '9.show() == "9"',
            main: intShowScript,
            inputs: [int(9)],
            output: str("9")
        },
        {
            description: '10.show() == "10"',
            main: intShowScript,
            inputs: [int(10)],
            output: str("10")
        },
        {
            description: '-1.show() == "-1"',
            main: intShowScript,
            inputs: [int(-1)],
            output: str("-1")
        },
        {
            description: '-10.show() == "-10"',
            main: intShowScript,
            inputs: [int(-10)],
            output: str("-10")
        },
        {
            description: '-100.show() == "-100"',
            main: intShowScript,
            inputs: [int(-100)],
            output: str("-100")
        },
        {
            description: 'Int::parse("0") == 0',
            main: intParseScript,
            inputs: [str("0")],
            output: int(0)
        },
        {
            description: "123 show-parse roundtrip",
            main: intShowParseRoundtripScript,
            inputs: [int(123)],
            output: True
        },
        {
            description: "1234567890 show-parse roundtrip",
            main: intShowParseRoundtripScript,
            inputs: [int(1234567890)],
            output: True
        },
        {
            description: "-123 show-parse roundtrip",
            main: intShowParseRoundtripScript,
            inputs: [int(-123)],
            output: True
        },
        {
            description: "-1234567890 show-parse roundtrip",
            main: intShowParseRoundtripScript,
            inputs: [int(-1234567890)],
            output: True
        },
        {
            description: "Int::from_data(1 as Data) == 1",
            main: intFromDataScript,
            inputs: [int(1)],
            output: int(1)
        },
        {
            description: "int serialization for 1 returns correct CBOR",
            main: intSerializeScript,
            inputs: [int(1)],
            output: cbor(new IntData(1))
        },
        {
            description: "int serialization for -1 returns correct CBOR",
            main: intSerializeScript,
            inputs: [int(-1)],
            output: cbor(new IntData(-1))
        },
        {
            description:
                "int serialization for -1234567890 returns correct CBOR",
            main: intSerializeScript,
            inputs: [int(-1234567890)],
            output: cbor(new IntData(-1234567890))
        },
        {
            description:
                "(-100001*10000000)/(1000000) == -1000010 (emulation of real math)",
            main: `testing int_real_mul
            func main(a: Int, b: Int) -> Int {
                (a * b)/(1000000)
            }`,
            inputs: [int(-100001), int(10_000_000)],
            output: int(-1000010)
        },
        {
            description: "-1.to_ratio() == -1/1",
            main: intToRatioScript,
            inputs: [int(-1)],
            output: ratio(-1, 1)
        }
    ])
})
