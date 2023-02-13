#!/usr/bin/env node
//@ts-check
import fs from "fs";
import crypto from "crypto";
import * as helios from "../helios.js";
import { correctDir, runIfEntryPoint } from "./util.js";

correctDir();

/**
 * @typedef {import('../helios.js').PropertyTest} PropertyTest
 */

const helios_ = helios.exportedForTesting;

///////////////////////////////////////////////////////////
// Inline unit tests 
///////////////////////////////////////////////////////////
// These tests are defined JSDoc strings of helios.js
export default async function main() {
   // import  the helios library and remove the export keywords so we can use a plain eval

   let heliosSrc = fs.readFileSync("../helios.js").toString();

   heliosSrc = heliosSrc.replace(/^\ *export /gm, "");

   let lines = heliosSrc.split("\n");

   let tests = [];
   let fnCount = 0;
   for (let i = 0; i < lines.length; i++) {
       let line = lines[i];

       if (line.trim().startsWith("* @example")) {
           i++;

           line = lines[i];

           line = line.trim().slice(1).trim().replace(/\/\/.*/, "").trim();
           
           tests.push(line);
        } else if (line.startsWith("function") || line.startsWith("async")) {
            fnCount += 1;
        }
    }

    heliosSrc = "'use strict';\n" + heliosSrc + "\n" + tests.map(t => {
        let parts = t.split("=>");

        return `assertEq(${parts[0].trim()}, ${parts[1].trim()}, 'unit test ${t} failed')`
    }).join(";\n") + ";";

    eval(heliosSrc);

    console.log(`unit tested ${tests.length} out of ${fnCount} top-level js function statements using the inline examples`);
    for (let test of tests) {
        console.log("  " + test);
    }
}

runIfEntryPoint(main, "inline.js");
