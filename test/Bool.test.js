import { describe, it } from "node:test"
import {
    cbor,
    False,
    True,
    str,
    int,
    compileForRun,
    constr,
    bytes,
    list,
    map
} from "./utils.js"

describe("Bool", () => {
    describe("Literals", () => {
        it("literal false == false", () => {
            const runner = compileForRun(`testing bool_lit_false
            func main() -> Bool {
                false
            }`)

            runner([], False)
        })

        it("Literal true == true", () => {
            const runner = compileForRun(`testing bool_lit_true
            func main() -> Bool {
                true
            }`)

            runner([], True)
        })

        it("Literal !false == true", () => {
            const runner = compileForRun(`testing bool_not_lit_false
            func main() -> Bool {
                !false
            }`)

            runner([], True)
        })

        it("Literal !true == false", () => {
            const runner = compileForRun(`testing bool_not_lit_true
            func main() -> Bool {
                !true
            }`)

            runner([], False)
        })
    })

    describe("Identity", () => {
        const runner = compileForRun(`testing bool_identity
        func main(x: Bool) -> Bool {
            x
        }`)

        it("false is false", () => {
            runner([False], False)
        })

        it("true is true", () => {
            runner([True], True)
        })
    })

    describe("!Bool", () => {
        const runner = compileForRun(`testing bool_not_identity
        func main(x: Bool) -> Bool {
            !x
        }`)

        it("!false == true", () => {
            runner([False], True)
        })

        it("!true == false", () => {
            runner([True], False)
        })
    })

    describe("Bool && Bool", () => {
        const runner = compileForRun(`testing bool_and
        func main(a: Bool, b: Bool) -> Bool {
            a && b
        }`)

        it("true && true == true", () => {
            runner([True, True], True)
        })

        it("true && false == false", () => {
            runner([True, False], False)
        })

        it("false && true == false", () => {
            runner([False, True], False)
        })

        it("false && false == false", () => {
            runner([False, False], False)
        })
    })

    describe("Bool::and", () => {
        const runner = compileForRun(`testing bool_and_functional
        func main(a: Bool, b: Bool) -> Bool {
            Bool::and(() -> {
                a
            }, () -> {
                b
            })
        }`)

        it("Bool::and(true, true) == true", () => {
            runner([True, True], True)
        })

        it("Bool::and(true, false) == false", () => {
            runner([True, False], False)
        })

        it("Bool::and(false, true) == false", () => {
            runner([False, True], False)
        })

        it("Bool::and(false, false) == false", () => {
            runner([False, False], False)
        })
    })

    describe("Bool || Bool", () => {
        const runner = compileForRun(`testing bool_or_op
        func main(a: Bool, b: Bool) -> Bool {
            a || b
        }`)

        it("true || true == true", () => {
            runner([True, True], True)
        })

        it("true || false == true", () => {
            runner([True, False], True)
        })

        it("false || true == true", () => {
            runner([False, True], True)
        })

        it("false || false == false", () => {
            runner([False, False], False)
        })
    })

    describe("Bool::or", () => {
        const runner = compileForRun(`testing bool_or_functional
        func main(a: Bool, b: Bool) -> Bool {
            Bool::or(() -> {a}, () -> {b})
        }`)

        it("Bool::or(true, true) == true", () => {
            runner([True, True], True)
        })

        it("Bool::or(true, false) == true", () => {
            runner([True, False], True)
        })

        it("Bool::or(false, true) == true", () => {
            runner([False, True], True)
        })

        it("Bool::or(false, false) == false", () => {
            runner([False, False], False)
        })
    })

    describe("Bool == Bool", () => {
        const runner1 = compileForRun(`testing bool_eq_identity
        func main(x: Bool) -> Bool {
            x == x
        }`)

        it("(x == x) == true", () => {
            runner1([False], True)
        })

        const runner2 = compileForRun(`testing bool_eq
        func main(a: Bool, b: Bool) -> Bool {
            a == b
        }`)

        it("(true == true) == true", () => {
            runner2([True, True], True)
        })

        it("(true == false) == false", () => {
            runner2([True, False], False)
        })

        it("(false == true) == false", () => {
            runner2([False, True], False)
        })

        it("(false == false) == true", () => {
            runner2([False, False], True)
        })
    })

    describe("Bool != Bool", () => {
        const runner1 = compileForRun(`testing bool_neq_identity
        func main(x: Bool) -> Bool {
            x != x
        }`)

        it("(x != x) == false", () => {
            runner1([True], False)
        })

        const runner2 = compileForRun(`testing bool_neq
        func main(a: Bool, b: Bool) -> Bool {
            a != b
        }`)

        it("(true != true) == false", () => {
            runner2([True, True], False)
        })

        it("(true != false) == true", () => {
            runner2([True, False], True)
        })

        it("(false != true) == true", () => {
            runner2([False, True], True)
        })

        it("(false != false) == false", () => {
            runner2([False, False], False)
        })
    })

    describe("Bool.to_int", () => {
        const runner = compileForRun(`testing bool_to_int
        func main(a: Bool) -> Int {
            a.to_int()
        }`)

        it("false.to_int() == 0", () => {
            runner([False], int(0))
        })

        it("true.to_int() == 1", () => {
            runner([True], int(1))
        })
    })

    describe("Bool.show", () => {
        const runner = compileForRun(`testing bool_show
        func main(a: Bool) -> String {
            a.show()
        }`)

        it('false.show() == "false"', () => {
            runner([False], str("false"))
        })

        it('true.show() == "true"', () => {
            runner([True], str("true"))
        })
    })

    describe("Bool::from_data", () => {
        const runner = compileForRun(`testing bool_from_data
        func main(a: Data) -> Bool {
            Bool::from_data(a)
        }`)

        it("Bool::from_data(false as Data) == false", () => {
            runner([False], False)
        })

        it("Bool::from_data(true as Data) == true", () => {
            runner([True], True)
        })
    })

    describe("Bool.serialize", () => {
        const runner = compileForRun(`testing bool_serialize
        func main(a: Bool) -> ByteArray {
            a.serialize()
        }`)

        it("false.serialize() == Cbor encoding of ConstrData(0)", () => {
            runner([False], cbor(False))
        })

        it("true.serialize() == Cbor encoding of ConstrData(1)", () => {
            runner([True], cbor(True))
        })
    })

    describe("Bool.trace", () => {
        const runner = compileForRun(`testing bool_trace
        func main(a: Bool) -> Bool {
            a.trace("prefix")
        }`)

        it('false.trace("...") == false', () => {
            runner([False], False)
        })

        it('true.trace("...") == true', () => {
            runner([True], True)
        })
    })

    describe("Bool::is_valid_data", () => {
        const runner = compileForRun(`testing bool_is_valid_data
        func main(data: Data) -> Bool {
            Bool::is_valid_data(data)
        }`)

        it("returns true for False", () => {
            runner([False], True)
        })

        it("returns true for True", () => {
            runner([True], True)
        })

        it("returns true for constrData 0 []", () => {
            runner([constr(0)], True)
        })

        it("returns true for constrData 1 []", () => {
            runner([constr(1)], True)
        })

        it("returns false for constrData 2 []", () => {
            runner([constr(2)], False)
        })

        it("returns false for constrData 0 [<dummy-content>]", () => {
            runner([constr(0, int(0))], False)
        })

        it("returns false for constrData -1 [<dummy-content>]", () => {
            runner([constr(-1, int(0))], False)
        })

        it("returns false for bData", () => {
            runner([bytes("")], False)
        })

        it("returns false for iData", () => {
            runner([int(0)], False)
        })

        it("returns false for listData", () => {
            runner([list()], False)
        })

        it("returns false for mapData", () => {
            runner([map([])], False)
        })
    })
})
