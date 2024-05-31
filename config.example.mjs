"use strict";

const config = {
    homeserver:
        "https://matrix.ari.lt/" /* The full matrix homeserver, not just the delegated domain */,
    token: "..." /* The access token of the bot account */,
    prefix: "!t " /* The command !prefix - bot will only respond to messages that are valid commands starting with it */,
    autojoin: true /* Should the bot auto-join rooms its invited to? */,
    rooms: [
        "#root:ari.lt",
        "#quotes:ari.lt",
        "#gpt:pain.agency",
    ] /* The rooms of trie-bot */,
    model: "model.bin" /* The model of the Trie */,
};

export default config;
