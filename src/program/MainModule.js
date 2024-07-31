import { CompilerError, Source, Word } from "@helios-lang/compiler-utils"
import { FuncStatement, Statement } from "../statements/index.js"
import { Module } from "./Module.js"

/**
 * The entrypoint module
 */
export class MainModule extends Module {
    /**
     * @param {Word} name
     * @param {Statement[]} statements
     * @param {Source} src
     */
    constructor(name, statements, src) {
        super(name, statements, src)
    }

    /**
     * @type {FuncStatement}
     */
    get mainFunc() {
        for (let s of this.statements) {
            if (s.name.value == "main") {
                if (!(s instanceof FuncStatement)) {
                    throw CompilerError.type(
                        s.site,
                        "'main' isn't a function statement"
                    )
                } else {
                    return s
                }
            }
        }

        throw new Error(
            "'main' not found (is a module being used as an entrypoint?)"
        )
    }
}
