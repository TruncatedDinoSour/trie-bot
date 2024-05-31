# Trie bot

> A Matrix bot based off https://ari.lt/gh/libtrie

# Importing Element chat exports

If you want to import an Element chat export (JSON) format,
you can simply:

```sh
node import.mjs my-export.json ...
```

You may supply multiple exports.

# Running

```sh
docker compose up -d
```

Or

- Install [Libtrie](https://ari.lt/gh/libtrie) systemwide
- Then:

```sh
npm i
make strip -j$(nproc)
su -c 'make install'
printf '' | ./bin/trie-update model.bin
npm run bot
```
