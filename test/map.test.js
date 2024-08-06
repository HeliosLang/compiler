import { describe } from "node:test"
import { compileAndRunMany, True, map, int, False } from "./utils.js"

describe("Map", () => {
    const mapEqScript = `testing map_eq
    func main(a: Map[Int]Int, b: Map[Int]Int) -> Bool {
        a == b
    }`

    const mapAllKeysGtScript = `testing map_all_keys_gt
    func main(a: Map[Int]Int, gt: Int) -> Bool {
        a.all_keys((k: Int) -> {k > gt})
    }`

    const mapAllValuesGtScript = `testing map_all_values_gt
    func main(a: Map[Int]Int, gt: Int) -> Bool {
        a.all_values((v: Int) -> {v > gt})
    }`

    const mapAnyKeyScript = `testing map_any_key
    func main(a: Map[Int]Int, k: Int) -> Bool {
        a.any_key((k_: Int) -> {k_ == k})
    }`

    const mapAnyValueScript = `testing map_any_value
    func main(a: Map[Int]Int, k: Int) -> Bool {
        a.any_value((k_: Int) -> {k_ == k})
    }`

    compileAndRunMany([
        {
            description: "{1: 1} == {1: 1} is true",
            main: mapEqScript,
            inputs: [map([[int(1), int(1)]]), map([[int(1), int(1)]])],
            output: True
        },
        {
            description: "{1: 1} == {1: 2} is false",
            main: mapEqScript,
            inputs: [map([[int(1), int(1)]]), map([[int(1), int(2)]])],
            output: False
        },
        {
            description: "all_keys of {1: 1, 2: 2} > 2 is false",
            main: mapAllKeysGtScript,
            inputs: [
                map([
                    [int(1), int(1)],
                    [int(2), int(2)]
                ]),
                int(2)
            ],
            output: False
        },
        {
            description: "all_keys of {1: 1, 2: 2} > 0 is true",
            main: mapAllKeysGtScript,
            inputs: [
                map([
                    [int(1), int(1)],
                    [int(2), int(2)]
                ]),
                int(0)
            ],
            output: True
        },
        {
            description: "all_values of {1: 1, 2: 2} > 2 is false",
            main: mapAllValuesGtScript,
            inputs: [
                map([
                    [int(1), int(1)],
                    [int(2), int(2)]
                ]),
                int(2)
            ],
            output: False
        },
        {
            description: "any_key of {1: 1, 2: 2} is 3 is false",
            main: mapAnyKeyScript,
            inputs: [
                map([
                    [int(1), int(1)],
                    [int(2), int(2)]
                ]),
                int(3)
            ],
            output: False
        },
        {
            description: "any_key of {1: 1, 2: 2, 3: 3} is 3 is true",
            main: mapAnyKeyScript,
            inputs: [
                map([
                    [int(1), int(1)],
                    [int(2), int(2)],
                    [int(3), int(3)]
                ]),
                int(3)
            ],
            output: True
        },
        {
            description: "any_value of {1: 1, 2: 2} is 3 is false",
            main: mapAnyValueScript,
            inputs: [
                map([
                    [int(1), int(1)],
                    [int(2), int(2)]
                ]),
                int(3)
            ],
            output: False
        },
        {
            description: "any_value of {1: 1, 2: 2, 3: 3} is 3 is true",
            main: mapAnyValueScript,
            inputs: [
                map([
                    [int(1), int(1)],
                    [int(2), int(2)],
                    [int(3), int(3)]
                ]),
                int(3)
            ],
            output: True
        }
    ])
})
