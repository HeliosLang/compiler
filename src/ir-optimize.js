//@ts-check
// IR optimization

import {
    config
} from "./config.js";

import {
    assert,
    assertClass,
    assertDefined
} from "./utils.js";

import {
    Word
} from "./tokens.js";

import { 
    ConstrData,
    MapData,
    ListData,
    IntData,
    ByteArrayData
} from "./uplc-data.js";

import {
    BUILTIN_PREFIX
} from "./uplc-builtins.js";

import {
    UplcUnit
} from "./uplc-ast.js";

/**
 * @typedef {import("./ir-ast.js").IRExpr} IRExpr
 */

import {
    IRCallExpr,
    IRErrorExpr,
    IRFuncExpr,
    IRLiteralExpr,
    IRNameExpr,
    loopIRExprs
} from "./ir-ast.js";

import { 
    IREvaluator,
    IRErrorValue,
    IRLiteralValue,
    annotateIR
} from "./ir-evaluate.js";

import { IRVariable } from "./ir-context.js";

/**
 * Recursive algorithm that performs the following optimizations.
 * 
 * Optimizations performed in both `aggressive == false` and `aggressive == true` cases:
 *   * replace `IRNameExpr` by `IRLiteralExpr` if the expected value is IRLiteralValue
 *   * replace `IRCallExpr` by `IRLiteralExpr` if the expected value is IRLiteralValue
 * 
 * Optimizations only performed in the `aggressive == true` case:
 *   * replace `IRNameExpr` by `IRErrorExpr` if the expected value is IRErrorValue
 *   * replace `IRCallExpr` by `IRErrorExpr` if the expected value is IRErrorValue
 *   * replace `__core__addInteger(<expr>, 0)` or `__core__addInteger(0, <expr>)` by `<expr>`
 *   * replace `__core__subtractInteger(<expr>, 0)` by `<expr>`
 *   * replace `__core__multiplyInteger(<expr>, 1)` or `__core__multiplyInteger(1, <expr>)` by `<expr>`
 *   * replace `__core__divideInteger(<expr>, 1)` by `<expr>`
 *   * replace `__core__quotientInteger(<expr>, 1)` by `<expr>`
 *   * replace `__core__appendByteString(<expr>, #)` or `__core__appendByteString(#, <expr>)` by `<expr>`
 *   * replace `__core__appendString(<expr>, "")` or `__core__appendString("", <expr>)` by `<expr>`
 *   * replace `__core__decodeUtf8(__core__encodeUtf8(<expr>))` by `<expr>`
 *   * replace `__core__ifThenElse(true, <expr-a>, <expr-b>)` by `<expr-a>` if `<expr-b>` doesn't expect IRErrorValue
 *   * replace `__core__ifThenElse(false, <expr-a>, <expr-b>)` by `<expr-b>` if `<expr-a>` doesn't expect IRErrorValue
 *   * replace `__core__ifThenElse(__core__nullList(<lst-expr>), <expr-a>, <expr-b>)` by `__core__chooseList(<lst-expr>, <expr-a>, <expr-b>)`
 *   * replace `__core__ifThenElse(<cond-expr>, <expr-a>, <expr_a>)` by `<expr-a>` if `<cond-expr>` doesn't expect IRErrorValue
 *   * replace `__core__chooseUnit(<expr>, ())` by `<expr>`
 *   * replace `__core__trace(<msg-expr>, <ret-expr>)` by `<ret_expr>` if `<msg-expr>` doesn't expect IRErrorValue
 *   * replace `__core__chooseList([], <expr-a>, <expr-b>)` by `<expr-a>` if `<expr-b>` doesn't expect IRErrorValue
 *   * replace `__core__chooseList([...], <expr-a>, <expr-b>)` by `<expr-b>` if `<expr-a>` doesn't expect IRErrorValue
 *   * replace `__core__chooseData(ConstrData, <C-expr>, <M-expr>, <L-expr>, <I-expr>, <B-expr>)` by `<C-expr>` if none of the other expression expect IRErrorValue
 *   * replace `__core__chooseData(MapData, <C-expr>, <M-expr>, <L-expr>, <I-expr>, <B-expr>)` by `<M-expr>` if none of the other expression expect IRErrorValue
 *   * replace `__core__chooseData(ListData, <C-expr>, <M-expr>, <L-expr>, <I-expr>, <B-expr>)` by `<L-expr>` if none of the other expression expect IRErrorValue
 *   * replace `__core__chooseData(IntData, <C-expr>, <M-expr>, <L-expr>, <I-expr>, <B-expr>)` by `<I-expr>` if none of the other expression expect IRErrorValue
 *   * replace `__core__chooseData(ByteArrayData, <C-expr>, <M-expr>, <L-expr>, <I-expr>, <B-expr>)` by `<B-expr>` if none of the other expression expect IRErrorValue
 *   * replace `__core__unMapData(__core__mapData(<expr>))` by `<expr>`
 *   * replace `__core__unListData(__core__listData(<expr>))` by `<expr>`
 *   * replace `__core__unIData(__core__iData(<expr>))` by `<expr>`
 *   * replace `__core__unBData(__core__bData(<expr>))` by `<expr>`
 *   * replace `__core__equalsData(__core__iData(<expr-a>), __core__iData(<expr-b>))` by `__core__equalsInteger(<expr-a>, <expr-b>)`
 *   * replace `__core__equalsData(__core__bData(<expr-a>), __core__bData(<expr-b>))` by `__core__equalsByteString(<expr-a>, <expr-b>)`
 *   * remove unused IRFuncExpr arg variables if none if the corresponding IRCallExpr args expect errors and if all the the IRCallExprs expect only this IRFuncExpr
 *   * replace IRCallExpr args that are uncalled IRFuncExprs with `()`
 *   * flatten nested IRFuncExprs if the correspondng IRCallExprs always call them in succession
 *   * replace `(<vars>) -> {<name-expr>(<vars>)}` by `<names-expr>` if each is only referenced once (i.e. only referenced in the call)
 *   * replace `(<vars>) -> {<func-expr>(<vars>)}` by `<func-expr>` if each is only referenced once (i.e. only referenced in the call)
 *   * inline (copies) of `<name-expr>` in `(<vars>) -> {...}(<name-expr>, ...)`
 *   * inline `<fn-expr>` in `(<vars>) -> {...}(<fn-expr>, ...)` if the corresponding var is only referenced once
 *   * replace `() -> {<expr>}()` by `<expr>`
 * 
 * Optimizations that we have considered, but are NOT performed:
 *   * replace `__core__subtractInteger(0, <expr>)` by `__core__multiplyInteger(<expr>, -1)`
 *       reason: it is unclear if either method is cheaper for the majority of cases
 *   * replace `__core__multiplyInteger(<expr>, -1)` by `__core__subtractInteger(0, <expr>)`
 *       reason: it is unclear if either method is cheaper for the majority of cases
 * 
 * @internal
 * @param {IREvaluator} evaluation 
 * @param {IRExpr} expr
 * @param {boolean} aggressive
 * @returns {IRExpr}
 */
export class IROptimizer {
    #evaluator;
    #root;
    #aggressive;

    /**
     * @type {Map<IRVariable, IRExpr>}
     */
    #inlining;

    /**
     * @type {Map<IRFuncExpr, number>}
     */
    #callCount;

    /**
     * @param {IRExpr} root
     * @param {boolean} aggressive 
     */
    constructor(root, aggressive = false) {
        this.#evaluator = new IREvaluator();
        this.#root = root;
        IROptimizer.assertNoDuplicateExprs(root);
        this.#aggressive = aggressive;

        this.#inlining = new Map();
        this.#callCount = new Map();

        this.init();
    }

    /**
     * @param {IRExpr} expr 
     * @returns {boolean}
     */
    expectsError(expr) {
        return this.#evaluator.expectsError(expr);
    }

    /**
     * @private
     * @param {IRFuncExpr} fn 
     */
    countFuncCalls(fn) {
        return this.#callCount.get(fn) ?? this.#evaluator.countFuncCalls(fn);
    }

    /**
     * Makes sure the callCount is copied from IREvaluator
     * @private
     * @param {IRFuncExpr} old 
     * @param {IRVariable[]} args
     * @param {IRExpr} body
     * @returns {IRFuncExpr}
     */
    newFuncExpr(old, args, body) {
        const n = this.countFuncCalls(old);

        const funcExpr = new IRFuncExpr(
            old.site,
            args,
            body,
            old.tag
        );

        this.#callCount.set(funcExpr, n);

        return funcExpr;
    }

    /**
     * Apply optimizations that require access to the root:
     *   * flatten nested IRFuncExpr where possible
     *   * remove unused IRFuncExpr variables
     * @private
     */
    init() {
        this.#evaluator.eval(this.#root);

        if (config.DEBUG) {
            console.log(annotateIR(this.#evaluator, this.#root));
        }

        if (!this.#aggressive) {
            return;
        }

        this.removeUnusedArgs();

        this.replaceUncalledArgsWithUnit();

        // rerun evaluation
        this.#evaluator = new IREvaluator();

        this.#evaluator.eval(this.#root);

        if (config.DEBUG) {
            console.log(annotateIR(this.#evaluator, this.#root));
        }

        this.flattenNestedFuncExprs();
    }

    /**
     * Mutates
     * @private
     */
    removeUnusedArgs() {
        const funcExprs = this.#evaluator.funcExprs.filter(expr => {
            const unusedIndices = this.#evaluator.getUnusedFuncVariables(expr);

            return unusedIndices.length > 0 && this.#evaluator.onlyDedicatedCallExprs(expr) && this.#evaluator.noUnusedArgErrors(expr, unusedIndices);
        });

        funcExprs.forEach(expr => {
            const unusedIndices = this.#evaluator.getUnusedFuncVariables(expr);
            const unused = new Set(unusedIndices);

            const callExprs = this.#evaluator.getFuncCallExprs(expr);

            callExprs.forEach(callExpr => {
                callExpr.args = callExpr.args.filter((a, i) => !unused.has(i));
            });
            
            expr.args = expr.args.filter((a, i) => !unused.has(i));
        });
    }

    /**
     * TODO: improve IREvaluator to make sure all possible IRFuncExpr calls are evaluated
     * @private
     */
    replaceUncalledArgsWithUnit() {
        loopIRExprs(this.#root, {
            callExpr: (callExpr) => {
                callExpr.args = callExpr.args.map(a => {
                    if (a instanceof IRFuncExpr && this.#evaluator.countFuncCalls(a) == 0) {
                        return new IRLiteralExpr(new UplcUnit(a.site));
                    } else {
                        return a;
                    }
                });
            }
        });
    }

    /**
     * In scope order, call func before call args
     * @private
     */
    collectFuncExprs() {
        /**
         * @type {IRFuncExpr[]}
         */
        const funcExprs = [];

        loopIRExprs(this.#root, {
            funcExpr: (funcExpr) => {
                funcExprs.push(funcExpr);
            }
        });

        return funcExprs;
    }

    /**
     * @private
     */
    flattenNestedFuncExprs() {
        const funcExprs = this.collectFuncExprs();

        /**
         * @type {Set<IRFuncExpr>}
         */
        const done = new Set();

        funcExprs.forEach(expr => {
            if (done.has(expr)) {
                return;
            }

            let last = expr;
            let args = expr.args.slice();
            let depth = 1;

            while (last.body instanceof IRFuncExpr && this.#evaluator.onlyDedicatedCallExprs(last.body) && this.#evaluator.onlyNestedCalls(last, last.body)) {
                depth += 1;
                last = last.body;
                args = args.concat(last.args.slice());
                done.add(last);
            }

            if (depth == 1) {
                // don't do anything
                return;
            }

            const callExprs = this.#evaluator.getFuncCallExprs(last);

            assert(callExprs.length > 0);

            callExprs.forEach(callExpr => {
                let inner = callExpr;

                /**
                 * @type {IRExpr[][]}
                 */
                let allArgs = [];

                for (let i = 0; i < depth; i++) {
                    allArgs.push(inner.args.slice());

                    if (i < depth - 1) {
                        inner = assertClass(inner.func, IRCallExpr);
                    }
                }

                callExpr.func = inner.func;
                callExpr.args = allArgs.reverse().flat();
            });
                
            expr.args = args;
            expr.body = last.body;
        })
    }

    /**
     * @param {IRFuncExpr} start
     * @param {IRNameExpr} nameExpr
     * @returns {boolean}
     */
    isEvaluatedMoreThanOnce(start, nameExpr) {
        /**
         * @type {Map<IRExpr, IRCallExpr | IRFuncExpr>}
         */
        const parents = new Map();

        let foundNameExpr = false;

        loopIRExprs(start, {
            funcExpr: (funcExpr) => {
                parents.set(funcExpr.body, funcExpr);
            },
            callExpr: (callExpr) => {
                parents.set(callExpr.func, callExpr);
                callExpr.args.forEach(a => {parents.set(a, callExpr)});
            },
            nameExpr: (ne) => {
                foundNameExpr = ne == nameExpr;
            },
            exit: () => {
                return foundNameExpr;
            }
        });

        let parent = parents.get(nameExpr);

        while (parent && parent != start) {
            if (parent instanceof IRFuncExpr && this.countFuncCalls(parent) > 1) {
                return true;
            }
            
            parent = parents.get(parent);
        }

        return false;
    }

    /**
     * @param {IRVariable} v 
     * @param {IRExpr} expr 
     */
    inline(v, expr) {
        this.#inlining.set(v, expr);
    }
    
    /**
     * @private
     * @param {IRNameExpr} expr 
     * @returns {IRExpr}
     */
    optimizeNameExpr(expr) {
        const v = this.#evaluator.getExprValue(expr);
    
        if (v) {
            if (v instanceof IRLiteralValue) {
                return new IRLiteralExpr(v.value);
            } else if (v instanceof IRErrorValue && this.#aggressive) {
                return new IRErrorExpr(expr.site);
            }
        }

        if (!expr.isCore()) {
            const newExpr = this.#inlining.get(expr.variable);

            if (newExpr) {
                // always copy to make sure any (nested) IRNameExpr is unique (=> unique DeBruijn index)
                return newExpr.copy();
            }
        }

        return expr;
    }

    /**
     * The optimizations are only performed in aggressive mode
     * @private
     * @param {IRCallExpr} expr
     * @returns {IRExpr}
     */
    optimizeBuiltinCallExpr(expr) {
        const builtinName = expr.builtinName;

        const args = expr.args;

        switch (builtinName) {
            case "addInteger": {
                const [a, b] = args;

                if (a instanceof IRLiteralExpr && a.value.int == 0n) {
                    return b;
                } else if (b instanceof IRLiteralExpr && b.value.int == 0n) {
                    return a;
                }

                break;
            };
            case "subtractInteger": {
                const [a, b] = args;

                if (b instanceof IRLiteralExpr && b.value.int == 0n) {
                    return a;
                }

                break;
            };
            case "multiplyInteger": {
                const [a, b] = args;

                if (a instanceof IRLiteralExpr && a.value.int == 1n) {
                    return b;
                } else if (b instanceof IRLiteralExpr && b.value.int == 1n) {
                    return a;
                }

                break;
            };
            case "divideInteger": {
                const [a, b] = args;

                if (b instanceof IRLiteralExpr && b.value.int == 1n) {
                    return a;
                }

                break;
            };
            case "quotientInteger": {
                const [a, b] = args;

                if (b instanceof IRLiteralExpr && b.value.int == 1n) {
                    return a;
                }

                break;
            };
            case "appendByteString": {
                const [a, b] = args;

                if (a instanceof IRLiteralExpr && a.value.bytes.length == 0) {
                    return b;
                } else if (b instanceof IRLiteralExpr && b.value.bytes.length == 0) {
                    return a;
                }

                break;
            };
            case "appendString": {
                const [a, b] = args;

                if (a instanceof IRLiteralExpr && a.value.string == "") {
                    return b;
                } else if (b instanceof IRLiteralExpr && b.value.string == "") {
                    return a;
                }

                break;
            };
            case "decodeUtf8": {
                const [arg] = args;

                if (arg instanceof IRCallExpr && arg.func instanceof IRNameExpr && arg.builtinName == "encodeUtf8") {
                    return arg.args[0];
                }

                break;
            };
            case "ifThenElse": {
                const [cond, a, b] = args;

                if (cond instanceof IRLiteralExpr) {
                    if (cond.value.bool && !this.expectsError(b)) {
                        return a;
                    } else if (!cond.value.bool && !this.expectsError(a)) {
                        return b;
                    }
                } else if (!this.expectsError(cond) && a.toString() == b.toString()) {
                    return a;
                } else if (cond instanceof IRCallExpr && cond.func instanceof IRNameExpr && cond.builtinName == "nullList") {
                    return new IRCallExpr(
                        expr.site,
                        new IRNameExpr(new Word(expr.site, `${BUILTIN_PREFIX}chooseList`)),
                        [cond.args[0], a, b]
                    );
                }

                break;
            };
            case "chooseUnit": {
                const [a, b] = args;

                if (b instanceof IRLiteralExpr && b.value instanceof UplcUnit) {
                    return a;
                }

                break;
            };
            case "trace": {
                const [a, b] = args;

                if (!this.expectsError(a)) {
                    return b;
                }

                break;
            };
            case "chooseList": {
                const [lst, a, b] = args;

                if (lst instanceof IRLiteralExpr) {
                    if (lst.value.list.length == 0 && !this.expectsError(b)) {
                        return a;
                    } else if (lst.value.list.length > 0 && !this.expectsError(a)) {
                        return b;
                    }
                }

                break;
            };
            case "chooseData": {
                const [cond, C, M, L, I, B] = args;

                if (cond instanceof IRLiteralExpr) {
                    if (cond.value.data instanceof ConstrData && !this.expectsError(M) && !this.expectsError(L) && !this.expectsError(I) && !this.expectsError(B)) {
                        return C;
                    } else if (cond.value.data instanceof MapData && !this.expectsError(C) && !this.expectsError(L) && !this.expectsError(I) && !this.expectsError(B)) {
                        return M;
                    } else if (cond.value.data instanceof ListData && !this.expectsError(C) && !this.expectsError(M) && !this.expectsError(I) && !this.expectsError(B)) {
                        return L;
                    } else if (cond.value.data instanceof IntData && !this.expectsError(C) && !this.expectsError(M) && !this.expectsError(L) && !this.expectsError(B)) {
                        return I;
                    } else if (cond.value.data instanceof ByteArrayData && !this.expectsError(C) && !this.expectsError(M) && !this.expectsError(L) && !this.expectsError(I)) {
                        return B;
                    }
                }

                break;
            };
            case "unMapData": {
                const [arg] = args;

                if (arg instanceof IRCallExpr && arg.func instanceof IRNameExpr && arg.builtinName == "mapData") {
                    return arg.args[0];
                }

                break;
            };
            case "unListData": {
                const [arg] = args;

                if (arg instanceof IRCallExpr && arg.func instanceof IRNameExpr && arg.builtinName == "listData") {
                    return arg.args[0];
                }

                break;
            };
            case "unIData": {
                const [arg] = args;

                if (arg instanceof IRCallExpr && arg.func instanceof IRNameExpr && arg.builtinName == "iData") {
                    return arg.args[0];
                }

                break;
            };
            case "unBData": {
                const [arg] = args;

                if (arg instanceof IRCallExpr && arg.func instanceof IRNameExpr && arg.builtinName == "bData") {
                    return arg.args[0];
                }

                break;
            };
            case "equalsData": {
                const [a, b] = args;

                if (
                    a instanceof IRCallExpr && a.func instanceof IRNameExpr && a.builtinName == "iData" &&
                    b instanceof IRCallExpr && b.func instanceof IRNameExpr && b.builtinName == "iData"
                ) {
                    return new IRCallExpr(expr.site, new IRNameExpr(new Word(expr.site, `${BUILTIN_PREFIX}equalsInteger`)), [a.args[0], b.args[0]]);
                } else if (
                    a instanceof IRCallExpr && a.func instanceof IRNameExpr && a.builtinName == "bData" &&
                    b instanceof IRCallExpr && b.func instanceof IRNameExpr && b.builtinName == "bData"
                ) {
                    return new IRCallExpr(expr.site, new IRNameExpr(new Word(expr.site, `${BUILTIN_PREFIX}equalsByteString`)), [a.args[0], b.args[0]]);
                }

                break;
            };
        }

        return expr;
    }

    /**
     * @private
     * @param {IRCallExpr} expr 
     * @returns {IRExpr}
     */
    optimizeCallExpr(expr) {
        const v = this.#evaluator.getExprValue(expr);
    
        if (v) {
            if (v instanceof IRLiteralValue) {
                return new IRLiteralExpr(v.value);
            } else if (v instanceof IRErrorValue && this.#aggressive) {
                return new IRErrorExpr(expr.site);
            }
        }

        let func = expr.func;
        
        let args = expr.args.map(a => this.optimizeInternal(a));

        // see if any arguments can be inlined
        if (func instanceof IRFuncExpr) {
            let unused = new Set();

            const funcExpr = func;
            const variables = func.args;

            args.forEach((a, i) => {
                const v = variables[i];

                if (a instanceof IRNameExpr) {
                    // inline all IRNameExprs
                    unused.add(i);
                    this.inline(v, a);
                } else if (a instanceof IRFuncExpr && this.#evaluator.countVariableReferences(v) == 1) {
                    // inline IRFuncExpr if it is only reference once
                    unused.add(i);
                    this.inline(v, a);
                } else if (a instanceof IRCallExpr && this.#evaluator.countVariableReferences(v) == 1) {
                    const nameExpr = this.#evaluator.getVariableReferences(v)[0];

                    if (!this.isEvaluatedMoreThanOnce(funcExpr, nameExpr)) {
                        unused.add(i);
                        this.inline(v, a);
                    }
                }
            });

            if (unused.size > 0) {
                args = args.filter((a, i) => !unused.has(i));

                const newFuncExpr = this.newFuncExpr(
                    func,
                    func.args.filter((a, i) => !unused.has(i)),
                    func.body
                );

                func = newFuncExpr;
            }
        }

        if (args.length == 0 && func instanceof IRFuncExpr && func.args.length == 0) {
            return this.optimizeInternal(func.body);
        }

        expr = new IRCallExpr(
            expr.site, 
            this.optimizeInternal(func),
            args
        );

        const builtinName = expr.builtinName;

        if (builtinName != "" && this.#aggressive) {
            return this.optimizeBuiltinCallExpr(expr);
        }

        return expr;
    }

    /**
     * @private
     * @param {IRFuncExpr} expr 
     * @returns {IRExpr}
     */
    optimizeFuncExpr(expr) {
        expr = this.newFuncExpr(
            expr, 
            expr.args,
            this.optimizeInternal(expr.body)
        );

        if (
            expr.body instanceof IRCallExpr && 
            (expr.body.func instanceof IRNameExpr || expr.body.func instanceof IRFuncExpr) && 
            expr.body.args.length == expr.args.length && 
            expr.body.args.every((a, i) => {
                return a instanceof IRNameExpr && a.isVariable(expr.args[i]) && this.#evaluator.countVariableReferences(expr.args[i]) == 1;
            })
        ) {
            return expr.body.func;
        }

        return expr;
    }

    /**
     * @private
     * @param {IRExpr} expr 
     */
    optimizeInternal(expr) {
        const newExpr = (() => {
            if (expr instanceof IRLiteralExpr) {
                // already optimal
                return expr;
            } else if (expr instanceof IRErrorExpr) {
                // already optimal
                return expr;
            } else if (expr instanceof IRNameExpr) {
                return this.optimizeNameExpr(expr);
            } else if (expr instanceof IRCallExpr) {
                return this.optimizeCallExpr(expr);
            } else if (expr instanceof IRFuncExpr) {
                return this.optimizeFuncExpr(expr);
            } else {
                throw new Error("unhandled IRExpr");
            }
        })();

        return newExpr;
    }

    /**
     * @param {IRExpr} expr 
     */
    static assertNoDuplicateExprs(expr) {
        /**
         * @type {Set<IRExpr>}
         */
        const s = new Set();

        loopIRExprs(expr, {
            nameExpr: (nameExpr) => {
                if (s.has(nameExpr)) {
                    console.log(expr.toString());
                    throw new Error("duplicate IRNameExpr " + nameExpr.name);
                }

                s.add(nameExpr);
            }
        });
    }

    /**
     * @returns {IRExpr}
     */
    optimize() {
        const expr = this.optimizeInternal(this.#root);

        IROptimizer.assertNoDuplicateExprs(expr);

        return expr;
    }
}