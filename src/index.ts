import { REST } from "@discordjs/rest";
import { Client, Guild, GuildMember, Role } from "discord.js";
import { Routes } from "discord-api-types/v10";
import * as fs from "fs";
import * as path from "path";


// =========================================================== //
//                  CONSTANTS                                  //
// =========================================================== //


// The server where the Patreon integration will occur.
const BASE_SERVER_ID: string = "635413437647683596";

// The name of the command that lets users sync their Patreon roles.
const SYNC_CMD_NAME: string = "syncpatreon";


// Patreon tiers; all servers MUST have these names.
const ALL_PATREON: string[] = [
    "Patreon Tier 1",
    "Patreon Tier 2",
    "Patreon Tier 3",
    "Patreon Tier 4",
    "Patreon Tier 5",
    "Patreon Tier 6",
    "Patreon Tier 7"
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

const COMMANDS = [
    {
        name: SYNC_CMD_NAME,
        description: "Updates your roles with the Patreon roles. You must be in the Fungal server."
    }
];

const COOLDOWN: Set<string> = new Set();

// =========================================================== //
//                  EVENTS                                     //
// =========================================================== //

process.on("unhandledRejection", e => {
    console.error(`[${new Date().toString()}]`);
    console.error(e);
    console.error("===================================");
});

CLIENT.on("ready", async () => {
    console.log("Ready.");
});

CLIENT.on("error", e => {
    console.error(e);
});

CLIENT.on("guildMemberUpdate", async (oldMember, newMember) => {
    if (oldMember.guild.id !== BASE_SERVER_ID) {
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
        return;
    }


    await checkPatreonRoles(member.id, member.guild);
});

CLIENT.on("interactionCreate", async i => {
    if (!i.isCommand()) {
        return;
    }

    if (i.commandName !== SYNC_CMD_NAME || !i.guild) {
        return;
    }

    if (COOLDOWN.has(i.user.id)) {
        await i.reply({
            content: "This command is on cooldown. Try again later.",
            ephemeral: true
        });

        return;
    }

    COOLDOWN.add(i.user.id);
    setTimeout(() => {
        COOLDOWN.delete(i.user.id);
    }, 30 * 1000);

    await checkPatreonRoles(i.user.id);
    await i.reply({
        content: "Okay, synced successfully.",
        ephemeral: true
    });
});

CLIENT.on("guildMemberAdd", async member => {
    await checkPatreonRoles(member.id);
});

CLIENT.on("guildMemberRemove", async member => {
    if (member.guild.id !== BASE_SERVER_ID) {
        return;
    }

    // Remove patreon roles from all servers
    for await (const [, server] of CLIENT.guilds.cache) {
        try {
            // First, figure out what roles to remove.
            const m = await server.members.fetch(member.id);
            const rolesToRemove = server.roles.cache
                .filter(x => ALL_PATREON.some(y => y === x.name));
            await m.roles.remove(rolesToRemove);
        }
        catch (e) {
            // nothing
        }
    }
});

// =========================================================== //
//                  FUNCTIONS                                  //
// =========================================================== //

/**
 * Checks and adds/removes the Patreon role for a member.
 * @param memberId The ID of the member to check.
 * @param fungalServer The Fungal Caverns Discord server. Note that you should only pass in a value if the server is from Fungal.
 */
async function checkPatreonRoles(memberId: string, fungalServer?: Guild): Promise<void> {
    if (!fungalServer || fungalServer.id !== BASE_SERVER_ID) {
        try {
            fungalServer = await CLIENT.guilds.fetch(BASE_SERVER_ID);
        }
        catch (e) {
            return;
        }
    }

    // See what roles the person has in the Fungal server.
    let memberFungal: GuildMember;
    try {
        memberFungal = await fungalServer.members.fetch(memberId);
    }
    catch (e) {
        return;
    }

    const newRoles: [string, Role][] = memberFungal.roles.cache.map(x => [x.name, x]);
    const currPatreonRoles = newRoles.filter(([name,]) => ALL_PATREON.some(y => y === name));
    const currPatreonNames = currPatreonRoles.map(x => x[0]);

    for await (const [id, server] of CLIENT.guilds.cache) {
        if (id === BASE_SERVER_ID) {
            continue;
        }

        try {
            // First, figure out what roles to remove.
            const m = await server.members.fetch(memberId);
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
            // nothing
        }
    }
}

(async () => {
    const content = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "config.json")).toString());
    const token: string = content["token"];
    const clientId: string = content["clientId"];

    const rest = new REST({ version: "10" }).setToken(token);
    rest.put(
        Routes.applicationCommands(clientId),
        {
            body: COMMANDS
        }
    );

    await CLIENT.login(token);
})();