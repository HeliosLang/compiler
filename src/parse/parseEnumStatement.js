import { Word, group } from "@helios-lang/compiler-utils"
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

    while (!r.isEof()) {
        let name = new Word("Unnamed", ctx.currentSite)

        let m

        if ((m = r.matches(anyName))) {
            name = m
        } else {
            r.endMatch(false)
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

        members.push(new EnumMember(name, fields))
    }

    return members
}
