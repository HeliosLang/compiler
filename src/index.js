//////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////      Helios      /////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////
//
// Author:        Christian Schmitz
// Email:         cschmitz398@gmail.com
// Website:       https://www.helios-lang.io
// Repository:    https://github.com/HeliosLang/compiler
// Version:       0.17.0
// Last update:   July 2024
// License type:  BSD-3-Clause
//
//
// About: Helios-lang is a smart contract DSL for Cardano.
//     This Javascript library contains functions to compile Helios sources into Plutus-core.
//
//
// Dependencies: none
//
//
// Disclaimer: I made Helios available as FOSS so that the Cardano community can test it
//     extensively. I don't guarantee the library is bug-free, nor do I guarantee
//     backward compatibility with future versions.
//
//
// Example usage:
//     > import { Program } from "@helios-lang/compiler";
//     > console.log(new helios.Program("spending my_validator ...").compile().toString());
//
//
// Documentation: https://helios-lang.io/docs/lang/intro
//
//
// License text:
//     Copyright 2024 Christian Schmitz
//
//     Redistribution and use in source and binary forms, with or without
//     modification, are permitted provided that the following conditions are met:
//
//     1. Redistributions of source code must retain the above copyright notice, this
//     list of conditions and the following disclaimer.
//
//     2. Redistributions in binary form must reproduce the above copyright notice,
//     this list of conditions and the following disclaimer in the documentation
//     and/or other materials provided with the distribution.
//
//     3. Neither the name of the copyright holder nor the names of its contributors
//     may be used to endorse or promote products derived from this software without
//     specific prior written permission.
//
//     THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS “AS IS”
//     AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
//     IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
//     DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
//     FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
//     DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
//     SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
//     CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
//     OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
//     OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//

export * from "./program/index.js"

/**
 * @import { ErrorCollector, Site, Source, Word } from "@helios-lang/compiler-utils"
 * @import { SourceMappedStringI } from "@helios-lang/ir"
 * @import { UplcData } from "@helios-lang/uplc"
 */

/**
 * @typedef {object} ScopeI
 * @prop {boolean} allowShadowing
 * @prop {[Word, (import("./typecheck/common.js").EvalEntity | ScopeI), boolean]} values
 * Used by top-scope to loop over all the statements
 *
 * @prop {(name: Word) => boolean} has
 * Checks if scope contains a name
 *
 * @prop {(name: Word, value: import("./typecheck/common.js").EvalEntity | ScopeI) => void} set
 * Sets a named value. Throws an error if not unique
 *
 * @prop {(name: Word) => void} remove
 *
 * @prop {(name: Word) => (null | ScopeI)} getScope
 *
 * @prop {(name: Word) => ((import("./typecheck/common.js").Named & import("./typecheck/common.js").Namespace) | undefined)} getBuiltinNamespace
 *
 * @prop {(name: Word | string, dryRun?: boolean) => (import("./typecheck/common.js").EvalEntity | ScopeI)} get
 *
 * @prop {boolean} isStrict
 *
 * @prop {(onlyIfStrict?: boolean) => void} assertAllUsed
 * Asserts that all named values are used.
 * Throws an error if some are unused, unless they start with "_"
 * Check is only run if we are in strict mode
 *
 * @prop {(name: Word) => boolean} isUsed
 *
 * @prop {(callback: (name: string, type: import("./typecheck/common.js").Type) => void) => void} loopTypes
 */

/**
 * @typedef {ScopeI & {
 *   kind: "ModuleScope"
 * }} ModuleScopeI
 */

/**
 * @typedef {object} RawFuncI
 * @prop {string} name
 * @prop {(ttp?: string[], ftp?: string[]) => SourceMappedStringI} toIR
 * @prop {(db: Map<string, RawFuncI>, dst: Definitions, ttp?: string[], ftp?: string[]) => void} load
 */

/**
 * `keySite` is an optional way to give the key a proper name
 * @typedef {{
 *   content: SourceMappedStringI
 *   keySite?: Site
 * }} Definition
 */

/**
 * TODO: this should be wrapped by a class
 * @typedef {Map<string, Definition>} Definitions
 */

/**
 * @typedef {{
 *   optimize: boolean
 *   isTestnet: boolean
 *   makeParamsSubstitutable?: boolean
 *   aliasNamespace?: string
 * }} ToIRContextProps
 */

/**
 * @typedef {object} TypeCheckContext
 * @prop {ErrorCollector} errors
 */

/**
 * @typedef {object} ToIRContextI
 * @prop {ToIRContextProps} props
 * @prop {string} indent
 * @prop {string | undefined} aliasNamespace
 * @prop {Map<string, RawFuncI>} db
 * @prop {boolean} isTestnet
 * @prop {boolean} optimize
 * @prop {boolean} paramsSubsitutable
 * @prop {() => ToIRContextI} tab
 *
 * @prop {() => Map<string, ((ttp: string[], ftp: string[]) => SourceMappedStringI)>} fetchRawGenerics
 * Load all raw generics so all possible implementations can be generated correctly during type parameter injection phase
 *
 * @prop {(ir: SourceMappedStringI, userDefs?: Definitions | undefined) => Definitions} fetchRawFunctions
 * Doesn't add templates
 *
 * @prop {(alias: string) => ToIRContextI} appendAliasNamespace
 * Appends parent debugging information which should be passed into IR via site.alias
 *
 * @prop {(alias: string) => ToIRContextI} withAliasNamespace
 * Adds parent debugging information which should be passed into IR via site.alias
 *
 * @prop {(ir: SourceMappedStringI) => SourceMappedStringI} wrapWithRawFunctions
 */

/**
 * @typedef {object} ConstStatementI
 * @prop {"ConstStatement"} kind
 * @prop {import("./typecheck/common.js").DataType} type
 * @prop {() => boolean} isSet
 * @prop {(data: UplcData) => void} changeValueSafe
 * @prop {() => string} toString
 * @prop {(scope: ScopeI) => import("./typecheck/common.js").DataType} evalType
 * @prop {(scope: ScopeI) => void} eval
 * @prop {(ctx: ToIRContextI, map: Definitions) => void} toIR
 */

/**
 * @typedef {object} EnumStatementI
 * @prop {"EnumStatement"} kind
 * @prop {string} path
 */

/**
 * @typedef {object} FuncStatementI
 */

/**
 * @typedef {object} ImportFromStatementI
 */

/**
 * @typedef {object} ImportModuleStatementI
 */

/**
 * @typedef {object} StructStatementI
 */

/**
 * @typedef {ConstStatementI
 *   | EnumStatementI
 *   | FuncStatementI
 *   | ImportFromStatementI
 *   | ImportModuleStatementI
 *   | StructStatementI
 * } StatementI
 */

/**
 * @typedef {object} ModuleI
 * @prop {Word} name
 * @prop {Source} sourceCode
 * @prop {StatementI[]} statements
 * @prop {() => string} toString
 * @prop {(scope: ModuleScopeI) => void} evalTypes
 * @prop {(modules: ModuleI[], stack: ModuleI[]) => ModuleI[]} filterDependencies
 * @prop {(callback: (name: string, statement: ConstStatementI) => void) => void} loopConstStatements
 */

/**
 * @typedef {object} MainModuleI
 * @prop {Word} name
 * @prop {Source} sourceCode
 * @prop {StatementI[]} statements
 * @prop {FuncStatementI} mainFunc
 * @prop {() => string} toString
 * @prop {(scope: ModuleScopeI) => void} evalTypes
 * @prop {(modules: ModuleI[], stack: ModuleI[]) => ModuleI[]} filterDependencies
 * @prop {(callback: (name: string, statement: ConstStatementI) => void) => void} loopConstStatements
 */
