# How to profile a test run

```sh
> npm test --prof <test-name>
```

For example:
```sh
> npm test --prof builtins
```

The profile output can be processed using the following command:

```sh
> node --prof-process isolate-0x.......-......-v8.log > profile.log
```