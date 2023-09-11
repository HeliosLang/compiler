import {
    IREvaluator,
    IRScope,
    Program,
    ToIRContext,
    annotateIR,
    buildIRExpr,
    tokenizeIR
} from "helios";

function compileHeliosAndAnnotate(src) {
    const program = Program.new(src)

    const [rawIR, _] = program.toIR(new ToIRContext(false, "")).generateSource()

    return compileAndAnnotate(rawIR)
}

function compileAndAnnotate(src) {
    const ir = tokenizeIR(src);

    const expr = buildIRExpr(ir);

    const scope = new IRScope(null, null);

    expr.resolveNames(scope);

    const evaluation = new IREvaluator();

    evaluation.eval(expr);

    return annotateIR(evaluation, expr);
}

export default async function test() {
    /*console.log(compileAndAnnotate(
        `(a, b) -> {
            a
        }`
    ));

    console.log(compileAndAnnotate(
        `(a, b) -> {
            __core__divideInteger(a, b)
        }`
    ));

    console.log(compileHeliosAndAnnotate(
        `testing int_div_0
    
        func main(a: Int) -> Int {
            a / 0
        }`
    ));

    console.log(compileHeliosAndAnnotate(
        `testing int_decode_zigzag
    
        func main(a: Int) -> Int {
            a.decode_zigzag()
        }`
    ));

    console.log(compileHeliosAndAnnotate(`
    testing int_to_from_little_endian
    func main(a: Int) -> Bool {
        Int::from_little_endian(a.to_little_endian()) == a
    }`));

    console.log(compileHeliosAndAnnotate(`
    testing int_parse
    func main(a: Int) -> Bool {
        Int::parse(a.show()) == a
    }`));

    console.log(compileAndAnnotate(
        `(a, b) -> {
            __core__multiplyInteger(__core__divideInteger(a, b), 0)
        }`
    ));

    console.log(compileAndAnnotate(
        `(a) -> {
            (recurse) -> {
                recurse(recurse, a)
            }(
                (recurse, lst) -> {
                    __core__chooseList(
                        lst,
                        () -> {
                            __core__trace("end", ())
                        },
                        () -> {
                            __core__trace("not end", recurse(recurse, __core__tailList(lst)))
                        }
                    )()
                }
            )
        }`
    ));

    console.log(compileAndAnnotate(
        `(a) -> {
            (recurse) -> {
                recurse(recurse, a)
            }(
                (recurse, lst) -> {
                    __core__chooseList(
                        lst,
                        () -> {
                            __core__trace("end", ())
                        },
                        () -> {
                            __core__trace("not end", recurse(recurse, __core__tailList__safe(lst)))
                        }
                    )()
                }
            )
        }`
    ));

    console.log(compileAndAnnotate(
        `(arg0) -> {
            __core__iData((a) -> {
              0
            }(__core__unIData(arg0)))
          }
          `
    ));

    console.log(compileAndAnnotate(
        `(arg0) -> {
              (b) -> {
                __core__constrData(__core__ifThenElse(
                  b,
                  1,
                  0
                ), __core__mkNilData(()))
              }((a) -> {
                __core__equalsInteger((self) -> {
                  __core__ifThenElse(
                    __core__lessThanInteger(self, 0),
                    () -> {
                      error()
                    },
                    __core__ifThenElse(
                      __core__equalsInteger(__core__modInteger(self, 2), 0),
                      () -> {
                        __core__divideInteger(self, 2)
                      },
                      () -> {
                        __core__divideInteger(__core__addInteger(self, 1), -2)
                      }
                    )
                  )()
                }((self) -> {
                  __core__ifThenElse(
                    __core__lessThanInteger(self, 0),
                    () -> {
                      __core__subtractInteger(__core__multiplyInteger(self, -2), 1)
                    },
                    () -> {
                      __core__multiplyInteger(self, 2)
                    }
                  )()
                }(a)), a)
              }(__core__unIData(arg0)))
        }`
    ));

    console.log(compileAndAnnotate(`(arg0) -> {
        __core__constrData(__core__ifThenElse(
          (a) -> {
            __core__equalsInteger((bytes) -> {
              (n) -> {
                (recurse) -> {
                  recurse(recurse, 0, 1, 0)
                }((recurse, acc, pow, i) -> {
                  __core__ifThenElse(
                    __core__equalsInteger(i, n),
                    () -> {
                      acc
                    },
                    () -> {
                      (new_acc) -> {
                        recurse(recurse, new_acc, __core__multiplyInteger(pow, 256), __core__addInteger(i, 1))
                      }(__core__addInteger(acc, __core__multiplyInteger(__core__indexByteString(bytes, i), pow)))
                    }
                  )()
                })
              }(__core__lengthOfByteString(bytes))
            }(__core__ifThenElse(
              __core__lessThanInteger(a, 0),
              () -> {
                error()
              },
              () -> {
                (recurse) -> {
                  recurse(recurse, a)
                }((recurse, self) -> {
                  __core__consByteString(__core__modInteger(self, 256), __core__ifThenElse(
                    __core__lessThanInteger(self, 256),
                    () -> {
                      #
                    },
                    () -> {
                      recurse(recurse, __core__divideInteger(self, 256))
                    }
                  )())
                })
              }
            )()), a)
          }(__core__unIData(arg0)),
          1,
          0
        ), __core__mkNilData(()))
      }
      `))

      console.log(compileAndAnnotate(`(__helios__string____to_data) -> {
                (__helios__error) -> {
        (__helios__common__BASE58_ALPHABET) -> {
        (__helios__int__to_base58) -> {
        (__module__int_to_base58__main) -> {
          () -> {
            __helios__string____to_data(__module__int_to_base58__main())
          }
        }(() -> {
          (a) -> {
            __helios__int__to_base58(a)
          }(679457997)
        })
        }((self) -> {
          __core__decodeUtf8(__core__ifThenElse(
            __core__lessThanInteger(self, 0),
            () -> {
              __helios__error("expected positive number")
            },
            () -> {
              (recurse) -> {
                recurse(recurse, self, #)
              }((recurse, self, bytes) -> {
                (digit) -> {
                  (bytes) -> {
                    __core__ifThenElse(
                      __core__lessThanInteger(self, 58),
                      () -> {
                        bytes
                      },
                      () -> {
                        recurse(recurse, __core__divideInteger(self, 58), bytes)
                      }
                    )()
                  }(__core__consByteString(__core__indexByteString(__helios__common__BASE58_ALPHABET, digit), bytes))
                }(__core__modInteger(self, 58))
              })
            }
          )())
        })
        }(#31323334353637383941424344454647484a4b4c4d4e505152535455565758595a6162636465666768696a6b6d6e6f707172737475767778797a)
        }((msg) -> {
          __core__trace(msg, () -> {
            error()
          })()
        })
        }((s) -> {
          __core__bData(__core__encodeUtf8(s))
        })
      `));

      console.log(compileHeliosAndAnnotate(`
      testing int_to_from_little_endian
      func main(a: Int) -> Bool {
          Int::from_little_endian(a.to_little_endian()) == a
      }`));

      console.log(compileHeliosAndAnnotate(`testing bytearray_starts_with_1
      func main(a: ByteArray, b: ByteArray) -> Bool {
          (a+b).starts_with(a)
      }`))

      console.log(compileHeliosAndAnnotate(`testing list_eq_2
      func main(a: []Int, b: []Int) -> Bool {
          (a == b) == ((a.length == b.length) && (
              []Int::new(a.length, (i: Int) -> Int {i}).all((i: Int) -> Bool {
                  a.get(i) == b.get(i)
              })
          ))
      }`));

      console.log(compileHeliosAndAnnotate(`testing list_length
      func main(a: []Int) -> Int {
        a.length
      }`));

      console.log(compileHeliosAndAnnotate(`testing list_filter_get_singleton_iterator
    func main(a: []Int) -> Int {
        a
            .to_iterator()
            .map((item: Int) -> {item*2})
            .filter((item: Int) -> {item == 0})
            .get_singleton()
    }`))

    console.log(compileHeliosAndAnnotate(`testing list_split_at
    func main(a: []Int, b: Int) -> []Int {
      (c: []Int, d: []Int) = a.split_at(b);

      c + d
    }`))

    console.log(compileHeliosAndAnnotate(`
    testing list_add_1_alt
        func main(a: []Int) -> Bool {
            newLst: []Int = []Int{} + a;
            newLst == a
        }`));


    console.log(compileHeliosAndAnnotate(`
    testing swap
    
    func swap(a: Int, b: Int) -> (Int, Int) {
      (b, a)
    }
    
    func main(a: Int) -> Int {
      (_, c:Int) = swap(a, a);

      c
    }`))

    console.log(compileHeliosAndAnnotate(`
    testing list_take_end
    func main(a: []Int, n: Int) -> []Int {
        a.take_end(n)
    }`));

    console.log(compileAndAnnotate(`(__helios__common__list_0) -> {
      (__helios__bool____to_data) -> {
      (__helios__int__from_data) -> {
      (__helios__common__fields) -> {
      (__helios__common__field_0) -> {
      (__helios__bool__from_data) -> {
      (__helios__common__fields_after_0) -> {
      (__helios__common__field_1) -> {
      (__helios__timerange__contains) -> {
      (__helios__common__list_1) -> {
      (__helios__common__list_2) -> {
      (__helios__timerange__NEVER) -> {
      (__helios__common__identity) -> {
      (__helios__time__new) -> {
      (__module__timerange_never__main) -> {
        (arg0) -> {
          __helios__bool____to_data(__module__timerange_never__main(__helios__int__from_data(arg0)))
        }
      }((a) -> {
        __helios__timerange__contains(__helios__timerange__NEVER)(__helios__time__new(a))
      })
      }(__helios__common__identity)
      }((self) -> {
        self
      })
      }(__core__constrData(0, __helios__common__list_2(__core__constrData(0, __helios__common__list_2(__core__constrData(2, __helios__common__list_0), __helios__bool____to_data(true))), __core__constrData(0, __helios__common__list_2(__core__constrData(0, __helios__common__list_0), __helios__bool____to_data(true))))))
      }((arg0, arg1) -> {
        __core__mkCons(arg0, __helios__common__list_1(arg1))
      })
      }((a) -> {
        __core__mkCons(a, __helios__common__list_0)
      })
      }((self) -> {
        (t) -> {
          (lower) -> {
            (extended, closed) -> {
              (lowerExtType, checkUpper) -> {
                __core__ifThenElse(
                  __core__equalsInteger(lowerExtType, 2),
                  () -> {
                    false
                  },
                  () -> {
                    __core__ifThenElse(
                      __core__equalsInteger(lowerExtType, 0),
                      () -> {
                        checkUpper()
                      },
                      () -> {
                        __core__ifThenElse(
                          __core__ifThenElse(
                            closed,
                            () -> {
                              __core__lessThanEqualsInteger(__core__unIData(__core__headList(__core__sndPair(__core__unConstrData(extended)))), t)
                            },
                            () -> {
                              __core__lessThanInteger(__core__unIData(__core__headList(__core__sndPair(__core__unConstrData(extended)))), t)
                            }
                          )(),
                          () -> {
                            checkUpper()
                          },
                          () -> {
                            false
                          }
                        )()
                      }
                    )()
                  }
                )()
              }(__core__fstPair(__core__unConstrData(extended)), () -> {
                (upper) -> {
                  (extended, closed) -> {
                    (upperExtType) -> {
                      __core__ifThenElse(
                        __core__equalsInteger(upperExtType, 0),
                        () -> {
                          false
                        },
                        () -> {
                          __core__ifThenElse(
                            __core__equalsInteger(upperExtType, 2),
                            () -> {
                              true
                            },
                            () -> {
                              __core__ifThenElse(
                                __core__ifThenElse(
                                  closed,
                                  () -> {
                                    __core__lessThanEqualsInteger(t, __core__unIData(__core__headList(__core__sndPair(__core__unConstrData(extended)))))
                                  },
                                  () -> {
                                    __core__lessThanInteger(t, __core__unIData(__core__headList(__core__sndPair(__core__unConstrData(extended)))))
                                  }
                                )(),
                                true,
                                false
                              )
                            }
                          )()
                        }
                      )()
                    }(__core__fstPair(__core__unConstrData(extended)))
                  }(__helios__common__field_0(upper), __helios__bool__from_data(__helios__common__field_1(upper)))
                }(__helios__common__field_1(self))
              })
            }(__helios__common__field_0(lower), __helios__bool__from_data(__helios__common__field_1(lower)))
          }(__helios__common__field_0(self))
        }
      })
      }((self) -> {
        __core__headList(__helios__common__fields_after_0(self))
      })
      }((self) -> {
        __core__tailList(__helios__common__fields(self))
      })
      }((d) -> {
        __core__ifThenElse(
          __core__equalsInteger(__core__fstPair(__core__unConstrData(d)), 0),
          false,
          true
        )
      })
      }((self) -> {
        __core__headList(__helios__common__fields(self))
      })
      }((self) -> {
        __core__sndPair(__core__unConstrData(self))
      })
      }(__core__unIData)
      }((b) -> {
        __core__constrData(__core__ifThenElse(
          b,
          1,
          0
        ), __helios__common__list_0)
      })
      }(__core__mkNilData(()))
      `))

      console.log(compileHeliosAndAnnotate(`testing list_head_iterator
      func main(a: []Int) -> Bool {
          if (a.length == 0) {
              true
          } else {
              a.to_iterator().head() == a.get(0)
          }
      }`))

      console.log(compileHeliosAndAnnotate(`testing map_find_value_safe
      func main(a: Map[Int]Int) -> Option[Int] {
          (result: () -> (Int, Int), ok: Bool) = a.find_safe((_, v: Int) -> Bool {v == 0}); 
          if (ok) {
              (_, v: Int) = result(); 
              Option[Int]::Some{v}
          } else {
              Option[Int]::None
          }
      }`))

      console.log(compileHeliosAndAnnotate(`testing hash_new
      func main(a: PubKeyHash) -> Bool {
          []ByteArray{#70, #71, #72, #73, #74, #75, #76, #77, #78, #79, #7a, #7b, #7c, #7d, #7e, #7f}.any((ba: ByteArray) -> Bool {
              PubKeyHash::new(ba) == a
          })
      }`))

      console.log(compileHeliosAndAnnotate(`testing bytearray_show
      func main(a: ByteArray) -> String {
          a.show()
      }`))

      console.log(compileHeliosAndAnnotate(`testing list_filter_get_singleton
      func main(a: []Int) -> Int {
          a.map((item: Int) -> {item*2}).filter((item: Int) -> {item == 0}).get_singleton()
      }`))

      console.log(compileHeliosAndAnnotate(`testing bool_and_alt
      func main(a: Bool, b: Bool) -> Bool {
          Bool::and(() -> Bool {
              a
          }, () -> Bool {
              b && (0 / 0 == 0)
          })
      }`))

      console.log(compileHeliosAndAnnotate(`testing list_filter_get_singleton_iterator
      func main(a: []Int) -> Int {
          a
              .to_iterator()
              .map((item: Int) -> {item*2})
              .filter((item: Int) -> {item == 0})
              .get_singleton()
      }`))

      console.log(compileHeliosAndAnnotate(`testing list_fold2_verbose
      func main(a: []Int) -> Int {
          (sa: Int, sb: Int) = a.fold((sum: () -> (Int, Int), x: Int) -> () -> (Int, Int) {
              (sa_: Int, sb_: Int) = sum();
              () -> {(sa_ + x, sb_ + x)}
          }, () -> {(0, 0)})();
          (sa + sb)/2
      }`))*/

      console.log(compileAndAnnotate(`(arg0) -> {
        __core__iData((recurse) -> {
          recurse(recurse, __core__unListData(arg0), () -> {
            (callback) -> {
              callback(0, 0)
            }
          })
        }((recurse, self, z) -> {
          __core__chooseList(self, () -> {
            z
          }, () -> {
            recurse(recurse, __core__tailList(self), (prev, item) -> {
              (sum, x) -> {
                sum()((sa_, sb_) -> {
                  () -> {
                    (callback) -> {
                      callback(__core__addInteger(sa_, x), __core__addInteger(sb_, x))
                    }
                  }
                })
              }(prev, __core__unIData(item))
            }(z, __core__headList(self)))
          })()
        })()((sa, sb) -> {
          __core__divideInteger(__core__addInteger(sa, sb), 2)
        }))
      }`))

}