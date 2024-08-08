import { describe, it } from "node:test"
import { True, int, False, list, compileForRun } from "./utils.js"

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

    describe("Iterator[Int].is_empty", () => {
        const runner = compileForRun(`testing list_iterator_is_empty
        func main(a: []Int) -> Bool {
            a.to_iterator().is_empty()
        }`)

        it("empty list converted to iterator is also empty", () => {
            runner([list()], True)
        })
    })

    describe("Iterator[Int].any", () => {
        const runner = compileForRun(`testing list_iterator_any
        func main(a: []Int, b: Int) -> Bool {
            a.to_iterator().any((i: Int) -> {i == b})
        }`)

        it("some list iterator entries match", () => {
            runner([list(int(10), int(11)), int(11)], True)
        })

        it("no list iterator entries match", () => {
            runner([list(int(10), int(11)), int(0)], False)
        })
    })

    describe("Iterator[Int].all", () => {
        const runner = compileForRun(`testing list_iterator_all
        func main(a: []Int, b: Int) -> Bool {
            a.to_iterator().all((i: Int) -> {i == b})
        }`)

        it("some list iterator entries don't match", () => {
            runner([list(int(10), int(11)), int(10)], False)
        })

        it("some list iterator entries don't match 2", () => {
            runner([list(int(10), int(11)), int(11)], False)
        })

        it("all list iterator entries match", () => {
            runner([list(int(10), int(10)), int(10)], True)
        })
    })
})
