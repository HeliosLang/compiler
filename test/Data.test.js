import { describe, it } from "node:test"
import {
    True,
    assertOptimizedAs,
    bytes,
    compileForRun,
    constr,
    int,
    list,
    map,
    str
} from "./utils.js"

describe("Data", () => {
    describe("Data.as", () => {
        const runner1 = compileForRun(`testing data_as
        func main(a: Data) -> Int {
            a.as[Int]
        }`)

        it("parametric getter ok if correct runtime type", () => {
            runner1([int(1)], int(1))
        })

        it("parametric getter fails if incorrect runtime type", () => {
            runner1([bytes("")], { error: "" })
        })

        const runner2 = compileForRun(`testing data_as
        func main(a: Data) -> Int {
            a.as[Int]*2 + a.as[Int]/2
        }`)

        it("data.as[] can be used with operators", () => {
            runner2([int(1)], int(2))
        })

        const runner3 = compileForRun(`testing data_as
        func main(a: Data) -> String {
            a.as[Int].show()
        }`)

        it("data.as[] can be used in chain", () => {
            runner3([int(1)], str("1"))
        })
    })

    describe("Data.switch", () => {
        const runner1 = compileForRun(`testing data_switch_int
        func main(a: Data) -> Int {
            a.switch{
                IntData{i} => i,
                else => error("expected int")
            }
        }`)

        it("can get IntData int through switch", () => {
            runner1([int(1)], int(1))
        })

        const runner2 = compileForRun(`testing data_switch_list_item
        func main(a: Data) -> Int {
            a.switch{
                ListData{items} => {
                    items.get_singleton().switch{
                        IntData{i} => i,
                        else => error("expected list of int")
                    }
                },
                else => error("expected list of int")
            }
        }`)

        it("can get ListData int item through switch", () => {
            runner2([list(int(1))], int(1))
        })

        const runner3 = compileForRun(`testing data_switch_constr_tag
        func main(a: Data) -> Int {
            a.switch{
                ConstrData{tag, _} => {
                    tag
                },
                else => error("expected constrData")
            }
        }`)

        it("can get ConstrData tag through switch", () => {
            runner3([constr(1)], int(1))
        })
    })

    describe("Data::is_valid_data", () => {
        const runner = compileForRun(`testing data_is_valid_data
        func main(data: Data) -> Bool {
            Data::is_valid_data(data)
        }`)

        it("returns true for iData", () => {
            runner([int(0)], True)
        })

        it("returns true for bData", () => {
            runner([bytes("")], True)
        })

        it("returns true for listData", () => {
            runner([list()], True)
        })

        it("returns true for mapData", () => {
            runner([map([])], True)
        })

        it("returns true for constrData", () => {
            runner([constr(123)], True)
        })
    })

    describe("Data.show()", () => {
        const runner = compileForRun(`testing data_show
            func main(data: Data) -> String {
                data.show()
            }`)

        it("ConstrData(0, []) shows as 0{}", () => {
            runner([constr(0)], str("0{}"))
        })

        it("ConstrData(0, [IntData(1)]) shows as 0{1}", () => {
            runner([constr(0, int(1))], str("0{1}"))
        })

        it("MapData([[IntData(1), IntData(1)]]) shows as {1:1}", () => {
            runner([map([[int(1), int(1)]])], str("{1:1}"))
        })

        it("MapData([[IntData(1), IntData(1)], [IntData(2), IntData(2)]]) shows as {1:1,2:2}", () => {
            runner(
                [
                    map([
                        [int(1), int(1)],
                        [int(2), int(2)]
                    ])
                ],
                str("{1:1,2:2}")
            )
        })

        it("MapData([[IntData(1), ConstrData(1, [])]]) shows as {1:1{}}", () => {
            runner([map([[int(1), constr(1)]])], str("{1:1{}}"))
        })

        it("MapData([[IntData(1), ConstrData(1, [IntData(1), IntData(2), ListData([])])]]) shows as {1:1{1,2,[]}}", () => {
            runner(
                [map([[int(1), constr(1, int(1), int(2), list())]])],
                str("{1:1{1,2,[]}}")
            )
        })

        it("ListData([]) shows as []", () => {
            runner([list()], str("[]"))
        })

        it("ListData([IntData(1)]) shows as [1]", () => {
            runner([list(int(1))], str("[1]"))
        })

        it("ListData([IntData(1), IntData(2)]) shows as [1,2]", () => {
            runner([list(int(1), int(2))], str("[1,2]"))
        })

        it("ListData([IntData(1), IntData(2), IntData(3)]) shows as [1,2,3]", () => {
            runner([list(int(1), int(2), int(3))], str("[1,2,3]"))
        })

        it("ListData([IntData(1), ConstrData(2, [ConstrData(0, [])]), ListData([IntData(3)])]) shows as [1,2{0{}},[3]]", () => {
            runner(
                [list(int(1), constr(2, constr(0)), list(int(3)))],
                str("[1,2{0{}},[3]]")
            )
        })

        it("IntData(1) shows as 1", () => {
            runner([int(1)], str("1"))
        })

        it("is optimized out in print()", () => {
            assertOptimizedAs(
                `testing data_show_in_print_actual
                func main(data: Data) -> () {
                    print(data.show())
                }`,
                `testing data_show_in_print_expected_optimized
                func main(_: Data) -> () {
                    ()
                }`
            )
        })
    })
})
