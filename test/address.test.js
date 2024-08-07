import { describe } from "node:test"
import { compileAndRunMany, True, map, int, False, bytes } from "./utils.js"

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
})
