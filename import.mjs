"use strict";

import fs from "fs";
import { spawn } from "child_process";
import { config } from "./config.mjs";

const tf = process.argv.length - 2;

function main() {
    let p = spawn("./bin/trie-update", [config.model], {
        stdio: ["pipe", "inherit", "inherit"],
    });

    p.on("error", (err) => {
        console.error("Failed to start subprocess:", err);
    });

    let fp = 0;

    process.argv.slice(2).forEach((filename) => {
        fs.readFile(filename, "utf-8", (err, data) => {
            if (err) {
                console.error("Failed to open file for reading:", filename);
                process.exit(1);
            }

            let json = JSON.parse(data);

            for (let msg of json.messages) {
                if (
                    msg.type === "m.room.message" &&
                    !msg.content.hasOwnProperty("m.relates_to")
                )
                    p.stdin.write(`${msg.content.body}\0`);
            }

            fp++;

            if (fp === tf) p.stdin.end();
        });
    });
}

main();
