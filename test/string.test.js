import { describe, it } from "node:test"
import { False, True, compileForRun, str } from "./utils.js"

describe("String", () => {
    describe("String == String", () => {
        const runner1 = compileForRun(`
        testing string_eq_self
        func main(a: String) -> Bool {
            a == a
        }`)

        it("(x == x) == true", () => {
            runner1([str("hello")], True)
        })

        const runner2 = compileForRun(`
        testing string_eq
        func main(a: String, b: String) -> Bool {
            a == b
        }`)

        it("\"Hello\" is same as \"Hello\"", () => {
            runner2([str("Hello"), str("Hello")], True)
        })

        it("\"Hello\" is not same as \"hello\"", () => {
            runner2([str("Hello"), str("hello")], False)
        })
    })

    describe("String != String", () => {
        const runner1 = compileForRun(`
        testing string_neq_self
        func main(a: String) -> Bool {
            a != a
        }`)

        it("(x != x) == false", () => {
            runner1([str("Hello")], False)
        })

        const runner2 = compileForRun(`
        testing string_neq_2
        func main(a: String, b: String) -> Bool {
            a != b
        }`)

        it("\"Hello\" != \"Hello\" is false", () => {
            runner2([str("Hello"), str("Hello")], False)
        })

        it("\"Hello\" != \"hello\" is true", () => {
            runner2([str("Hello"), str("hello")], True)
        })
    })

    describe("String + String", () => {
        const runner1 = compileForRun(`
        testing string_add_empty
        func main(a: String) -> String {
            a + ""
        }`)

        it("\"Hello\" + empty string is \"Hello\"", () => {
            runner1([str("Hello")], str("Hello"))
        })

        it("\"\" + empty string is \"\"", () => {
            runner1([str("")], str(""))
        })

        const runner2 = compileForRun(`
        testing empty_add_string
        func main(a: String) -> String {
            "" + a
        }`)

        it("empty string + \"Hello\" is \"Hello\"", () => {
            runner2([str("Hello")], str("Hello"))
        })

        it("empty string + \"\" is \"\"", () => {
            runner2([str("")], str(""))
        })

        const runner3 = compileForRun(`
        testing string_add_2
        func main(a: String, b: String) -> String {
            a + b
        }`)

        it("\"Hello\" + \" World\" is \"Hello World\"", () => {
            runner3([str("Hello"), str(" World")], str("Hello World"))
        })
    })

    describe("String.starts_with", () => {
        const runner1 = compileForRun(`
        testing string_starts_with_1
        func main(a: String, b: String) -> Bool {
            (a+b).starts_with(a)
        }`)

        it("empty string always starts with self", () => {
            runner1([str(""), str("a")], True)
        })
        
        it("non-empty string always starts with self", () => {
            runner1([str("abc"), str("def")], True)
        })

        const runner2 = compileForRun(`
        testing string_starts_with_2
        func main(a: String, b: String) -> Bool {
            (a+b).starts_with(b)
        }`)

        it("only empty string added to other starts with other", () => {
            runner1([str(""), str("Hello")], True)
        })
    })
})