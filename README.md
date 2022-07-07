# PatreonManager
A bot designed to help manage Patreon donations across multiple servers.

## Disclaimer
The source code here is essentially hardcoded to work specifically with [Dungeoneer](https://discord.gg/o3), [Fungal and Crystal Caverns](https://discord.gg/fungal), and other possible Discord servers. While you can use the source code for your own use, you will need to modify it to work with your needs. In particular, you will need to modify the constants section of the source code.

## The Idea
As far as I'm aware, when you set up a Patreon, you can only connect your Patreon to one server (the *base server*). So, if you have a network of servers where, if someone has Patreon in one server, they get Patreon in all servers in the network, then this becomes inconvenient.

This bot acknowledges this issue by automatically syncing the member roles with the Patreon role(s) across all network servers that have the Patreon roles. This syncing occurs:
- when the member joins the server,
- when the member leaves the base server (they lose their Patreon role(s) in every server in the network),
- when the Patreon role(s) are added to the user, or removed from the user, and
- when the user runs the `syncpatreon` command manually.

## Setup
In your base server, define your Patreon roles. Then, for each server in your network, create the Patreon roles with the same exact name as defined in your base server. From there, in the bot's source code, be sure to modify the names of the Patreon roles (the `ALL_PATREON` variable) so that they are the same as the ones across all of your servers.

For example, if (in your base server) your Patreon roles are called `Patreon Tier 1`, `Patreon Tier 2`, and `Patreon Ultra`, then:
- in *each* server in your network, you need to create the `Patreon Tier 1`, `Patreon Tier 2`, and `Patreon Ultra` roles.
- in the source code, set `ALL_PATREON` to `["Patreon Tier 1", "Patreon Tier 2", "Patreon Ultra"]`.

## License
Unless otherwise specified, all files in this repository here are listed under the MIT license.