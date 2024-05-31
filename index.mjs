"use strict";

import config from "./config.mjs";
import {
    MatrixClient,
    AutojoinRoomsMixin,
    RichRepliesPreprocessor,
} from "matrix-bot-sdk";
import { spawn } from "child_process";

let user_id;
const client = new MatrixClient(config.homeserver, config.token);

function get_command_argument(event) {
    return event["content"]["body"]
        .slice(config.prefix.length)
        .split(" ")
        .slice(1)
        .join(" ")
        .trim();
}

async function cmd_gen(room_id, event) {
    // trie-generate <model.bin> <seed> <min size> <count>
    // to
    // gen [count = 1] [min size = 16] [seed = (Math.random() * 1000) + new Date().getTime()]

    let arg = get_command_argument(event);
    let args = ["1", "16", String(Math.random() * 1000 + new Date().getTime())];

    if (arg) {
        let split_args = arg.split(" ");

        args[0] = split_args[0] || args[0];
        args[1] = split_args[1] || args[1];

        if (split_args.length > 2) args[2] = split_args.slice(2).join(" ");
    }

    let p = spawn("trie-generate", [config.model, args[2], args[0], args[1]]);

    p.on("error", async (err) => {
        console.error(event["event_id"], "Failed to start subprocess:", err);
        await client.replyNotice(room_id, event, `Failed to load the Trie.`);
    });

    p.stdout.on("data", async (data) => {
        await client.replyNotice(room_id, event, `[${args[2]}] ${data}`);
    });
}

async function on_cmd(room_id, event) {
    if (event.content.body.toLowerCase().startsWith(`${config.prefix}gen`))
        await cmd_gen(room_id, event);
    else if (
        event.content.body.toLowerCase().startsWith(`${config.prefix}help`)
    )
        await client.replyHtmlText(
            room_id,
            event,
            `
A Matrix bot based off https://ari.lt/gh/libtrie<br/>
<br/>
This room is <b>${config.rooms.includes(room_id) ? "being learnt" : "ignored"}</b>.
<br/>
Commands:<br/>
<br/>
<ul>
<li>gen [count = 1] [min size = 16] [seed = (Math.random() * 1000) + new Date().getTime()] -- Get a new model-like message.</li>
</ul>
<br/>
Source code: https://ari.lt/gh/trie-bot
`,
        );
}

async function on_room_message(room_id, event) {
    if (
        !event["content"] ||
        !event["content"]["body"] ||
        event["sender"] === user_id
    )
        return;

    if (event.content.body.startsWith(config.prefix)) {
        await on_cmd(room_id, event);
        return;
    }

    if (!config.rooms.includes(room_id)) return;

    let p = spawn("trie-update", [config.model], {
        stdio: ["pipe", "ignore", "ignore"],
        silent: true,
    });

    p.on("error", async (err) => {
        console.error(event["event_id"], "Failed to start subprocess:", err);
        await client.replyNotice(room_id, event, `Failed to update the Trie.`);
    });

    p.stdin.write(`${event.content.body.replaceAll("\0", "")}\0`);
    p.stdin.end();
}

async function main() {
    client.addPreprocessor(new RichRepliesPreprocessor(false));

    if (config.autojoin) AutojoinRoomsMixin.setupOnClient(client);

    await client.start().then(async () => {
        user_id = await client.getUserId();
        console.log(`Bot started! User ID: ${user_id}`);
    });

    for (let idx = 0; idx < config.rooms.length; ++idx) {
        let r = await client.resolveRoom(config.rooms[idx]);
        await client.joinRoom(r);
        config.rooms[idx] = r;
    }

    client.on("room.message", async (room_id, event) => {
        try {
            await on_room_message(room_id, event);
        } catch (e) {
            console.error(e);
            client.replyText(room_id, event, "Error!");
        }
    });
}

main();
