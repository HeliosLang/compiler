import { describe, it } from "node:test"
import {
    compileAndRunMany,
    True,
    map,
    int,
    False,
    bytes,
    compileForRun,
    list,
    constr
} from "./utils.js"

describe("Address", () => {
    const addressFromValidatorScript = `testing address_from_validator
    func main(vh: ValidatorHash) -> Bool {
        addr = Address::from_validator(vh);

        !addr.is_staked()
        && addr.credential.switch{
            Validator{v} => v == vh,
            else => error("unexpected")
        }
    }`

    compileAndRunMany([
        {
            description: "new empty address has correct format",
            main: `
            testing address_new_empty
            func main() -> Bool {
                a = Address::new_empty();
                a.credential.switch{
                    pk: PubKey => pk.hash == PubKeyHash::new(#),
                    else => error("unexpected")
                } &&
                a.staking_credential.switch{
                    None => true,
                    else => error("unexpected")
                }
            }`,
            inputs: [],
            output: True
        },
        {
            description:
                "Address::from_validator creates an address with the correct format",
            main: addressFromValidatorScript,
            inputs: [
                bytes(
                    "00112233445566778899aabbccddeeff00112233445566778899aabb"
                )
            ],
            output: True
        }
    ])

    describe("Address::is_valid_data", () => {
        const runner = compileForRun(`testing address_is_valid_data
        func main(d: Data) -> Bool {
            Address::is_valid_data(d)
        }`)

        it("returns true for constrData with tag 1 and two fields: one pubkey spending credential, and one empty/none option", () => {
            runner(
                [constr(0, constr(0, bytes(new Array(28).fill(0))), constr(1))],
                True
            )
        })

        it("returns false for constrData with tag 1", () => {
            runner(
                [constr(1, constr(0, bytes(new Array(28).fill(0))), constr(1))],
                False
            )
        })

        it("returns true for constrData with tag 0 and two fields: one pubkey spending credential, and one empty/none option", () => {
            runner(
                [constr(0, constr(1, bytes(new Array(28).fill(0))), constr(1))],
                True
            )
        })

        it("returns true for constrData with tag 0 and two fields: one pubkey spending credential, and one empty/none option", () => {
            runner(
                [constr(0, constr(1, bytes(new Array(28).fill(0))), constr(1))],
                True
            )
        })

        it("returns false for constrData with tag 0 and two fields: one garbage spending credential, and one empty/none option", () => {
            runner(
                [constr(0, constr(2, bytes(new Array(28).fill(0))), constr(1))],
                False
            )
        })

        it("returns true for constrData with tag 0 and two fields: one validator spending credential, and one empty/none option", () => {
            runner(
                [constr(0, constr(1, bytes(new Array(28).fill(0))), constr(1))],
                True
            )
        })

        it("returns false for constrData with tag 0 and two fields: one validator spending credential, and one garbage staking credential option", () => {
            runner(
                [constr(0, constr(1, bytes(new Array(28).fill(0))), constr(0))],
                False
            )
        })

        it("returns true for constrData with tag 0 and two fields: one validator spending credential, and one pubkey credential option", () => {
            runner(
                [
                    constr(
                        0,
                        constr(1, bytes(new Array(28).fill(0))),
                        constr(
                            0,
                            constr(0, constr(0, bytes(new Array(28).fill(0))))
                        )
                    )
                ],
                True
            )
        })

        it("returns false for constrData with tag 0 and two fields: one validator spending credential, and one pubkey credential option with 29 bytes", () => {
            runner(
                [
                    constr(
                        0,
                        constr(1, bytes(new Array(28).fill(0))),
                        constr(
                            0,
                            constr(0, constr(0, bytes(new Array(29).fill(0))))
                        )
                    )
                ],
                False
            )
        })

        it("returns false for constrData without fields", () => {
            runner([constr(0)], False)
        })

        it("returns false for iData", () => {
            runner([int(0)], False)
        })

        it("returns false for bData", () => {
            runner([bytes([])], False)
        })

        it("returns false for listData", () => {
            runner([list()], False)
        })

        it("returns false for mapData", () => {
            runner([map([])], False)
        })
    })
})
