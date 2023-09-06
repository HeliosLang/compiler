//@ts-check
// IR optimization

/**
 * @typedef {import("./ir-ast.js").IRExpr} IRExpr
 */

import { 
    IREvaluation
} from "./ir-evaluation.js";

/**
 * @internal
 * @param {IREvaluation} evaluation 
 * @param {IRExpr} expr
 * @returns {IRExpr}
 */
export function optimizeIR(evaluation, expr) {
    return expr;
}
