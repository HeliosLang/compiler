import { 
    IROptimizer,
    IRScope,
    Program,
    ToIRContext,
    buildIRExpr, 
    tokenizeIR
} from "helios"


function optimize(src, n = 1) {
    const ir = tokenizeIR(src);

    let expr = buildIRExpr(ir);

    const scope = new IRScope(null, null);

    expr.resolveNames(scope);

    for (let iter = 0; iter < n; iter++) {
        const optimizer = new IROptimizer(expr, true);

        expr = optimizer.optimize();
    }

    return expr.toString();
}

function optimizeHelios(src, n = 1) {
    const program = Program.new(src);

    const [rawIR, _] = program.toIR(new ToIRContext(false, "")).generateSource();

    console.log(rawIR)
    return optimize(rawIR, n);
}

export default async function test() {
    console.log(optimize(`
    (a, b) -> {
        __core__multiplyInteger(__core__addInteger(a, b), 0)
    }
    `))

    console.log(optimize(`
    (a, b) -> {
        __core__multiplyInteger(__core__divideInteger(a, b), 0)
    }`))

    console.log(optimize(`
    (a, b) -> {
        (fn) -> {
            fn(a, b)()
        }(
            (a, b) -> {
                () -> {
                    __core__addInteger(a, b)
                }
            }
        )
    }`))

    console.log(optimize(`
    (a, b) -> {
        (fn) -> {
            fn(a, b)()(a)
        }(
            (a, b) -> {
                () -> {
                    (c) -> {
                        __core__addInteger(a, b)
                    }
                }
            }
        )
    }`))

    console.log(optimize(`
    (a, b) -> {
        (fn) -> {
            __core__addInteger(
                fn(a, b)()(a), 
                fn(b, a)()(b)
            )
        }(
            (a, b) -> {
                () -> {
                    (c) -> {
                        __core__addInteger(a, b)
                    }
                }
            }
        )
    }`))

    console.log(optimize(`
    (i) -> {
        (id) -> {
            (recurse) -> {
                recurse(recurse, id)
            }(
                (recurse, x) -> {
                    __core__ifThenElse(
                        __core__lessThanInteger(0, x),
                        () -> {
                            recurse(recurse, __core__subtractInteger(x, 1))
                        },
                        () -> {
                            x
                        }
                    )()
                }
            )
        }(__core__addInteger(i, i))
    }
    `))

    console.log(optimize(`
    (i) -> {
        (id) -> {
            (recurse) -> {
                recurse(recurse, i)
            }(
                (recurse, x) -> {
                    __core__ifThenElse(
                        __core__lessThanInteger(0, x),
                        () -> {
                            recurse(recurse, __core__subtractInteger(x, 1))
                        },
                        () -> {
                            id
                        }
                    )()
                }
            )
        }(__core__addInteger(i, i))
    }
    `))

    console.log(optimize(`(__helios__common__list_0) -> {
        (arg0, arg1) -> {
          (b) -> {
            __core__constrData(__core__ifThenElse(
              b,
              1,
              0
            ), __helios__common__list_0)
          }(__core__equalsInteger(__core__unIData(arg0), __core__unIData(arg1)))
        }
      }(__core__mkNilData(()))
      `, 3))

      console.log(optimize(`(arg0) -> {
        __core__iData((a) -> {
          0
        }(__core__unIData(arg0)))
      }`));

      console.log(optimize(`(__helios__common__list_0) -> {
        (__helios__bool____to_data) -> {
        (__helios__int__from_data) -> {
        (__helios__int____eq) -> {
        (__helios__error) -> {
        (__helios__int__decode_zigzag) -> {
        (__helios__int__encode_zigzag) -> {
        (__module__int_encode_decode_zigzag__main) -> {
          (arg0) -> {
            __helios__bool____to_data(__module__int_encode_decode_zigzag__main(__helios__int__from_data(arg0)))
          }
        }((a) -> {
          __helios__int____eq(__helios__int__decode_zigzag(__helios__int__encode_zigzag(a)())(), a)
        })
        }((self) -> {
          () -> {
            __core__ifThenElse(
              __core__lessThanInteger(self, 0),
              () -> {
                __core__subtractInteger(__core__multiplyInteger(self, -2), 1)
              },
              () -> {
                __core__multiplyInteger(self, 2)
              }
            )()
          }
        })
        }((self) -> {
          () -> {
            __core__ifThenElse(
              __core__lessThanInteger(self, 0),
              () -> {
                __helios__error("expected positive int")
              },
              () -> {
                __core__ifThenElse(
                  __core__equalsInteger(__core__modInteger(self, 2), 0),
                  () -> {
                    __core__divideInteger(self, 2)
                  },
                  () -> {
                    __core__divideInteger(__core__addInteger(self, 1), -2)
                  }
                )()
              }
            )()
          }
        })
        }((msg) -> {
          __core__trace(msg, () -> {
            error()
          })()
        })
        }(__core__equalsInteger)
        }(__core__unIData)
        }((b) -> {
          __core__constrData(__core__ifThenElse(
            b,
            1,
            0
          ), __helios__common__list_0)
        })
        }(__core__mkNilData(()))
      `, 3));

      console.log(optimize(`(__helios__int____to_data) -> {
        (__helios__int__from_data) -> {
        (__helios__int__min) -> {
        (__helios__int__bound_max) -> {
        (__module__int_bound_max__main) -> {
          (arg0, arg1) -> {
            __helios__int____to_data(__module__int_bound_max__main(__helios__int__from_data(arg0), __helios__int__from_data(arg1)))
          }
        }((a, b) -> {
          __helios__int__bound_max(a)(b)
        })
        }((self) -> {
          (other) -> {
            __helios__int__min(self, other)
          }
        })
        }((a, b) -> {
          __core__ifThenElse(
            __core__lessThanInteger(a, b),
            a,
            b
          )
        })
        }(__core__unIData)
        }(__core__iData)
    `));

        console.log(optimizeHelios(`
    testing int_to_base58
    func main() -> String {
        a = 0x287fb4cd;
        a.to_base58()
    }
    `))

    console.log(optimizeHelios(`
    testing int_to_from_little_endian
    func main(a: Int) -> Bool {
        Int::from_little_endian(a.to_little_endian()) == a
    }`))

    console.log(optimizeHelios(`testing bytearray_starts_with_1
    func main(a: ByteArray, b: ByteArray) -> Bool {
        (a+b).starts_with(a)
    }`, 2));

    console.log(optimizeHelios(`testing list_new_const
    func main(n: Int, b: Int) -> Bool {
        lst: []Int = []Int::new_const(n, b);
        if (n < 0) {
            lst.length == 0
        } else {
            lst.length == n && lst.all((v: Int) -> Bool {v == b})
        }
    }`, 10));

    console.log(optimizeHelios(`testing list_eq_2
    func main(a: []Int, b: []Int) -> Bool {
        (a == b) == ((a.length == b.length) && (
            []Int::new(a.length, (i: Int) -> Int {i}).all((i: Int) -> Bool {
                a.get(i) == b.get(i)
            })
        ))
    }`));

    console.log(optimizeHelios(`testing list_filter_get_singleton_iterator
    func main(a: []Int) -> Int {
        a
            .to_iterator()
            .map((item: Int) -> {item*2})
            .filter((item: Int) -> {item == 0})
            .get_singleton()
    }`, 3));

    console.log(optimizeHelios(`
    testing list_split_at
    func main(a: []Int, b: Int) -> []Int {
      (c: []Int, d: []Int) = a.split_at(b);

      c + d
    }`));

    console.log(optimizeHelios(`testing list_add_1_alt
    func main(a: []Int) -> Bool {
        newLst: []Int = []Int{} + a;
        newLst == a
    }`, 2))

    console.log(optimizeHelios(`testing list_take_end
    func main(a: []Int, n: Int) -> []Int {
        a.take_end(n)
    }`, 3))

    console.log(optimizeHelios(`testing timerange_never
    func main(a: Int) -> Bool {
        TimeRange::NEVER.contains(Time::new(a))
    }`, 2))

    console.log(optimizeHelios(` testing map_find_value_safe
    func main(a: Map[Int]Int) -> Option[Int] {
        (result: () -> (Int, Int), ok: Bool) = a.find_safe((_, v: Int) -> Bool {v == 0}); 
        if (ok) {
            (_, v: Int) = result(); 
            Option[Int]::Some{v}
        } else {
            Option[Int]::None
        }
    }`));

    console.log(optimizeHelios(`testing hash_new
    func main(a: PubKeyHash) -> Bool {
        []ByteArray{#70, #71, #72, #73, #74, #75, #76, #77, #78, #79, #7a, #7b, #7c, #7d, #7e, #7f}.any((ba: ByteArray) -> Bool {
            PubKeyHash::new(ba) == a
        })
    }`))

    console.log(optimizeHelios(`testing list_fold2_verbose
    func main(a: []Int) -> Int {
        (sa: Int, sb: Int) = a.fold((sum: () -> (Int, Int), x: Int) -> () -> (Int, Int) {
            (sa_: Int, sb_: Int) = sum();
            () -> {(sa_ + x, sb_ + x)}
        }, () -> {(0, 0)})();
        (sa + sb)/2
    }`, 10))
}