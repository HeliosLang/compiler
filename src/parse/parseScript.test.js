import { throws } from "node:assert"
import { describe, it } from "node:test"
import { parseScript } from "./parseScript.js"

describe(parseScript.name, () => {
    it("doesn't fail for simple script", () => {
        parseScript(`testing simple
        
        func main() -> Int {
            0
        }`)
    })

    it("doesn't fail for simple script containing literal Real", () => {
        parseScript(`testing lit_real
        
        func main() -> Real {
            0.0
        }`)
    })

    it("throws if top-level function doesn't have return type", () => {
        throws(() => {
            parseScript(
                `testing no_top_return_type
            func main() -> {
                0
            }`
            )
        })
    })

    it("throws if switch case conditions are inconsistent", () => {
        throws(() => {
            parseScript(
                `testing inconsistent_switch
                func main(a: MyEnum1, b: MyEnum2) -> Bool {
                    (a, b).switch{
                        (A, B) => true,
                        (A, B, C) => true,
                        _ => false
                    }
                }`
            )
        })
    })

    it("throws if switch case conditions are inconsistent 2", () => {
        throws(() => {
            parseScript(
                `testing inconsistent_switch
                func main(a: MyEnum1, b: MyEnum2) -> Bool {
                    (a, b).switch{
                        A => true,
                        (A, B) => true,
                        _ => false
                    }
                }`
            )
        })
    })

    it("doesn't allow parametric return types", () => {
        throws(() => {
            parseScript(`module Tokens
        
            func contains[V: Valuable](v: V, asset_class: AssetClass) -> Bool {
                v.value.get_safe(asset_class) > 0
            } 
            
            func contains_reimbursement(id: Int) -> [V: Valuable](v: V) -> Bool {
                [V: Valuable](v: V) -> {
                    contains(v, reimbursement(id))
                }
            }`)
        })
    })

    it("allows parsing a higher order function with unnamed args", () => {
        parseScript(`testing higher_order
        
        func higher_order() -> (Int, Int) -> Int {
            (a: Int, b: Int) -> {a + b}
        }
        
        func main() -> Bool {
            higher_order()(1, 1)
        }`)
    })

    it("is able to parse empty literal list with newline", () => {
        parseScript(`testing empty_string_list
        
        func main() -> []String {
            []String{
            }
        }`)
    })

    it("no nodejs stack overflow if func keyword is missing", () => {
        throws(() => {
            parseScript(`module VestingData

                enum VestingState {
                    Initializing
                    VerifyingBeneficiary
                    Active
                    Paused {
                        reason: String
                        infoRef: Option[AssetClass]
                    }
                
                    func validate(self) -> Bool {
                        self.switch {
                            Paused{reason, infoRef} => {
                                self.validateReason(reason, infoRef)
                            },
                            _ => true
                        }
                    }
                
                    validateReason(self, reason: String, infoRef: Option[AssetClass]) -> Bool {
                        REQT("the reason must be at least 12 characters");
                        assert(reason.encode_utf8().length >= 12, "reason < 12 - too short");
                
                        false
                    }
                }`)
        }, /SyntaxError/)
    })
})
