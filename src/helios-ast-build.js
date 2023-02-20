//@ts-check
// Helios AST building

import {
    Source,
    assert,
    assertDefined
} from "./utils.js";

import {
    Group,
    Site,
    SymbolToken,
    Token,
    UserError,
    Word
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
    CallExpr,
    ChainExpr,
    DataSwitchExpr,
    EnumSwitchExpr,
    FuncArg,
    FuncLiteralExpr,
    FuncTypeExpr,
    IfElseExpr,
    ListLiteralExpr,
    ListTypeExpr,
    MapLiteralExpr,
    MapTypeExpr,
    MemberExpr,
    NameTypePair,
    OptionTypeExpr,
    ParensExpr,
    PrimitiveLiteralExpr,
    PrintExpr,
    StructLiteralExpr,
    StructLiteralField,
    SwitchCase,
    SwitchDefault,
    TypeExpr,
    TypePathExpr,
    TypeRefExpr,
    UnaryExpr,
    UnconstrDataSwitchCase,
    ValueExpr,
    ValuePathExpr,
    ValueRefExpr,
    VoidExpr,
    VoidTypeExpr
} from "./helios-ast-expressions.js";

import {
    ConstStatement,
    DataField,
    EnumMember,
    EnumStatement,
    FuncStatement,
    ImplDefinition,
    ImportStatement,
    Statement,
    StructStatement
} from "./helios-ast-statements.js";

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
		const t = assertDefined(ts.shift()).assertWord();
		const kw = t.value;

		if (kw == "const") {
			statements.push(buildConstStatement(t.site, ts));
		} else if (kw == "struct") {
			statements.push(buildStructStatement(t.site, ts));
		} else if (kw == "func") {
			statements.push(buildFuncStatement(t.site, ts));
		} else if (kw == "enum") {
			statements.push(buildEnumStatement(t.site, ts));
		} else if (kw == "import") {
			statements = statements.concat(buildImportStatements(t.site, ts));
		} else {
			throw t.syntaxError(`invalid top-level keyword '${kw}'`);
		}
	}

	return statements;
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {[number, Word]} - [purpose, name] (ScriptPurpose is an integer)
 * @package
 */
export function buildScriptPurpose(ts) {
	// need at least 2 tokens for the script purpose
	if (ts.length < 2) {
		throw ts[0].syntaxError("invalid script purpose syntax");
	}

	const purposeWord = assertDefined(ts.shift()).assertWord();

	let purpose;
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
		throw purposeWord.syntaxError(`script purpose missing`);
	} else {
		throw purposeWord.syntaxError(`unrecognized script purpose '${purposeWord.value}' (expected 'testing', 'spending', 'staking', 'minting' or 'module')`);
	}

	const name = assertDefined(ts.shift()).assertWord().assertNotKeyword();

	return [purpose, name];
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

		let [purposeId, nameWord] = buildScriptPurpose(ts);

		return [getPurposeName(purposeId), nameWord.value];
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
 * @returns {ConstStatement}
 */
function buildConstStatement(site, ts) {
	const name = assertDefined(ts.shift()).assertWord().assertNotKeyword();

	let typeExpr = null;
	if (ts[0].isSymbol(":")) {
		ts.shift();

		const equalsPos = SymbolToken.find(ts, "=");

		if (equalsPos == -1) {
			throw site.syntaxError("invalid syntax");
		}

		typeExpr = buildTypeExpr(ts.splice(0, equalsPos));
	}

	const maybeEquals = ts.shift();
	if (maybeEquals === undefined) {
		throw site.syntaxError("expected '=' after 'consts'");
	} else {
		void maybeEquals.assertSymbol("=");

		const nextStatementPos = Word.find(ts, ["const", "func", "struct", "enum", "import"]);

		const tsValue = nextStatementPos == -1 ? ts.splice(0) : ts.splice(0, nextStatementPos);

		const valueExpr = buildValueExpr(tsValue);

		if (ts.length > 0) {
			site.setEndSite(ts[0].site);
		}

		return new ConstStatement(site, name, typeExpr, valueExpr);
	}
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
 * @returns {StructStatement}
 */
function buildStructStatement(site, ts) {
	const maybeName = ts.shift();

	if (maybeName === undefined) {
		throw site.syntaxError("expected name after 'struct'");
	} else {
		const name = maybeName.assertWord().assertNotKeyword();

		const maybeBraces = ts.shift();
		if (maybeBraces === undefined) {
			throw name.syntaxError(`expected '{...}' after 'struct ${name.toString()}'`);
		} else {
			const braces = maybeBraces.assertGroup("{", 1);

			const [tsFields, tsImpl] = splitDataImpl(braces.fields[0]);

			const fields = buildDataFields(tsFields);

			const impl = buildImplDefinition(tsImpl, new TypeRefExpr(name), fields.map(f => f.name), braces.site.endSite);

			if (ts.length > 0) {
				site.setEndSite(ts[0].site);
			}

			return new StructStatement(site, name, fields, impl);
		}
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
			throw fieldName.typeError(`duplicate field \'${fieldName.toString()}\'`);
		}
	}

	while (ts.length > 0) {
		const colonPos = SymbolToken.find(ts, ":");

		if (colonPos == -1) {
			throw ts[0].syntaxError("expected ':' in data field");
		}

		const tsBef = ts.slice(0, colonPos);
		const tsAft = ts.slice(colonPos+1);
		const maybeFieldName = tsBef.shift();
		if (maybeFieldName === undefined) {
			throw ts[colonPos].syntaxError("expected word before ':'");
		} else {
			const fieldName = maybeFieldName.assertWord().assertNotKeyword();

			assertUnique(fieldName);

			if (tsAft.length == 0) {
				throw ts[colonPos].syntaxError("expected type expression after ':'");
			}

			const nextColonPos = SymbolToken.find(tsAft, ":");

			if (nextColonPos != -1) {
				if (nextColonPos == 0) {
					throw tsAft[nextColonPos].syntaxError("expected word before ':'");
				}

				void tsAft[nextColonPos-1].assertWord();

				ts = tsAft.splice(nextColonPos-1);
			} else {
				ts = [];
			}

			const typeExpr = buildTypeExpr(tsAft);

			fields.push(new DataField(fieldName, typeExpr));
		}
	}

	return fields;
}

/**
 * @package
 * @param {Site} site 
 * @param {Token[]} ts 
 * @param {?TypeExpr} methodOf - methodOf !== null then first arg can be named 'self'
 * @returns {FuncStatement}
 */
function buildFuncStatement(site, ts, methodOf = null) {
	const name = assertDefined(ts.shift()).assertWord().assertNotKeyword();

	const fnExpr = buildFuncLiteralExpr(ts, methodOf, false);

	if (ts.length > 0) {
		site.setEndSite(ts[0].site);
	}

	return new FuncStatement(site, name, fnExpr);
}

/**
 * @package
 * @param {Token[]} ts 
 * @param {?TypeExpr} methodOf - methodOf !== null then first arg can be named 'self'
 * @param {boolean} allowInferredRetType
 * @returns {FuncLiteralExpr}
 */
function buildFuncLiteralExpr(ts, methodOf = null, allowInferredRetType = false) {
	const parens = assertDefined(ts.shift()).assertGroup("(");
	const site = parens.site;
	const args = buildFuncArgs(parens, methodOf);

	const arrow = assertDefined(ts.shift()).assertSymbol("->");

	const bodyPos = Group.find(ts, "{");

	if (bodyPos == -1) {
		throw site.syntaxError("no function body");
	} else if (bodyPos == 0 && !allowInferredRetType) {
		throw site.syntaxError("no return type specified");
	}

	const retTypeExprs = buildFuncRetTypeExprs(arrow.site, ts.splice(0, bodyPos), allowInferredRetType);
	const bodyExpr = buildValueExpr(assertDefined(ts.shift()).assertGroup("{", 1).fields[0]);

	return new FuncLiteralExpr(site, args, retTypeExprs, bodyExpr);
}

/**
 * @package
 * @param {Group} parens 
 * @param {?TypeExpr} methodOf - methodOf !== nul then first arg can be named 'self'
 * @returns {FuncArg[]}
 */
function buildFuncArgs(parens, methodOf = null) {
	/** @type {FuncArg[]} */
	const args = [];

	let someNoneUnderscore = parens.fields.length == 0;

	for (let i = 0; i < parens.fields.length; i++) {
		const f = parens.fields[i];
		const ts = f.slice();

		const name = assertDefined(ts.shift()).assertWord();

		if (name.toString() == "self") {
			someNoneUnderscore = true;

			if (i != 0 || methodOf === null) {
				throw name.syntaxError("'self' is reserved");
			} else {
				if (ts.length > 0) {
					if (ts[0].isSymbol(":")) {
						throw ts[0].syntaxError("unexpected type expression after 'self'");
					} else {
						throw ts[0].syntaxError("unexpected token");
					}
				} else {
					args.push(new FuncArg(name, methodOf));
				}
			}
		} else if (name.toString() == "_") {
			if (ts.length > 0) {
				if (ts[0].isSymbol(":")) {
					throw ts[0].syntaxError("unexpected type expression after '_'");
				} else {
					throw ts[0].syntaxError("unexpected token");
				}
			} else {
				args.push(new FuncArg(name, methodOf));
			}
		} else {
			someNoneUnderscore = true;

			name.assertNotKeyword();

			for (let prev of args) {
				if (prev.name.toString() == name.toString()) {
					throw name.syntaxError(`duplicate argument '${name.toString()}'`);
				}
			}

			const maybeColon = ts.shift();
			if (maybeColon === undefined) {
				throw name.syntaxError(`expected ':' after '${name.toString()}'`);
			} else {
				const colon = maybeColon.assertSymbol(":");

				if (ts.length == 0) {
					throw colon.syntaxError("expected type expression after ':'");
				}

				const typeExpr = buildTypeExpr(ts);

				args.push(new FuncArg(name, typeExpr));
			}
		}
	}

	if (!someNoneUnderscore) {
		throw parens.syntaxError("expected at least one non-underscore function argument");
	}

	return args;
}

/**
 * @package
 * @param {Site} site 
 * @param {Token[]} ts 
 * @returns {EnumStatement}
 */
function buildEnumStatement(site, ts) {
	const maybeName = ts.shift();

	if (maybeName === undefined) {
		throw site.syntaxError("expected word after 'enum'");
	} else {
		const name = maybeName.assertWord().assertNotKeyword();

		const maybeBraces = ts.shift();
		if (maybeBraces === undefined) {
			throw name.syntaxError(`expected '{...}' after 'enum ${name.toString()}'`);
		} else {
			const braces = maybeBraces.assertGroup("{", 1);

			const [tsMembers, tsImpl] = splitDataImpl(braces.fields[0]);

			if (tsMembers.length == 0) {
				throw braces.syntaxError("expected at least one enum member");
			}

			/** @type {EnumMember[]} */
			const members = [];

			while (tsMembers.length > 0) {
				members.push(buildEnumMember(tsMembers));
			}

			const impl = buildImplDefinition(tsImpl, new TypeRefExpr(name), members.map(m => m.name), braces.site.endSite);

			if (ts.length > 0) {
				site.setEndSite(ts[0].site);
			}

			return new EnumStatement(site, name, members, impl);
		}
	}
}

/**
 * @package
 * @param {Site} site 
 * @param {Token[]} ts 
 * @returns {ImportStatement[]}
 */
function buildImportStatements(site, ts) {
	const maybeBraces = ts.shift();

	if (maybeBraces === undefined) {
		throw site.syntaxError("expected '{...}' after 'import'");
	} else {
		const braces = maybeBraces.assertGroup("{");

		const maybeFrom = ts.shift();

		if (maybeFrom === undefined) {
			throw maybeBraces.syntaxError("expected 'from' after 'import {...}'");
		} else {
			const maybeModuleName = ts.shift();

			if (maybeModuleName === undefined) {
				throw maybeFrom.syntaxError("expected module name after 'import {...} from'");
			} else {
				maybeFrom.assertWord("from");
				const moduleName = maybeModuleName.assertWord().assertNotKeyword();

				if (braces.fields.length === 0) {
					throw braces.syntaxError("expected at least 1 import field");
				}

				return braces.fields.map(fts => {
					const ts = fts.slice();
					const maybeOrigName = ts.shift();

					if (maybeOrigName === undefined) {
						throw braces.syntaxError("empty import field");
					} else {
						const origName = maybeOrigName.assertWord();
						if (ts.length === 0) {
							return new ImportStatement(site, origName, origName, moduleName);
						} else {
							const maybeAs = ts.shift();

							if (maybeAs === undefined) {
								throw maybeOrigName.syntaxError(`expected 'as' or nothing after '${origName.value}'`);
							} else {
								maybeAs.assertWord("as");

								const maybeNewName = ts.shift();

								if (maybeNewName === undefined) {
									throw maybeAs.syntaxError("expected word after 'as'");
								} else {
									const newName = maybeNewName.assertWord();

									const rem = ts.shift();
									if (rem !== undefined) {
										throw rem.syntaxError("unexpected");
									} else {
										return new ImportStatement(site, newName, origName, moduleName);
									}
								}
							}
						}
					}
				})
			}
		}
	}
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {EnumMember}
 */
function buildEnumMember(ts) {
	const name = assertDefined(ts.shift()).assertWord().assertNotKeyword();

	if (ts.length == 0 || ts[0].isWord()) {
		return new EnumMember(name, []);
	} else {
		const braces = assertDefined(ts.shift()).assertGroup("{", 1);

		const fields = buildDataFields(braces.fields[0]);

		return new EnumMember(name, fields);
	}
}

/** 
 * @package
 * @param {Token[]} ts 
 * @param {TypeRefExpr} selfTypeExpr - reference to parent type
 * @param {Word[]} fieldNames - to check if impl statements have a unique name
 * @param {?Site} endSite
 * @returns {ImplDefinition}
 */
function buildImplDefinition(ts, selfTypeExpr, fieldNames, endSite) {
	/**
	 * @param {Word} name 
	 */
	function assertNonAuto(name) {
		if (name.toString() == "serialize" || name.toString() == "__eq" || name.toString() == "__neq" || name.toString() == "from_data") {
			throw name.syntaxError(`'${name.toString()}' is a reserved member`);
		}
	}

	for (let fieldName of fieldNames) {
		assertNonAuto(fieldName);
	}

	const statements = buildImplMembers(ts, selfTypeExpr);

	/** 
	 * @param {number} i 
	 */
	function assertUnique(i) {
		let s = statements[i];

		assertNonAuto(s.name);

		for (let fieldName of fieldNames) {
			if (fieldName.toString() == s.name.toString()) {
				throw s.name.syntaxError(`'${s.name.toString()}' is duplicate`);
			}
		}

		for (let j = i+1; j < statements.length; j++) {
			if (statements[j].name.toString() == s.name.toString()) {
				throw statements[j].name.syntaxError(`'${s.name.toString()}' is duplicate`);
			}
		}
	}

	const n = statements.length;

	for (let i = 0; i < n; i++) {
		assertUnique(i);
	}

	if (n > 0 && endSite !== null) {
		statements[n-1].site.setEndSite(endSite);
	}

	return new ImplDefinition(selfTypeExpr, statements);
}

/**
 * @package
 * @param {Token[]} ts 
 * @param {TypeExpr} methodOf
 * @returns {(ConstStatement | FuncStatement)[]}
 */
function buildImplMembers(ts, methodOf) {
	/** @type {(ConstStatement | FuncStatement)[]} */
	const statements = [];

	while (ts.length != 0) {
		const t = assertDefined(ts.shift()).assertWord();
		const kw = t.value;

		let s;

		if (kw == "const") {
			s = buildConstStatement(t.site, ts);
		} else if (kw == "func") {
			s = buildFuncStatement(t.site, ts, methodOf);
		} else {
			throw t.syntaxError("invalid impl syntax");
		}

		statements.push(s);
	}

	return statements
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {TypeExpr}
 */
function buildTypeExpr(ts) {
	assert(ts.length > 0);

	if (ts[0].isGroup("[")) {
		return buildListTypeExpr(ts);
	} else if (ts[0].isWord("Map")) {
		return buildMapTypeExpr(ts);
	} else if (ts[0].isWord("Option")) {
		return buildOptionTypeExpr(ts);
	} else if (ts.length > 1 && ts[0].isGroup("(") && ts[1].isSymbol("->")) {
		return buildFuncTypeExpr(ts);
	} else if (ts.length > 1 && ts[0].isWord() && ts[1].isSymbol("::")) {
		return buildTypePathExpr(ts);
	} else if (ts[0].isWord()) {
		return buildTypeRefExpr(ts);
	} else {
		throw ts[0].syntaxError("invalid type syntax")
	}
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {ListTypeExpr}
 */
function buildListTypeExpr(ts) {
	const brackets = assertDefined(ts.shift()).assertGroup("[", 0);

	const itemTypeExpr = buildTypeExpr(ts);

	return new ListTypeExpr(brackets.site, itemTypeExpr);
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {MapTypeExpr}
 */
function buildMapTypeExpr(ts) {
	const kw = assertDefined(ts.shift()).assertWord("Map");

	const maybeKeyTypeExpr = ts.shift();

	if (maybeKeyTypeExpr === undefined) {
		throw kw.syntaxError("missing Map key-type");
	} else {
		const keyTypeTs = maybeKeyTypeExpr.assertGroup("[", 1).fields[0];
		if (keyTypeTs.length == 0) {
			throw kw.syntaxError("missing Map key-type (brackets can't be empty)");
		} else {
			const keyTypeExpr = buildTypeExpr(keyTypeTs);

			if (ts.length == 0) {
				throw kw.syntaxError("missing Map value-type");
			} else {
				const valueTypeExpr = buildTypeExpr(ts);

				return new MapTypeExpr(kw.site, keyTypeExpr, valueTypeExpr);
			}
		}
	}
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {TypeExpr}
 */
function buildOptionTypeExpr(ts) {
	const kw = assertDefined(ts.shift()).assertWord("Option");

	const someTypeExpr = buildTypeExpr(assertDefined(ts.shift()).assertGroup("[", 1).fields[0]);

	const typeExpr = new OptionTypeExpr(kw.site, someTypeExpr);
	if (ts.length > 0) {
		if (ts[0].isSymbol("::") && ts[1].isWord(["Some", "None"])) {
			if (ts.length > 2) {
				throw ts[2].syntaxError("unexpected token");
			}

			return new TypePathExpr(ts[0].site, typeExpr, ts[1].assertWord());
		} else {
			throw ts[0].syntaxError("invalid option type syntax");
		}
	} else {
		return typeExpr;
	}
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {FuncTypeExpr}
 */
function buildFuncTypeExpr(ts) {
	const parens = assertDefined(ts.shift()).assertGroup("(");

	const argTypes = parens.fields.map(f => buildTypeExpr(f.slice()));

	const arrow = assertDefined(ts.shift()).assertSymbol("->");

	const retTypes = buildFuncRetTypeExprs(arrow.site, ts, false);

	return new FuncTypeExpr(parens.site, argTypes, retTypes.map(t => assertDefined(t)));
}

/**
 * @package
 * @param {Site} site 
 * @param {Token[]} ts 
 * @param {boolean} allowInferredRetType
 * @returns {(?TypeExpr)[]}
 */
function buildFuncRetTypeExprs(site, ts, allowInferredRetType = false) {
	if (ts.length === 0) {
		if (allowInferredRetType) {
			return [null];
		} else {
			throw site.syntaxError("expected type expression after '->'");
		}
	} else {
		if (ts[0].isGroup("(") && (ts.length == 1 || !ts[1].isSymbol("->"))) {
			const group = assertDefined(ts.shift()).assertGroup("(");

			if (group.fields.length == 0) {
				return [new VoidTypeExpr(group.site)];
			} else if (group.fields.length == 1) {
				throw group.syntaxError("expected 0 or 2 or more types in multi return type");
			} else {
				return group.fields.map(fts => {
					fts = fts.slice();

					return buildTypeExpr(fts);
				});
			}
		} else {
			return [buildTypeExpr(ts)];
		}
	}
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {TypePathExpr}
 */
function buildTypePathExpr(ts) {
	const baseName = assertDefined(ts.shift()).assertWord().assertNotKeyword();

	const symbol = assertDefined(ts.shift()).assertSymbol("::");

	const memberName = assertDefined(ts.shift()).assertWord();

	if (ts.length > 0) {
		throw ts[0].syntaxError("invalid type syntax");
	}

	return new TypePathExpr(symbol.site, new TypeRefExpr(baseName), memberName);
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {TypeRefExpr}
 */
function buildTypeRefExpr(ts) {
	const name = assertDefined(ts.shift()).assertWord().assertNotKeyword();

	if (ts.length > 0) {
		throw ts[0].syntaxError("invalid type syntax");
	}

	return new TypeRefExpr(name);
}

/**
 * @package
 * @param {Token[]} ts 
 * @param {number} prec 
 * @returns {ValueExpr}
 */
function buildValueExpr(ts, prec = 0) {
	assert(ts.length > 0);

	// lower index in exprBuilders is lower precedence
	/** @type {((ts: Token[], prev: number) => ValueExpr)[]} */
	const exprBuilders = [
		/**
		 * 0: lowest precedence is assignment
		 * @param {Token[]} ts_ 
		 * @param {number} prec_ 
		 * @returns 
		 */
		function (ts_, prec_) {
			return buildMaybeAssignOrPrintExpr(ts_, prec_);
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
 * @returns {ValueExpr}
 */
function buildMaybeAssignOrPrintExpr(ts, prec) {
	let semicolonPos = SymbolToken.find(ts, ";");
	const equalsPos = SymbolToken.find(ts, "=");
	const printPos = Word.find(ts, "print");

	if (semicolonPos == -1) {
		if (equalsPos != -1) {
			throw ts[equalsPos].syntaxError("invalid assignment syntax, expected ';' after '...=...'");
		} else {
			return buildValueExpr(ts, prec + 1);
		}
	} else {
		if ((equalsPos == -1 || equalsPos > semicolonPos) && (printPos == -1 || printPos > semicolonPos)) {
			const upstreamExpr = buildValueExpr(ts.splice(0, semicolonPos), prec+1);
			const site = assertDefined(ts.shift()).site;

			if (ts.length == 0) {
				throw site.syntaxError("expected expression after ';'");
			} else {
				const downstreamExpr = buildValueExpr(ts, prec);

				return new ChainExpr(site, upstreamExpr, downstreamExpr);
			}
		} else if (equalsPos != -1 && equalsPos < semicolonPos) {
			if (printPos != -1) {
				if (printPos <= semicolonPos) {
					throw ts[printPos].syntaxError("expected ';' after 'print(...)'");
				}
			}

			const equalsSite = ts[equalsPos].assertSymbol("=").site;

			const lts = ts.splice(0, equalsPos);

			const lhs = buildAssignLhs(equalsSite, lts);
			
			assertDefined(ts.shift()).assertSymbol("=");

			semicolonPos = SymbolToken.find(ts, ";");
			assert(semicolonPos != -1);

			let upstreamTs = ts.splice(0, semicolonPos);
			if (upstreamTs.length == 0) {
				throw equalsSite.syntaxError("expected expression between '=' and ';'");
			}

			const upstreamExpr = buildValueExpr(upstreamTs, prec + 1);

			const semicolonSite = assertDefined(ts.shift()).assertSymbol(";").site;

			if (ts.length == 0) {
				throw semicolonSite.syntaxError("expected expression after ';'");
			}

			const downstreamExpr = buildValueExpr(ts, prec);

			return new AssignExpr(equalsSite, lhs, upstreamExpr, downstreamExpr);
		} else if (printPos != -1 && printPos < semicolonPos) {
			if (equalsPos != -1) {
				if (equalsPos <= semicolonPos) {
					throw ts[equalsPos].syntaxError("expected ';' after '...=...'");
				}
			}

			const printSite = assertDefined(ts.shift()).assertWord("print").site;

			const maybeParens = ts.shift();

			if (maybeParens === undefined) {
				throw ts[printPos].syntaxError("expected '(...)' after 'print'");
			} else {
				const parens = maybeParens.assertGroup("(", 1);

				const msgExpr = buildValueExpr(parens.fields[0]);

				const semicolonSite = assertDefined(ts.shift()).assertSymbol(";").site;

				if (ts.length == 0) {
					throw semicolonSite.syntaxError("expected expression after ';'");
				}

				const downstreamExpr = buildValueExpr(ts, prec);

				return new PrintExpr(printSite, msgExpr, downstreamExpr);
			}
		} else {
			throw new Error("unhandled");
		}
	}
}

/**
 * @package
 * @param {Site} site 
 * @param {Token[]} ts 
 * @returns {NameTypePair[]}
 */
function buildAssignLhs(site, ts) {
	const maybeName = ts.shift();
	if (maybeName === undefined) {
		throw site.syntaxError("expected a name before '='");
	} else {
		/**
		 * @type {NameTypePair[]}
		 */
		const pairs = [];

		if (maybeName.isWord()) {
			const name = maybeName.assertWord().assertNotKeyword();

			if (ts.length > 0) {
				const colon = assertDefined(ts.shift()).assertSymbol(":");

				if (ts.length == 0) {
					throw colon.syntaxError("expected type expression after ':'");
				} else {
					const typeExpr = buildTypeExpr(ts);

					pairs.push(new NameTypePair(name, typeExpr));
				}
			} else {
				pairs.push(new NameTypePair(name, null));
			}
		} else if (maybeName.isGroup("(")) {
			const group = maybeName.assertGroup("(");

			if (group.fields.length < 2) {
				throw group.syntaxError("expected at least 2 lhs' for multi-assign");
			}

			let someNoneUnderscore = false;
			for (let fts of group.fields) {
				if (fts.length == 0) {
					throw group.syntaxError("unexpected empty field for multi-assign");
				}

				fts = fts.slice();

				const name = assertDefined(fts.shift()).assertWord();

				if (name.value === "_") {
					if (fts.length !== 0) {
						throw fts[0].syntaxError("unexpected token after '_' in multi-assign");
					}

					pairs.push(new NameTypePair(name, null));
				} else {
					someNoneUnderscore = true;

					name.assertNotKeyword();

					const maybeColon = fts.shift();
					
					if (maybeColon === undefined) {
						throw name.syntaxError(`expected ':' after '${name.toString()}'`);
					}
					
					const colon = maybeColon.assertSymbol(":");

					if (fts.length === 0) {
						throw colon.syntaxError("expected type expression after ':'");
					}

					const typeExpr = buildTypeExpr(fts);

					// check that name is unique
					pairs.forEach(p => {
						if (p.name.value === name.value) {
							throw name.syntaxError(`duplicate name '${name.value}' in lhs of multi-assign`);
						}
					});

					pairs.push(new NameTypePair(name, typeExpr));
				}
			}

			if (!someNoneUnderscore) {
				throw group.syntaxError("expected at least one non-underscore in lhs of multi-assign");
			}
		} else {
			throw maybeName.syntaxError("unexpected syntax for lhs of =");
		}

		return pairs;
	}
}

/**
 * @package
 * @param {string | string[]} symbol 
 * @returns {(ts: Token[], prec: number) => ValueExpr}
 */
function makeBinaryExprBuilder(symbol) {
	// default behaviour is left-to-right associative
	return function (ts, prec) {
		const iOp = SymbolToken.findLast(ts, symbol);

		if (iOp == ts.length - 1) {
			// post-unary operator, which is invalid
			throw ts[iOp].syntaxError(`invalid syntax, '${ts[iOp].toString()}' can't be used as a post-unary operator`);
		} else if (iOp > 0) { // iOp == 0 means maybe a (pre)unary op, which is handled by a higher precedence
			const a = buildValueExpr(ts.slice(0, iOp), prec);
			const b = buildValueExpr(ts.slice(iOp + 1), prec + 1);

			return new BinaryExpr(ts[iOp].assertSymbol(), a, b);
		} else {
			return buildValueExpr(ts, prec + 1);
		}
	};
}

/**
 * @package
 * @param {string | string[]} symbol 
 * @returns {(ts: Token[], prec: number) => ValueExpr}
 */
function makeUnaryExprBuilder(symbol) {
	// default behaviour is right-to-left associative
	return function (ts, prec) {
		if (ts[0].isSymbol(symbol)) {
			const rhs = buildValueExpr(ts.slice(1), prec);

			return new UnaryExpr(ts[0].assertSymbol(), rhs);
		} else {
			return buildValueExpr(ts, prec + 1);
		}
	}
}

/**
 * @package
 * @param {Token[]} ts 
 * @param {number} prec 
 * @returns {ValueExpr}
 */
function buildChainedValueExpr(ts, prec) {
	/** @type {ValueExpr} */
	let expr = buildChainStartValueExpr(ts);

	// now we can parse the rest of the chaining
	while (ts.length > 0) {
		const t = assertDefined(ts.shift());

		if (t.isGroup("(")) {
			expr = new CallExpr(t.site, expr, buildCallArgs(t.assertGroup()));
		} else if (t.isGroup("[")) {
			throw t.syntaxError("invalid expression '[...]'");
		} else if (t.isSymbol(".") && ts.length > 0 && ts[0].isWord("switch")) {
			expr = buildSwitchExpr(expr, ts);
		} else if (t.isSymbol(".")) {
			const name = assertDefined(ts.shift()).assertWord().assertNotKeyword();

			expr = new MemberExpr(t.site, expr, name);
		} else if (t.isGroup("{")) {
			throw t.syntaxError("invalid syntax");
		} else if (t.isSymbol("::")) {
			throw t.syntaxError("invalid syntax");
		} else {
			throw t.syntaxError(`invalid syntax '${t.toString()}'`);
		}
	}

	return expr;
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {ValueExpr}
 */
function buildChainStartValueExpr(ts) {
	if (ts.length > 1 && ts[0].isGroup("(") && ts[1].isSymbol("->")) {
		return buildFuncLiteralExpr(ts, null, true);
	} else if (ts[0].isWord("if")) {
		return buildIfElseExpr(ts);
	} else if (ts[0].isWord("switch")) {
		throw ts[0].syntaxError("expected '... .switch' instead of 'switch'");
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
			throw ts[0].syntaxError(`invalid use of '${ts[0].assertWord().value}', can only be used as top-level statement`);
		} else {
			const name = assertDefined(ts.shift()).assertWord();

			// only place where a word can be "self"
			return new ValueRefExpr(name.value == "self" ? name : name.assertNotKeyword());
		}
	} else {
		throw ts[0].syntaxError("invalid syntax");
	}
}

/**
 * @package
 * @param {Token[]} ts
 * @returns {ValueExpr}
 */
function buildParensExpr(ts) {
	const group = assertDefined(ts.shift()).assertGroup("(");
	const site = group.site;

	if (group.fields.length === 0) {
		throw group.syntaxError("expected at least one expr in parens");
	} else {
		return new ParensExpr(site, group.fields.map(fts => buildValueExpr(fts)));
	}
}

/**
 * @package
 * @param {Group} parens 
 * @returns {ValueExpr[]}
 */
function buildCallArgs(parens) {
	return parens.fields.map(fts => buildValueExpr(fts));
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {IfElseExpr}
 */
function buildIfElseExpr(ts) {
	const site = assertDefined(ts.shift()).assertWord("if").site;

	/** @type {ValueExpr[]} */
	const conditions = [];

	/** @type {ValueExpr[]} */
	const branches = [];
	while (true) {
		const parens = assertDefined(ts.shift()).assertGroup("(");
		const braces = assertDefined(ts.shift()).assertGroup("{");

		if (parens.fields.length != 1) {
			throw parens.syntaxError("expected single if-else condition");
		}

		if (braces.fields.length == 0) {
			throw braces.syntaxError("branch body can't be empty");
		} else if (braces.fields.length != 1) {
			throw braces.syntaxError("expected single if-else branch expession");
		}

		conditions.push(buildValueExpr(parens.fields[0]));
		branches.push(buildValueExpr(braces.fields[0]));

		const maybeElse = ts.shift();

		if (maybeElse === undefined ) {
			// add a void else branch
			branches.push(new VoidExpr(braces.site));
			break;
		} else {
			maybeElse.assertWord("else");

			const next = assertDefined(ts.shift());
			if (next.isGroup("{")) {
				// last group
				const braces = next.assertGroup();
				if (braces.fields.length != 1) {
					throw braces.syntaxError("expected single expession for if-else branch");
				}
				branches.push(buildValueExpr(braces.fields[0]));
				break;
			} else if (next.isWord("if")) {
				continue;
			} else {
				throw next.syntaxError("unexpected token");
			}
		}
	}

	return new IfElseExpr(site, conditions, branches);
}

/**
 * @package
 * @param {ValueExpr} controlExpr
 * @param {Token[]} ts 
 * @returns {ValueExpr} - EnumSwitchExpr or DataSwitchExpr
 */
function buildSwitchExpr(controlExpr, ts) {
	const site = assertDefined(ts.shift()).assertWord("switch").site;

	const braces = assertDefined(ts.shift()).assertGroup("{");

	/** @type {SwitchCase[]} */
	const cases = [];

	/** @type {?SwitchDefault} */
	let def = null;

	for (let tsInner of braces.fields) {
		if (tsInner[0].isWord("else")) {
			if (def !== null) {
				throw def.syntaxError("duplicate 'else' in switch");
			}

			def = buildSwitchDefault(tsInner);
		} else {
			if (def !== null) {
				throw def.syntaxError("switch 'else' must come last");
			}

			cases.push(buildSwitchCase(tsInner));
		}
	}

	// check the uniqueness of each case here
	/** @type {Set<string>} */
	const set = new Set()
	for (let c of cases) {
		let t = c.memberName.toString();
		if (set.has(t)) {
			throw c.memberName.syntaxError(`duplicate switch case '${t}')`);
		}

		set.add(t);
	}

	if (cases.length < 1) {
		throw site.syntaxError("expected at least one switch case");
	}

	if (cases.some(c => c.isDataMember())) {
		if (cases.length + (def === null ? 0 : 1) > 5) {
			throw site.syntaxError(`too many cases for data switch, expected 5 or less, got ${cases.length.toString()}`);
		} else {
			let count = 0;
			cases.forEach(c => {if (!c.isDataMember()){count++}});

			if (count > 1) {
				throw site.syntaxError(`expected at most 1 enum case in data switch, got ${count}`);
			} else {
				if (count === 1 && cases.some(c => c instanceof UnconstrDataSwitchCase)) {
					throw site.syntaxError(`can't have both enum and (Int, []Data) in data switch`);
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
 * @returns {Word} 
 */
function buildSwitchCaseName(site, ts, isAfterColon) {
	const first = ts.shift();

	if (first === undefined) {
		if (isAfterColon) {
			throw site.syntaxError("invalid switch case syntax, expected member name after ':'");
		} else {
			throw site.syntaxError("invalid switch case syntax");
		}
	}
		
	if (first.isWord("Map")) {
		const second = ts.shift();

		if (second === undefined) {
			throw site.syntaxError("expected token after 'Map'");
		}

		const keyTs = second.assertGroup("[]", 1).fields[0];

		const key = keyTs.shift();

		if (key === undefined) {
			throw second.syntaxError("expected 'Map[Data]Data'");
		}

		key.assertWord("Data");

		if (keyTs.length > 0) {
			throw keyTs[0].syntaxError("unexpected token after 'Data'");
		}

		const third = ts.shift();

		if (third === undefined) {
			throw site.syntaxError("expected token after 'Map[Data]")
		}

		third.assertWord("Data");

		if (ts.length > 0) {
			throw ts[0].syntaxError("unexpected token after 'Map[Data]Data'");
		}

		return new Word(first.site, "Map[Data]Data");
	} else if (first.isWord()) {
		if (ts.length > 0) {
			throw ts[0].syntaxError("unexpected token");
		}

		return first.assertWord().assertNotKeyword();
	} else if (first.isGroup("[")) {
		// list 
		first.assertGroup("[", 0);

		const second = ts.shift();

		if (second === undefined) {
			throw site.syntaxError("expected token after '[]'");
		} else if (ts.length > 0) {
			throw ts[0].syntaxError("unexpected token");
		}

		second.assertWord("Data");

		return new Word(first.site, "[]Data");
	} else {
		throw first.syntaxError("invalid switch case name syntax");
	}
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {SwitchCase}
 */
function buildSwitchCase(ts) {
	const arrowPos = SymbolToken.find(ts, "=>");

	if (arrowPos == -1) {
		throw ts[0].syntaxError("expected '=>' in switch case");
	} else if (arrowPos == 0) {
		throw ts[0].syntaxError("expected '<word>' or '<word>: <word>' to the left of '=>'");
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
 * @returns {[?Word, Word]} - varName is optional
 */
function buildSwitchCaseNameType(ts) {
	const colonPos = SymbolToken.find(ts, ":");

	/** @type {?Word} */
	let varName = null;

	/** @type {?Word} */
	let memberName = null;

	if (colonPos != -1) {
		varName = assertDefined(ts.shift()).assertWord().assertNotKeyword();
		
		const maybeColon = ts.shift();
		if (maybeColon === undefined) {
			throw varName.syntaxError("invalid switch case syntax, expected '(<name>: <enum-member>)', got '(<name>)'");
		} else {
			void maybeColon.assertSymbol(":");

			memberName = buildSwitchCaseName(maybeColon.site, ts, true);
		}
	} else {
		memberName = buildSwitchCaseName(ts[0].site, ts, false);
	}

	if (ts.length !== 0) {
		throw new Error("unexpected");
	}

	if (memberName === null) {
		throw new Error("unexpected");
	} else {
		return [varName, memberName];
	}
}

/**
 * @package
 * @param {Token[]} tsLeft
 * @param {Token[]} ts
 * @returns {SwitchCase}
 */
function buildMultiArgSwitchCase(tsLeft, ts) {
	const parens = assertDefined(tsLeft.shift()).assertGroup("(");

	const pairs = parens.fields.map(fts => buildSwitchCaseNameType(fts));

	assert(tsLeft.length === 0);

	if (pairs.length !== 2) {
		throw parens.syntaxError(`expected (Int, []Data) case, got (${pairs.map(p => p[1].value).join(", ")}`);
	} else if (pairs[0][1].value != "Int" || pairs[1][1].value != "[]Data") {
		throw parens.syntaxError(`expected (Int, []Data) case, got (${pairs[0][1].value}, ${pairs[1][1].value})`);
	} else {
		const maybeArrow = ts.shift();

		if (maybeArrow === undefined) {
			throw parens.syntaxError("expected '=>'");
		} else {
			const arrow = maybeArrow.assertSymbol("=>");

			const bodyExpr = buildSwitchCaseBody(arrow.site, ts);

			return new UnconstrDataSwitchCase(arrow.site, pairs[0][0], pairs[1][0], bodyExpr);
		}
	}
}

/**
 * @package
 * @param {Token[]} tsLeft 
 * @param {Token[]} ts 
 * @returns {SwitchCase}
 */
function buildSingleArgSwitchCase(tsLeft, ts) {
	/** @type {[?Word, Word]} */
	const [varName, memberName] = buildSwitchCaseNameType(tsLeft);
	
	const maybeArrow = ts.shift();

	if (maybeArrow === undefined) {
		throw memberName.syntaxError("expected '=>'");
	} else {
		const arrow = maybeArrow.assertSymbol("=>");

		const bodyExpr = buildSwitchCaseBody(arrow.site, ts);

		return new SwitchCase(arrow.site, varName, memberName, bodyExpr);
	}
}

/**
 * @package
 * @param {Site} site 
 * @param {Token[]} ts 
 * @returns {ValueExpr}
 */
function buildSwitchCaseBody(site, ts) {
	/** @type {?ValueExpr} */
	let bodyExpr = null;

	if (ts.length == 0) {
		throw site.syntaxError("expected expression after '=>'");
	} else if (ts[0].isGroup("{")) {
		if (ts.length > 1) {
			throw ts[1].syntaxError("unexpected token");
		}

		const tsBody = ts[0].assertGroup("{", 1).fields[0];
		bodyExpr = buildValueExpr(tsBody);
	} else {
		bodyExpr = buildValueExpr(ts);
	}

	if (bodyExpr === null) {
		throw site.syntaxError("empty switch case body");
	} else {
		return bodyExpr;
	}
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {SwitchDefault}
 */
function buildSwitchDefault(ts) {
	const site = assertDefined(ts.shift()).assertWord("else").site;

	const maybeArrow = ts.shift();
	if (maybeArrow === undefined) {
		throw site.syntaxError("expected '=>' after 'else'");
	} else {
		const arrow = maybeArrow.assertSymbol("=>");

		/** @type {?ValueExpr} */
		let bodyExpr = null;
		if (ts.length == 0) {
			throw arrow.syntaxError("expected expression after '=>'");
		} else if (ts[0].isGroup("{")) {
			if (ts.length > 1) {
				throw ts[1].syntaxError("unexpected token");
			} else {
				bodyExpr = buildValueExpr(ts[0].assertGroup("{", 1).fields[0]);
			}
		} else {
			bodyExpr = buildValueExpr(ts);
		}

		if (bodyExpr === null) {
			throw arrow.syntaxError("empty else body");
		} else {
			return new SwitchDefault(arrow.site, bodyExpr);
		}
	}
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {ListLiteralExpr}
 */
function buildListLiteralExpr(ts) {
	const site = assertDefined(ts.shift()).assertGroup("[", 0).site;

	const bracesPos = Group.find(ts, "{");

	if (bracesPos == -1) {
		throw site.syntaxError("invalid list literal expression syntax");
	}

	const itemTypeExpr = buildTypeExpr(ts.splice(0, bracesPos));

	const braces = assertDefined(ts.shift()).assertGroup("{");

	const itemExprs = braces.fields.map(fts => buildValueExpr(fts));

	return new ListLiteralExpr(site, itemTypeExpr, itemExprs);
}

/**
 * @package
 * @param {Token[]} ts
 * @returns {MapLiteralExpr}
 */
function buildMapLiteralExpr(ts) {
	const site = assertDefined(ts.shift()).assertWord("Map").site;

	const bracket = assertDefined(ts.shift()).assertGroup("[", 1);

	const keyTypeExpr = buildTypeExpr(bracket.fields[0]);

	const bracesPos = Group.find(ts, "{");

	if (bracesPos == -1) {
		throw site.syntaxError("invalid map literal expression syntax");
	}

	const valueTypeExpr = buildTypeExpr(ts.splice(0, bracesPos));

	const braces = assertDefined(ts.shift()).assertGroup("{");

	/**
	 * @type {[ValueExpr, ValueExpr][]}
	 */
	const pairs = braces.fields.map(fts => {
		const colonPos = SymbolToken.find(fts, ":");

		if (colonPos == -1) {
			if (fts.length == 0) {
				throw braces.syntaxError("unexpected empty field");
			} else {
				throw fts[0].syntaxError("expected ':' in map literal field");
			}
		} else if (colonPos == 0) {
			throw fts[colonPos].syntaxError("expected expression before ':' in map literal field");
		} else if (colonPos == fts.length - 1) {
			throw fts[colonPos].syntaxError("expected expression after ':' in map literal field");
		}

		const keyExpr = buildValueExpr(fts.slice(0, colonPos));

		const valueExpr = buildValueExpr(fts.slice(colonPos+1));

		/**
		 * @type {[ValueExpr, ValueExpr]}
		 */
		return [keyExpr, valueExpr];
	});

	return new MapLiteralExpr(site, keyTypeExpr, valueTypeExpr, pairs);
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {StructLiteralExpr}
 */
function buildStructLiteralExpr(ts) {
	const bracesPos = Group.find(ts, "{");

	assert(bracesPos != -1);

	const typeExpr = buildTypeExpr(ts.splice(0, bracesPos));

	const braces = assertDefined(ts.shift()).assertGroup("{");

	const fields = braces.fields.map(fts => buildStructLiteralField(braces.site, fts));

	if (fields.every(f => f.isNamed()) || fields.every(f => !f.isNamed())) {
		return new StructLiteralExpr(typeExpr, fields);
	} else {
		throw braces.site.syntaxError("mangled literal struct (hint: specify all fields positionally or all with keys)");
	}
}

/**
 * @package
 * @param {Site} bracesSite
 * @param {Token[]} ts
 * @returns {StructLiteralField}
 */
function buildStructLiteralField(bracesSite, ts) {
	if (ts.length > 2 && ts[0].isWord() && ts[1].isSymbol(":")) {
		const maybeName = ts.shift();
		if (maybeName === undefined) {
			throw bracesSite.syntaxError("empty struct literal field");
		} else {
			const name = maybeName.assertWord();

			const maybeColon = ts.shift();
			if (maybeColon === undefined) {
				throw bracesSite.syntaxError("expected ':'");
			} else {
				const colon = maybeColon.assertSymbol(":");

				if (ts.length == 0) {
					throw colon.syntaxError("expected expression after ':'");
				} else {
					const valueExpr = buildValueExpr(ts);

					return new StructLiteralField(name.assertNotKeyword(), valueExpr);
				}
			}
		}
	} else {
		const valueExpr = buildValueExpr(ts);

		return new StructLiteralField(null, valueExpr);
	}
}

/**
 * @package
 * @param {Token[]} ts 
 * @returns {ValueExpr}
 */
function buildValuePathExpr(ts) {
	const dcolonPos = SymbolToken.findLast(ts, "::");

	assert(dcolonPos != -1);

	const typeExpr = buildTypeExpr(ts.splice(0, dcolonPos));

	assertDefined(ts.shift()).assertSymbol("::");

	const memberName = assertDefined(ts.shift()).assertWord().assertNotKeyword();
	
	return new ValuePathExpr(typeExpr, memberName);
}