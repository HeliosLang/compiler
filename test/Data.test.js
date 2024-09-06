import { describe, it } from "node:test"
import {
    True,
    bytes,
    compileForRun,
    constr,
    int,
    list,
    map,
    str
} from "./utils.js"

describe("Data", () => {
    const dataAsScript = `testing data_as
    func main(a: Data) -> Int {
        a.as[Int]
    }`

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

        it("ok for int", () => {
            runner([int(0)], True)
        })

        it("ok for bytearray", () => {
            runner([bytes("")], True)
        })

        it("ok for list", () => {
            runner([list()], True)
        })

        it("ok for map", () => {
            runner([map([])], True)
        })

        it("ok for constr", () => {
            runner([constr(123)], True)
        })
    })
})
