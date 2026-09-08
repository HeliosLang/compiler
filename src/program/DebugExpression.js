import {
    makeErrorCollector,
    makeSource,
    makeTokenReader,
    makeTokenizer,
    makeWord
} from "@helios-lang/compiler-utils"
import { $, compile } from "@helios-lang/ir"
import { ToIRContext } from "../codegen/index.js"
import { debugScopes } from "../expressions/DebugScope.js"
import { IR_PARSE_OPTIONS } from "../parse/index.js"
import { ParseContext } from "../parse/ParseContext.js"
import { parseValueExpr } from "../parse/parseValueExpr.js"
import { ModuleCollection } from "./ModuleCollection.js"

/**
 * Compile a watch expression against the lexical scope of an original source site.
 * Parameters use native CEK representations, avoiding lossy Data round trips.
 * @param {import('./Program.js').Program} program
 * @param {string} expression
 * @param {{file: string, line: number, column: number}} location
 * @param {string[]} names
 */
export function compileDebugExpression(program, expression, location, names) {
    const candidates = (debugScopes.get(program.errors) ?? []).filter(
        ({ site }) =>
            site.file == location.file &&
            site.line == location.line &&
            site.column == location.column
    )
    const selected = candidates[candidates.length - 1]
    if (!selected) throw new Error("No lexical scope at this source location")
    const errors = makeErrorCollector()
    const tokens = makeTokenizer(makeSource(expression), {
        errorCollector: errors
    }).tokenize()
    if (!tokens.length) throw new Error("Enter a Helios expression")
    const reader = makeTokenReader({ tokens, errors })
    const expr = parseValueExpr(new ParseContext(reader), 0)
    errors.throw()
    const result = expr.eval({ errors }, selected.scope)
    errors.throw()
    const type = result.asTyped?.type.toString()
    if (!type) throw new Error("Expression must return a value")
    const parameters = names.map((name) => {
        const word = makeWord({ value: name })
        const entity = selected.scope.has(word)
            ? selected.scope.get(word)
            : undefined
        return entity?.asNamed?.path ?? name
    })
    const ctx = new ToIRContext({
        optimize: false,
        isTestnet: program.isForTestnet,
        makeParamsSubstitutable: false
    })
    const modules = new ModuleCollection([
        ...program.entryPoint.mainImportedModules,
        program.entryPoint.mainModule
    ])
    let ir = expr.toIR(ctx)
    const defs = modules.fetchDefinitions(ctx, ir, () => false)
    ir = modules.wrap(ctx, ir, defs)
    // The explicit outer parameters also bind runtime ScriptContext dependencies.
    for (let i = parameters.length - 1; i >= 0; i--)
        ir = $`(${parameters[i]}) -> {${ir}}`
    return {
        program: compile(ir, {
            optimize: false,
            parseOptions: IR_PARSE_OPTIONS
        }),
        type
    }
}
