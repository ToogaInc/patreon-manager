import { Client, GuildMember, Role } from "discord.js";
import * as fs from "fs";
import * as path from "path";

const PATREON_TIER_1: string = "Patreon Tier 1";
const PATREON_TIER_2: string = "Patreon Tier 2";
const PATREON_TIER_3: string = "Patreon Tier 3";
const PATREON_TIER_4: string = "Patreon Tier 4";
const PATREON_TIER_5: string = "Patreon Tier 5";
const PATREON_TIER_6: string = "Patreon Tier 6";
const PATREON_TIER_7: string = "Patreon Tier 7";

const FUNGAL_ID: string = "635413437647683596";

const ALL_PATREON: string[] = [
    PATREON_TIER_1,
    PATREON_TIER_2,
    PATREON_TIER_3,
    PATREON_TIER_4,
    PATREON_TIER_5,
    PATREON_TIER_6,
    PATREON_TIER_7
];

const CLIENT = new Client({
    intents: [
        "GUILDS",
        "GUILD_MEMBERS"
    ],
    partials: [
        "GUILD_MEMBER"
    ]
});

CLIENT.on("ready", async () => {
    console.log("Ready.");
});

CLIENT.on("error", e => {
    console.error(e);
});

CLIENT.on("guildMemberUpdate", async (oldMember, newMember) => {
    if (oldMember.guild.id !== FUNGAL_ID) {
        return;
    }

    let member: GuildMember;
    try {
        member = await newMember.fetch();
    }
    catch (e) {
        console.error(`Could not fetch member ${oldMember.id}: ${e}`);
        return;
    }

    if (oldMember.roles.cache.filter(x => ALL_PATREON.some(y => y === x.name)).size === 0
        && newMember.roles.cache.filter(x => ALL_PATREON.some(y => y === x.name)).size === 0) {
        console.log("skipped");
        return;
    }

    const newRoles: [string, Role][] = member.roles.cache.map(x => [x.name, x]);
    const currPatreonRoles = newRoles.filter(([name,]) => ALL_PATREON.some(y => y === name));
    const currPatreonNames = currPatreonRoles.map(x => x[0]);

    for await (const [id, server] of CLIENT.guilds.cache) {
        if (id === FUNGAL_ID) {
            continue;
        }
        
        try {
            // First, figure out what roles to remove.
            let m = await server.members.fetch(oldMember.id);
            const rolesToRemove = server.roles.cache
                .filter(x => ALL_PATREON.some(y => y === x.name) 
                    && !currPatreonNames.some(y => y === x.name));
            await m.roles.remove(rolesToRemove);

            // Figure out what roles to add
            const rolesToAdd = server.roles.cache
                .filter(x => currPatreonNames.some(y => y === x.name));
            await m.roles.add(rolesToAdd);
        }
        catch (e) {
            continue;
        }
    }
});

(async () => {
    const content = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "config.json")).toString());
    const token: string = content["token"];
    await CLIENT.login(token);
})();