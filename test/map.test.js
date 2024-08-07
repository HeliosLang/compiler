import { describe } from "node:test"
import { compileAndRunMany, True, map, int, False, list } from "./utils.js"

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

    const mapFoldWithListScript = `testing map_fold_with_list
    func main(a: Map[Int]Int, z0: Int, b: []Int) -> Int {
        a.fold_with_list((z: Int, key: Int, value: Int, item: Int) -> {
            z + (key + value)*item
        }, z0, b)
    }`

    const mapFold2Script = `testing map_fold2
    func main(a: Map[Int]Int) -> Int {
        (ks, vs) = a.fold2((ks: Int, vs: Int, key: Int, value: Int) -> {
            (ks + key, vs + value)
        }, 0, 0);

        ks*vs
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
        },
        {
            description:
                "fold_with_list throws an error if the list is shorter",
            main: mapFoldWithListScript,
            inputs: [
                map([
                    [int(1), int(1)],
                    [int(2), int(2)],
                    [int(3), int(3)]
                ]),
                int(0),
                list(int(1), int(1))
            ],
            output: { error: "" }
        },
        {
            description: "fold_with_list correctly sums",
            main: mapFoldWithListScript,
            inputs: [
                map([
                    [int(1), int(1)],
                    [int(2), int(2)],
                    [int(3), int(3)]
                ]),
                int(0),
                list(int(1), int(1), int(1))
            ],
            output: int(12)
        },
        {
            description:
                "fold_with_list correctly sums even if list is too long",
            main: mapFoldWithListScript,
            inputs: [
                map([
                    [int(1), int(1)],
                    [int(2), int(2)],
                    [int(3), int(3)]
                ]),
                int(0),
                list(int(1), int(1), int(1), int(1))
            ],
            output: int(12)
        },
        {
            description: "fold2 can correctly sums keys and values separately",
            main: mapFold2Script,
            inputs: [
                map([
                    [int(1), int(1)],
                    [int(2), int(2)],
                    [int(3), int(3)]
                ])
            ],
            output: int(36)
        },
        {
            description:
                "fold2 can correctly sums keys and values separately with single entry",
            main: mapFold2Script,
            inputs: [map([[int(1), int(1)]])],
            output: int(1)
        },
        {
            description:
                "fold2 can correctly sums keys and values separately with no entries",
            main: mapFold2Script,
            inputs: [map([])],
            output: int(0)
        }
    ])
})
