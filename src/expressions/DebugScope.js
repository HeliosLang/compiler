/** @type {WeakMap<object, {site: import('@helios-lang/compiler-utils').Site, scope: import('../scopes/Scope.js').Scope}[]>} */
export const debugScopes = new WeakMap()

/**
 * Keep scopes separate from the AST so traversal and serialization stay acyclic.
 * @param {import('../index.js').TypeCheckContext} ctx
 * @param {import('@helios-lang/compiler-utils').Site} site
 * @param {import('../scopes/Scope.js').Scope} scope
 */
export function rememberDebugScope(ctx, site, scope) {
    let scopes = debugScopes.get(ctx.errors)
    if (!scopes) {
        scopes = []
        debugScopes.set(ctx.errors, scopes)
    }
    scopes.push({ site, scope })
}
