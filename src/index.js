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
// Documentation: https://www.hyperion-bt.org/helios-book
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
export * as testUtils from "../test/utils.js"
