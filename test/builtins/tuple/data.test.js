import { runTestScript } from "../../test-runners.js"

export default async function test() {
    await runTestScript(
        `
    testing tuple_data

    struct Struct {
        field: (Int, Int, Int)
    }
    
    func main() -> Bool {
        s = Struct{(1, 2, 3)};
        (a: Int, b: Int, _) = s.field;
        a == 1 && b == 2
    }`,
        "data(1{})",
        []
    )
}
