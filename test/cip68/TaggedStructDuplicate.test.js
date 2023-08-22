import {
	assert,
	Program
} from "helios"

export default async function test() {
	const src = `
testing tagged_struct

struct TaggedStruct {
	a: Int "b"
	b: Int
}

func main() -> TaggedStruct {
	s = TaggedStruct{0, 10};
	print(s.b.show());
	c: TaggedStruct = s.copy(b: 5);
	c
}
`

	try {
	    const program = Program.new(src)
	} catch(e) {
		console.log(e.message)
		if (e.message.includes("duplicate")) {
			return 
		} else {
			throw e
        }

	}

	throw new Error("unexpected")
}
