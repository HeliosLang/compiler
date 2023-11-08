import { Program, RuntimeError, assertDefined, assert, bytesToText } from "helios";

export default async function test() {
    const src = `testing data_switch_constr
    
    func main(d: Data) -> String {
      d.switch{
        Int => "int",
        (i: Int, []Data) => i.show(),
        ByteArray => "bytearray",
        _ => "other"
      }
    }
  
    enum MyEnum {
      One
      Two
      Three{x: Int}
    }
  
    const DATA: MyEnum::Three = MyEnum::Three{10}
    `;
  
    const program = Program.new(src);
  
    const data = program.evalParam("DATA");
  
    let res = await program.compile(true).run([data]);
  
    if (res instanceof RuntimeError) {
        throw new Error("unexpected"); 
    } else {
        assert(bytesToText(assertDefined(res.data).bytes) == "2");
    }
}