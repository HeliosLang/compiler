import { describe } from "node:test"
import {
    compileAndRunMany,
    True,
    map,
    int,
    False,
    bytes,
    list
} from "./utils.js"

describe("Iterator", () => {
    const listIteratorIsEmptyScript = `testing list_iterator_is_empty
    func main(a: []Int) -> Bool {
        a.to_iterator().is_empty()
    }`

    const listIteratorAnyScript = `testing list_iterator_any
    func main(a: []Int, b: Int) -> Bool {
        a.to_iterator().any((i: Int) -> {i == b})
    }`

    const listIteratorAllScript = `testing list_iterator_all
    func main(a: []Int, b: Int) -> Bool {
        a.to_iterator().all((i: Int) -> {i == b})
    }`

    compileAndRunMany([
        {
            description: "empty list converted to iterator is also empty",
            main: listIteratorIsEmptyScript,
            inputs: [list()],
            output: True
        },
        {
            description: "some list iterator entries match",
            main: listIteratorAnyScript,
            inputs: [list(int(10), int(11)), int(11)],
            output: True
        },
        {
            description: "no list iterator entries match",
            main: listIteratorAnyScript,
            inputs: [list(int(10), int(11)), int(0)],
            output: False
        },
        {
            description: "some list iterator entries don't",
            main: listIteratorAllScript,
            inputs: [list(int(10), int(11)), int(10)],
            output: False
        },
        {
            description: "some list iterator entries don't",
            main: listIteratorAllScript,
            inputs: [list(int(10), int(11)), int(11)],
            output: False
        },
        {
            description: "all list iterator entries match",
            main: listIteratorAllScript,
            inputs: [list(int(10), int(10)), int(10)],
            output: True
        }
    ])
})
