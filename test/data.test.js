import { describe } from "node:test"
import { bytes, compileAndRunMany, constr, int, list, str } from "./utils.js"

describe("Data", () => {
    const dataAsScript = `testing data_as
    func main(a: Data) -> Int {
        a.as[Int]
    }`

    compileAndRunMany([
        {
            description: "parametric getter works",
            main: dataAsScript,
            inputs: [int(1)],
            output: int(1)
        },
        {
            description: "parametric fails for wrong input",
            main: dataAsScript,
            inputs: [bytes("")],
            output: { error: "" }
        },
        {
            description: "data.as[] can be used with operators",
            main: `testing data_as
            func main(a: Data) -> Int {
                a.as[Int]*2 + a.as[Int]/2
            }`,
            inputs: [int(1)],
            output: int(2)
        },
        {
            description: "data.as[] can be used in chain",
            main: `testing data_as
            func main(a: Data) -> String {
                a.as[Int].show()
            }`,
            inputs: [int(1)],
            output: str("1")
        },
        {
            description: "can get IntData int through switch",
            main: `testing data_switch_int
            func main(a: Data) -> Int {
                a.switch{
                    IntData{i} => i,
                    else => error("expected int")
                }
            }`,
            inputs: [int(1)],
            output: int(1)
        },
        {
            description: "can get ListData int item through switch",
            main: `testing data_switch_list_item
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
            }`,
            inputs: [list(int(1))],
            output: int(1)
        },
        {
            description: "can get ConstrData tag through switch",
            main: `testing data_switch_constr_tag
            func main(a: Data) -> Int {
                a.switch{
                    ConstrData{tag, _} => {
                        tag
                    },
                    else => error("expected constrData")
                }
            }`,
            inputs: [constr(1)],
            output: int(1)
        }
    ])
})
