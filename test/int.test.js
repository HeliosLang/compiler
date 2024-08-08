import { describe, it } from "node:test"
import { encodeIntBE } from "@helios-lang/codec-utils"
import { IntData } from "@helios-lang/uplc"
import {
    False,
    True,
    bytes,
    cbor,
    compileForRun,
    constr,
    int,
    list,
    map,
    ratio,
    str
} from "./utils.js"

describe("Int", () => {
    describe("Literals", () => {
        it("0", () => {
            const runner = compileForRun(`testing litint0
            func main() -> Int {
                0
            }`)

            runner([], int(0))
        })

        it("-1", () => {
            const runner = compileForRun(`testing litintminus1
            func main() -> Int {
                -1
            }`)

            runner([], int(-1))
        })
    })

    describe("Int == Int", () => {
        const runner1 = compileForRun(`testing int_eq_identity
        func main(x: Int) -> Bool {
            x == x
        }`)

        it("(x == x) == true", () => {
            runner1([int(1)], True)
        })

        const runner2 = compileForRun(`testing int_eq
        func main(a: Int, b: Int) -> Bool {
            a == b
        }`)

        it("(1 == 1) == true", () => {
            runner2([int(1), int(1)], True)
        })

        it("(1 == 0) == false", () => {
            runner2([int(1), int(0)], False)
        })
    })

    describe("Int != Int", () => {
        const runner1 = compileForRun(`testing int_neq_identity
        func main(x: Int) -> Bool {
            x != x
        }`)

        it("(x != x) == false", () => {
            runner1([int(1)], False)
        })

        const runner2 = compileForRun(`testing int_neq
        func main(a: Int, b: Int) -> Bool {
            a != b
        }`)

        it("(1 != 1) == false", () => {
            runner2([int(1), int(1)], False)
        })

        it("(1 != 0) == true", () => {
            runner2([int(1), int(0)], True)
        })
    })

    describe("- Int", () => {
        const runner = compileForRun(`testing int_negate
        func main(a: Int) -> Int {
            -a
        }`)

        it("-(1) == -1", () => {
            runner([int(1)], int(-1))
        })

        it("-(0) == 0", () => {
            runner([int(0)], int(0))
        })
    })

    describe("+ Int", () => {
        const runner = compileForRun(`testing int_pos
        func main(a: Int) -> Int {
            +a
        }`)

        it("+(1) == 1", () => {
            runner([int(1)], int(1))
        })

        it("+(0) == 0", () => {
            runner([int(0)], int(0))
        })
    })

    describe("Int + Int", () => {
        const runner1 = compileForRun(`testing int_add_lit_0
        func main(x: Int) -> Int {
            x + 0
        }`)

        it("1 + Literal 0 == 1", () => {
            runner1([int(1)], int(1))
        })

        const runner2 = compileForRun(`testing int_add
        func main(a: Int, b: Int) -> Int {
            a + b
        }`)

        it("1 + 1 == 2", () => {
            runner2([int(1), int(1)], int(2))
        })

        it("1 + (-1) == 0", () => {
            runner2([int(1), int(-1)], int(0))
        })
    })

    describe("Int - Int", () => {
        const runner1 = compileForRun(`testing int_sub_lit_0
        func main(x: Int) -> Int {
            x - 0
        }`)

        it("1 - Literal 0 == 1", () => {
            runner1([int(1)], int(1))
        })

        const runner2 = compileForRun(`testing int_lit_0_sub
        func main(x: Int) -> Int {
            0 - x
        }`)

        it("Literal 0 - 1 == -1", () => {
            runner2([int(1)], int(-1))
        })

        const runner3 = compileForRun(`testing int_sub
        func main(a: Int, b: Int) -> Int {
            a - b
        }`)

        it("1 - 1 == 0", () => {
            runner3([int(1), int(1)], int(0))
        })

        it("1 - 2 == -1", () => {
            runner3([int(1), int(2)], int(-1))
        })
    })

    describe("Int * Int", () => {
        const runner1 = compileForRun(`testing int_lit_0_mul
        func main(x: Int) -> Int {
            0 * x
        }`)

        it("Literal 0 * 1 == 0", () => {
            runner1([int(1)], int(0))
        })

        const runner2 = compileForRun(`testing int_lit_1_mul
        func main(x: Int) -> Int {
            1 * x
        }`)

        it("Literal 1 * 10 == 10", () => {
            runner2([int(10)], int(10))
        })

        const runner3 = compileForRun(`testing int_mul
        func main(a: Int, b: Int) -> Int {
            a * b
        }`)

        it("1 * 1 == 1", () => {
            runner3([int(1), int(1)], int(1))
        })

        it("10 * 10 == 100", () => {
            runner3([int(10), int(10)], int(100))
        })

        it("10 * 0 == 0", () => {
            runner3([int(10), int(0)], int(0))
        })

        it("10 * (-1) == -10", () => {
            runner3([int(10), int(-1)], int(-10))
        })

        const runner4 = compileForRun(`testing int_real_mul
        func main(a: Int, b: Int) -> Int {
            (a * b)/(1000000)
        }`)

        it("(-100001*10000000)/(1000000) == -1000010 (emulation of real math)", () => {
            runner4([int(-100001), int(10_000_000)], int(-1000010))
        })
    })

    describe("Int / Int", () => {
        const runner1 = compileForRun(`testing int_div_lit_0
        func main(a: Int) -> Int {
            a / 0
        }`)

        it("1 / (Literal 0) == error", () => {
            runner1([int(1)], { error: "" })
        })

        const runner2 = compileForRun(`testing int_lit_0_div
        func main(a: Int) -> Int {
            0 / a
        }`)

        it("(Literal 0) / 1 == 0", () => {
            runner2([int(1)], int(0))
        })

        const runner3 = compileForRun(`testing int_div
        func main(a: Int, b: Int) -> Int {
            a / b
        }`)

        it("2 / 2 == 1", () => {
            runner3([int(2), int(2)], int(1))
        })

        it("10 / 1 == 10", () => {
            runner3([int(10), int(1)], int(10))
        })

        it("1 / 10 == 0", () => {
            runner3([int(1), int(10)], int(0))
        })

        it("-1 / 10 == 0", () => {
            runner3([int(-1), int(10)], int(0))
        })

        it("-9 / 10 == 0", () => {
            runner3([int(-9), int(10)], int(0))
        })

        it("-10 / 10 == -1", () => {
            runner3([int(-10), int(10)], int(-1))
        })
    })

    describe("Int % Int", () => {
        const runner1 = compileForRun(`testing int_mod_lit_0
        func main(x: Int) -> Int {
            x % 0
        }`)

        it("1 % (Literal 0) == error", () => {
            runner1([int(1)], { error: "" })
        })

        const runner2 = compileForRun(`testing int_mod
        func main(a: Int, b: Int) -> Int {
            a % b
        }`)

        it("1 % 1 == 0", () => {
            runner2([int(1), int(1)], int(0))
        })

        it("2 % 3 == 2", () => {
            runner2([int(2), int(3)], int(2))
        })
    })

    describe("Int >= Int", () => {
        const runner1 = compileForRun(`testing int_geq_lit_0
        func main(x: Int) -> Bool {
            x >= 0
        }`)

        it("1 >= Literal 0 == true", () => {
            runner1([int(1)], True)
        })

        const runner2 = compileForRun(`testing int_geq
        func main(a: Int, b: Int) -> Bool {
            a >= b
        }`)

        it("1 >= 1 == true", () => {
            runner2([int(1), int(1)], True)
        })

        it("-1 >= 1 == false", () => {
            runner2([int(-1), int(1)], False)
        })
    })

    describe("Int > Int", () => {
        const runner = compileForRun(`testing int_geq
        func main(a: Int, b: Int) -> Bool {
            a > b
        }`)

        it("1 > 1 == false", () => {
            runner([int(1), int(1)], False)
        })

        it("2 > 1 == true", () => {
            runner([int(2), int(1)], True)
        })
    })

    describe("Int <= Int", () => {
        const runner = compileForRun(`testing int_leq
        func main(a: Int, b: Int) -> Bool {
            a <= b
        }`)

        it("1 <= 1 == true", () => {
            runner([int(1), int(1)], True)
        })

        it("2 <= 1 == false", () => {
            runner([int(2), int(1)], False)
        })
    })

    describe("Int < Int", () => {
        const runner = compileForRun(`testing int_lt
        func main(a: Int, b: Int) -> Bool {
            a < b
        }`)

        it("0 < 1 == true", () => {
            runner([int(0), int(1)], True)
        })

        it("1 < 1 == false", () => {
            runner([int(1), int(1)], False)
        })

        it("2 < 1 == false", () => {
            runner([int(2), int(1)], False)
        })
    })

    describe("Int::min", () => {
        const runner = compileForRun(`testing int_min
        func main(a: Int, b: Int) -> Int {
            Int::min(a, b)
        }`)

        it("Int::min(0, 1) == 0", () => {
            runner([int(0), int(1)], int(0))
        })

        it("Int::min(100,-100) == -100", () => {
            runner([int(100), int(-100)], int(-100))
        })
    })

    describe("Int::max", () => {
        const runner = compileForRun(`testing int_max
        func main(a: Int, b: Int) -> Int {
            Int::max(a, b)
        }`)

        it("Int::max(0, 1) == 1", () => {
            runner([int(0), int(1)], int(1))
        })

        it("Int::max(100,-100) == 100", () => {
            runner([int(100), int(-100)], int(100))
        })
    })

    describe("Int.bound_min", () => {
        const runner = compileForRun(`testing int_bound_min
        func main(a: Int, b: Int) -> Int {
            a.bound_min(b)
        }`)

        it("1.bound_min(0) == 1", () => {
            runner([int(1), int(0)], int(1))
        })

        it("0.bound_min(1) == 1", () => {
            runner([int(0), int(1)], int(1))
        })
    })

    describe("Int.bound_max", () => {
        const runner = compileForRun(`testing int_bound_max
        func main(a: Int, b: Int) -> Int {
            a.bound_max(b)
        }`)

        it("1.bound_max(0) == 0", () => {
            runner([int(1), int(0)], int(0))
        })

        it("0.bound_max(1) == 0", () => {
            runner([int(0), int(1)], int(0))
        })
    })

    describe("Int.bound", () => {
        const runner = compileForRun(`testing int_bound
        func main(a: Int, b: Int, c: Int) -> Int {
            a.bound(b, c)
        }`)

        it("10.bound(15, 20) == 15", () => {
            runner([int(10), int(15), int(20)], int(15))
        })

        it("17.bound(15, 20) == 17", () => {
            runner([int(17), int(15), int(20)], int(17))
        })

        it("22.bound(15, 20) == 20", () => {
            runner([int(22), int(15), int(20)], int(20))
        })
    })

    describe("Int.abs", () => {
        const runner = compileForRun(`testing int_abs
        func main(a: Int) -> Int {
            a.abs()
        }`)

        it("-1.abs() == 1", () => {
            runner([int(-1)], int(1))
        })

        it("-100.abs() == 100", () => {
            runner([int(-100)], int(100))
        })

        it("0.abs() == 0", () => {
            runner([int(0)], int(0))
        })

        it("1.abs() == 1", () => {
            runner([int(1)], int(1))
        })

        it("100.abs() == 100", () => {
            runner([int(100)], int(100))
        })
    })

    describe("Int::sqrt", () => {
        const runner = compileForRun(`testing int_sqrt
        func main(a: Int) -> Int {
            Int::sqrt(a)
        }`)

        it("sqrt(-1) == error", () => {
            runner([int(-1)], { error: "" })
        })

        it("sqrt(0) == 0", () => {
            runner([int(0)], int(0))
        })

        it("sqrt(1) == 1", () => {
            runner([int(1)], int(1))
        })

        it("sqrt(4) == 2", () => {
            runner([int(4)], int(2))
        })

        it("sqrt(9) == 3", () => {
            runner([int(9)], int(3))
        })

        it("sqrt(8) == 2", () => {
            runner([int(8)], int(2))
        })

        it("sqrt(1024) == 32", () => {
            runner([int(1024)], int(32))
        })

        it("sqrt(1048576) == 1024", () => {
            runner([int(1048576)], int(1024))
        })

        it("sqrt(1048575) == 1023", () => {
            runner([int(1048575)], int(1023))
        })
    })

    describe("Int.encode_zigzag", () => {
        const runner = compileForRun(`testing int_encode_zigzag
        func main(a: Int) -> Int {
            a.encode_zigzag()
        }`)

        it("encode_zigzag(0) == 0", () => {
            runner([int(0)], int(0))
        })

        it("encode_zigzag(-1) == 1", () => {
            runner([int(-1)], int(1))
        })

        it("encode_zigzag(1) == 2", () => {
            runner([int(1)], int(2))
        })

        it("encode_zigzag(-2) == 3", () => {
            runner([int(-2)], int(3))
        })

        it("encode_zigzag(2) == 4", () => {
            runner([int(2)], int(4))
        })

        it("encode_zigzag(-3) == 5", () => {
            runner([int(-3)], int(5))
        })

        it("encode_zigzag(3) == 6", () => {
            runner([int(3)], int(6))
        })
    })

    describe("Int.decode_zigzag", () => {
        const runner1 = compileForRun(`testing int_decode_zigzag
        func main(a: Int) -> Int {
            a.decode_zigzag()
        }`)

        it("decode_zigzag(-1) == error", () => {
            runner1([int(-1)], { error: "" })
        })

        it("decode_zigzag(0) == 0", () => {
            runner1([int(0)], int(0))
        })

        it("decode_zigzag(1) == -1", () => {
            runner1([int(1)], int(-1))
        })

        it("decode_zigzag(2) == 1", () => {
            runner1([int(2)], int(1))
        })

        it("decode_zigzag(3) == -2", () => {
            runner1([int(3)], int(-2))
        })

        it("decode_zigzag(4) == 2", () => {
            runner1([int(4)], int(2))
        })

        it("decode_zigzag(5) == -3", () => {
            runner1([int(5)], int(-3))
        })

        it("decode_zigzag(6) == 3", () => {
            runner1([int(6)], int(3))
        })

        const runner2 = compileForRun(`testing int_zigzag
        func main(a: Int) -> Int {
            a.encode_zigzag().decode_zigzag()
        }`)

        it("decode_zigzag(encode_zigzag(-100)) == -100", () => {
            runner2([int(-100)], int(-100))
        })
    })

    describe("Int.to_bool", () => {
        const runner = compileForRun(`testing int_to_bool
        func main(a: Int) -> Bool {
            a.to_bool()
        }`)

        it("0.to_bool() == false", () => {
            runner([int(0)], False)
        })

        it("1.to_bool() == true", () => {
            runner([int(1)], True)
        })

        it("-1.to_bool() == true", () => {
            runner([int(-1)], True)
        })
    })

    describe("Int.to_hex", () => {
        const runner = compileForRun(`testing int_to_hex
        func main(a: Int) -> String {
            a.to_hex()
        }`)

        it('(-16).to_hex() == "-10"', () => {
            runner([int(-16)], str("-10"))
        })

        it('(-15).to_hex() == "-f"', () => {
            runner([int(-15)], str("-f"))
        })

        it('(-1).to_hex() == "-1"', () => {
            runner([int(-1)], str("-1"))
        })

        it('0.to_hex() == "0"', () => {
            runner([int(0)], str("0"))
        })

        it('1.to_hex() == "1"', () => {
            runner([int(1)], str("1"))
        })

        it('15.to_hex() == "f"', () => {
            runner([int(15)], str("f"))
        })

        it('16.to_hex() == "10"', () => {
            runner([int(16)], str("10"))
        })

        it('128.to_hex() == "80"', () => {
            runner([int(128)], str("80"))
        })

        it('255.to_hex() == "ff"', () => {
            runner([int(255)], str("ff"))
        })
    })

    describe("Int.to_little_endian", () => {
        const runner = compileForRun(`testing int_to_little_endian
        func main(a: Int) -> ByteArray {
            a.to_little_endian()
        }`)

        it("1024.to_little_endian() == JS-equiv", () => {
            runner([int(1024)], bytes(encodeIntBE(1024).reverse()))
        })

        it("0.to_little_endian() == #00", () => {
            runner([int(0)], bytes("00"))
        })

        it("-1.to_little_endian() throws an error", () => {
            runner([int(-1)], { error: "" })
        })
    })

    describe("Int::from_little_endian", () => {
        const runner1 = compileForRun(`testing int_from_little_endian
        func main(a: ByteArray) -> Int {
            Int::from_little_endian(a)
        }`)

        it("# from little endian == 0", () => {
            runner1([bytes("")], int(0))
        })

        it("#00 from little endian == 0", () => {
            runner1([bytes("00")], int(0))
        })

        it("#ff from little endian == 255", () => {
            runner1([bytes("ff")], int(255))
        })

        const runner2 = compileForRun(`testing int_little_endian_roundtrip
        func main(a: Int) -> Bool {
            Int::from_little_endian(a.to_little_endian()) == a
        }`)

        it("123 little endian roundtrip", () => {
            runner2([int(123)], True)
        })

        it("1234567890 little endian roundtrip", () => {
            runner2([int(1234567890)], True)
        })
    })

    describe("Int.to_big_endian", () => {
        const runner = compileForRun(`testing int_to_big_endian
        func main(a: Int) -> ByteArray {
            a.to_big_endian()
        }`)

        it("1024.to_big_endian() == JS-equiv", () => {
            runner([int(1024)], bytes(encodeIntBE(1024)))
        })

        it("0.to_big_endian() == #00", () => {
            runner([int(0)], bytes("00"))
        })

        it("-1.to_big_endian() throws an error", () => {
            runner([int(-1)], { error: "" })
        })
    })

    describe("Int::from_big_endian", () => {
        const runner1 = compileForRun(`testing int_from_big_endian
        func main(a: ByteArray) -> Int {
            Int::from_big_endian(a)
        }`)

        it("# from big endian == 0", () => {
            runner1([bytes("")], int(0))
        })

        it("#00 from big endian == 0", () => {
            runner1([bytes("00")], int(0))
        })

        it("#ff from big endian == 255", () => {
            runner1([bytes("ff")], int(255))
        })

        const runner2 = compileForRun(`testing int_big_endian_roundtrip
        func main(a: Int) -> Bool {
            Int::from_big_endian(a.to_big_endian()) == a
        }`)

        it("123 big endian roundtrip", () => {
            runner2([int(123)], True)
        })

        it("1234567890 big endian roundtrip", () => {
            runner2([int(1234567890)], True)
        })
    })

    describe("Int.to_base58", () => {
        const runner = compileForRun(`testing int_to_base58
        func main(a: Int) -> String {
            a.to_base58()
        }`)

        it('(0x287fb4cd).to_base58() == "233QC4"', () => {
            runner([int(0x287fb4cd)], str("233QC4"))
        })
    })

    describe("Int::from_base58", () => {
        const runner1 = compileForRun(`testing int_from_base58
        func main(a: String) -> Int {
            Int::from_base58(a)
        }`)

        it('Int::from_base58("233QC4") == 0x287fb4cd', () => {
            runner1([str("233QC4")], int(0x287fb4cd))
        })

        const runner2 = compileForRun(`testing int_base58_roundtrip
        func main(a: Int) -> Bool {
            Int::from_base58(a.to_base58()) == a
        }`)

        it("123 base58 roundtrip", () => {
            runner2([int(123)], True)
        })

        it("1234567890 base58 roundtrip", () => {
            runner2([int(1234567890)], True)
        })
    })

    describe("Int.show", () => {
        const runner = compileForRun(`testing int_show
        func main(a: Int) -> String {
            a.show()
        }`)

        it('0.show() == "0"', () => {
            runner([int(0)], str("0"))
        })

        it('1.show() == "1"', () => {
            runner([int(1)], str("1"))
        })

        it('9.show() == "9"', () => {
            runner([int(9)], str("9"))
        })

        it('10.show() == "10"', () => {
            runner([int(10)], str("10"))
        })

        it('-1.show() == "-1"', () => {
            runner([int(-1)], str("-1"))
        })

        it('-10.show() == "-10"', () => {
            runner([int(-10)], str("-10"))
        })

        it('-100.show() == "-100"', () => {
            runner([int(-100)], str("-100"))
        })
    })

    describe("Int::parse", () => {
        const runner1 = compileForRun(`testing int_parse
        func main(a: String) -> Int {
            Int::parse(a)
        }`)

        it('Int::parse("0") == 0', () => {
            runner1([str("0")], int(0))
        })

        it('Int::parse("-0") not allowed', () => {
            runner1([str("-0")], { error: "" })
        })

        it('Int::parse("-1") == -1', () => {
            runner1([str("-1")], int(-1))
        })

        const runner2 = compileForRun(`testing int_show_parse_roundtrip
        func main(a: Int) -> Bool {
            Int::parse(a.show()) == a
        }`)

        it("123 show-parse roundtrip", () => {
            runner2([int(123)], True)
        })

        it("1234567890 show-parse roundtrip", () => {
            runner2([int(1234567890)], True)
        })

        it("-123 show-parse roundtrip", () => {
            runner2([int(-123)], True)
        })

        it("-1234567890 show-parse roundtrip", () => {
            runner2([int(-1234567890)], True)
        })
    })

    describe("Int::from_data", () => {
        const runner = compileForRun(`testing int_from_data
        func main(a: Data) -> Int {
            Int::from_data(a)
        }`)

        it("Int::from_data(1 as Data) == 1", () => {
            runner([int(1)], int(1))
        })

        it("Int::from_data(bData) == error", () => {
            runner([bytes("")], { error: "" })
        })
    })

    describe("Int.serialize", () => {
        const runner = compileForRun(`testing int_serialize
        func main(a: Int) -> ByteArray {
            a.serialize()
        }`)

        it("int serialization for 1 returns correct CBOR", () => {
            runner([int(1)], cbor(new IntData(1)))
        })

        it("int serialization for -1 returns correct CBOR", () => {
            runner([int(-1)], cbor(new IntData(-1)))
        })

        it("int serialization for -1234567890 returns correct CBOR", () => {
            runner([int(-1234567890)], cbor(new IntData(-1234567890)))
        })
    })

    describe("Int.to_ratio", () => {
        const runner = compileForRun(`testing int_to_ratio
        func main(a: Int) -> Ratio {
            a.to_ratio()
        }`)

        it("-1.to_ratio() == -1/1", () => {
            runner([int(-1)], ratio(-1, 1))
        })
    })

    describe("Int::is_valid_data", () => {
        const runner = compileForRun(`testing int_is_valid_data
        func main(data: Data) -> Bool {
            Int::is_valid_data(data)
        }`)

        it("true for int", () => {
            runner([int(0)], True)
        })

        it("false for bytes", () => {
            runner([bytes("")], False)
        })

        it("false for list", () => {
            runner([list()], False)
        })

        it("false for constr", () => {
            runner([constr(0)], False)
        })

        it("false for map", () => {
            runner([map([])], False)
        })
    })
})
