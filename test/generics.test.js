import { describe, it } from "node:test";
import { Program } from "../src/index.js"

describe("Generic functions", () => {
    it("test 1", () => {
          
        const src = `testing bool_from_data
    
        func unused2() -> Bool {
        true
        }
        
        func unused() -> Bool {
        unused2()
        }
    
        func deserialize[A](a: Data) -> A {
        A::from_data(a)
        }
    
        func main(d: Data) -> Bool {
        deserialize[Bool](d).trace("hello")
        }`;
    
        new Program(src);
    
        //console.log("done creating program 0");
        //console.log(program.dumpIR(true));
                  
    })
})