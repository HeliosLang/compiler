#!/usr/bin/env node
import * as helios from "./helios.js";

const src = `spending always_true
func main(ctx: ScriptContext) -> Bool {
    ctx.get_script_purpose().serialize().length > 0
        && ctx.tx.redeemers.length == 1
}`;

helios.Program.new(src).compile();
