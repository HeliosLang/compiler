//@ts-check
// IR AST build functions

import {
    assert,
    assertDefined
 } from "./utils.js";

import {
    BoolLiteral,
    ByteArrayLiteral,
    IntLiteral,
    StringLiteral,
    Token,
    Word
} from "./tokens.js";

import {
	UplcData
} from "./uplc-data.js";

import {
    UplcBool,
    UplcByteArray,
	UplcDataValue,
    UplcInt,
    UplcString,
    UplcUnit
} from "./uplc-ast.js";

import {
	IRScope,
	IRVariable
} from "./ir-context.js";

/**
 * @typedef {import("./ir-ast.js").IRExpr} IRExpr
 */

import {
    IRFuncExpr,
	IRCallExpr,
	IRErrorExpr,
    IRLiteralExpr,
    IRNameExpr
} from "./ir-ast.js";

/**
 * Build an Intermediate Representation expression
 * @param {Token[]} ts 
 * @returns {IRExpr}
 * @internal
 */
export function buildIRExpr(ts) {
	/** @type {null | IRExpr} */
	let expr = null;

	while (ts.length > 0) {
		let t = ts.shift();

		if (t === undefined) {
			throw new Error("unexpected: no tokens");
		} else {
			if (t.isGroup("(") && ts.length > 0 && ts[0].isSymbol("->")) {
				assert(expr === null, "shouldn't be preceded by an expr");

				ts.unshift(t);

				expr = buildIRFuncExpr(ts);
			} else if (t.isGroup("(")) {
				let group = assertDefined(t.assertGroup(), "should be a group");

				if (expr === null) {
					if (group.fields.length == 1) {
						expr = buildIRExpr(group.fields[0])
					} else if (group.fields.length == 0) {
						expr = new IRLiteralExpr(new UplcUnit(t.site));
					} else {
						group.syntaxError("unexpected parentheses with multiple fields");
					}
				} else {
					let args = [];
					for (let f of group.fields) {
						args.push(buildIRExpr(f));
					}

					expr = new IRCallExpr(t.site, expr, args);
				}
			} else if (t.isSymbol("-")) {
				// only makes sense next to IntegerLiterals
				let int = assertDefined(ts.shift(), "expected digit after '-'");
				if (int instanceof IntLiteral) {
					expr = new IRLiteralExpr(new UplcInt(int.site, int.value * (-1n)));
				} else {
					throw int.site.typeError(`expected literal int, got ${int}`);
				}
			} else if (t instanceof BoolLiteral) {
				assert(expr === null);
				expr = new IRLiteralExpr(new UplcBool(t.site, t.value));
			} else if (t instanceof IntLiteral) {
				assert(expr === null);
				expr = new IRLiteralExpr(new UplcInt(t.site, t.value));
			} else if (t instanceof ByteArrayLiteral) {
				assert(expr === null);
				if (t.bytes.length == 0 && ts[0] != undefined && ts[0] instanceof ByteArrayLiteral) {
					// literal data is ##<...>
					const next = assertDefined(ts.shift(), "expected hexadecimal bytestring after '##'");

					if (next instanceof ByteArrayLiteral) {
						expr = new IRLiteralExpr(new UplcDataValue(next.site, UplcData.fromCbor(next.bytes)));
					} else {
						throw new Error("unexpected token after '##'");
					}
				} else {
					expr = new IRLiteralExpr(new UplcByteArray(t.site, t.bytes));
				}
			} else if (t instanceof StringLiteral) {
				assert(expr === null);
				expr = new IRLiteralExpr(new UplcString(t.site, t.value));
			} else if (t.isWord("error")) {
				assert(expr === null, "unexpected expr before 'error'");

				let maybeGroup = ts.shift();
				if (maybeGroup === undefined) {
					throw t.site.syntaxError("expected parens after error");
				} else {
					assertDefined(maybeGroup.assertGroup("(", 0), "expected empty parens after 'error'");
					
					expr = new IRErrorExpr(t.site, "");
				}
			} else if (t.isWord()) {
				const w = assertDefined(t.assertWord(), "expected word");

				if (expr !== null) {
					throw new Error(`unexpected expr '${expr.toString()}' before word '${w.value}'`);
				}

				expr = new IRNameExpr(w);
			} else {
				throw new Error("unhandled untyped token " + t.toString());
			}
		}
	}

	if (expr === null) {
		throw new Error("expr is null");
	} else {
		return expr;
	}
}

/**
 * Build an IR function expression
 * @param {Token[]} ts 
 * @returns {IRFuncExpr}
 */
function buildIRFuncExpr(ts) {
	let maybeParens = ts.shift();
	if (maybeParens === undefined) {
		throw new Error("empty func expr");
	} else {
		let parens = assertDefined(maybeParens.assertGroup("("));

		assertDefined(ts.shift()).assertSymbol("->");
		let braces = assertDefined(assertDefined(ts.shift()).assertGroup("{"));

		/**
		 * @type {Word[]}
		 */
		let argNames = [];

		for (let f of parens.fields) {
			assert(f.length == 1, "expected single word per arg");
			argNames.push(assertDefined(f[0].assertWord()));
		}

		if (braces.fields.length > 1) {
			throw braces.syntaxError("unexpected comma in function body")
		} else if (braces.fields.length == 0) {
			throw braces.syntaxError("empty function body")
		}

		let bodyExpr = buildIRExpr(braces.fields[0]);

		return new IRFuncExpr(parens.site, argNames.map(a => new IRVariable(a)), bodyExpr)
	}
}