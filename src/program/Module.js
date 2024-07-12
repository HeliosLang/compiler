import { CompilerError, Word } from "@helios-lang/compiler-utils"
import { parseScript } from "../parse/index.js"
import { ModuleScope } from "../scopes/index.js"
import {
    ConstStatement,
    ImportFromStatement,
    ImportModuleStatement,
    Statement
} from "../statements/index.js"

/**
 * A Module is a collection of statements
 */
export class Module {
    #name
    #statements

    /**
     * @param {Word} name
     * @param {Statement[]} statements
     */
    constructor(name, statements) {
        this.#name = name
        this.#statements = statements

        this.#statements.forEach((s) =>
            s.setBasePath(`__module__${this.#name.toString()}`)
        )
    }

    /**
     * @param {string} rawSrc
     * @returns {Module}
     */
    static new(rawSrc) {
        const { purpose, name, statements, errors } = parseScript(rawSrc)

        errors.throw()

        if (name !== null) {
            return new Module(name, statements)
        } else {
            throw new Error("unexpected") // should've been caught by calling src.throwErrors() above
        }
    }

    /**
     * @type {Word}
     */
    get name() {
        return this.#name
    }

    /**
     * @type {Statement[]}
     */
    get statements() {
        return this.#statements.slice()
    }

    /**
     * @returns {string}
     */
    toString() {
        return this.#statements.map((s) => s.toString()).join("\n")
    }

    /**
     * @param {ModuleScope} scope
     */
    evalTypes(scope) {
        for (let s of this.statements) {
            s.eval(scope)
        }
    }

    /**
     * This module can depend on other modules
     * TODO: detect circular dependencies
     * @param {Module[]} modules
     * @param {Module[]} stack
     * @returns {Module[]}
     */
    filterDependencies(modules, stack = []) {
        /**
         * @type {Module[]}
         */
        let deps = []

        /** @type {Module[]} */
        let newStack = [this]
        newStack = newStack.concat(stack)

        for (let s of this.#statements) {
            if (
                s instanceof ImportFromStatement ||
                s instanceof ImportModuleStatement
            ) {
                let mn = s.moduleName.value

                if (mn == this.name.value) {
                    throw CompilerError.syntax(s.site, "can't import self")
                } else if (stack.some((d) => d.name.value == mn)) {
                    throw CompilerError.syntax(
                        s.site,
                        "circular import detected"
                    )
                }

                // if already in deps, then don't add (because it will have been added before along with all its dependencies)
                if (!deps.some((d) => d.name.value == mn)) {
                    let m = modules.find((m) => m.name.value == mn)

                    if (m === undefined) {
                        throw CompilerError.reference(
                            s.site,
                            `module '${mn}' not found`
                        )
                    } else {
                        // only add deps that weren't added before
                        let newDeps = m
                            .filterDependencies(modules, newStack)
                            .concat([m])
                            .filter(
                                (d) =>
                                    !deps.some(
                                        (d_) => d_.name.value == d.name.value
                                    )
                            )

                        deps = deps.concat(newDeps)
                    }
                }
            }
        }

        return deps
    }

    /**
     *
     * @param {(name: string, statement: ConstStatement) => void} callback
     */
    loopConstStatements(callback) {
        /**
         * @type {{statements: Statement[]}[]}
         */
        const stack = [this]

        let head = stack.pop()

        while (head) {
            head.statements.forEach((statement) => {
                if (statement instanceof ConstStatement) {
                    callback(statement.name.value, statement)
                } else {
                    stack.push(statement)
                }
            })
        }
    }
}
