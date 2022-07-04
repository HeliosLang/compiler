# Part 1 of Plutus-Light how-to guide: *cardano-node* setup
You will need a Linux environment with *docker* for this.

Start a *cardano-node* docker container:
```bash
$ docker run -d \
  -e NETWORK=testnet \
  -e TESTNET_MAGIC_NUM=1097911063 \
  -e CARDANO_NODE_SOCKET_PATH=/ipc/node.socket \
  -v cardano-testnet-data:/data \
  inputoutput/cardano-node:latest
```

This command will automatically download the latest *cardano-node* image, and create a named docker volume for storing the blockchain state.

Check that the *cardano-node* container is running using the following command:
```bash
$ docker ps
```
Take note of the container id.

You can stop the container any time:
```bash
$ docker stop <container-id>
```
I recommend using `docker stop` and not `docker rm -f` as it allows *cardano-node* processes to receive the more graceful `SIGTERM` signal (instead of just `SIGKILL`).

You can clean up stopped containers if you are running low on system resources:
```bash
$ docker system prune
```

About 30 seconds after starting the *cardano-node* container, `/ipc/node.socket` should've been created and you can start using `cardano-cli` to query the blockchain.

Check the blockchain synchronization status using the following command:
```bash
$ docker exec <container-id> cardano-cli query tip --testnet-magic 1097911063
```

It can take up to 10 hours for your *cardano-node* to fully synchronize.