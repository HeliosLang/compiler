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

import {
    UplcBool,
    UplcBuiltin,
    UplcByteArray,
    UplcDataValue,
    UplcInt,
    UplcList,
    UplcPair,
    UplcString,
    UplcValue
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
} from "./ir-ast.js";

/**
 * @internal
 * @typedef {(IRLiteralValue | IRErrorValue | IRDataValue | IRFuncValue | IRAnyValue | IRMultiValue)} IRValue
 */

/**
 * @internal
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
     * @param {IRValue} other 
     * @param {boolean} permissive
     * @returns {boolean}
     */
    eq(other, permissive = false) {
        if (other instanceof IRLiteralValue) {
            return other.value.toString() == this.value.toString() || permissive;
        } else if (permissive && other instanceof IRDataValue) {
            return true;
        } else {
            return other instanceof IRAnyValue;
        }
    }
}

/**
 * @internal
 */
export class IRDataValue {
    /**
     * @param {IRValue} other 
     * @param {boolean} permissive
     * @returns {boolean}
     */
    eq(other, permissive = false) {
        if (permissive && other instanceof IRLiteralValue) {
            return true;
        } else {
            return (other instanceof IRDataValue) || (other instanceof IRAnyValue);
        }
    }

    /**
     * @returns {string}
     */
    toString() {
        return `Data`;
    }
}

/**
 * @internal
 */
export class IRFuncValue {
    /**
     * @readonly
     * @type {IRStack}
     */
    stack;

	/**
	 * @readonly
	 * @type {IRFuncExpr | IRNameExpr}
	 */
	definition;

	/**
     * @param {IRStack} stack
	 * @param {IRFuncExpr | IRNameExpr} def
	 */
	constructor(stack, def) {
        this.stack = stack;
		this.definition = def;

		if (def instanceof IRNameExpr) {
			assert(def.isCore());
		}
	}

    /**
     * @param {IRValue} other 
     * @param {boolean} permissive
     * @returns {boolean}
     */
    eq(other, permissive = false) {
        if (other == this) {
            return true;
        }

        if (other instanceof IRFuncValue) {
            if (this.definition instanceof IRNameExpr && other.definition instanceof IRNameExpr) {
                if (this.definition.isCore() && other.definition.isCore()) {
					return this.definition.name == other.definition.name;
				} else if (!this.definition.isCore() && !other.definition.isCore()) {
                    return this.definition.variable == other.definition.variable;
                } else {
                    return false;
                }
            } else {
                return (this.definition == other.definition && compareIRStacks(this.stack, other.stack, permissive)) || permissive;
            }
        } else {
            return other instanceof IRAnyValue;
        }
    }

    /**
     * @returns {string}
     */
    toString() {
        if (this.definition instanceof IRNameExpr) {
            if (this.definition.isCore()) {
                return `Builtin`;
            } else {
                return `Fn`;
            }
        } else {
            return `Fn`;
        }
    }
}

/**
 * @internal
 */
export class IRErrorValue {
    /**
     * @param {IRValue} other 
     * @param {boolean} permissive
     * @returns {boolean}
     */
    eq(other, permissive = false) {
        return (other instanceof IRErrorValue) || (other instanceof IRAnyValue);
    }

    /**
     * @returns {string}
     */
    toString() {
        return `Error`;
    }
}

/**
 * Can be Data of any function
 * Simply eliminated when encountered in an IRMultiValue
 * @internal
 */
export class IRAnyValue {
    /**
     * @param {IRValue} other 
     * @param {boolean} permissive
     * @returns {boolean}
     */
    eq(other, permissive = false) {
        return true;
    }

    toString() {
        return `Any`;
    }
}

/**
 * @internal
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
		this.values = values;
	}

    /**
     * @returns {boolean}
     */
    hasError() {
        return this.values.some(v => v instanceof IRErrorValue);
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

        if (this.values.some(v => v instanceof IRFuncValue)) {
            parts.push(`Fn`);
        }

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
     * Order can be different
     * @param {IRValue} other
     * @param {boolean} permissive
     * @returns {boolean}
     */
    eq(other, permissive = false) {
        if (permissive && other instanceof IRMultiValue) {
            const thisHasData = this.hasData() || this.hasLiteral();
            const otherHasData = other.hasData() || other.hasLiteral();

            if (thisHasData !== otherHasData) {
                return false
            } else if (this.hasError() !== other.hasError()) {
                return false;
            } else {
                const thisValues = this.values.filter(v => {
                    return (v instanceof IRFuncValue);
                });

                const otherValues = other.values.filter(v => {
                    return (v instanceof IRFuncValue);
                });

                return thisValues.every(v => otherValues.some(ov => ov.eq(v, permissive))) && 
                    otherValues.every(ov => thisValues.some(v => v.eq(ov, permissive)));
            }
        } else if (other instanceof IRMultiValue) {
            if (this.hasError() !== other.hasError()) {
                return false;
            } else if (this.hasData() !== other.hasData()) {
                return false;
            } else {
                const thisValues = this.values.filter(v => {
                    return (v instanceof IRFuncValue) || (v instanceof IRLiteralValue);
                });

                const otherValues = other.values.filter(v => {
                    return (v instanceof IRFuncValue) || (v instanceof IRLiteralValue);
                });

                return thisValues.every(v => otherValues.some(ov => ov.eq(v, permissive))) && 
                    otherValues.every(ov => thisValues.some(v => v.eq(ov, permissive)));
            }
        } else {
            return other instanceof IRAnyValue;
        }
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
        }
        
		const hasError = values.some(v => v instanceof IRErrorValue);
		let hasData = values.some(v => v instanceof IRDataValue);
        const hasAny = values.some(v => v instanceof IRAnyValue);

        let nLiterals = 0;

        values.forEach(v => {
            if (v instanceof IRLiteralValue) {
                nLiterals += 1;
            }
        })

        if (!hasData && hasAny && nLiterals > 0) {
            hasData = true;
        }


        /*if (!hasData && nLiterals > 1) {
            hasData = true;
        }*/

		/**
		 * @type {Map<string, IRLiteralValue>}
		 */
		const literals = new Map();
        if (!hasAny && !hasData) {
            values.forEach(v => {
                if (v instanceof IRLiteralValue) {
                    literals.set(v.value.toString(), v);
                }
            });
        }

		// assume each IRFuncValue is different
		const fns = values.filter(v => v instanceof IRFuncValue);

		/**
		 * @type {IRValue[]}
		 */
		const flattened = fns.concat(Array.from(literals.values()));

		if (hasData) {
			flattened.push(new IRDataValue());
		}

		if (hasError) {
			flattened.push(new IRErrorValue());
		}

        if (!hasData && fns.length == 0 && literals.size == 0) {
            flattened.push(new IRAnyValue());
        }

        if (flattened.length == 0) {
            assert(values.some(v => v instanceof IRAnyValue));

            return new IRAnyValue();
        } else if (flattened.length == 1) {
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
    withoutError() {
        return IRMultiValue.flatten(this.values.filter(v => !(v instanceof IRErrorValue)));
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
        throw new Error("always expects literal unit arg");
    },
    mkNilPairData: ([a]) => {
        throw new Error("always expects literal unit arg");
    },
    serialiseData: ([a]) => {
        return new IRDataValue();
    }
};

/**
 * @param {IRStack} a 
 * @param {IRStack} b 
 * @param {boolean} permissive 
 * @returns 
 */
function compareIRStacks(a, b, permissive = false) {
    if (a.length == b.length && a.every((s, i) => {
        const t = b[i];

        const res = s.args.every(([_, a], j) => {
            const other = t.args[j][1];

            const res_ = a.eq(other, permissive);

            //if (permissive && !res_) {
              //  console.log(`col ${j} failed ${a.toString()} vs ${other.toString()}`)
            //}
            return res_;
            
            //return a.eq(other, permissive);
        })

        /*if (permissive && !res) {
            console.log(a.map(x => x.args.map(y => y[1].toString()).join(", ")).join("\n"))
            console.log(b.map(x => x.args.map(y => y[1].toString()).join(", ")).join("\n"))
            console.log(`row$ ${i} failed`)
        }*/

        return res;
    })) {
        return true;
    } else {
        return false;
    }
}

/**
 * @internal
 * @typedef {{fn: IRFuncExpr, args: [IRVariable, IRValue][]}[]} IRStack
 */

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
     *   {calling: IRCallExpr} |
     *   {fn: IRFuncExpr, owner: null | IRExpr, stack: IRStack} | 
     *   {multi: number, owner: null | IRExpr} | 
     *   {value: IRValue, owner: null | IRExpr} |
     *   {ignore: number}
     * )[]}
     */
    #computeStack;

    /**
     * @type {IRValue[]}
     */
    #reductionStack;

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
     * @type {Map<IRFuncExpr, number>}
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
     * @type {Map<IRCallExpr, number>}
     */
    #activeCalls;

    /**
     * @type {number}
     */
    #maxRecursion;

	constructor() {
        this.#computeStack = [];
        this.#reductionStack = [];

        // data structures used by optimization
        this.#exprValues = new Map();
        this.#variableValues = new Map();
        this.#callCount = new Map();
        this.#funcCallExprs = new Map();
        this.#variableReferences = new Map();
        this.#activeCalls = new Map();
        this.#maxRecursion = 10;
	}

    /**
     * @type {IRFuncExpr[]}
     */
    get funcExprs() {
        return Array.from(this.#funcCallExprs.keys());
    }

    /**
     * 
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
        return this.#callCount.get(fn) ?? 0;
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
            } else {
                return false;
            }
        } else {
            return false;
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
     * Push onto the computeStack, unwrapping IRCallExprs
     * @private
     * @param {IRStack} stack
     * @param {IRExpr} expr
     */
    pushExpr(stack, expr) {
        if (expr instanceof IRErrorExpr) {
            this.#computeStack.push({stack: stack, expr: expr});
        } else if (expr instanceof IRLiteralExpr) {
            this.#computeStack.push({stack: stack, expr: expr});
        } else if (expr instanceof IRNameExpr) {
            this.#computeStack.push({stack: stack, expr: expr});
        } else if (expr instanceof IRFuncExpr) {
            this.#computeStack.push({stack: stack, expr: expr});
        } else if (expr instanceof IRCallExpr) {
            this.#computeStack.push({stack: stack, expr: expr});

            this.pushExpr(stack, expr.func);

            expr.args.forEach(a => this.pushExpr(stack, a));
        } else {
            throw new Error("unexpected expression type");
        }
    }

    /**
     * @param {IRExpr} expr 
     * @param {IRValue} value 
     */
    setExprValue(expr, value) {
        const outputs = this.#exprValues.get(expr);

        if (outputs) {
            this.#exprValues.set(expr, IRMultiValue.flatten([outputs, value]));
        } else {
            this.#exprValues.set(expr, value);
        }
    }

    /**
     * @param {null | IRExpr} owner 
     * @param {IRValue} value 
     */
    pushReductionValue(owner, value) {
        if (owner) {
            this.setExprValue(owner, value);
        }

        this.#reductionStack.push(value);
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

        for (let i = stack.length - 1; i >= 0; i--) {
            const args = stack[i].args;
            const j = args.findIndex(arg => arg[0] == variable);

            if (j != -1) {
                return args[j][1];
            }
        }

        throw new Error(`${variable.name} not found in eval stack`);
    }

    /**
     * @private
     * @param {IRNameExpr} nameExpr 
     * @param {IRValue[]} args 
     * @returns {IRValue}
     */
    callBuiltin(nameExpr, args) {
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
                    return res.withoutError();
                } else {
                    return res;
                }
            }
        });

        return IRMultiValue.flatten(resValues);
    }

    /**
     * @param {IRFuncExpr} fn 
     */
    incrCallCount(fn) {
        const prev = this.#callCount.get(fn);

        if (prev) {
            this.#callCount.set(fn, Math.min(prev + 1, Number.MAX_SAFE_INTEGER));
        } else {
            this.#callCount.set(fn, 1);
        }
    }

    /**
     * @private
     * @param {IRStack} stack
     * @param {IRFuncExpr} fn
     */
    isRecursing(stack, fn) {
        const maybeRunaway = this.#computeStack.length > 100;

        const depth = 3;
        let count = 0;
        
        for (let i = this.#computeStack.length - 1; i >= 0; i--) {
            const entry = this.#computeStack[i];

            if ("fn" in entry && entry.fn == fn) {
                
                if (compareIRStacks(stack, entry.stack, maybeRunaway)) {
                    count += 1;
                }
            }

            if (count >= depth) {
                this.#callCount.set(fn, Number.MAX_SAFE_INTEGER);
                return true;
            }
        }

        return false;
    }

    /**
     * @param {IRVariable[]} variables 
     * @param {IRValue[]} values 
     * @returns {[IRVariable, IRValue][]}
     */
    mapVarsToValues(variables, values) {
        assert(variables.length == values.length);

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
        const permutations = IRMultiValue.allPermutations(args);

        if (owner instanceof IRCallExpr) {
            this.#computeStack.push({calling: owner});
            this.#activeCalls.set(owner, (this.#activeCalls.get(owner) ?? 0) + 1);
        }

        if (permutations.length > 1) {
            this.#computeStack.push({multi: permutations.length, owner: owner});
        }

        permutations.forEach(args => {
            if (args.some(a => a instanceof IRErrorValue)) {
                this.#computeStack.push({value: new IRErrorValue(), owner: owner});
            } else {
                const varsToValues = this.mapVarsToValues(fn.args, args);
                const stack_ = stack.concat([{fn: fn, args: varsToValues}]);

                this.incrCallCount(fn);
                this.#computeStack.push({fn: fn, owner: owner, stack: stack_});
                this.pushExpr(stack_, fn.body);
            }
        });
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

        if (fn instanceof IRNameExpr) {
            const res = this.callBuiltin(fn, args);
            this.pushReductionValue(owner, res);
        } else {
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
    }

    /**
     * Call an unknown function (eg. returned at the deepest point of recursion)
     * Make sure any arguments that are functions are also called so that all possible execution paths are touched
     * Absorb the return values of these functions
     * @private
     * @param {IRExpr} owner
     * @param {IRAnyValue} fn
     * @param {IRValue[]} args
     */
    callAnyFunc(owner, fn, args) {
        /**
         * Only user-defined functions!
         * @type {IRFuncValue[]}
         */
        const fnsInArgs = [];

        args.forEach(a => {
            if (a instanceof IRMultiValue) {
                a.values.forEach(aa => {
                    if (aa instanceof IRFuncValue && (aa.definition instanceof IRFuncExpr)) {
                        fnsInArgs.push(aa);
                    }
                });
            } else if (a instanceof IRFuncValue && (a.definition instanceof IRFuncExpr)) {
                fnsInArgs.push(a);
            }
        });

        this.#computeStack.push({value: fn, owner: owner});

        this.#computeStack.push({ignore: fnsInArgs.length});

        fnsInArgs.forEach(fn => {
            const def = assertClass(fn.definition, IRFuncExpr);

            this.pushFuncCall(fn.stack, null, def, def.args.map(a => new IRAnyValue()));
        });
    }

    /**
     * @internal
     */
    evalInternal() {
        let head = this.#computeStack.pop();

		while (head) {
            if ("expr" in head) {
                const expr = head.expr;

                if (expr instanceof IRCallExpr) {
                    const v = assertDefined(this.#reductionStack.pop());

                    /**
                     * @type {IRValue[]}
                     */
                    const args = [];

                    for (let i = 0; i < expr.args.length; i++) {
                        args.push(assertDefined(this.#reductionStack.pop()))
                    }

                    if ((this.#activeCalls.get(expr) ?? 0) > this.#maxRecursion) {
                        // we are recursing too deep, simply return Any
                        this.pushReductionValue(expr, new IRAnyValue());
                    } else {
                        if (v instanceof IRAnyValue) {
                            this.callAnyFunc(expr, v, args);
                        } else if (v instanceof IRErrorValue || args.some(a => a instanceof IRErrorValue)) {
                            this.pushReductionValue(expr, new IRErrorValue());
                        } else {
                            if (v instanceof IRFuncValue) {
                                this.callFunc(expr, v, args);
                            } else if (v instanceof IRMultiValue) {
                                this.#computeStack.push({multi: v.values.length, owner: expr});

                                for (let subValue of v.values) {
                                    if (subValue instanceof IRErrorValue) {
                                        this.pushReductionValue(expr, subValue);
                                    } else if (subValue instanceof IRDataValue) {
                                        throw new Error("unexpected function value");
                                    } else if (subValue instanceof IRLiteralValue) {
                                        throw new Error("unexpected function value");
                                    } else if (subValue instanceof IRMultiValue) {
                                        throw new Error("unexpected multi subvalue");
                                    } else if (subValue instanceof IRFuncValue) {
                                        this.callFunc(expr, subValue, args);
                                    } else if (subValue instanceof IRAnyValue) {
                                        this.callAnyFunc(expr, subValue, args);  
                                    } else {
                                        throw new Error("unexpected function value");
                                    }
                                }
                            } else {
                                throw new Error("unexpected function term " + v.toString());
                            }
                        }
                    }
                } else if (expr instanceof IRErrorExpr) {
                    this.pushReductionValue(expr, new IRErrorValue());
                } else if (expr instanceof IRNameExpr) {
                    
                    if (expr.isCore()) {
                        this.pushReductionValue(expr, new IRFuncValue(head.stack, expr));
                    } else {
                        this.pushReductionValue(expr, this.getValue(head.stack, expr));
                    }
                } else if (expr instanceof IRLiteralExpr) {
                    this.pushReductionValue(expr, new IRLiteralValue(expr.value));
                } else if (expr instanceof IRFuncExpr) {
                    // don't set owner because it is confusing wrt. return value type
                    this.#reductionStack.push(new IRFuncValue(head.stack, expr));
                } else {
                    throw new Error("unexpected expr type");
                }
			} else if ("fn" in head && head.fn instanceof IRFuncExpr) {
                // track the owner
                const owner = head.owner;
                const last = assertDefined(this.#reductionStack.pop());

                this.setExprValue(head.fn, last);
                this.pushReductionValue(owner, last);
			} else if ("multi" in head) {
                // collect multiple IRValues from the reductionStack and put it back as a single IRMultiValue

				/**
				 * @type {IRValue[]}
				 */
				const values = [];

				for (let i = 0; i < head.multi; i++) {
					values.push(assertDefined(this.#reductionStack.pop()));
				}

                this.pushReductionValue(head.owner, IRMultiValue.flatten(values));
            } else if ("value" in head) {
                this.pushReductionValue(head.owner, head.value);
            } else if ("ignore" in head) {
                for (let i = 0; i < head.ignore; i++) {
                    assertDefined(this.#reductionStack.pop());
                }
            } else if ("calling" in head) {
                this.#activeCalls.set(head.calling, assertDefined(this.#activeCalls.get(head.calling)) - 1);
			} else {
				throw new Error("unexpected term");
			}

            head = this.#computeStack.pop();
		}
    }

    /**
     * @param {IRExpr} expr entry point
     * @returns {IRValue}
     */
    evalFirstPass(expr) {
        this.pushExpr([], expr);

        this.evalInternal();

        const res = assertDefined(this.#reductionStack.pop());

        assert(this.#reductionStack.length == 0, "expected a single reduction value in first phase [" + this.#reductionStack.map(v => v.toString()).join(", ") + "]");

        if (res instanceof IRFuncValue) {
            return res;
        } else if (res instanceof IRLiteralValue) {
            return res; // used by const
        } else {
            throw new Error("expected entry point function");
        }
    }

    /**
     * @param {IRFuncValue} main
     * @returns {IRValue}
     */
    evalSecondPass(main) {
        const definition = assertClass(main.definition, IRFuncExpr);
        const args = definition.args.map(a => new IRDataValue());
        this.callFunc(definition, main, args);

        this.evalInternal();

        const res = assertDefined(this.#reductionStack.pop());

        assert(this.#reductionStack.length == 0, "expected a single reduction value in second phase [" + res.toString() + ", " + this.#reductionStack.map(v => v.toString()).join(", ") + "]");

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
                throw new Error("unexpected return value " + v.toString());
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

            return `(${expr.args.map(a => {
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