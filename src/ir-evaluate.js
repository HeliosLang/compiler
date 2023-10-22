//@ts-check
// IR pseudo evaluation

import {
    TAB
} from "./config.js";

import {
    assert,
    assertClass,
    assertDefined,
    textToBytes
} from "./utils.js";

import {
    RuntimeError,
    Site,
    Word
} from "./tokens.js";

import { 
	ByteArrayData,
	ConstrData, 
	IntData,
	ListData,
	MapData,
    UplcData
} from "./uplc-data.js";

import {
    BUILTIN_PREFIX,
    SAFE_BUILTIN_SUFFIX
} from "./uplc-builtins.js";

/**
 * @typedef {import('./uplc-ast.js').UplcValue} UplcValue
 */

import {
    UplcBool,
    UplcBuiltin,
    UplcByteArray,
    UplcDataValue,
    UplcInt,
    UplcList,
    UplcPair,
    UplcString,
    UplcUnit,
    
} from "./uplc-ast.js";

import {
    IRVariable
} from "./ir-context.js";

/**
 * @typedef {import("./ir-ast.js").IRExpr} IRExpr
 */

import {
    IRCallExpr,
    IRErrorExpr,
    IRLiteralExpr,
    IRNameExpr,
    IRFuncExpr,
    loopIRExprs
} from "./ir-ast.js";


/**
 * @internal
 * @typedef {{
 *   toString(): string
 *   isLiteral(): boolean
 *   hasError(maybe: boolean): boolean
 *   withoutLiterals(): IRValue
 *   withoutErrors(): IRValue
 *   dump(codeMapper: IRValueCodeMapper, depth?: number): any
 * }} IRValue
 */


/**
 * @internal
 */
class IRStack {
    /**
     * @readonly
     * @type {[IRVariable, IRValue][]}
     */
    values;

    #isLiteral;

    /**
     * @param {[IRVariable, IRValue][]} values 
     * @param {boolean} isLiteral
     */
    constructor(values, isLiteral) {
        this.values = values;
        this.#isLiteral = isLiteral || values.length == 0;
    }

    /**
     * @param {IRVariable} variable 
     * @returns {boolean}
     */
    static isGlobal(variable) {
        return variable.name.match(/^__(helios|const|module)__/) !== null;
    }

    /**
     * @param {IRValueCodeMapper} codeMapper 
     * @param {number} depth 
     * @returns {any}
     */
    dump(codeMapper, depth = 0) {
        return {
            isLiteral: this.#isLiteral,
            codes: codeMapper.getCodes(this),
            ...(depth > 0 ? {values: this.values.map(([_, arg]) => {
                return arg.dump(codeMapper, depth - 1)
            })} : {})
        }
    }

    /**
     * @returns {boolean}
     */
    isLiteral() {
        return this.#isLiteral;
    }

    /**
     * @return {IRStack}
     */
    withoutLiterals() {
        /**
         * @type {[IRVariable, IRValue][]}
         */
        const varVals = this.values.map(([vr, vl]) => {
            if (IRStack.isGlobal(vr)) {
                return [vr, vl];
            } else {
                return [vr, vl.withoutLiterals()]
            }
        });

        return new IRStack(
            varVals, 
            varVals.every(([_, v]) => v.isLiteral())
        );
    }

    /**
     * @param {IRVariable} v 
     * @returns {IRValue}
     */
    getValue(v) {
        const j = this.values.findIndex(([va]) => va == v)

        if (j != -1) {
            return this.values[j][1];
        }

        throw new Error(`${v.name} not found in IRStack`);
    }

    /**
     * @param {[IRVariable, IRValue][]} args 
     * @returns {IRStack}
     */
    extend(args) {
        assert(args.every(([_, v]) => !(v instanceof IRErrorValue)));

        return new IRStack(
            this.values.concat(args),
            this.#isLiteral && args.every(([_, v]) => v.isLiteral())
        );
    }

    /**
     * @param {Set<IRVariable>} irVars 
     * @returns {IRStack}
     */
    filter(irVars) {
        const varVals = this.values.filter(([v]) => irVars.has(v));
        return new IRStack(varVals, varVals.every(([_, v]) => v.isLiteral()));
    }

    /**
     * @returns {IRStack}
     */
    static empty() {
        return new IRStack([], true);
    }

    /**
     * Both stack are expected to have the same shape
     * TODO: get rid of this
     * @param {IRStack} other
     * @returns {IRStack}
     */
    merge(other) {
        const n = this.values.length;

        assert(n == other.values.length);

        let stack = IRStack.empty();

        for (let i = 0; i < n; i++) {
            const a = this.values[i];
            const b = other.values[i];

            if (a == b) {
                stack = stack.extend([a]);
            } else {
                stack = stack.extend([[a[0], IRMultiValue.flatten([a[1], b[1]])]]);
            }
        }

        return stack;
    }
}

/**
 * @internal
 * @implements {IRValue}
 */
export class IRLiteralValue {
	/**
	 * @readonly
	 */
	value;

	/**
	 * @param {UplcValue} value 
	 */
	constructor(value) {
		this.value = value;
	}

    /**
     * @returns {string}
     */
    toString() {
        return this.value.toString();
    }

    /**
     * @returns {boolean}
     */
    isLiteral() {
        return true;
    }

    /**
     * @param {boolean} maybe
     * @returns {boolean}
     */
    hasError(maybe = true) {
        return false;
    }

    /**
     * @returns {IRValue}
     */
    withoutLiterals() {
        if (this.value instanceof UplcUnit) {
            return new IRAnyValue();
        } else {
            return new IRDataValue();
        }
    }

    /**
     * @returns {IRValue}
     */
    withoutErrors() {
        return this;
    }

    /**
     * @param {IRValueCodeMapper} codeMapper 
     * @param {number} depth 
     * @returns {any}
     */
    dump(codeMapper, depth = 0) {
        return {
            type: "Literal",
            code: codeMapper.getCode(this),
            value: this.toString()
        }
    }
}

/**
 * @internal
 * @implements {IRValue}
 */
export class IRDataValue {
    /**
     * @returns {boolean}
     */
    isLiteral() {
        return false;
    }

    /**
     * @returns {IRValue}
     */
    withoutLiterals() {
        return this;
    }

    /**
     * @param {boolean} maybe
     * @returns {boolean}
     */
    hasError(maybe = true) {
        return false;
    }

    /**
     * @returns {IRValue}
     */
    withoutErrors() {
        return this;
    }

    /**
     * @returns {string}
     */
    toString() {
        return `Data`;
    }

    /**
     * @param {IRValueCodeMapper} codeMapper 
     * @param {number} depth 
     * @returns 
     */
    dump(codeMapper, depth = 0) {
        return {
            code: codeMapper.getCode(this),
            type: "Data"
        }
    }
}

/**
 * @param {IRExpr} expr 
 * @returns {Set<IRVariable>}
 */
function collectIRVariables(expr) {
    /**
     * @type {Set<IRVariable>}
     */
    const s = new Set();

    loopIRExprs(expr, {
        nameExpr: (nameExpr) => {
            if (!nameExpr.isCore()) {
                s.add(nameExpr.variable);
            }
        }
    });

    return s;
}

/**
 * @internal
 * @implements {IRValue}
 */
export class IRBuiltinValue {
    /**
     * @readonly
     * @type {IRNameExpr}
     */
    builtin;

    /**
     * @param {IRNameExpr} builtin 
     */
    constructor(builtin) {
		assert(builtin.isCore());

        this.builtin = builtin;
    }

    /**
     * @type {string}
     */
    get builtinName() {
        let name = this.builtin.name.slice(BUILTIN_PREFIX.length);

        if (name.endsWith(SAFE_BUILTIN_SUFFIX)) {
            name = name.slice(0, name.length - SAFE_BUILTIN_SUFFIX.length);
        }

        return name;
    }

    /**
     * @returns {string}
     */
    toString() {
        return `Builtin__${this.builtinName}`;
    }

    /**
     * @returns {boolean}
     */
    isLiteral() {
        return true;
    }

    /**
     * @returns {IRValue}
     */
    withoutLiterals() {
        return this;
    }

    /**
     * @param {boolean} maybe
     * @returns {boolean}
     */
    hasError(maybe = true) {
        return false;
    }

    /**
     * @returns {IRValue}
     */
    withoutErrors() {
        return this;
    }

    /**
     * @param {IRValueCodeMapper} codeMapper 
     * @param {number} depth 
     * @returns {any}
     */
    dump(codeMapper, depth = 0) {
        return {
            type: "Builtin",
            code: codeMapper.getCode(this),
            name: this.builtin.name
        }
    }
}

/**
 * @internal
 * @implements {IRValue}
 */
export class IRFuncValue {
    /**
     * @readonly
     * @type {IRStack}
     */
    stack;

	/**
	 * @readonly
	 * @type {IRFuncExpr}
	 */
	definition;

	/**
     * @param {IRFuncExpr} definition
     * @param {IRStack} stack
	 */
	constructor(definition, stack) {
        this.definition = definition;
        const irVars = collectIRVariables(definition);
        this.stack = stack.filter(irVars);
	}

    /**
     * @param {IRFuncExpr} definition 
     * @param {IRStack} stack 
     * @returns {IRFuncValue}
     */
    static new(definition, stack) {
        return new IRFuncValue(definition, stack);
    }

    /**
     * @returns {boolean}
     */
    isLiteral() {
        return this.stack.isLiteral();
    }

    /**
     * @returns {IRValue}
     */
    withoutLiterals() {
        return new IRFuncValue(this.definition, this.stack.withoutLiterals());
    }

    /**
     * @param {boolean} maybe
     * @returns {boolean}
     */
    hasError(maybe = true) {
        return false;
    }

    /**
     * @returns {IRValue}
     */
    withoutErrors() {
        return this;
    }

    /**
     * @param {IRValueCodeMapper} codeMapper 
     * @param {number} depth 
     * @returns {any}
     */
    dump(codeMapper, depth = 0) {
        return {
            type: "Fn",
            tag: this.definition.tag,
            codes: codeMapper.getCodes(this),
            definition: this.definition.toString(),
            stack: this.stack.dump(codeMapper, depth)
        }
    }

    /**
     * @returns {string}
     */
    toString() {
        return `Fn${this.definition.tag}`;
    }
}

/**
 * @internal
 * @implements {IRValue}
 */
export class IRErrorValue {
    /**
     * @returns {boolean}
     */
    isLiteral() {
        return false;
    }

    /**
     * @returns {IRValue}
     */
    withoutLiterals() {
        return this;
    }

    /**
     * @param {boolean} maybe
     * @returns {boolean}
     */
    hasError(maybe = true) {
        return true;
    }

    /**
     * @returns {IRValue}
     */
    withoutErrors() {
        throw new Error("can't remove IRErrorValue from IRErrorValue");
    }

    /**
     * @returns {string}
     */
    toString() {
        return `Error`;
    }

    /**
     * @param {IRValueCodeMapper} codeMapper 
     * @param {number} depth 
     * @returns {any}
     */
    dump(codeMapper, depth = 0) {
        return {
            type: "Error",
            code: codeMapper.getCode(this)
        }
    }
}

/**
 * Can be Data of any function
 * Simply eliminated when encountered in an IRMultiValue
 * @internal
 * @implements {IRValue}
 */
export class IRAnyValue {
    /**
     * @returns {boolean}
     */
    isLiteral() {
        return false;
    }

    /**
     * @returns {IRValue}
     */
    withoutLiterals() {
        return this;
    }

    /**
     * Maybe this IRAnyValue instance represents an Error, we can't know for sure.
     * @param {boolean} maybe
     * @returns {boolean}
     */
    hasError(maybe = true) {
        return maybe;
    }

    /**
     * @returns {IRValue}
     */
    withoutErrors() {
        return this;
    }

    /**
     * @returns {string}
     */
    toString() {
        return `Any`;
    }

    /**
     * @param {IRValueCodeMapper} codeMapper 
     * @param {number} depth 
     * @returns {any}
     */
    dump(codeMapper, depth = 0) {
        return {
            type: "Any",
            code: codeMapper.getCode(this)
        }
    }
}

/**
 * @internal
 * @implements {IRValue}
 */
export class IRMultiValue {
	/**
	 * @readonly
	 */
	values;

	/**
	 * @param {IRValue[]} values 
	 */
	constructor(values) {
        assert(values.every(v => !(v instanceof IRLiteralValue)));
		this.values = values;
	}

    /**
     * @param {boolean} maybe
     * @returns {boolean}
     */
    hasError(maybe = true) {
        return this.values.some(v => v.hasError(maybe));
    }

    /**
     * @returns {boolean}
     */
    isLiteral() {
        return false;
    }

    /**
     * @returns {IRValue}
     */
    withoutLiterals() {
        return IRMultiValue.flatten(this.values.map(v => v.withoutLiterals()));
    }

    /**
     * @returns {boolean}
     */
    hasData() {
        return this.values.some(v => v instanceof IRDataValue);
    }

    /**
     * @returns {boolean}
     */
    hasLiteral() {
        return this.values.some(v => v instanceof IRLiteralValue);
    }

    /**
     * @param {IRValueCodeMapper} codeMapper 
     * @param {number} depth 
     * @returns {any}
     */
    dump(codeMapper, depth = 0) {
        return {
            type: "Multi",
            code: codeMapper.getCode(this),
            values: this.values.slice().map(v => v.dump(codeMapper, depth))
        }
    }

    toString() {
        /**
         * @type {string[]}
         */
        const parts = [];

        if (this.hasError()) {
            parts.push(`Error`);
        }

        if (this.hasData()) {
            parts.push(`Data`);
        }

        this.values.forEach(v => {
            if (v instanceof IRFuncValue) {
                parts.push(`Fn${v.definition.tag}`);
            } else if (v instanceof IRBuiltinValue) {
                parts.push(`Builtin_${v.builtin.name.slice(("__core__").length)}`);
            }
        });

        this.values.forEach(v => {
            if (v instanceof IRLiteralValue) {
                parts.push(v.toString());
            }
        });

        if (parts.length == 1 && parts[0] == `Error` && this.values.some(v => v instanceof IRAnyValue)) {
            parts.push("Any");
        }

        return `(${parts.join(" | ")})`;
    }

	/**
	 * @param {IRValue[]} values 
	 * @returns {IRValue}
	 */
	static flatten(values) {
        if (values.length == 1) {
            return values[0];
        }

		// flatten nested IRMultiValues
		values = values.map(v => {
			if (v instanceof IRMultiValue) {
				return v.values
			} else {
				return [v]
			}
		}).flat();

        if (values.length == 1) {
            return values[0];
        } else if (values.every((v, i) => v instanceof IRLiteralValue && ((i == 0) || (v.toString() == values[0].toString())))) {
            return values[0];
        }
        
        const hasError = values.some(v => v instanceof IRErrorValue);
		const hasData = values.some(v => v instanceof IRDataValue || (v instanceof IRLiteralValue && !(v.value instanceof UplcUnit)));
        const hasAny = values.some(v => v instanceof IRAnyValue || (v instanceof IRLiteralValue && v.value instanceof UplcUnit));

		/**
		 * @type {IRValue[]}
		 */
		let flattened = [];

		if (values.some(v => v instanceof IRFuncValue || v instanceof IRBuiltinValue)) {
			/**
			 * @type {Map<IRExpr, IRFuncValue | IRBuiltinValue>}
			 */
			const s = new Map();

			values.forEach(v => {
				if (v instanceof IRFuncValue) {
                    const prev = s.get(v.definition);

                    if (prev instanceof IRFuncValue) {
                        s.set(v.definition, IRFuncValue.new(v.definition, prev.stack.merge(v.stack)));
                    } else {
                        s.set(v.definition, v);
                    }
                } else if (v instanceof IRBuiltinValue) {
                    s.set(v.builtin, v)
                }
			});

            flattened = flattened.concat(Array.from(s.values()));
		} else if (hasData) {
            flattened.push(new IRDataValue());
        } else if (hasAny) {
            flattened.push(new IRAnyValue());
        }

        if (hasError) {
            flattened.push(new IRErrorValue());
        }

        if (flattened.length == 1) {
			return flattened[0];
		} else {
			return new IRMultiValue(flattened);
		}
	}

	/**
	 * @param {IRValue[]} values 
	 * @returns {IRValue[][]}
	 */
	static allPermutations(values) {
		if (!values.some(v => v instanceof IRMultiValue)) {
			return [values];
		} else {
			/**
			 * @type {IRValue[][]}
			 */
			const permutations = [];

			let ns = values.map(v => {
				if (v instanceof IRMultiValue) {
					return v.values.length;
				} else {
					return 1;
				}
			});

			let N = ns.reduce((prev, n) => {
				return prev * n
			}, 1);

			for (let i = 0; i < N; i++) {
				let j = i;

				/**
				 * @type {number[]}
				 */
				const is = [];

				ns.forEach(n => {
					is.push(j % n);

					j = Math.floor(j / n);
				});

				permutations.push(is.map((j, i) => {
					const v = assertDefined(values[i]);

					if (v instanceof IRMultiValue) {
						return v.values[j];
					} else {
						assert(j == 0);
						return v;
					}
				}));
			}

			return permutations;
		}
	}

    /**
     * @returns {IRValue}
     */
    withoutErrors() {
        return IRMultiValue.flatten(this.values.filter(v => !(v instanceof IRErrorValue)));
    }
}

/**
 * Codes are used to combine multiple IRValues (including nested IRStacks that are part of IRFuncValues) into a single number.
 * 
 * We can't have however use the full depth of IRStack values because there could be callback-recursion.
 * @internal
 */
class IRValueCodeMapper {
    /**
     * @type {number}
     */
    #nextUnused;

    /**
     * @type {Map<string, number>}
     */
    #usedCodes;

    /**
     * @type {Map<IRValue | IRStack, number[]>}
     */
    #valueCodes;

    constructor() {
        this.#usedCodes = new Map([
            ["Any", 0],
            ["Data", 1],
            ["Error", 2]
        ]);
        this.#nextUnused = 3;
        this.#valueCodes = new Map();
    }

    static get maxDepth() {
        return 10;
    }

    /**
     * @private
     * @param {string} key 
     * @returns {number}
     */
    genCode(key) {
        let code = this.#usedCodes.get(key);

        if (code !== undefined) {
            return code;
        }

        code = this.#nextUnused;
        this.#nextUnused += 1;

        this.#usedCodes.set(key, code);

        return code;
    }

    /**
     * @private
     * @param {IRValue | IRStack} v 
     * @returns {number[]}
     */
    genCodes(v) {
        if (v instanceof IRBuiltinValue) {
            return (new Array(IRValueCodeMapper.maxDepth)).fill(this.genCode(v.builtinName));
        } else if (v instanceof IRDataValue) {
            return (new Array(IRValueCodeMapper.maxDepth)).fill(this.genCode("Data"));
        } else if (v instanceof IRErrorValue) {
            return (new Array(IRValueCodeMapper.maxDepth)).fill(this.genCode("Error"));
        } else if (v instanceof IRAnyValue) {
            return (new Array(IRValueCodeMapper.maxDepth)).fill(this.genCode("Any"));
        } else if (v instanceof IRLiteralValue) {
            return (new Array(IRValueCodeMapper.maxDepth)).fill(this.genCode(v.value.toString()));
        } else if (v instanceof IRFuncValue) {
            const tag = `Fn${assertDefined(v.definition.tag)}`;
            const stackCodes = this.getCodes(v.stack);

            /**
             * @type {number[]}
             */
            const codes = [];

            for (let i = 0; i < IRValueCodeMapper.maxDepth; i++) {
                const key = i == 0 ? tag : `${tag}(${stackCodes[i-1]})`;

                codes.push(this.genCode(key));
            }

            return codes;
        } else if (v instanceof IRStack) {
            const valueCodes = v.values.map(([_, v]) => this.getCodes(v));

            /**
             * @type {number[]}
             */
            const codes = [];

            for (let i = 0; i < IRValueCodeMapper.maxDepth - 1; i++) {
                const key = `[${valueCodes.map(vc => vc[i]).join(",")}]`;
                codes.push(this.genCode(key));
            }

            return codes;
        } else if (v instanceof IRMultiValue) {
            const valueCodes = v.values.map(v => this.getCodes(v));

            /**
             * @type {number[]}
             */
            const codes = [];

            for (let i = 0; i < IRValueCodeMapper.maxDepth; i++) {
                const key = `{${valueCodes.map(vc => vc[i]).sort().join(",")}}`;
                codes.push(this.genCode(key));
            }

            return codes;
        } else {
            throw new Error("unhandled");
        }
    }

    /**
     * @param {IRValue | IRStack} v 
     * @returns {number[]}
     */
    getCodes(v) {
        const cached = this.#valueCodes.get(v);

        if (cached) {
            return cached;
        }

        const codes = this.genCodes(v);

        this.#valueCodes.set(v, codes);

        return codes;
    }

    /**
     * @param {IRValue} v
     * @returns {number}
     */
    getCode(v) {
        const codes = this.getCodes(v);

        return codes[IRValueCodeMapper.maxDepth-1];
    }

    /**
     * @param {IRValue} fn 
     * @param {IRValue[]} args 
     */
    getCallCode(fn, args) {
        const key = `${assertDefined(this.getCode(fn))}(${args.map(a => this.getCode(a)).join(",")})`;
        return this.genCode(key);
    }

    /**
     * @param {IRValue} a 
     * @param {IRValue} b 
     * @returns {boolean}
     */
    eq(a, b) {
        const ca = this.getCode(a);
        const cb = this.getCode(b);

        return ca == cb;
    }
}

/**
 * @internal
 * @type {{[name: string]: (args: IRValue[]) => IRValue}}
 */
const IR_BUILTIN_CALLBACKS = {
    addInteger: ([a, b]) => {
        return new IRDataValue();
    },
    subtractInteger: ([a, b]) => {
        return new IRDataValue();
    },
    multiplyInteger: ([a, b]) => {
        if (a instanceof IRLiteralValue && a.value.int == 0n) {
            return a;
        } else if (b instanceof IRLiteralValue && b.value.int == 0n) {
            return b;
        } else {
            return new IRDataValue();
        }
    },
    divideInteger: ([a, b]) => {
        if (a instanceof IRLiteralValue && a.value.int == 0n) {
            return IRMultiValue.flatten([a, new IRErrorValue()]);
        } else if (b instanceof IRLiteralValue) {
            if (b.value.int == 0n) {
                return new IRErrorValue();
            } else if (b.value.int == 1n) {
                return a;
            } else {
                return new IRDataValue();
            }
        } else {
            return IRMultiValue.flatten([new IRDataValue(), new IRErrorValue()]);
        }
    },
    modInteger: ([a, b]) => {
        if (b instanceof IRLiteralValue) {
            if (b.value.int == 1n) {
                return new IRLiteralValue(new UplcInt(b.value.site, 0n, true));
            } else if (b.value.int == 0n) {
                return new IRErrorValue();
            } else {
                return new IRDataValue();
            }
        } else {
            return IRMultiValue.flatten([
                new IRDataValue(),
                new IRErrorValue()
            ]);
        }
    },
    quotientInteger: ([a, b]) => {
        if (a instanceof IRLiteralValue && a.value.int == 0n) {
            return IRMultiValue.flatten([a, new IRErrorValue()]);
        } else if (b instanceof IRLiteralValue) {
            if (b.value.int == 0n) {
                return new IRErrorValue();
            } else if (b.value.int == 1n) {
                return a;
            } else {
                return new IRDataValue();
            }
        } else {
            return IRMultiValue.flatten([new IRDataValue(), new IRErrorValue()]);
        }
    },
    remainderInteger: ([a, b]) => {
        if (b instanceof IRLiteralValue) {
            if (b.value.int == 1n) {
                return new IRLiteralValue(new UplcInt(b.value.site, 0n, true));
            } else if (b.value.int == 0n) {
                return new IRErrorValue();
            } else {
                return new IRDataValue();
            }
        } else {
            return IRMultiValue.flatten([
                new IRDataValue(),
                new IRErrorValue()
            ]);
        }
    },
    equalsInteger: ([a, b]) => {
        return new IRDataValue();
    },
    lessThanInteger: ([a, b]) => {
        return new IRDataValue();
    },
    lessThanEqualsInteger: ([a, b]) => {
        return new IRDataValue();
    },
    appendByteString: ([a, b]) => {
        return new IRDataValue();
    },
    consByteString: ([a, b]) => {
        return new IRDataValue();
    },
    sliceByteString: ([a, b, c]) => {
        if (b instanceof IRLiteralValue && b.value.int <= 0n) {
            return new IRLiteralValue(new UplcByteArray(b.value.site, []));
        } else {
            return new IRDataValue();
        }
    },
    lengthOfByteString: ([a]) => {
        return new IRDataValue();
    },
    indexByteString: ([a, b]) => {
        if (b instanceof IRLiteralValue && b.value.int < 0n) {
            return new IRErrorValue();
        } else if (a instanceof IRLiteralValue && a.value.bytes.length == 0) {
            return new IRErrorValue();
        } else {
            return IRMultiValue.flatten([
                new IRDataValue(),
                new IRErrorValue()
            ]);
        }
    },
    equalsByteString: ([a, b]) => {
        return new IRDataValue();
    },
    lessThanByteString: ([a, b]) => {
        return new IRDataValue();
    },
    lessThanEqualsByteString: ([a, b]) => {
        return new IRDataValue();
    },
    appendString: ([a, b]) => {
        return new IRDataValue();
    },
    equalsString: ([a, b]) => {
        return new IRDataValue();
    },
    encodeUtf8: ([a]) => {
        return new IRDataValue();
    },
    decodeUtf8: ([a]) => {
        return IRMultiValue.flatten([
            new IRDataValue(),
            new IRErrorValue()
        ]);
    },
    sha2_256: ([a]) => {
        return new IRDataValue();
    },
    sha3_256: ([a]) => {
        return new IRDataValue();
    },
    blake2b_256: ([a]) => {
        return new IRDataValue();
    },
    verifyEd25519Signature: ([a, b, c]) => {
        if (a instanceof IRLiteralValue && a.value.bytes.length != 32) {
            return new IRErrorValue();
        } else if (c instanceof IRLiteralValue && c.value.bytes.length != 64) {
            return new IRErrorValue();
        } else {
            return IRMultiValue.flatten([
                new IRDataValue(),
                new IRErrorValue()
            ]);
        }
    },
    ifThenElse: ([a, b, c]) => {
        if (a instanceof IRLiteralValue) {
            if (a.value.bool) {
                return b;
            } else {
                return c;
            }
        } else {
            return IRMultiValue.flatten([b, c]);
        }
    },
    chooseUnit: ([a, b]) => {
        return b;
    },
    trace: ([a, b]) => {
        return b;
    },
    fstPair: ([a]) => {
        return new IRDataValue();
    },
    sndPair: ([a]) => {
        return new IRDataValue();
    },
    chooseList: ([a, b, c]) => {
        if (a instanceof IRLiteralValue) {
            if (a.value.list.length == 0) {
                return b;
            } else {
                return c;
            }
        } else {
            return IRMultiValue.flatten([b, c]);
        }
    },
    mkCons: ([a, b]) => {
        return new IRDataValue();
    },
    headList: ([a]) => {
        return IRMultiValue.flatten([
            new IRDataValue(),
            new IRErrorValue()
        ]);
    },
    tailList: ([a]) => {
        return IRMultiValue.flatten([
            new IRDataValue(),
            new IRErrorValue()
        ]);
    },
    nullList: ([a]) => {
        return new IRDataValue();
    },
    chooseData: ([a, b, c, d, e, f]) => {
        if (a instanceof IRLiteralValue) {
            const data = a.value.data;

            if (data instanceof ConstrData) {
                return b;
            } else if (data instanceof MapData) {
                return c;
            } else if (data instanceof ListData) {
                return d;
            } else if (data instanceof IntData) {
                return e;
            } else if (data instanceof ByteArrayData) {
                return f;
            } else {
                throw new Error("unhandled UplcData type");
            }
        } else {
            return IRMultiValue.flatten([b, c, d, e, f]);
        }
    },
    constrData: ([a, b]) => {
        return new IRDataValue();
    },
    mapData: ([a])  => {
        return new IRDataValue();
    },
    listData: ([a]) => {
        return new IRDataValue();
    },
    iData: ([a]) => {
        return new IRDataValue();
    },
    bData: ([a]) => {
        return new IRDataValue();
    },
    unConstrData: ([a]) => {
        return IRMultiValue.flatten([
            new IRDataValue(),
            new IRErrorValue()
        ]);
    },
    unMapData: ([a]) => {
        return IRMultiValue.flatten([
            new IRDataValue(),
            new IRErrorValue()
        ]);
    },
    unListData: ([a]) => {
        return IRMultiValue.flatten([
            new IRDataValue(),
            new IRErrorValue()
        ]);
    },
    unIData: ([a]) => {
        return IRMultiValue.flatten([
            new IRDataValue(),
            new IRErrorValue()
        ]);
    },
    unBData: ([a]) => {
        return IRMultiValue.flatten([
            new IRDataValue(),
            new IRErrorValue()
        ]);
    },
    equalsData: ([a, b]) => {
        return new IRDataValue();
    },
    mkPairData: ([a, b]) => {
        return new IRDataValue();
    },
    mkNilData: ([a]) => {
        return new IRDataValue();
    },
    mkNilPairData: ([a]) => {
        return new IRDataValue();
    },
    serialiseData: ([a]) => {
        return new IRDataValue();
    }
};

/**
 * @internal
 */
export class IREvaluator {
    /**
     * Unwraps an IR AST
     * @type {(
     *   {
     *     stack: IRStack,
     *     expr: IRErrorExpr | IRLiteralExpr | IRNameExpr | IRFuncExpr | IRCallExpr
     *   } |
     *   {calling: IRCallExpr, code: number, args: IRValue[]} |
     *   {fn: IRFuncExpr, owner: null | IRExpr, stack: IRStack} | 
     *   {multi: number, owner: null | IRExpr} | 
     *   {value: IRValue, owner: null | IRExpr} |
     *   {ignore: number, owner: null | IRExpr} | 
     *   {cacheExpr: IRCallExpr, code: number, value: IRValue}
     * )[]}
     */
    #compute;

    /**
     * @type {IRValue[]}
     */
    #reduce;

    /**
	 * Keep track of the eval result of each expression
	 * @type {Map<IRExpr, IRValue>}
	 */
	#exprValues;

    /**
     * Keep track of all values passed through IRVariables
     * @type {Map<IRVariable, IRValue>}
     */
    #variableValues;

    /**
     * IRFuncExpr tag as key
     * @type {Map<number, number>}
     */
    #callCount;

    /**
     * @type {Map<IRFuncExpr, Set<IRCallExpr>>}
     */
    #funcCallExprs;

    /**
     * @type {Map<IRVariable, Set<IRNameExpr>>}
     */
    #variableReferences;

    /**
     * @type {Map<IRCallExpr, Map<number, IRValue>>}
     */
    #cachedCalls;

    #evalLiterals;

    /**
     * @param {boolean} evalLiterals 
     */
	constructor(evalLiterals = true) {
        this.#compute = [];
        this.#reduce = [];

        // data structures used by optimization
        this.#exprValues = new Map();
        this.#variableValues = new Map();
        this.#callCount = new Map();
        this.#funcCallExprs = new Map();
        this.#variableReferences = new Map();
        this.#cachedCalls = new Map();
        this.#evalLiterals = evalLiterals;
	}

    /**
     * @type {IRFuncExpr[]}
     */
    get funcExprs() {
        return Array.from(this.#funcCallExprs.keys());
    }

    /**
     * @param {IRExpr} expr 
     * @returns {undefined | IRValue}
     */
    getExprValue(expr) {
        return this.#exprValues.get(expr);
    }

    /**
     * @param {IRVariable} v
     * @returns {undefined | IRValue}
     */
    getVariableValue(v) {
        return this.#variableValues.get(v);
    }

    /**
     * @param {IRVariable} v 
     * @returns {number}
     */
    countVariableReferences(v) {
        return this.#variableReferences.get(v)?.size ?? 0;
    }

    /**
     * @param {IRVariable} v 
     * @returns {IRNameExpr[]}
     */
    getVariableReferences(v) {
        return Array.from(this.#variableReferences.get(v) ?? [])
    }

    /**
     * @param {IRFuncExpr} fn
     * @returns {number}
     */
    countFuncCalls(fn) {
        return this.#callCount.get(fn.tag) ?? 0;
    }

    /**
     * @param {IRExpr} expr 
     * @returns {boolean}
     */
    expectsError(expr) {
        const v = this.getExprValue(expr);

        if (v) {
            if (v instanceof IRErrorValue) {
                return true;
            } else if (v instanceof IRMultiValue && v.hasError()) {
                return true;
            } else if (v instanceof IRAnyValue) {
                return true;
            } else {
                return false;
            }
        } else {
            // the expression might be recently formed, so if not found, better be on the safe side
            return true;
        }
    }

    /**
     * @param {IRFuncExpr} fn
     * @returns {number[]} indices
     */
    getUnusedFuncVariables(fn) {
        /**
         * @type {number[]}
         */
        const indices = [];

        fn.args.forEach((a, i) => {
            const s = this.#variableReferences.get(a);
            if (!s || s.size == 0) {
                indices.push(i);
            }
        })

        return indices;
    }

    /**
     * @param {IRFuncExpr} fn 
     * @returns {IRCallExpr[]}
     */
    getFuncCallExprs(fn) {
        return Array.from(this.#funcCallExprs.get(fn) ?? []);
    }

    /**
     * @param {IRFuncExpr} fn 
     * @returns {boolean}
     */
    onlyDedicatedCallExprs(fn) {
        const callExprs = this.getFuncCallExprs(fn);

        // if there are no callExprs then we don't know exactly how the function is called (eg. main), and we can't flatten
        if (callExprs.length == 0) {
            return false;
        }

        return callExprs.every(ce => {
            if (ce.func == fn) {
                // literally calling fn directly
                return true;
            }

            const v = this.getExprValue(ce.func);

            if (!v) {
                return false;
            } else if (v instanceof IRMultiValue) {
                return v.values.every(vv => !(vv instanceof IRFuncValue) || (vv.definition == fn))
            } else if (v instanceof IRFuncValue) {
                //assert(v.definition == fn, `expected ${fn.toString()}, not ${v.definition.toString()}`);
                return true;
            } else {
                throw new Error(`unexpected ${v.toString()}`);
            }
        });
    }

    /**
     * @param {IRFuncExpr} fn
     * @param {number[]} unused
     * @returns {boolean}
     */
    noUnusedArgErrors(fn, unused) {
        const callExprs = this.getFuncCallExprs(fn);

        return callExprs.every(ce => {
            return unused.every(i => {
                return !this.expectsError(ce.args[i]);
            });
        });
    }

    /**
     * @param {IRFuncExpr} first 
     * @param {IRFuncExpr} second
     */
    onlyNestedCalls(first, second) {
        const callExprs = this.getFuncCallExprs(second);

        // if there are no callExprs then we don't know exactly how the function is called (eg. main), and we can't flatten
        if (callExprs.length == 0) {
            return false;
        }

        return callExprs.every(ce => {
            if (ce.func instanceof IRCallExpr) {
                const v = this.getExprValue(ce.func.func);

                if (!v) {
                    return false;
                } else if (v instanceof IRMultiValue) {
                    return v.values.every(vv => !(vv instanceof IRFuncValue) || (vv.definition == first))
                } else if (v instanceof IRFuncValue) {
                    return v.definition == first;
                } else {
                    throw new Error(`unexpected ${v.toString()}`);
                }
            } else {
                return false;
            }
        });
    }

    /**
     * The newExpr should evaluate to exactly the same values etc. as the oldExpr
     * @param {IRExpr} oldExpr 
     * @param {IRExpr} newExpr 
     */
    notifyCopyExpr(oldExpr, newExpr) {
        const oldValue = this.#exprValues.get(oldExpr);
        if (oldValue) {
            this.#exprValues.set(newExpr, oldValue);
        }
    }

    /**
     * Push onto the computeStack, unwrapping IRCallExprs
     * @private
     * @param {IRStack} stack
     * @param {IRExpr} expr
     */
    pushExpr(stack, expr) {
        if (expr instanceof IRErrorExpr) {
            this.#compute.push({stack: stack, expr: expr});
        } else if (expr instanceof IRLiteralExpr) {
            this.#compute.push({stack: stack, expr: expr});
        } else if (expr instanceof IRNameExpr) {
            this.#compute.push({stack: stack, expr: expr});
        } else if (expr instanceof IRFuncExpr) {
            this.#compute.push({stack: stack, expr: expr});
        } else if (expr instanceof IRCallExpr) {
            this.#compute.push({stack: stack, expr: expr});

            this.pushExpr(stack, expr.func);

            expr.args.forEach(a => this.pushExpr(stack, a));
        } else {
            throw new Error("unexpected expression type");
        }
    }

    /**
     * @private
     * @param {IRExpr} expr 
     * @param {IRValue} value 
     * @returns {IRValue} combined value
     */
    setExprValue(expr, value) {
        const outputs = this.#exprValues.get(expr);

        if (outputs) {
            const combined = IRMultiValue.flatten([outputs, value]);
            this.#exprValues.set(expr, combined);
            return combined;
        } else {
            this.#exprValues.set(expr, value);
            return value;
        }
    }

    /**
     * @private
     * @param {null | IRExpr} owner 
     * @param {IRValue} value 
     */
    pushReductionValue(owner, value) {
        if (owner) {
            const combined = this.setExprValue(owner, value);

            if (value instanceof IRAnyValue || (value instanceof IRMultiValue && value.values.some(v => v instanceof IRAnyValue))) {
                value = combined;
            }
        }

        this.#reduce.push(value);
    }

    /**
     * @private
     * @param {IRStack} stack
     * @param {IRNameExpr} nameExpr
     * @returns {IRValue}
     */
    getValue(stack, nameExpr) {
        const variable = nameExpr.variable;

        const s = this.#variableReferences.get(variable);

        if (s) {
            s.add(nameExpr);
        } else {
            this.#variableReferences.set(variable, new Set([nameExpr]));
        }

        return stack.getValue(variable);
    }

    /**
     * @private
     * @param {IRExpr} owner
     * @param {IRNameExpr} nameExpr 
     * @param {IRValue[]} args
     */
    callBuiltin(owner, nameExpr, args) {
        let builtin = nameExpr.name.slice(BUILTIN_PREFIX.length);
        const isSafe = builtin.endsWith(SAFE_BUILTIN_SUFFIX);
        if (isSafe) {
            builtin = builtin.slice(0, builtin.length - SAFE_BUILTIN_SUFFIX.length);
        }

        // collect results for each permutation of multivalued args

        /**
         * @type {IRValue[][]}
         */
        const permutations = IRMultiValue.allPermutations(args);

        const resValues = permutations.map(args => {
            if (args.every(a => a instanceof IRLiteralValue)) {
                try {
                    const res = UplcBuiltin.evalStatic(new Word(Site.dummy(), builtin), args.map(a => assertClass(a, IRLiteralValue).value));
                    return new IRLiteralValue(res);
                } catch (e) {
                    if (e instanceof RuntimeError) {
                        return new IRErrorValue();
                    } else {
                        throw e;
                    }
                }
            } else if (args.some(a => a instanceof IRErrorValue)) {
                return new IRErrorValue();
            } else {
                const res = assertDefined(IR_BUILTIN_CALLBACKS[builtin], `builtin ${builtin} not defined in IR_BUILTIN_CALLBACKS`)(args);
                
                if (isSafe && res instanceof IRMultiValue && res.hasError()) {
                    return res.withoutErrors();
                } else {
                    return res;
                }
            }
        });

        this.pushReductionValue(owner, IRMultiValue.flatten(resValues));
    }

    /**
     * @private
     * @param {IRFuncExpr} fn 
     */
    incrCallCount(fn) {
        const prev = this.#callCount.get(fn.tag);

        if (prev) {
            this.#callCount.set(fn.tag, Math.min(prev + 1, Number.MAX_SAFE_INTEGER));
        } else {
            this.#callCount.set(fn.tag, 1);
        }
    }

    /**
     * @private
     * @param {IRVariable[]} variables 
     * @param {IRValue[]} values 
     * @returns {[IRVariable, IRValue][]}
     */
    mapVarsToValues(variables, values) {
        assert(variables.length == values.length, "variables and values don't have the same length([" + variables.map(v => v.name).join(",") + "] vs [" + values.map(v => v.toString()).join(",") + "]");

        /**
         * @type {[IRVariable, IRValue][]}
         */
        const m = [];

        variables.forEach((variable, i) => {
            const value = values[i];

            const allValues = this.#variableValues.get(variable);

            if (allValues) {
                this.#variableValues.set(variable, IRMultiValue.flatten([allValues, value]));
            } else {
                this.#variableValues.set(variable, value);
            }

            m.push([variable, value]);
        });

        return m;
    }

    /**
     * @private
     * @param {IRStack} stack
     * @param {null | IRExpr} owner
     * @param {IRFuncExpr} fn
     * @param {IRValue[]} args
     */
    pushFuncCall(stack, owner, fn, args) {
        if (args.some(a => a instanceof IRErrorValue)) {
            this.pushReductionValue(owner, new IRErrorValue());
        } else {
            if (args.some(a => a.hasError(true))) {
                this.#compute.push({multi: 2, owner: owner});
                this.#compute.push({value: new IRErrorValue(), owner: owner});
                args = args.map(a => a.withoutErrors())
            }
            
            const varsToValues = this.mapVarsToValues(fn.args, args);
            stack = stack.extend(varsToValues);
    
            this.incrCallCount(fn);
            this.#compute.push({fn: fn, owner: owner, stack: stack});
            this.pushExpr(stack, fn.body); 
        }
    }

    /**
     * @private
     * @param {IRExpr} owner for entry point ths is the entry point IRFuncExpr, for all other calls this is the IRCallExpr
     * @param {IRFuncValue} v
     * @param {IRValue[]} args 
     */
    callFunc(owner, v, args) {
        const fn = v.definition;
        const stack = v.stack;

        if (owner instanceof IRCallExpr) {
            const s = this.#funcCallExprs.get(fn);

            if (!s) {
                this.#funcCallExprs.set(fn, new Set([owner]));
            } else {
                s.add(owner);
            }
        }

        this.pushFuncCall(stack, owner, fn, args);
    }

    /**
     * Call an unknown function (eg. returned at the deepest point of recursion)
     * Make sure any arguments that are functions are also called so that all possible execution paths are touched (TODO: should we also called function values returned by those calls etc.?)
     * Absorb the return values of these functions
     * @private
     * @param {IRExpr} owner
     * @param {IRAnyValue} fn
     * @param {IRValue[]} args
     */
    callAnyFunc(owner, fn, args) {
        if (args.some(a => a instanceof IRErrorValue)) {
            this.pushReductionValue(owner, new IRErrorValue());
        } else {
            if (args.some(a => a.hasError(false))) {
                this.#compute.push({multi: 2, owner: owner});
                this.#compute.push({value: new IRErrorValue(), owner: owner});
                args = args.map(a => a.withoutErrors())
            }

            /**
             * Only user-defined functions!
             * @type {IRFuncValue[]}
             */
            const fnsInArgs = [];

            args.forEach(a => {
                if (a instanceof IRMultiValue) {
                    a.values.forEach(aa => {
                        if (aa instanceof IRFuncValue) {
                            fnsInArgs.push(aa);
                        }
                    });
                } else if (a instanceof IRFuncValue) {
                    fnsInArgs.push(a);
                }
            });

            this.#compute.push({ignore: fnsInArgs.length, owner: owner});

            fnsInArgs.forEach(fn => {
                const def = assertClass(fn.definition, IRFuncExpr);

                this.pushFuncCall(fn.stack, null, def, def.args.map(a => new IRAnyValue()));
            });
        }
    }

    /**
     * @private
     * @param {IRCallExpr} expr
     * @param {number} code
     * @param {IRValue} value
     */
    cacheValue(expr, code, value) {
        const prev = this.#cachedCalls.get(expr);

        if (prev) {
            const prevPrev = prev.get(code);

            if (prevPrev && !(prevPrev instanceof IRAnyValue)) {
                const newValue = IRMultiValue.flatten([prevPrev, value]);
                prev.set(code, newValue);
            } else {
                prev.set(code, value);
            }
        } else {
            this.#cachedCalls.set(expr, new Map([[code, value]]));
        }
    }

    /**
     * @private
     * @param {IRCallExpr} expr 
     * @param {number} code 
     */
    prepareCacheValue(expr, code) {
        this.#compute.push({value: new IRAnyValue(), cacheExpr: expr, code: code});
    }

    /**
     * @private
     */
    evalInternal() {
        const codeMapper = new IRValueCodeMapper();

        let head = this.#compute.pop();

		while (head) {
            if ("cacheExpr" in head) {
                this.cacheValue(head.cacheExpr, head.code, head.value);
            } else if ("expr" in head) {
                const expr = head.expr;

                if (expr instanceof IRCallExpr) {
                    let fn = assertDefined(this.#reduce.pop());

                    /**
                     * @type {IRValue[]}
                     */
                    let args = [];

                    for (let i = 0; i < expr.args.length; i++) {
                        args.push(assertDefined(this.#reduce.pop()))
                    }

                    // don't allow partial literal args (could lead to infinite recursion where the partial literal keeps updating)
                    //  except when calling builtins (partial literals are important: eg. in divideInteger(<data>, 10) we know that the callExpr doesn't return an error)
                    const allLiteral = fn.isLiteral() && args.every(a => a.isLiteral());

                    if (!allLiteral && !(fn instanceof IRBuiltinValue) && !(fn instanceof IRFuncValue && fn.definition.args.length == 1 && IRStack.isGlobal(fn.definition.args[0]))) {
                        fn = fn.withoutLiterals();
                        args = args.map(a => a.withoutLiterals());
                    }

                    const fns = fn instanceof IRMultiValue ? fn.values : [fn];

                    if (fns.length > 1) {
                        this.#compute.push({multi: fns.length, owner: expr});
                    }

                    for (let fn of fns) {
                        const code = codeMapper.getCallCode(fn, args);
                        const cached = this.#cachedCalls.get(expr)?.get(code);

                        if (cached) {
                            this.pushReductionValue(expr, cached);
                            
                            // increment the call count even though we are using a cached value
                            for (let fn of fns) {
                                if (fn instanceof IRFuncValue) {
                                    this.incrCallCount(fn.definition);
                                }
                            }
                        } else {
                            this.#compute.push({calling: expr, code: code, args: args});
                            //this.cacheValue(expr, code, new IRAnyValue());

                            if (fn instanceof IRAnyValue) {///} || fn instanceof IRDataValue) {
                                this.callAnyFunc(expr, fn, args);
                            } else if (fn instanceof IRErrorValue) {
                                this.pushReductionValue(expr, new IRErrorValue());
                            } else if (fn instanceof IRFuncValue) {
                                this.callFunc(expr, fn, args);
                                this.prepareCacheValue(expr, code);
                            } else if (fn instanceof IRBuiltinValue) {
                                this.callBuiltin(expr, fn.builtin, args);
                                this.prepareCacheValue(expr, code);
                            } else {
                                console.log(expr.toString());
                                throw expr.site.typeError("unable to call " + fn.toString());
                            }
                        }
                    }
                } else if (expr instanceof IRErrorExpr) {
                    this.pushReductionValue(expr, new IRErrorValue());
                } else if (expr instanceof IRNameExpr) {
                    if (expr.isParam()) {
                        this.pushReductionValue(expr, new IRDataValue());
                    } else if (expr.isCore()) {
                        this.pushReductionValue(expr, new IRBuiltinValue(expr));
                    } else {
                        this.pushReductionValue(expr, this.getValue(head.stack, expr));
                    }
                } else if (expr instanceof IRLiteralExpr) {
                    if (this.#evalLiterals ) {
                        this.pushReductionValue(expr, new IRLiteralValue(expr.value));
                    } else {
                        if (expr.value instanceof UplcUnit) {
                            this.pushReductionValue(expr, new IRAnyValue());
                        } else {
                            this.pushReductionValue(expr, new IRDataValue());
                        }
                    }
                } else if (expr instanceof IRFuncExpr) {
                    // don't set owner because it is confusing wrt. return value type
                    this.#reduce.push(IRFuncValue.new(expr, head.stack));
                } else {
                    throw new Error("unexpected expr type");
                }
            } else if ("calling" in head) {
                // keep track of recursive calls
                
                const last = assertDefined(this.#reduce.pop());
                this.cacheValue(head.calling, head.code, last);
                this.pushReductionValue(head.calling, last);
			} else if ("fn" in head && head.fn instanceof IRFuncExpr) {
                // track the owner
                const owner = head.owner;
                const last = assertDefined(this.#reduce.pop());
                
                this.setExprValue(head.fn, last);
                this.pushReductionValue(owner, last);
			} else if ("multi" in head) {
                // collect multiple IRValues from the reductionStack and put it back as a single IRMultiValue

				/**
				 * @type {IRValue[]}
				 */
				const values = [];

				for (let i = 0; i < head.multi; i++) {
					values.push(assertDefined(this.#reduce.pop()));
				}

                this.pushReductionValue(head.owner, IRMultiValue.flatten(values));
            } else if ("value" in head) {
                this.pushReductionValue(head.owner, head.value);
            } else if ("ignore" in head) {
                const vs = [new IRAnyValue()];
                for (let i = 0; i < head.ignore; i++) {
                    if (assertDefined(this.#reduce.pop()) instanceof IRErrorValue) {
                        vs.push(new IRErrorValue());
                    }
                }

                this.pushReductionValue(head.owner, IRMultiValue.flatten(vs));
			} else {
				throw new Error("unexpected term");
			}

            head = this.#compute.pop();
		}
    }

    /**
     * @private
     * @param {IRExpr} expr entry point
     * @returns {IRValue}
     */
    evalFirstPass(expr) {
        this.pushExpr(IRStack.empty(), expr);

        this.evalInternal();

        const res = assertDefined(this.#reduce.pop());

        assert(this.#reduce.length == 0, "expected a single reduction value in first phase [" + this.#reduce.map(v => v.toString()).join(", ") + "]");

        if (res instanceof IRFuncValue) {
            return res;
        } else if (res instanceof IRLiteralValue) {
            return res; // used by const
        } else if (res instanceof IRMultiValue && res.values.some(v => v instanceof IRAnyValue)) {
            return res;
        } else {
            console.log(annotateIR(this, expr));
            throw new Error(`expected entry point function, got ${res.toString()}`);
        }
    }

    /**
     * @private
     * @param {IRFuncValue} main
     * @returns {IRValue}
     */
    evalSecondPass(main) {
        const definition = assertClass(main.definition, IRFuncExpr);
        const args = definition.args.map(a => new IRDataValue());
        this.callFunc(definition, main, args);

        this.evalInternal();

        const res = assertDefined(this.#reduce.pop());

        assert(this.#reduce.length == 0, "expected a single reduction value in second phase [" + res.toString() + ", " + this.#reduce.map(v => v.toString()).join(", ") + "]");

        const finalValues = (res instanceof IRMultiValue) ? res.values : [res];

        for (let v of finalValues) {
            if (v instanceof IRErrorValue) {

                // ok
                /*if (finalValues.length == 1) {
                    console.error("Warning: script always fails");
                }*/
            } else if (v instanceof IRLiteralValue) {
                // ok
            } else if (v instanceof IRDataValue) {
                // ok
            } else {
                // ok, (could be a literal UplcUnit, which is treated as Any because in other contexts it could be a function)
            }
        }

        return IRMultiValue.flatten(finalValues);
    }

	/**
	 * @param {IRExpr} expr entry point
     * @returns {IRValue}
	 */
	eval(expr) {
        const res = this.evalFirstPass(expr);

        if (res instanceof IRFuncValue) {
            return this.evalSecondPass(res);
        } else {
            return res;
        }
	}

    /**
     * @param {IRExpr} expr 
     * @returns {UplcData}
     */
    evalConst(expr) {
        const res = this.evalFirstPass(expr);

        if (res instanceof IRLiteralValue) {
            let v = res.value;

            if (v instanceof UplcDataValue) {
                return v.data;
            } else if (v instanceof UplcInt) {
                return new IntData(v.int);
            } else if (v instanceof UplcBool) {
                return new ConstrData(v.bool ? 1 : 0, []);
            } else if (v instanceof UplcList) {
                if (v.isDataList()) {
                    return new ListData(v.list.map(item => item.data));
                } else if (v.isDataMap()) {
                    return new MapData(v.list.map(item => {
                        const pair = assertClass(item, UplcPair);

                        return [pair.key, pair.value];
                    }));
                }
            } else if (v instanceof UplcString) {
                return new ByteArrayData(textToBytes(v.string));
            } else if (v instanceof UplcByteArray) {
                return new ByteArrayData(v.bytes);
            }

            throw new Error(`unable to turn '${v.toString()}' into data`);
        } else {
            throw new Error("expected IRLiteralValue");
        }
    }
}


/**
 * Used to debug the result of IREvalation
 * @internal
 * @param {IREvaluator} evaluation 
 * @param {IRExpr} expr 
 * @returns {string}
 */
export function annotateIR(evaluation, expr) {
    /**
     * @param {IRExpr} expr 
     * @param {string} indent
     * @returns {string}
     */
    const annotate = (expr, indent) => {
        if (expr instanceof IRLiteralExpr) {
            return expr.value.toString();
        } else if (expr instanceof IRErrorExpr) {
            return `error()`;
        } else if (expr instanceof IRNameExpr) {
            const output = evaluation.getExprValue(expr);

            if (output) {
                return `${expr.name}: ${output.toString()}`
            } else {
                return expr.name;
            }
        } else if (expr instanceof IRFuncExpr) {
            const output = evaluation.getExprValue(expr);

            const isGlobalDef = expr.args.length == 1 && expr.args[0].name.startsWith("__");
            const innerIndent = indent + (isGlobalDef ? "" : TAB);

            let countStr = "";
            const count = evaluation.countFuncCalls(expr);
            if (count == Number.MAX_SAFE_INTEGER) {
                countStr = "\u221e";
            } else {
                countStr = count.toString();
            }

            return `Fn${expr.tag}(${expr.args.map(a => {
                const v = evaluation.getVariableValue(a);

                if (v) {
                    return `${a.name}: ${v.toString()}`;
                } else {
                    return a.name;
                }
            }).join(", ")})${countStr} -> ${output ? output.toString() + " " : ""}{\n${innerIndent}${annotate(expr.body, innerIndent)}\n${indent}}`;
        } else if (expr instanceof IRCallExpr) {
            const output = evaluation.getExprValue(expr);

            const isGlobalDef = expr.func instanceof IRFuncExpr && expr.func.args.length == 1 && expr.func.args[0].name.startsWith("__");
            const globalDef = expr.func instanceof IRFuncExpr && expr.func.args.length == 1 ? expr.func.args[0].name : "";

            const parens = `(${isGlobalDef ? `\n${indent}${TAB}/* ${globalDef} */` : ""}${expr.args.map(a => `\n${indent}${TAB}${annotate(a, indent + TAB)}`).join(",")}${(expr.args.length > 0) || isGlobalDef ? `\n${indent}` : ""})${output ? `: ${output.toString()}` : ""}`;

            if (expr.func instanceof IRNameExpr) {
                return `${expr.func.toString()}${parens}`;
            } else {
                return `${annotate(expr.func, indent)}${parens}`;
            }
        } else {
            throw new Error("unhandled IRExpr");
        }
    }

    return annotate(expr, "");
}