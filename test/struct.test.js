import { describe, it } from "node:test"
import {
    False,
    True,
    bytes,
    compileForRun,
    constr,
    int,
    list,
    map
} from "./utils.js"
import { encodeUtf8 } from "@helios-lang/codec-utils"

describe("Singleton", () => {
    describe("Singleton(Int)::is_valid_data", () => {
        const runner = compileForRun(`testing singleton_int_is_valid_data
        struct S {
            a: Int
        }

        func main(d: Data) -> Bool {
            S::is_valid_data(d)
        }`)

        it("returns true for iData", () => {
            runner([int(0)], True)
        })

        it("returns false for bData", () => {
            runner([bytes([])], False)
        })

        it("returns false for listData", () => {
            runner([list()], False)
        })

        it("returns false for mapData", () => {
            runner([map([])], False)
        })

        it("returns false for constrData", () => {
            runner([constr(1)], False)
        })
    })
})

describe("Pair[Int, Int]", () => {
    describe("Pair[Int, Int]::is_valid_data", () => {
        const runner = compileForRun(`testing pair_int_int_is_valid_data
        struct S {
            a: Int
            b: Int
        }

        func main(d: Data) -> Bool {
            S::is_valid_data(d)
        }`)

        it("returns true for list with two iData items", () => {
            runner([list(int(0), int(1))], True)
        })

        it("returns false for list with three iData items", () => {
            runner([list(int(0), int(1), int(2))], False)
        })

        it("returns false for list with one iData item", () => {
            runner([list(int(0))], False)
        })

        it("returns false for iData", () => {
            runner([int(0)], False)
        })

        it("returns false for bData", () => {
            runner([bytes([])], False)
        })

        it("returns false for listData", () => {
            runner([list()], False)
        })

        it("returns false for mapData", () => {
            runner([map([])], False)
        })

        it("returns false for constrData", () => {
            runner([constr(1)], False)
        })
    })
})

describe("Cip68 Pair[Int, Int]", () => {
    describe("Pair[Int, Int]::is_valid_data", () => {
        const runner = compileForRun(`testing pair_int_int_is_valid_data
        struct S {
            a: Int "a"
            b: Int "b"
        }

        func main(d: Data) -> Bool {
            S::is_valid_data(d)
        }`)

        it("returns true for constrData with tag 0 and one field containing the map", () => {
            runner(
                [
                    constr(
                        0,
                        map([
                            [bytes(encodeUtf8("a")), int(0)],
                            [bytes(encodeUtf8("b")), int(1)]
                        ])
                    )
                ],
                True
            )
        })

        it("returns false if one of the fields isn't iData", () => {
            runner(
                [
                    constr(
                        0,
                        map([
                            [bytes(encodeUtf8("a")), int(0)],
                            [bytes(encodeUtf8("b")), bytes([])]
                        ])
                    )
                ],
                False
            )
        })

        it("returns false if one of the fields is missing", () => {
            runner([constr(0, map([[bytes(encodeUtf8("a")), int(0)]]))], False)
        })

        it("returns true even if an unknown field is included", () => {
            runner(
                [
                    constr(
                        0,
                        map([
                            [bytes(encodeUtf8("b")), int(1)],
                            [bytes(encodeUtf8("a")), int(0)],
                            [bytes(encodeUtf8("c")), int(2)]
                        ])
                    )
                ],
                True
            )
        })

        it("returns false for list", () => {
            runner([list()], False)
        })

        it("returns false for iData", () => {
            runner([int(0)], False)
        })

        it("returns false for bData", () => {
            runner([bytes([])], False)
        })

        it("returns false for listData", () => {
            runner([list()], False)
        })

        it("returns false for mapData", () => {
            runner([map([])], False)
        })

        it("returns false for constrData with tag 1", () => {
            runner([constr(1)], False)
        })
    })

    // TODO: implement == for Cip68 structs correctly
    //describe("Cip68 Pair[Int, Int] == Pair", () => {
    //    const runner = compileForRun(`testing cip68_pair_equals
    //    struct Pair {
    //        a: Int "a"
    //        b: Int "b"
    //    }
    //    func main(a: Int, b: Int, c: Data) -> Bool {
    //        Pair{a, b} == Pair::from_data(c)
    //    }`)
    //
    //    it("returns true if order of fields is the same", () => {
    //        runner(
    //            [
    //                int(0),
    //                int(1),
    //                constr(
    //                    0,
    //                    map([
    //                        [bytes(encodeUtf8("a")), int(0)],
    //                        [bytes(encodeUtf8("b")), int(1)]
    //                    ]),
    //                    int(0)
    //                )
    //            ],
    //            True
    //        )
    //    })
    //})
})
