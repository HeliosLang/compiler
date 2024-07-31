import { CompilerError, Source, Word } from "@helios-lang/compiler-utils"
import { ModuleScope, builtinNamespaces } from "../scopes/index.js"
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
    /**
     * @readonly
     * @type {Word}
     */
    name

    /**
     * @type {Statement[]}
     */
    #statements

    /**
     * @readonly
     * @type {Source}
     */
    sourceCode

    /**
     * @param {Word} name
     * @param {Statement[]} statements
     * @param {Source} sourceCode
     */
    constructor(name, statements, sourceCode) {
        this.name = name
        this.#statements = statements

        this.#statements.forEach((s) =>
            s.setBasePath(`__module__${this.name.toString()}`)
        )

        this.sourceCode = sourceCode
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

                    if (mn in builtinNamespaces) {
                        if (m) {
                            throw CompilerError.syntax(
                                m.name.site,
                                "reserved module name"
                            )
                        } else {
                            continue
                        }
                    }

                    if (!m) {
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
         * @type {[string, {statements: Statement[]}][]}
         */
        const stack = [[this.name.value, this]]

        let head = stack.pop()

        while (head) {
            const [path, stmnt] = head

            stmnt.statements.forEach((statement) => {
                const path_ = `${path}::${statement.name.value}`
                if (statement instanceof ConstStatement) {
                    callback(path_, statement)
                } else {
                    stack.push([path_, statement])
                }
            })

            head = stack.pop()
        }
    }
}
