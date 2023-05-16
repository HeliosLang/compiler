//@ts-check
// Helios AST building

import {
    Source,
    assert,
    assertDefined,
	reduceNull,
	reduceNullPairs
} from "./utils.js";

/**
 * @typedef {import("./tokens.js").Throw} Throw
 */

import {
    Group,
    Site,
    StringLiteral,
    SymbolToken,
    Token,
    UserError,
    Word,
	assertToken
} from "./tokens.js";

import {
    ScriptPurpose,
    getPurposeName
} from "./uplc-ast.js";

import {
    Tokenizer
} from "./tokenization.js";

import {
    AssignExpr,
    BinaryExpr,
    CallArgExpr,
    CallExpr,
    ChainExpr,
    DataSwitchExpr,
    EnumSwitchExpr,
	Expr,
    FuncArg,
	FuncArgTypeExpr,
    FuncLiteralExpr,
    FuncTypeExpr,
    IfElseExpr,
    DestructExpr,
    ListLiteralExpr,
    ListTypeExpr,
    MapLiteralExpr,
    MapTypeExpr,
    MemberExpr,
    OptionTypeExpr,
    ParensExpr,
	PathExpr,
    PrimitiveLiteralExpr,
    StructLiteralExpr,
    StructLiteralField,
    SwitchCase,
    SwitchDefault,
    RefExpr,
    UnaryExpr,
    UnconstrDataSwitchCase,
	ValuePathExpr,
    VoidExpr,
    VoidTypeExpr,
	ParametricExpr
} from "./helios-ast-expressions.js";

import {
    ConstStatement,
    DataField,
    EnumMember,
    EnumStatement,
    FuncStatement,
    ImplDefinition,
    ImportFromStatement,
    ImportModuleStatement,
    Statement,
    StructStatement,
	TypeParameter,
	TypeParameters
} from "./helios-ast-statements.js";

const AUTOMATIC_METHODS = [
	"__eq",
	"__neq",
	"copy",
	"from_data",
	"serialize"
];

/**
 * @type {null | ((path: StringLiteral) => (string | null))}
 */
let importPathTranslator = null

/**
 * Used by VSCode plugin
 * @param {(path: StringLiteral) => (string | null)} fn 
 */
export function setImportPathTranslator(fn) {
	importPathTranslator = fn
}

/**
 * @package
 * @param {Token[]} ts
 * @returns {Statement[]}
 */
export function buildProgramStatements(ts) {
	/**
	 * @type {Statement[]}
	 */
	let statements = [];

	while (ts.length != 0) {
		const t = ts.shift()?.assertWord();

		if (!t) {
			continue;
		}

		const kw = t.value;

		/**
		 * @type {Statement | (Statement | null)[] | null}
		 */
		let s = null;

		if (kw == "const") {
			s = buildConstStatement(t.site, ts);
		} else if (kw == "struct") {
			s = buildStructStatement(t.site, ts);
		} else if (kw == "func") {
			s = buildFuncStatement(t.site, ts);
		} else if (kw == "enum") {
			s = buildEnumStatement(t.site, ts);
		} else if (kw == "import") {
			s = buildImportStatements(t.site, ts);
		} else {
			t.syntaxError(`invalid top-level keyword '${kw}'`);
		}

		if (s) {
			if (Array.isArray(s)) {
				for (let s_ of s) {
					if (s_) {
						statements.push(s_);
					}
				}
			} else {
				statements.push(s);
			}
		}
	}

	return statements;
}

/**
 * @package
 * @param {Token[]} ts
 * @param {null | number} expectedPurpose
 * @returns {[number, Word] | null} - [purpose, name] (ScriptPurpose is an integer)
 * @package
 */
export function buildScriptPurpose(ts, expectedPurpose = null) {
	// need at least 2 tokens for the script purpose
	if (ts.length < 2) {

		if (ts.length == 0) {
			Site.dummy().syntaxError("invalid script purpose syntax");
		} else {
			ts[0].syntaxError("invalid script purpose syntax");
			ts.splice(0);
		}

		return null;
	}

	const purposeWord = ts.shift()?.assertWord();

	if (!purposeWord) {
		return null;
	}

	/**
	 * @type {number | null}
	 */
	let purpose = null;

	if (purposeWord.isWord("spending")) {
		purpose = ScriptPurpose.Spending;
	} else if (purposeWord.isWord("minting")) {
		purpose = ScriptPurpose.Minting;
	} else if (purposeWord.isWord("staking")) {
		purpose = ScriptPurpose.Staking;
	} else if (purposeWord.isWord("testing")) { // 'test' is not reserved as a keyword though
		purpose = ScriptPurpose.Testing;
	} else if (purposeWord.isWord("module")) {
		purpose = ScriptPurpose.Module;
	} else if (purposeWord.isKeyword()) {
		purposeWord.syntaxError(`script purpose missing`);

		ts.unshift(purposeWord);

		return null;
	} else {
		purposeWord.syntaxError(`unrecognized script purpose '${purposeWord.value}' (expected 'testing', 'spending', 'staking', 'minting' or 'module')`);
		purpose = -1;
	}

	if (expectedPurpose !== null && purpose !== null) {
		if (expectedPurpose != purpose) {
			purposeWord.syntaxError(`expected '${getPurposeName(purpose)}' script purpose`);
		}
	}

	const name = assertToken(ts.shift(), purposeWord.site)?.assertWord()?.assertNotKeyword();

	if (!name) {
		return null;
	}

	if (name.value === "main") {
		name.syntaxError(`${purposeWord.value} script can't be named 'main'`);
	}

	return [purpose, name];
}

/**
 * Also used by VSCode plugin
 * @param {Token[]} ts 
 * @param {number | null} expectedPurpose 
 * @returns {[number | null, Word | null, Statement[], number]}
 */
export function buildScript(ts, expectedPurpose = null) {
	const first = ts[0];

	const purposeName = buildScriptPurpose(ts, expectedPurpose);

	const statements = buildProgramStatements(ts);

	let mainIdx = -1;

	const [purpose, name] = purposeName !== null ? purposeName : [null, null];

	if (purpose != ScriptPurpose.Module) {
		mainIdx = statements.findIndex(s => s.name.value === "main");

		if (mainIdx == -1) {
			if (name !== null) {
				first.site.merge(name.site).syntaxError("entrypoint 'main' not found");
			} else {
				first.site.syntaxError("entrypoint 'main' not found");
			}
		}
	}

	return [purpose, name, statements, mainIdx];
}

/**
 * Parses Helios quickly to extract the script purpose header.
 * Returns null if header is missing or incorrectly formed (instead of throwing an error)
 * @param {string} rawSrc 
 * @returns {?[string, string]} - [purpose, name]
 */
export function extractScriptPurposeAndName(rawSrc) {
	try {
		let src = new Source(rawSrc);

		let tokenizer = new Tokenizer(src);

		let gen = tokenizer.streamTokens();

		// Don't parse the whole script, just 'eat' 2 tokens: `<purpose> <name>`
		let ts = [];
		for (let i = 0; i < 2; i++) {
			let yielded = gen.next();
			if (yielded.done) {
				return null;
			}

			ts.push(yielded.value);
		}

		const purposeName = buildScriptPurpose(ts);

		src.throwErrors();

		if (purposeName !== null) {
			const [purpose, name] = purposeName;

			return [getPurposeName(purpose), name.value];
		} else {
			throw new Error("unexpected"); // should've been caught above by calling src.throwErrors()
		}
	} catch (e) {
		if (!(e instanceof UserError)) {
			throw e;
		} else {
			return null;
		}
	}
}

/**
 * @package
 * @param {Site} site 
 * @param {Token[]} ts 
 * @returns {ConstStatement | null}
 */
function buildConstStatement(site, ts) {
	if (ts.length == 0) {
		site.syntaxError("invalid syntax (expected name after 'const')");
		return null;
	}

	const name = assertToken(ts.shift(), site)?.assertWord()?.assertNotKeyword();

	if (!name) {
		return null;
	}

	let typeExpr = null;

	if (ts.length > 0 && ts[0].isSymbol(":")) {
		const colon = assertDefined(ts.shift());

		const equalsPos = SymbolToken.find(ts, "=");

		if (equalsPos == -1) {
			ts.unshift(colon);
			site.merge(ts[ts.length-1].site).syntaxError("invalid syntax (expected '=' after 'const')");
			ts.splice(0);
			return null;
		} else if (equalsPos == 0) {
			colon.site.merge(ts[0].site).syntaxError("expected type expression between ':' and '='");
			ts.shift();
			return null;
		}

		typeExpr = buildTypeExpr(colon.site, ts.splice(0, equalsPos));
	}

	const maybeEquals = ts.shift();

	if (maybeEquals === undefined) {
		site.merge(name.site).syntaxError("expected '=' after 'const'");
		ts.splice(0);
		return null;
	} else if (!maybeEquals.isSymbol("=")) {
		site.merge(maybeEquals.site).syntaxError("expected '=' after 'const'");
		return null;
	} else {
		const equals = maybeEquals.assertSymbol("=");

		if (!equals) {
			return null;
		}

		const nextStatementPos = Word.find(ts, ["const", "func", "struct", "enum", "import"]);

		const tsValue = nextStatementPos == -1 ? ts.splice(0) : ts.splice(0, nextStatementPos);

		if (tsValue.length == 0) {
			equals.syntaxError("expected expression after '='");
			return null;
		} else {
			const endSite = tsValue[tsValue.length-1].site;

			const valueExpr = buildValueExpr(tsValue);

			if (valueExpr === null) {
				return null;
			} else {
				return new ConstStatement(site.merge(endSite), name, typeExpr, valueExpr);
			}
		}
	}
}

/**
 * @param {Site} site 
 * @param {Token[]} ts 
 * @returns {RefExpr | null}
 */
function buildTypeClassExpr(site, ts) {
	const name = assertToken(ts.shift(), site, "expected word")?.assertWord()?.assertNotKeyword();
	if (!name) {
		return null;
	}

	return new RefExpr(name);
}

/**
 * @param {Site} site 
 * @param {Token[]} ts 
 * @returns {null | TypeParameter}
 */
function buildTypeParameter(site, ts) {
	const name = assertToken(ts.shift(), site, "expected type parameter name")?.assertWord()?.assertNotKeyword() ?? null;
	if (!name) {
		return null;
	}

	const maybeColon = ts.shift();
	if (!maybeColon) {
		return new TypeParameter(name, null);
	}

	const colon = maybeColon.assertSymbol(":");
	if (!colon) {
		return null;
	}

	const typeClassExpr = buildTypeClassExpr(site, ts);
	if (!typeClassExpr) {
		return null;
	}

	if (ts.length > 0) {
		ts[0].syntaxError("unexpected token");
		return null;
	}

	return new TypeParameter(name, typeClassExpr);
}

/**
 * @param {Token[]} ts 
 * @param {boolean} isForFunc
 * @returns {TypeParameters}
 */
function buildTypeParameters(ts, isForFunc) {
	if (ts.length > 0 && ts[0].isGroup("[")) {
		const brackets = assertDefined(ts.shift()).assertGroup("[");

		if (brackets) {
			/**
			 * @type {TypeParameter[] | null}
			 */
			const params = reduceNull(brackets.fields.map(fts => {
				return buildTypeParameter(brackets.site, fts);
			}));

			if (params) {
				return new TypeParameters(params, isForFunc);
			}			
		}
	}

	return new TypeParameters([], isForFunc);
}

/**
 * @package
 * @param {Token[]} ts
 * @returns {[Token[], Token[]]}
 */
function splitDataImpl(ts) {
	const implPos = Word.find(ts, ["const", "func"]);

	if (implPos == -1) {
		return [ts, []];
	} else {
		return [ts.slice(0, implPos), ts.slice(implPos)];
	}
}


/**
 * @package
 * @param {Site} site 
 * @param {Token[]} ts 
 * @returns {StructStatement | null}
 */
function buildStructStatement(site, ts) {
	const maybeName = assertToken(ts.shift(), site, "expected name after 'struct'");
	if (!maybeName) {
		return null;
	}

	const name = maybeName.assertWord()?.assertNotKeyword();
	if (!name) {
		return null;
	}

	const parameters = buildTypeParameters(ts, false);

	const maybeBraces = assertToken(ts.shift(), name.site, `expected '{...}' after 'struct ${name.toString()}'`);
	if (!maybeBraces) {
		return null;
	}

	if (!maybeBraces.isGroup("{", 1)) {
		maybeBraces.syntaxError("expected non-empty '{..}' without separators");
		return null;
	}

	const braces = maybeBraces.assertGroup("{", 1);

	if (!braces) {
		return null;
	}

	const [tsFields, tsImpl] = splitDataImpl(braces.fields[0]);

	const fields = buildDataFields(tsFields);

	const impl = buildImplDefinition(tsImpl, new RefExpr(name), fields.map(f => f.name), braces.site.endSite);

	if (impl === null) {
		return null;
	} else {
		return new StructStatement(site.merge(braces.site), name, parameters, fields, impl);
	}
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {DataField[]}
 */
function buildDataFields(ts) {
	/** @type {DataField[]} */
	const fields = []

	/**
	 * @param {Word} fieldName
	 */
	function assertUnique(fieldName) {
		if (fields.findIndex(f => f.name.toString() == fieldName.toString()) != -1) {
			fieldName.typeError(`duplicate field \'${fieldName.toString()}\'`);
		}
	}

	while (ts.length > 0) {
		const colonPos = SymbolToken.find(ts, ":");

		if (colonPos == -1) {
			ts[0].site.merge(ts[ts.length-1].site).syntaxError("expected ':' in data field");
			return fields;
		}

		const colon = ts[colonPos];
		const tsBef = ts.slice(0, colonPos);
		const tsAft = ts.slice(colonPos+1);
		const maybeFieldName = tsBef.shift();
		if (maybeFieldName === undefined) {
			colon.syntaxError("expected word before ':'");
			continue;
		} else {
			const fieldName = maybeFieldName?.assertWord()?.assertNotKeyword();

			if (!fieldName) {
				return fields;
			}

			assertUnique(fieldName);

			if (tsAft.length == 0) {
				colon.syntaxError("expected type expression after ':'");
				return fields;
			}

			const nextColonPos = SymbolToken.find(tsAft, ":");

			if (nextColonPos != -1) {
				if (nextColonPos == 0) {
					tsAft[nextColonPos].syntaxError("expected word before ':'");
					return fields;
				}

				void tsAft[nextColonPos-1].assertWord();

				ts = tsAft.splice(nextColonPos-1);
			} else {
				ts = [];
			}

			const typeExpr = buildTypeExpr(colon.site, tsAft);

			if (!typeExpr) {
				return fields;
			}

			fields.push(new DataField(fieldName, typeExpr));
		}
	}

	return fields;
}

/**
 * @package
 * @param {Site} site 
 * @param {Token[]} ts 
 * @param {null | Expr} methodOf - methodOf !== null then first arg can be named 'self'
 * @returns {FuncStatement | null}
 */
function buildFuncStatement(site, ts, methodOf = null) {
	const name = assertToken(ts.shift(), site)?.assertWord()?.assertNotKeyword();

	if (!name) {
		return null;
	}

	if (ts.length == 0) {
		name.site.syntaxError("invalid syntax");
		return null;
	}

	const parameters = buildTypeParameters(ts, true);

	const fnExpr = buildFuncLiteralExpr(ts, methodOf, false);

	if (!fnExpr) {
		return null;
	}

	return new FuncStatement(site.merge(fnExpr.site), name, parameters, fnExpr);
}

/**
 * @package
 * @param {Token[]} ts 
 * @param {null | Expr} methodOf - methodOf !== null then first arg can be named 'self'
 * @param {boolean} allowInferredRetType
 * @returns {FuncLiteralExpr | null}
 */
function buildFuncLiteralExpr(ts, methodOf = null, allowInferredRetType = false) {
	const parens = assertDefined(ts.shift()).assertGroup("(");
	if (!parens) {
		return null;
	}

	const site = parens.site;
	const args = buildFuncArgs(parens, methodOf);

	const arrow = assertToken(ts.shift(), site)?.assertSymbol("->");
	if (!arrow) {
		return null;
	}

	const bodyPos = Group.find(ts, "{");

	if (bodyPos == -1) {
		site.syntaxError("no function body");
		return null;
	} else if (bodyPos == 0 && !allowInferredRetType) {
		site.syntaxError("no return type specified");
	}

	const retTypeExprs = buildFuncRetTypeExprs(arrow.site, ts.splice(0, bodyPos), allowInferredRetType);

	if (retTypeExprs === null) {
		return null;
	}

	const bodyGroup = assertToken(ts.shift(), site)?.assertGroup("{", 1)

	if (!bodyGroup) {
		return null;
	}

	const bodyExpr = buildValueExpr(bodyGroup.fields[0]);

	if (!bodyExpr) {
		return null;
	}

	return new FuncLiteralExpr(site, args, retTypeExprs, bodyExpr);
}

/**
 * @package
 * @param {Group} parens 
 * @param {null | Expr} methodOf - methodOf !== nul then first arg can be named 'self'
 * @returns {FuncArg[]}
 */
function buildFuncArgs(parens, methodOf = null) {
	/** @type {FuncArg[]} */
	const args = [];

	let hasDefaultArgs = false;

	for (let i = 0; i < parens.fields.length; i++) {
		const f = parens.fields[i];
		const ts = f.slice();

		const name = assertToken(ts.shift(), parens.site)?.assertWord();

		if (!name) {
			continue;
		}

		if (name.toString() == "self") {
			if (i != 0 || methodOf === null) {
				name.syntaxError("'self' is reserved");
			} else {
				if (ts.length > 0) {
					if (ts[0].isSymbol(":")) {
						ts[0].syntaxError("unexpected type expression after 'self'");
					} else {
						ts[0].syntaxError("unexpected token");
					}
				} else {
					args.push(new FuncArg(name, methodOf));
				}
			}
		} else if (name.toString() == "_") {
			if (ts.length > 0) {
				if (ts[0].isSymbol(":")) {
					ts[0].syntaxError("unexpected type expression after '_'");
				} else {
					ts[0].syntaxError("unexpected token");
				}
			} else {
				args.push(new FuncArg(name, methodOf));
			}
		} else {
			if (name.isKeyword()) {
				name.syntaxError("unexpected keyword");
			}

			for (let prev of args) {
				if (prev.name.toString() == name.toString()) {
					name.syntaxError(`duplicate argument '${name.toString()}'`);
				}
			}

			const maybeColon = ts.shift();
			if (maybeColon === undefined) {
				name.syntaxError(`expected ':' after '${name.toString()}'`);
			} else {
				const colon = maybeColon.assertSymbol(":");

				if (!colon) {
					continue;
				}

				const equalsPos = SymbolToken.find(ts, "=");

				/**
				 * @type {null | Expr}
				 */
				let defaultValueExpr = null;

				if (equalsPos != -1) {
					if (equalsPos == ts.length-1) {
						ts[equalsPos].syntaxError("expected expression after '='");
					} else {
						const vts = ts.splice(equalsPos);

						vts.shift()?.assertSymbol("=");
						
						defaultValueExpr = buildValueExpr(vts);

						hasDefaultArgs = true;
					}
				} else {
					if (hasDefaultArgs) {
						name.syntaxError("positional args must come before default args");
					}
				}

				/**
				 * @type {null | Expr}
				 */
				let typeExpr = null;

				if (ts.length == 0) {
					colon.syntaxError("expected type expression after ':'");
				} else {
					typeExpr = buildTypeExpr(colon.site, ts);
				}

				args.push(new FuncArg(name, typeExpr, defaultValueExpr));
			}
		}
	}

	return args;
}

/**
 * @package
 * @param {Site} site 
 * @param {Token[]} ts 
 * @returns {EnumStatement | null}
 */
function buildEnumStatement(site, ts) {
	const name = assertToken(ts.shift(), site, "expected word after 'enum'")?.assertWord()?.assertNotKeyword();
	if (!name) {
		return null;
	}

	const parameters = buildTypeParameters(ts, false);

	const braces = assertToken(ts.shift(), name.site, `expected '{...}' after 'enum ${name.toString()}'`)?.assertGroup("{", 1);

	if (!braces) {
		return null;
	}

	const [tsMembers, tsImpl] = splitDataImpl(braces.fields[0]);

	if (tsMembers.length == 0) {
		braces.syntaxError("expected at least one enum member");
	}

	/** @type {EnumMember[]} */
	const members = [];

	while (tsMembers.length > 0) {
		const member = buildEnumMember(tsMembers);

		if (!member) {
			continue;
		}

		members.push(member);
	}

	const impl = buildImplDefinition(tsImpl, new RefExpr(name), members.map(m => m.name), braces.site.endSite);

	if (!impl) {
		return null;
	}

	return new EnumStatement(site.merge(braces.site), name, parameters, members, impl);
}

/**
 * @package
 * @param {Site} site 
 * @param {Token[]} ts 
 * @returns {(ImportFromStatement | ImportModuleStatement | null)[] | null}
 */
function buildImportStatements(site, ts) {
	const t = assertToken(ts.shift(), site, "expected '{...}' or Word after 'import'");
	if (!t) {
		return null;
	}

	if (t.isWord()) {
		const statement = buildImportModuleStatement(site, t);

		if (!statement) {
			return null;
		}

		return [statement];
	} else {
		return buildImportFromStatements(site, t, ts);
	}
}

/**
 * @param {Site} site 
 * @param {Token} maybeName 
 * @returns {ImportModuleStatement | null}
 */
function buildImportModuleStatement(site, maybeName) {
	/**
	 * @type {Word | null}
	 */
	let moduleName = null;

	if (maybeName instanceof StringLiteral && importPathTranslator) {
		const translated = importPathTranslator(maybeName);
		if (!translated) {
			return null;
		}

		moduleName = new Word(maybeName.site, translated);
	} else {
		moduleName = maybeName.assertWord()?.assertNotKeyword() ?? null;
	}

	if (!moduleName) {
		return null;
	}

	return new ImportModuleStatement(site, moduleName);
}

/**
 * 
 * @param {Site} site 
 * @param {Token} maybeBraces 
 * @param {Token[]} ts 
 * @returns {(ImportFromStatement | null)[] | null}
 */
function buildImportFromStatements(site, maybeBraces, ts) {
	const braces = maybeBraces.assertGroup("{");
	if (!braces) {
		return null;
	}

	const maybeFrom = assertToken(ts.shift(), maybeBraces.site, "expected 'from' after 'import {...}'")?.assertWord("from");
	if (!maybeFrom) {
		return null;
	}

	const maybeModuleName = assertToken(ts.shift(), maybeFrom.site, "expected module name after 'import {...} from'");
	if (!maybeModuleName) {
		return null;
	}

	/**
	 * @type {null | undefined | Word}
	 */
	let moduleName = null;

	if (maybeModuleName instanceof StringLiteral && importPathTranslator) {
		const translated = importPathTranslator(maybeModuleName);

		if (!translated) {
			return null;
		}

		moduleName = new Word(maybeModuleName.site, translated);
	} else {
		moduleName = maybeModuleName.assertWord()?.assertNotKeyword();
	}

	if (!moduleName) {
		return null;
	}

	const mName = moduleName;

	if (braces.fields.length === 0) {
		braces.syntaxError("expected at least 1 import field");
	}

	return braces.fields.map(fts => {
		const ts = fts.slice();
		const maybeOrigName = ts.shift();

		if (maybeOrigName === undefined) {
			braces.syntaxError("empty import field");
			return null;
		} else {
			const origName = maybeOrigName.assertWord();

			if (!origName) {
				return null;
			} else if (ts.length === 0) {
				return new ImportFromStatement(site, origName, origName, mName);
			} else {
				const maybeAs = ts.shift();

				if (maybeAs === undefined) {
					maybeOrigName.syntaxError(`expected 'as' or nothing after '${origName.value}'`);
					return null;
				} else {
					maybeAs.assertWord("as");

					const maybeNewName = ts.shift();

					if (maybeNewName === undefined) {
						maybeAs.syntaxError("expected word after 'as'");
						return null;
					} else {
						const newName = maybeNewName.assertWord();

						if (!newName) {
							return null;
						}

						const rem = ts.shift();
						if (rem !== undefined) {
							rem.syntaxError("unexpected token");
							return null;
						} else {
							return new ImportFromStatement(site, newName, origName, mName);
						}
					}
				}
			}
		}
	}).filter(f => f !== null)
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {EnumMember | null}
 */
function buildEnumMember(ts) {
	const name = assertDefined(ts.shift()).assertWord()?.assertNotKeyword();

	if (!name) {
		return null;
	} else if (ts.length == 0 || ts[0].isWord()) {
		return new EnumMember(name, []);
	} else {
		const braces = assertToken(ts.shift(), name.site)?.assertGroup("{", 1);

		if (!braces) {
			return null;
		} else {
			const fields = buildDataFields(braces.fields[0]);

			return new EnumMember(name, fields);
		}
	}
}

/** 
 * @package
 * @param {Token[]} ts 
 * @param {RefExpr} selfTypeExpr - reference to parent type
 * @param {Word[]} fieldNames - to check if impl statements have a unique name
 * @param {?Site} endSite
 * @returns {ImplDefinition | null}
 */
function buildImplDefinition(ts, selfTypeExpr, fieldNames, endSite) {
	/**
	 * @param {Word} name
	 * @returns {boolean}
	 */
	function isNonAuto(name) {
		if (AUTOMATIC_METHODS.findIndex(n => n == name.toString()) != -1) {
			name.syntaxError(`'${name.toString()}' is a reserved member`);
			return false;
		} else {
			return true;
		}
	}

	for (let fieldName of fieldNames) {
		if (!isNonAuto(fieldName)) {
			return null;
		}
	}

	const statements = buildImplMembers(ts, selfTypeExpr);

	/** 
	 * @param {number} i
	 * @returns {boolean} - ok
	 */
	function isUnique(i) {
		let s = statements[i];

		isNonAuto(s.name);

		for (let fieldName of fieldNames) {
			if (fieldName.toString() == s.name.toString()) {
				s.name.syntaxError(`'${s.name.toString()}' is duplicate`);
				return false;
			}
		}

		for (let j = i+1; j < statements.length; j++) {
			if (statements[j].name.toString() == s.name.toString()) {
				statements[j].name.syntaxError(`'${s.name.toString()}' is duplicate`);
				return false;
			}
		}

		return true;
	}

	const n = statements.length;

	for (let i = 0; i < n; i++) {
		if (!isUnique(i)) {
			return null;
		}
	}

	if (n > 0 && endSite !== null) {
		statements[n-1].site.setEndSite(endSite);
	}

	return new ImplDefinition(selfTypeExpr, statements);
}

/**
 * @package
 * @param {Token[]} ts 
 * @param {Expr} methodOf
 * @returns {(ConstStatement | FuncStatement)[]}
 */
function buildImplMembers(ts, methodOf) {
	/** @type {(ConstStatement | FuncStatement)[]} */
	const statements = [];

	while (ts.length != 0) {
		const t = assertDefined(ts.shift()).assertWord();

		if (!t) {
			continue;
		}

		const kw = t.value;

		/**
		 * @type {null | ConstStatement | FuncStatement}
		 */
		let s = null;

		if (kw == "const") {
			s = buildConstStatement(t.site, ts);
		} else if (kw == "func") {
			s = buildFuncStatement(t.site, ts, methodOf);
		} else {
			t.syntaxError("invalid impl syntax");
		}

		if (s) {
			statements.push(s);
		}
	}

	return statements
}

/**
 * TODO: chain like value
 * @package
 * @param {Site} site
 * @param {Token[]} ts 
 * @returns {Expr | null}
 */
function buildTypeExpr(site, ts) {
	if (ts.length == 0) {
		site.syntaxError("expected token");
		return null;
	}

	if (ts[0].isGroup("[")) {
		return buildListTypeExpr(ts);
	} else if (ts[0].isWord("Map")) {
		return buildMapTypeExpr(ts);
	} else if (ts[0].isWord("Option")) {
		return buildOptionTypeExpr(ts);
	} else if (ts.length > 1 && ts[0].isGroup("(") && ts[1].isSymbol("->")) {
		return buildFuncTypeExpr(ts);
	} else if (ts.length > 2 && ts[0].isGroup("[") && ts[1].isGroup("(") && ts[2].isSymbol("->")) {
		return buildFuncTypeExpr(ts);
	} else if (SymbolToken.find(ts, "::") > Group.find(ts, "[")) {
		return buildTypePathExpr(ts);
	} else if (Group.find(ts, "[") > SymbolToken.find(ts, "::")) {
		return buildParametricTypeExpr(ts);
	} else if (ts.length == 1 && ts[0].isWord()) {
		return buildTypeRefExpr(ts);
	} else {
		ts[0].syntaxError("invalid type syntax");
		return null;
	}
}

/**
 * @param {Token[]} ts 
 * @returns {ParametricExpr | null}
 */
function buildParametricTypeExpr(ts) {
	const brackets = assertDefined(ts.pop()).assertGroup("[");
	if (!brackets) {
		return null;
	}

	const baseExpr = buildTypeExpr(brackets.site, ts);
	if (!baseExpr) {
		return null;
	}

	const typeExprs = reduceNull(brackets.fields.map(fts => {
		return buildTypeExpr(brackets.site, fts);
	}));

	if (!typeExprs) {
		return null;
	}

	return new ParametricExpr(brackets.site, baseExpr, typeExprs);
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {ListTypeExpr | null}
 */
function buildListTypeExpr(ts) {
	const brackets = assertDefined(ts.shift()).assertGroup("[", 0);

	if (!brackets) {
		return null
	}

	const itemTypeExpr = buildTypeExpr(brackets.site, ts);

	if (!itemTypeExpr) {
		return null;
	}

	return new ListTypeExpr(brackets.site, itemTypeExpr);
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {MapTypeExpr | null}
 */
function buildMapTypeExpr(ts) {
	const kw = assertDefined(ts.shift()).assertWord("Map");

	if (!kw) {
		return null;
	}

	const maybeKeyTypeExpr = assertToken(ts.shift(), kw.site, "missing Map key-type");

	if (!maybeKeyTypeExpr) {
		return null;
	}

	const keyTypeTs = maybeKeyTypeExpr.assertGroup("[", 1)?.fields[0];
	if (keyTypeTs === null || keyTypeTs === undefined) {
		return null;
	} else if (keyTypeTs.length == 0) {
		kw.syntaxError("missing Map key-type (brackets can't be empty)");
		return null;
	} 

	const keyTypeExpr = buildTypeExpr(kw.site, keyTypeTs);
	if (!keyTypeExpr) {
		return null;
	}

	if (ts.length == 0) {
		kw.syntaxError("missing Map value-type");
		return null;
	} 

	const valueTypeExpr = buildTypeExpr(kw.site, ts);

	if (!valueTypeExpr) {
		return null;
	}

	return new MapTypeExpr(kw.site, keyTypeExpr, valueTypeExpr);
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {Expr | null}
 */
function buildOptionTypeExpr(ts) {
	const kw = assertDefined(ts.shift()).assertWord("Option");

	if (!kw) {
		return null;
	}

	const typeTs = assertToken(ts.shift(), kw.site)?.assertGroup("[", 1)?.fields[0];

	if (!typeTs) {
		return null;
	}

	const someTypeExpr = buildTypeExpr(kw.site, typeTs);
	if (!someTypeExpr) {
		return null;
	}

	const typeExpr = new OptionTypeExpr(kw.site, someTypeExpr);
	if (ts.length > 0) {
		if (ts[0].isSymbol("::") && ts[1].isWord(["Some", "None"])) {
			if (ts.length > 2) {
				ts[2].syntaxError("unexpected token");
				return null;
			} else {
				const memberName = ts[1].assertWord()

				if (!memberName) {
					return null;
				}

				return new PathExpr(ts[0].site, typeExpr, memberName);
			}
		} else {
			ts[0].syntaxError("invalid option type syntax");
			return null;
		}
	} else {
		return typeExpr;
	}
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {FuncTypeExpr | null}
 */
function buildFuncTypeExpr(ts) {
	const parens = assertDefined(ts.shift()).assertGroup("(");
	if (!parens) {
		return null;
	}

	let hasOptArgs = false;

	const argTypes = reduceNull(parens.fields.map(f => {
		const fts = f.slice();

		if (fts.length == 0) {
			parens.syntaxError("expected func arg type");
			return null;
		}

		const funcArgTypeExpr = buildFuncArgTypeExpr(fts);

		if (!funcArgTypeExpr) {
			return null;
		}

		if (hasOptArgs) {
			if (!funcArgTypeExpr.isOptional()) {
				funcArgTypeExpr.syntaxError("optional arguments must come last");
				return null;
			}
		} else {
			if (funcArgTypeExpr.isOptional()) {
				hasOptArgs = true;
			}
		}

		return funcArgTypeExpr;
	}));

	if (!argTypes) {
		return null;
	} 

	if (argTypes.some(at => at.isNamed()) && argTypes.some(at => !at.isNamed())) {
		argTypes[0].syntaxError("can't mix named and unnamed args in func type");
		return null;
	}

	const arrow = assertToken(ts.shift(), parens.site)?.assertSymbol("->");

	if (!arrow) {
		return null;
	}

	const retTypes = buildFuncRetTypeExprs(arrow.site, ts, false);

	if (!retTypes) {
		return null;
	}

	return new FuncTypeExpr(parens.site, argTypes, retTypes.map(t => assertDefined(t)));
}

/**
 * 
 * @param {Token[]} ts 
 * @returns {FuncArgTypeExpr | null}
 */
function buildFuncArgTypeExpr(ts) {
	const colonPos = SymbolToken.find(ts, ":");

	if (colonPos != -1 && colonPos != 1) {
		ts[0].syntaxError("invalid syntax");
		return null;
	}

	/**
	 * @type {Word | null}
	 */
	let name = null;

	if (colonPos != -1) {
		name = assertDefined(ts.shift()).assertWord()?.assertNotKeyword() ?? null;

		if (!name) {
			return null;
		}

		const colon = assertDefined(ts.shift()).assertSymbol(":");

		if (!colon) {
			return null;
		}
		
		if (ts.length == 0) {
			colon.syntaxError("expected type expression after ':'");
			return null;
		}
	}

	const next = assertDefined(ts[0]);

	const hasDefault = next.isSymbol("?");
	if (hasDefault) {
		const opt = assertDefined(ts.shift());

		if (ts.length == 0) {
			opt.syntaxError("invalid type expression after '?'");
			return null;
		}
	}

	const typeExpr = buildTypeExpr(next.site, ts);
	if (!typeExpr) {
		return null;
	}

	return new FuncArgTypeExpr(name !== null ? name.site : typeExpr.site, name, typeExpr, hasDefault);
}

/**
 * @package
 * @param {Site} site 
 * @param {Token[]} ts 
 * @param {boolean} allowInferredRetType
 * @returns {null | (null | Expr)[]}
 */
function buildFuncRetTypeExprs(site, ts, allowInferredRetType = false) {
	if (ts.length === 0) {
		if (allowInferredRetType) {
			return [null];
		} else {
			site.syntaxError("expected type expression after '->'");
			return null;
		}
	} else {
		if (ts[0].isGroup("(") && (ts.length == 1 || !ts[1].isSymbol("->"))) {
			const group = assertToken(ts.shift(), site)?.assertGroup("(");

			if (!group) {
				return null;
			} else if (group.fields.length == 0) {
				return [new VoidTypeExpr(group.site)];
			} else if (group.fields.length == 1) {
				group.syntaxError("expected 0 or 2 or more types in multi return type");
				return null;
			} else {
				return group.fields.map(fts => {
					fts = fts.slice();

					return buildTypeExpr(group.site, fts);
				});
			}
		} else {
			return [buildTypeExpr(site, ts)];
		}
	}
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {null | PathExpr}
 */
function buildTypePathExpr(ts) {
	const i = SymbolToken.findLast(ts, "::");

	assert(i != -1);

	const baseExpr = buildTypeExpr(ts[0].site, ts.splice(0, i));
	if (!baseExpr) {
		return null;
	}

	const dcolon = assertDefined(ts.shift()).assertSymbol("::");
	if (!dcolon) {
		return null;
	}

	const memberName = assertToken(ts.shift(), dcolon.site)?.assertWord()?.assertNotKeyword();
	if (!memberName) {
		return null;
	}
	
	return new PathExpr(dcolon.site, baseExpr, memberName);
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {RefExpr | null}
 */
function buildTypeRefExpr(ts) {
	const name = assertDefined(ts.shift()).assertWord()?.assertNotKeyword();

	if (!name) {
		return null;
	}

	if (ts.length > 0) {
		ts[0].syntaxError("invalid type syntax");
		return null;
	}

	return new RefExpr(name);
}

/**
 * @package
 * @param {Token[]} ts 
 * @param {number} prec 
 * @returns {Expr | null}
 */
function buildValueExpr(ts, prec = 0) {
	assert(ts.length > 0);

	// lower index in exprBuilders is lower precedence
	/** @type {((ts: Token[], prev: number) => (Expr | null))[]} */
	const exprBuilders = [
		/**
		 * 0: lowest precedence is assignment
		 * @param {Token[]} ts_ 
		 * @param {number} prec_ 
		 * @returns 
		 */
		function (ts_, prec_) {
			return buildMaybeAssignOrChainExpr(ts_, prec_);
		},
		makeBinaryExprBuilder('||'), // 1: logical or operator
		makeBinaryExprBuilder('&&'), // 2: logical and operator
		makeBinaryExprBuilder(['==', '!=']), // 3: eq or neq
		makeBinaryExprBuilder(['<', '<=', '>', '>=']), // 4: comparison
		makeBinaryExprBuilder(['+', '-']), // 5: addition subtraction
		makeBinaryExprBuilder(['*', '/', '%']), // 6: multiplication division remainder
		makeUnaryExprBuilder(['!', '+', '-']), // 7: logical not, negate
		/**
		 * 8: variables or literal values chained with: (enum)member access, indexing and calling
		 * @param {Token[]} ts_ 
		 * @param {number} prec_ 
		 * @returns 
		 */
		function (ts_, prec_) {
			return buildChainedValueExpr(ts_, prec_);
		}
	];

	return exprBuilders[prec](ts, prec);
}

/**
 * @package
 * @param {Token[]} ts
 * @param {number} prec
 * @returns {Expr | null}
 */
function buildMaybeAssignOrChainExpr(ts, prec) {
	let semicolonPos = SymbolToken.find(ts, ";");
	const equalsPos = SymbolToken.find(ts, "=");

	if (semicolonPos == -1) {
		if (equalsPos != -1) {
			ts[equalsPos].syntaxError("invalid assignment syntax, expected ';' after '...=...'");
			return null;
		} else {
			return buildValueExpr(ts, prec + 1);
		}
	} else {
		if (equalsPos == -1 || equalsPos > semicolonPos) {
			const upstreamExpr = buildValueExpr(ts.splice(0, semicolonPos), prec+1);
			const site = assertDefined(ts.shift()).site;

			if (ts.length == 0) {
				site.syntaxError("expected expression after ';'");
				return null;
			} else if (upstreamExpr === null) {
				// error will already have been created
				return null;
			} else {
				const downstreamExpr = buildValueExpr(ts, prec);

				if (downstreamExpr === null) {
					// error will already have been created
					return null;
				} else {
					return new ChainExpr(site, upstreamExpr, downstreamExpr);
				}
			}
		} else if (equalsPos != -1 && equalsPos < semicolonPos) {
			const equals = ts[equalsPos].assertSymbol("=");

			if (!equals) {
				return null;
			}

			const equalsSite = equals.site;

			const lts = ts.splice(0, equalsPos);

			const lhs = buildAssignLhs(equalsSite, lts);
			
			assertDefined(ts.shift()).assertSymbol("=");

			semicolonPos = SymbolToken.find(ts, ";");
			assert(semicolonPos != -1);

			let upstreamTs = ts.splice(0, semicolonPos);
			if (upstreamTs.length == 0) {
				equalsSite.syntaxError("expected expression between '=' and ';'");
				return null;
			}

			const upstreamExpr = buildValueExpr(upstreamTs, prec + 1);

			const semicolon  = assertToken(ts.shift(), equalsSite)?.assertSymbol(";");

			if (!semicolon) {
				return null;
			}

			const semicolonSite = semicolon.site;

			if (ts.length == 0) {
				semicolonSite.syntaxError("expected expression after ';'");
				return null;
			}

			const downstreamExpr = buildValueExpr(ts, prec);

			if (downstreamExpr === null || upstreamExpr === null || lhs === null) {
				// error will already have been thrown internally
				return null;
			} else {
				return new AssignExpr(equalsSite, lhs, upstreamExpr, downstreamExpr);
			}
		} else {
			ts[0].syntaxError("unhandled");
			return null;
		}
	}
}

/**
 * @package
 * @param {Site} site
 * @param {Token[]} ts 
 * @param {boolean} isSwitchCase
 * @returns {DestructExpr | null}
 */
function buildDestructExpr(site, ts, isSwitchCase = false) {
	if (ts.length == 0) {
		site.syntaxError("expected token inside destructuring braces");
		return null;
	}

	let maybeName = assertToken(ts.shift(), site);

	if (!maybeName) {
		return null;
	}

	if (maybeName.isWord("_")) {
		if (ts.length != 0) {
			maybeName.syntaxError("unexpected tokens after '_'");
			return null;
		} else {
			return new DestructExpr(new Word(maybeName.site, "_"), null);
		}
	} else {
		let name = new Word(maybeName.site, "_");

		if (ts.length >= 1 && ts[0].isSymbol(":")) {
			let name_ = maybeName.assertWord()?.assertNotKeyword();

			if (!name_) {
				return null;
			}

			name = name_;

			const colon = assertToken(ts.shift(), name.site)?.assertSymbol(":");

			if (!colon) {
				return null;
			}

			if (ts.length == 0) {
				colon.syntaxError("expected type expression after ':'");
				return null;
			} 

			const destructExprs = buildDestructExprs(ts);

			if (destructExprs === null || destructExprs === undefined) {
				return null
			}

			const typeExpr = buildTypeExpr(colon.site, ts);

			if (!typeExpr) {
				return null;
			}

			return new DestructExpr(name, typeExpr, destructExprs);
		} else if (ts.length == 0) {
			if (isSwitchCase) {
				const typeName = maybeName.assertWord()?.assertNotKeyword();

				if (!typeName) {
					return null;
				}

				const typeExpr = new RefExpr(typeName);

				if (!typeExpr) {
					return null;
				} 

				return new DestructExpr(name, typeExpr);
			} else {
				const name = maybeName.assertWord()?.assertNotKeyword();

				if (!name) {
					return null;
				}

				return new DestructExpr(name, null);
			}
		} else {
			ts.unshift(maybeName);

			const destructExprs = buildDestructExprs(ts);

			if (destructExprs === null || destructExprs === undefined) {
				return null;
			}
	
			const typeExpr = buildTypeExpr(site, ts);

			if (!typeExpr) {
				return null;
			}

			return new DestructExpr(name, typeExpr, destructExprs);
		}
	}
}

/**
 * Pops the last element of ts if it is a braces group
 * @param {Token[]} ts
 * @returns {null | DestructExpr[]}
 */
function buildDestructExprs(ts) {
	if (ts.length == 0) {
		return [];
	} else if (ts[ts.length -1].isGroup("{")) {
		const group = assertDefined(ts.pop()).assertGroup("{");

		if (!group) {
			return null;
		}

		const destructExprs = group.fields.map(fts => {
			return buildDestructExpr(group.site, fts);
		});
	
		if (destructExprs.every(le => le !== null && le.isIgnored() && !le.hasDestructExprs())) {
			group.syntaxError("expected at least one used field while destructuring")
			return null;
		}

		return reduceNull(destructExprs);
	} else {
		return [];
	}	
}

/**
 * @package
 * @param {Site} site 
 * @param {Token[]} ts 
 * @returns {null | DestructExpr[]}
 */
function buildAssignLhs(site, ts) {
	const maybeName = ts.shift();
	if (maybeName === undefined) {
		site.syntaxError("expected a name before '='");
		return null;
	} else {
		/**
		 * @type {DestructExpr[]}
		 */
		const pairs = [];

		if (maybeName.isWord()) {
			ts.unshift(maybeName);

			const lhs = buildDestructExpr(maybeName.site, ts);

			if (lhs === null) {
				return null;
			} else if (lhs.isIgnored() && !lhs.hasDestructExprs()) {
				maybeName.syntaxError(`unused assignment ${maybeName.toString()}`);
				return null;
			}

			pairs.push(lhs);
		} else if (maybeName.isGroup("(")) {
			const group = maybeName.assertGroup("(");

			if (!group) {
				return null;
			}

			if (group.fields.length < 2) {
				group.syntaxError("expected at least 2 lhs' for multi-assign");
				return null;
			}

			let someNoneUnderscore = false;
			for (let fts of group.fields) {
				if (fts.length == 0) {
					group.syntaxError("unexpected empty field for multi-assign");
					return null;
				}

				fts = fts.slice();

				const lhs = buildDestructExpr(group.site, fts);

				if (!lhs) {
					return null;
				}
				
				if (!lhs.isIgnored() || lhs.hasDestructExprs()) {
					someNoneUnderscore = true;
				}

				// check that name is unique
				pairs.forEach(p => {
					if (!lhs.isIgnored() && p.name.value === lhs.name.value) {
						lhs.name.syntaxError(`duplicate name '${lhs.name.value}' in lhs of multi-assign`);
					}
				});

				pairs.push(lhs);
			}

			if (!someNoneUnderscore) {
				group.syntaxError("expected at least one non-underscore in lhs of multi-assign");
				return null;
			}
		} else {
			maybeName.syntaxError("unexpected syntax for lhs of =");
			return null;
		}

		return pairs;
	}
}

/**
 * @package
 * @param {string | string[]} symbol 
 * @returns {(ts: Token[], prec: number) => (Expr | null)}
 */
function makeBinaryExprBuilder(symbol) {
	// default behaviour is left-to-right associative
	return function (ts, prec) {
		const iOp = SymbolToken.findLast(ts, symbol);

		if (iOp == ts.length - 1) {
			// post-unary operator, which is invalid
			ts[iOp].syntaxError(`invalid syntax, '${ts[iOp].toString()}' can't be used as a post-unary operator`);
			return null;
		} else if (iOp > 0) { // iOp == 0 means maybe a (pre)unary op, which is handled by a higher precedence
			const a = buildValueExpr(ts.slice(0, iOp), prec);
			const b = buildValueExpr(ts.slice(iOp + 1), prec + 1);
			const op = ts[iOp].assertSymbol();

			if (!a || !b || !op) {
				return null;
			}

			return new BinaryExpr(op, a, b);
		} else {
			return buildValueExpr(ts, prec + 1);
		}
	};
}

/**
 * @package
 * @param {string | string[]} symbol 
 * @returns {(ts: Token[], prec: number) => (Expr | null)}
 */
function makeUnaryExprBuilder(symbol) {
	// default behaviour is right-to-left associative
	return function (ts, prec) {
		if (ts[0].isSymbol(symbol)) {
			const rhs = buildValueExpr(ts.slice(1), prec);
			const op = ts[0].assertSymbol();

			if (!rhs || !op) {
				return null;
			}

			return new UnaryExpr(op, rhs);
		} else {
			return buildValueExpr(ts, prec + 1);
		}
	}
}

/**
 * @package
 * @param {Token[]} ts 
 * @param {number} prec 
 * @returns {Expr | null}
 */
function buildChainedValueExpr(ts, prec) {
	/** @type {Expr | null} */
	let expr = buildChainStartValueExpr(ts);

	// now we can parse the rest of the chaining
	while (ts.length > 0) {
		if (expr === null) {
			return null;
		}

		const t = assertDefined(ts.shift());

		if (t.isGroup("(")) {
			expr = buildCallExpr(t.site, expr, assertDefined(t.assertGroup()));
		} else if (t.isGroup("[")) {
			expr = buildParametricValueExpr(expr, assertDefined(t.assertGroup("[")));
		} else if (t.isSymbol(".") && ts.length > 0 && ts[0].isWord("switch")) {
			expr = buildSwitchExpr(expr, ts);
		} else if (t.isSymbol(".")) {
			const name = assertToken(ts.shift(), t.site)?.assertWord()?.assertNotKeyword();

			if (!name) {
				return null;
			}

			expr = new MemberExpr(t.site, expr, name);
		} else if (t.isGroup("{")) {
			t.syntaxError("invalid syntax");
			return null;
		} else if (t.isSymbol("::")) {
			t.syntaxError("invalid syntax");
			return null;
		} else {
			t.syntaxError(`invalid syntax '${t.toString()}'`);
			return null;
		}
	}

	return expr;
}

/**
 * @param {Expr} expr 
 * @param {Group} brackets 
 * @returns {ParametricExpr | null}
 */
function buildParametricValueExpr(expr, brackets) {
	const typeExprs = reduceNull(brackets.fields.map(fts => {
		if (fts.length == 0) {
			brackets.site.syntaxError("unexpected empty field");
			return null;
		} else {
			const typeExpr = buildTypeExpr(brackets.site, fts);

			if (fts.length != 0) {
				fts[0].syntaxError("unexpected token");
				return null;
			} else {
				return typeExpr;
			}
		}
	}));

	if (!typeExprs) {
		return null;
	}

	return new ParametricExpr(brackets.site, expr, typeExprs);
}

/**
 * @param {Site} site 
 * @param {Expr} fnExpr 
 * @param {Group} parens
 * @returns {CallExpr | null}
 */
function buildCallExpr(site, fnExpr, parens) {
	const callArgs = buildCallArgs(parens);

	if (callArgs === null) {
		return null;
	} else {
		return new CallExpr(site, fnExpr, callArgs);
	}
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {Expr | null}
 */
function buildChainStartValueExpr(ts) {
	if (ts.length > 1 && ts[0].isGroup("(") && ts[1].isSymbol("->")) {
		return buildFuncLiteralExpr(ts, null, true);
	} else if (ts[0].isWord("if")) {
		return buildIfElseExpr(ts);
	} else if (ts[0].isWord("switch")) {
		ts[0].syntaxError("expected '... .switch' instead of 'switch'");
		return null;
	} else if (ts[0].isLiteral()) {
		return new PrimitiveLiteralExpr(assertDefined(ts.shift())); // can simply be reused
	} else if (ts[0].isGroup("(")) {
		return buildParensExpr(ts);
	} else if (Group.find(ts, "{") != -1) {
		if (ts[0].isGroup("[")) {
			return buildListLiteralExpr(ts);
		} else if (ts[0].isWord("Map") && ts[1].isGroup("[")) {
			return buildMapLiteralExpr(ts); 
		} else {
			// could be switch or literal struct construction
			const iBraces = Group.find(ts, "{");
			const iSwitch = Word.find(ts, "switch");
			const iPeriod = SymbolToken.find(ts, ".");

			if (iSwitch != -1 && iPeriod != -1 && iSwitch < iBraces && iPeriod < iBraces && iSwitch > iPeriod) {
				return buildValueExpr(ts.splice(0, iPeriod));
			} else {
				return buildStructLiteralExpr(ts);
			}
		}
	} else if (SymbolToken.find(ts, "::") != -1) {
		return buildValuePathExpr(ts);
	} else if (ts[0].isWord()) {
		if (ts[0].isWord("const") || ts[0].isWord("struct") || ts[0].isWord("enum") || ts[0].isWord("func") || ts[0].isWord("import")) {
			ts[0].syntaxError(`invalid use of '${assertDefined(ts[0].assertWord()).value}', can only be used as top-level statement`);
			return null;
		} else {
			const name = assertDefined(ts.shift()?.assertWord());

			if (name.value == "self") {
				return new RefExpr(name);
			} else {
				const n = name.assertNotKeyword();

				if (!n) {
					return null;
				}

				return new RefExpr(n);
			}
		}
	} else {
		ts[0].syntaxError("invalid syntax");
		return null;
	}
}

/**
 * @package
 * @param {Token[]} ts
 * @returns {Expr | null}
 */
function buildParensExpr(ts) {
	const group = assertDefined(ts.shift()).assertGroup("(");

	if (!group) {
		return null;
	}

	const site = group.site;

	if (group.fields.length === 0) {
		group.syntaxError("expected at least one expr in parens");
		return null;
	} else {
		const fields = group.fields.map(fts => buildValueExpr(fts));

		/**
		 * @type {Expr[]}
		 */
		const nonNullFields = [];

		fields.forEach(f => {
			if (f !== null) {
				nonNullFields.push(f);
			}
		});

		if (nonNullFields.length == 0) {
			// error will already have been thrown internally
			return null;
		} else {
			return new ParensExpr(site, nonNullFields);
		}
	}
}

/**
 * @package
 * @param {Group} parens 
 * @returns {CallArgExpr[] | null}
 */
function buildCallArgs(parens) {
	/**
	 * @type {Set<string>}
	 */
	const names = new Set();

	const callArgs = reduceNull(parens.fields.map(fts => {
		const callArg = buildCallArgExpr(parens.site, fts);

		if (callArg !== null && callArg.isNamed()) {
			if (names.has(callArg.name)) {
				callArg.syntaxError(`duplicate named call arg ${callArg.name}`);
			}

			names.add(callArg.name);
		}

		return callArg;
	}));

	if (callArgs === null) {
		return null;
	} else {
		if (callArgs.some(ca => ca.isNamed()) && callArgs.some(ca => !ca.isNamed())) {
			callArgs[0].syntaxError("can't mix positional and named args");
			return null;
		}

		return callArgs;
	}
}

/**
 * @param {Site} site 
 * @param {Token[]} ts 
 * @returns {CallArgExpr | null}
 */
function buildCallArgExpr(site, ts) {
	if (ts.length == 0) {
		site.syntaxError("invalid syntax");
		return null;
	}

	/**
	 * @type {null | undefined | Word}
	 */
	let name = null;

	if (ts.length >= 2 && ts[0].isWord() && ts[1].isSymbol(":")) {
		name = assertDefined(ts.shift()).assertWord()?.assertNotKeyword();

		if (!name) {
			return null;
		}

		const colon = assertDefined(ts.shift());

		if (ts.length == 0) {
			colon.syntaxError("expected value expressions after ':'");
			return null;
		}
	}

	const value = buildValueExpr(ts);

	if (!value) {
		return null;
	}

	return new CallArgExpr(name != null ? name.site : value.site, name, value);
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {IfElseExpr | null}
 */
function buildIfElseExpr(ts) {
	const ifWord = assertDefined(ts.shift()).assertWord("if");

	if (!ifWord) {
		return null;
	}

	const site = ifWord.site;

	/** @type {Expr[]} */
	const conditions = [];

	/** @type {Expr[]} */
	const branches = [];
	while (true) {
		const parens = assertToken(ts.shift(), site)?.assertGroup("(");

		if (!parens) {
			return null;
		}

		const braces = assertToken(ts.shift(), site)?.assertGroup("{");

		if (!braces) {
			return null;
		}

		if (parens.fields.length != 1) {
			parens.syntaxError("expected single if-else condition");
			return null;
		}

		if (braces.fields.length == 0) {
			braces.syntaxError("branch body can't be empty");
			return null;
		} else if (braces.fields.length != 1) {
			braces.syntaxError("expected single if-else branch expession");
			return null;
		}

		const cond = buildValueExpr(parens.fields[0]);
		const branch = buildValueExpr(braces.fields[0]);

		if (cond === null || branch === null) {
			continue;
		}

		conditions.push(cond);
		branches.push(branch);

		const maybeElse = ts.shift();

		if (maybeElse === undefined ) {
			// add a void else branch
			branches.push(new VoidExpr(braces.site));
			break;
		} else {
			const elseWord = maybeElse.assertWord("else");

			if (!elseWord) {
				return null;
			}

			const next = assertToken(ts.shift(), elseWord.site);

			if (!next) {
				return null;
			} else if (next.isGroup("{")) {
				// last group
				const braces = next.assertGroup();

				if (!braces) {
					return null;
				}

				if (braces.fields.length != 1) {
					braces.syntaxError("expected single expession for if-else branch");
					return null;
				}

				const elseBranch = buildValueExpr(braces.fields[0]);

				if (!elseBranch) {
					return null;
				}

				branches.push(elseBranch);
				break;
			} else if (next.isWord("if")) {
				continue;
			} else {
				next.syntaxError("unexpected token");
				return null;
			}
		}
	}

	return new IfElseExpr(site, conditions, branches);
}

/**
 * @package
 * @param {Expr} controlExpr
 * @param {Token[]} ts 
 * @returns {Expr | null} - EnumSwitchExpr or DataSwitchExpr
 */
function buildSwitchExpr(controlExpr, ts) {
	const switchWord = assertDefined(ts.shift()).assertWord("switch");

	if (!switchWord) {
		return null;
	}

	const site = switchWord.site;

	const braces = assertToken(ts.shift(), site)?.assertGroup("{");

	if (!braces) {
		return null;
	}

	/** @type {SwitchCase[]} */
	const cases = [];

	/** @type {null | SwitchDefault} */
	let def = null;

	for (let tsInner of braces.fields) {
		if (tsInner[0].isWord("else") || tsInner[0].isWord("_")) {
			if (def !== null) {
				def.syntaxError("duplicate default case in switch");
				return null;
			}

			def = buildSwitchDefault(tsInner);
		} else {
			if (def !== null) {
				def.syntaxError("switch default case must come last");
				return null;
			}

			const c = buildSwitchCase(tsInner);

			if (c === null) {
				return null;
			} else {
				cases.push(c);
			}
		}
	}

	// check the uniqueness of each case here
	/** @type {Set<string>} */
	const set = new Set()
	for (let c of cases) {
		let t = c.memberName.toString();
		if (set.has(t)) {
			c.memberName.syntaxError(`duplicate switch case '${t}')`);
			return null;
		}

		set.add(t);
	}

	if (cases.length < 1) {
		site.syntaxError("expected at least one switch case");
		return null;
	}

	if (cases.some(c => c.isDataMember())) {
		if (cases.length + (def === null ? 0 : 1) > 5) {
			site.syntaxError(`too many cases for data switch, expected 5 or less, got ${cases.length.toString()}`);
			return null;
		} else {
			let count = 0;
			cases.forEach(c => {if (!c.isDataMember()){count++}});

			if (count > 1) {
				site.syntaxError(`expected at most 1 enum case in data switch, got ${count}`);
				return null;
			} else {
				if (count === 1 && cases.some(c => c instanceof UnconstrDataSwitchCase)) {
					site.syntaxError(`can't have both enum and (Int, []Data) in data switch`);
					return null;
				} else {
					return new DataSwitchExpr(site, controlExpr, cases, def);
				}
			}
		}
	} else {
		return new EnumSwitchExpr(site, controlExpr, cases, def);
	}
}

/**
 * @package
 * @param {Site} site
 * @param {Token[]} ts
 * @param {boolean} isAfterColon
 * @returns {Word | null} 
 */
function buildSwitchCaseName(site, ts, isAfterColon) {
	const first = ts.shift();

	if (first === undefined) {
		if (isAfterColon) {
			site.syntaxError("invalid switch case syntax, expected member name after ':'");
			return null;
		} else {
			site.syntaxError("invalid switch case syntax");
			return null;
		}
	}
		
	if (first.isWord("Map")) {
		const second = ts.shift();

		if (!second) {
			site.syntaxError("expected token after 'Map'");
			return null;
		}

		const keyTs = second.assertGroup("[]", 1)?.fields[0];

		if (keyTs === undefined || keyTs === null) {
			return null;
		}

		const key = keyTs.shift();

		if (key === undefined) {
			second.syntaxError("expected 'Map[Data]Data'");
			return null;
		}

		key.assertWord("Data");

		if (keyTs.length > 0) {
			keyTs[0].syntaxError("unexpected token after 'Data'");
			return null;
		}

		const third = ts.shift();

		if (third === undefined) {
			site.syntaxError("expected token after 'Map[Data]");
			return null;
		}

		third.assertWord("Data");

		if (ts.length > 0) {
			ts[0].syntaxError("unexpected token after 'Map[Data]Data'");
			return null;
		}

		return new Word(first.site, "Map[Data]Data");
	} else if (first.isWord()) {
		if (ts.length > 0) {
			ts[0].syntaxError("unexpected token");
			return null;
		}

		return first?.assertWord()?.assertNotKeyword() ?? null;
	} else if (first.isGroup("[")) {
		// list 
		first.assertGroup("[", 0);

		const second = ts.shift();

		if (second === undefined) {
			site.syntaxError("expected token after '[]'");
			return null;
		} else if (ts.length > 0) {
			ts[0].syntaxError("unexpected token");
			return null;
		}

		second.assertWord("Data");

		return new Word(first.site, "[]Data");
	} else {
		first.syntaxError("invalid switch case name syntax");
		return null;
	}
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {SwitchCase | null}
 */
function buildSwitchCase(ts) {
	const arrowPos = SymbolToken.find(ts, "=>");

	if (arrowPos == -1) {
		ts[0].syntaxError("expected '=>' in switch case");
		return null;
	} else if (arrowPos == 0) {
		ts[0].syntaxError("expected '<word>' or '<word>: <word>' to the left of '=>'");
		return null;
	}

	const tsLeft = ts.splice(0, arrowPos);

	if (tsLeft.length === 1 && tsLeft[0].isGroup("(")) {
		return buildMultiArgSwitchCase(tsLeft, ts);
	} else {
		return buildSingleArgSwitchCase(tsLeft, ts);
	}
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {null | [?Word, Word]} - varName is optional
 */
function buildSwitchCaseNameType(ts) {
	const colonPos = SymbolToken.find(ts, ":");

	/** @type {null | Word} */
	let varName = null;

	/** @type {null | Word} */
	let memberName = null;

	if (colonPos != -1) {
		const maybeVarName = assertDefined(ts.shift()).assertWord()?.assertNotKeyword();

		if (!maybeVarName) {
			return null;
		}

		varName = maybeVarName;
		
		const maybeColon = ts.shift();

		if (maybeColon === undefined) {
			varName.syntaxError("invalid switch case syntax, expected '(<name>: <enum-member>)', got '(<name>)'");
			return null;
		} else {
			void maybeColon.assertSymbol(":");

			memberName = buildSwitchCaseName(maybeColon.site, ts, true);
		}
	} else {
		memberName = buildSwitchCaseName(ts[0].site, ts, false);
	}

	if (ts.length !== 0) {
		ts[0].syntaxError("unexpected token");
		return null;
	}

	if (memberName === null) {
		// error will already have been thrown internally
		return null;
	} else {
		return [varName, memberName];
	}
}

/**
 * @package
 * @param {Token[]} tsLeft
 * @param {Token[]} ts
 * @returns {SwitchCase | null}
 */
function buildMultiArgSwitchCase(tsLeft, ts) {
	const parens = assertDefined(tsLeft.shift()).assertGroup("(");

	if (!parens) {
		return null;
	}

	const pairs = reduceNull(parens.fields.map(fts => buildSwitchCaseNameType(fts)));

	if (pairs === null) {
		return null;
	}

	assert(tsLeft.length === 0);

	if (pairs.length !== 2) {
		parens.syntaxError(`expected (Int, []Data) case, got (${pairs.map(p => p[1].value).join(", ")}`);
		return null;
	} else if (pairs[0][1].value != "Int" || pairs[1][1].value != "[]Data") {
		parens.syntaxError(`expected (Int, []Data) case, got (${pairs[0][1].value}, ${pairs[1][1].value})`);
		return null;
	} else {
		const maybeArrow = ts.shift();

		if (maybeArrow === undefined) {
			parens.syntaxError("expected '=>'");
			return null;
		} else {
			const arrow = maybeArrow.assertSymbol("=>");

			if (!arrow) {
				return null;
			}

			const bodyExpr = buildSwitchCaseBody(arrow.site, ts);

			if (bodyExpr === null) {
				return null;
			} else {
				return new UnconstrDataSwitchCase(arrow.site, pairs[0][0], pairs[1][0], bodyExpr);
			}
		}
	}
}

/**
 * @package
 * @param {Token[]} tsLeft 
 * @param {Token[]} ts 
 * @returns {SwitchCase | null}
 */
function buildSingleArgSwitchCase(tsLeft, ts) {
	const site = tsLeft[tsLeft.length-1].site;

	const destructExpr = buildDestructExpr(site, tsLeft, true);

	if (destructExpr === null) {
		return null;
	} else if (!destructExpr.hasType()) {
		destructExpr.site.syntaxError("invalid switch case syntax");
		return null;
	}
	
	const maybeArrow = ts.shift();

	if (maybeArrow === undefined) {
		site.syntaxError("expected '=>'");
		return null;
	} else {
		const arrow = maybeArrow.assertSymbol("=>");

		if (!arrow) {
			return null;
		}

		const bodyExpr = buildSwitchCaseBody(arrow.site, ts);

		if (bodyExpr === null) {
			return null;
		} else {
			return new SwitchCase(arrow.site, destructExpr, bodyExpr);
		}
	}
}

/**
 * @package
 * @param {Site} site 
 * @param {Token[]} ts 
 * @returns {Expr | null}
 */
function buildSwitchCaseBody(site, ts) {
	/** @type {null | Expr} */
	let bodyExpr = null;

	if (ts.length == 0) {
		site.syntaxError("expected expression after '=>'");
		return null;
	} else if (ts[0].isGroup("{")) {
		if (ts.length > 1) {
			ts[1].syntaxError("unexpected token");
			return null;
		}

		const tsBody = ts[0].assertGroup("{", 1)?.fields[0];

		if (tsBody === undefined || tsBody === null) {
			return null;
		}

		bodyExpr = buildValueExpr(tsBody);
	} else {
		bodyExpr = buildValueExpr(ts);
	}

	return bodyExpr;
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {SwitchDefault | null}
 */
function buildSwitchDefault(ts) {
	const elseWord = assertDefined(ts.shift()).assertWord();

	if (!elseWord) {
		return null;
	} else if (!(elseWord.isWord("else") || elseWord.isWord("_"))) {
		elseWord.syntaxError("expected 'else' or '_'");
		return null;
	}

	const site = elseWord.site;

	const maybeArrow = ts.shift();
	if (maybeArrow === undefined) {
		site.syntaxError(`expected '=>' after '${elseWord.value}'`);
		return null;
	} else {
		const arrow = maybeArrow.assertSymbol("=>");

		if (!arrow) {
			return null;
		}

		/** @type {null | Expr} */
		let bodyExpr = null;

		if (ts.length == 0) {
			arrow.syntaxError("expected expression after '=>'");
			return null;
		} else if (ts[0].isGroup("{")) {
			if (ts.length > 1) {
				ts[1].syntaxError("unexpected token");
				return null;
			} else {
				const bodyTs = ts[0].assertGroup("{", 1)?.fields[0];

				if (bodyTs === undefined || bodyTs === null) {
					return null;
				}

				bodyExpr = buildValueExpr(bodyTs);
			}
		} else {
			bodyExpr = buildValueExpr(ts);
		}

		if (!bodyExpr) {
			arrow.syntaxError("empty switch default case body");
			return null;
		}

		return new SwitchDefault(arrow.site, bodyExpr);
	}
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {ListLiteralExpr | null}
 */
function buildListLiteralExpr(ts) {
	const group = assertDefined(ts.shift()).assertGroup("[", 0);

	if (!group) {
		return null;
	}

	const site = group.site;

	const bracesPos = Group.find(ts, "{");

	if (bracesPos == -1) {
		site.syntaxError("invalid list literal expression syntax");
		return null;
	}

	const itemTypeExpr = buildTypeExpr(site, ts.splice(0, bracesPos));

	if (!itemTypeExpr) {
		return null;
	}

	const braces = assertToken(ts.shift(), site)?.assertGroup("{");

	if (!braces) {
		return null;
	}

	const itemExprs = reduceNull(braces.fields.map(fts => buildValueExpr(fts)));

	if (itemExprs === null) {
		// error will have already been thrown internally
		return null;
	}

	return new ListLiteralExpr(site, itemTypeExpr, itemExprs);
}

/**
 * @package
 * @param {Token[]} ts
 * @returns {MapLiteralExpr | null}
 */
function buildMapLiteralExpr(ts) {
	const mapWord = assertDefined(ts.shift()).assertWord("Map");

	if (!mapWord) {
		return null;
	}

	const site = mapWord.site;

	const bracket = assertDefined(ts.shift()).assertGroup("[", 1);

	if (!bracket) {
		return null;
	}

	const keyTypeExpr = buildTypeExpr(site, bracket.fields[0]);

	if (!keyTypeExpr) {
		return null;
	}

	const bracesPos = Group.find(ts, "{");

	if (bracesPos == -1) {
		site.syntaxError("invalid map literal expression syntax");
		return null;
	}

	const valueTypeExpr = buildTypeExpr(site, ts.splice(0, bracesPos));

	if (!valueTypeExpr) {
		return null;
	}

	const braces = assertDefined(ts.shift()).assertGroup("{");

	if (!braces) {
		return null;
	}

	/**
	 * @type {null | [Expr, Expr][]}
	 */
	const pairs = reduceNullPairs(braces.fields.map(fts => {
		const colonPos = SymbolToken.find(fts, ":");

		if (colonPos == -1) {
			if (fts.length == 0) {
				braces.syntaxError("unexpected empty field");
			} else {
				fts[0].syntaxError("expected ':' in map literal field");
			}
		} else if (colonPos == 0) {
			fts[colonPos].syntaxError("expected expression before ':' in map literal field");
		} else if (colonPos == fts.length - 1) {
			fts[colonPos].syntaxError("expected expression after ':' in map literal field");
		} else {
			const keyExpr = buildValueExpr(fts.slice(0, colonPos));

			const valueExpr = buildValueExpr(fts.slice(colonPos+1));

			/**
			 * @type {[Expr | null, Expr | null]}
			 */
			return [keyExpr, valueExpr];
		}

		return [null, null];
	}));

	if (pairs === null) {
		return null;
	}

	return new MapLiteralExpr(site, keyTypeExpr, valueTypeExpr, pairs);
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {StructLiteralExpr | null}
 */
function buildStructLiteralExpr(ts) {
	const bracesPos = Group.find(ts, "{");

	assert(bracesPos != -1);

	const site = ts[bracesPos].site;

	if (bracesPos == 0) {
		site.syntaxError("expected struct type before braces");
		return null;
	}
	
	const typeExpr = buildTypeExpr(site, ts.splice(0, bracesPos));

	if (!typeExpr) {
		return null;
	}

	const braces = assertDefined(ts.shift()).assertGroup("{");

	if (!braces) {
		return null;
	}

	const fields = reduceNull(braces.fields.map(fts => buildStructLiteralField(braces.site, fts)));

	if (fields === null) {
		return null;
	} 
	
	if (fields.every(f => f.isNamed()) || fields.every(f => !f.isNamed())) {
		return new StructLiteralExpr(typeExpr, fields);
	} else {
		braces.site.syntaxError("mangled literal struct (hint: specify all fields positionally or all with keys)");
		return null;
	}
}

/**
 * @package
 * @param {Site} site - site of the braces
 * @param {Token[]} ts
 * @returns {StructLiteralField | null}
 */
function buildStructLiteralField(site, ts) {
	if (ts.length > 2 && ts[0].isWord() && ts[1].isSymbol(":")) {
		return buildStructLiteralNamedField(site, ts);
	} else {
		return buildStructLiteralUnnamedField(site, ts);
	}
}

/**
 * @package
 * @param {Site} site
 * @param {Token[]} ts
 * @returns {StructLiteralField | null}
 */
function buildStructLiteralNamedField(site, ts) {
	const name = assertToken(ts.shift(), site, "empty struct literal field")?.assertWord()?.assertNotKeyword();

	if (!name) {
		return null;
	}

	const colon = assertToken(ts.shift(), name.site, "expected ':' after struct field name")?.assertSymbol(":");

	if (!colon) {
		return null;
	}

	if (ts.length == 0) {
		colon.syntaxError("expected expression after ':'");
		return null;
	}
	const valueExpr = buildValueExpr(ts);

	if (!valueExpr) {
		return null;
	}

	return new StructLiteralField(name, valueExpr);
}

/**
 * @package
 * @param {Site} site
 * @param {Token[]} ts
 * @returns {StructLiteralField | null}
 */
function buildStructLiteralUnnamedField(site, ts) {
	const valueExpr = buildValueExpr(ts);

	if (!valueExpr) {
		return null;
	}

	return new StructLiteralField(null, valueExpr);
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {Expr | null}
 */
function buildValuePathExpr(ts) {
	const dcolonPos = SymbolToken.findLast(ts, "::");

	assert(dcolonPos != -1);

	const typeExpr = buildTypeExpr(ts[dcolonPos].site, ts.splice(0, dcolonPos));

	if (!typeExpr) {
		return null;
	}

	const dcolon = assertDefined(ts.shift()?.assertSymbol("::"));

	const memberName = assertToken(ts.shift(), dcolon.site)?.assertWord()?.assertNotKeyword();

	if (!memberName) {
		return null;
	}
	
	return new ValuePathExpr(typeExpr.site, typeExpr, memberName);
}