import { assert, Program } from "helios"

export default async function test() {
    const src = `
testing tagged_struct

struct TaggedStruct {
	a: Int "@"
	b: Int "hello-world"
}

func main() -> TaggedStruct {
	s = TaggedStruct{0, 10};
	print(s.b.show());
	c: TaggedStruct = s.copy(b: 5);
	c
}
`

    const program = Program.new(src)

    const res = await program.compile().run([])

    const json = res.data.toSchemaJson()

    console.log(json)

    assert(JSON.parse(json).fields[0].map[1].v.int == 5)
}
