import { makeWord, group, intlit, symbol } from "@helios-lang/compiler-utils"
import {
    DataField,
    EnumMember,
    EnumStatement,
    ImplDefinition
} from "../statements/index.js"
import { ParseContext } from "./ParseContext.js"
import { anyImplKeyword, parseImplDefinition } from "./parseImplDefinition.js"
import { anyName, parseName } from "./parseName.js"
import { createSelfTypeExpr } from "./parseStructStatement.js"
import { parseTypeParameters } from "./parseTypeParameters.js"
import { parseDataFields } from "./parseDataFields.js"

const MAX_CONSTR_INDEX = 4294967295

/**
 * @param {ParseContext} ctx
 * @returns {EnumStatement}
 */
export function parseEnumStatement(ctx) {
    const r = ctx.reader
    const name = parseName(ctx)
    const parameters = parseTypeParameters(ctx)
    const selfTypeExpr = createSelfTypeExpr(name, parameters)

    /**
     * @type {EnumMember[]}
     */
    let members = []

    let impl = new ImplDefinition(selfTypeExpr, [])

    let m

    if ((m = r.matches(group("{", { length: 1 })))) {
        const fr = m.fields[0]

        const dataReader = fr.readUntil(anyImplKeyword)

        members = parseEnumMembers(ctx.atSite(m.site).withReader(dataReader))

        impl = parseImplDefinition(
            ctx.atSite(m.site).withReader(fr),
            selfTypeExpr
        )
    } else {
        r.endMatch()
    }

    return new EnumStatement(ctx.currentSite, name, parameters, members, impl)
}

/**
 * @param {ParseContext} ctx
 * @returns {EnumMember[]}
 */
function parseEnumMembers(ctx) {
    const r = ctx.reader

    /**
     * @type {EnumMember[]}
     */
    const members = []
    let constrIndex = -1

    while (!r.isEof()) {
        let m

        if ((m = r.matches(intlit(), symbol(":")))) {
            const nextConstrIndexBI = m[0].value

            if (nextConstrIndexBI > BigInt(MAX_CONSTR_INDEX)) {
                ctx.errors.syntax(
                    m[0].site,
                    `custom enum variant constr index ${nextConstrIndexBI.toString()} too large (hint: cant be larger than ${MAX_CONSTR_INDEX})`
                )
                constrIndex += 1 // fallback
            } else if (nextConstrIndexBI < 0n) {
                ctx.errors.syntax(
                    m[0].site,
                    `custom enum variant constr index can't be negative`
                )
                constrIndex += 1 // fallback
            } else if (nextConstrIndexBI <= BigInt(constrIndex)) {
                ctx.errors.syntax(
                    m[0].site,
                    `enum variant constr index not increasing`
                )
                constrIndex += 1 // fallback
            } else {
                constrIndex = Number(nextConstrIndexBI)
            }
        } else {
            r.endMatch(false)
            constrIndex += 1
        }

        let name = makeWord({ value: "Unnamed", site: ctx.currentSite })
        if ((m = r.matches(anyName))) {
            name = m
        } else {
            r.endMatch(true)
            break
        }

        /**
         * @type {DataField[]}
         */
        let fields = []

        if ((m = r.matches(group("{", { length: 1 })))) {
            fields = parseDataFields(ctx.inGroup(m))
        } else {
            r.endMatch(false)
        }

        members.push(new EnumMember(constrIndex, name, fields))
    }

    return members
}
