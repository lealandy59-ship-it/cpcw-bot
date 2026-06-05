require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  {
    data: new SlashCommandBuilder().setName('addteam').setDescription('Create a new crew (Mod+ only)').addStringOption(o => o.setName('name').setDescription('Crew name').setRequired(true)),
    async execute(i) { await i.reply({ content: '🏷️ Running /addteam...', ephemeral: true }); }
  },
  {
    data: new SlashCommandBuilder().setName('appoint').setDescription('Appoint a new owner to your team').addUserOption(o => o.setName('user').setDescription('New owner').setRequired(true)),
    async execute(i) { await i.reply({ content: '👑 Running /appoint...', ephemeral: true }); }
  },
  {
    data: new SlashCommandBuilder().setName('bail').setDescription("Remove a player's suspension early").addUserOption(o => o.setName('user').setDescription('Player to bail').setRequired(true)),
    async execute(i) { await i.reply({ content: '🔓 Running /bail...', ephemeral: true }); }
  },
  {
    data: new SlashCommandBuilder().setName('ban').setDescription('Ban a member from the server (Mod+ only)').addUserOption(o => o.setName('user').setDescription('Member to ban').setRequired(true)).addStringOption(o => o.setName('reason').setDescription('Reason')),
    async execute(i) { await i.reply({ content: '🔨 Running /ban...', ephemeral: true }); }
  },
  {
    data: new SlashCommandBuilder().setName('clearstrike').setDescription('Clear all strikes from a team (Mod+ only)').addStringOption(o => o.setName('team').setDescription('Team name').setRequired(true)),
    async execute(i) { await i.reply({ content: '🧹 Running /clearstrike...', ephemeral: true }); }
  },
  {
    data: new SlashCommandBuilder().setName('clearwarn').setDescription('Remove all warnings from a member').addUserOption(o => o.setName('user').setDescription('Member to clear').setRequired(true)),
    async execute(i) { await i.reply({ content: '🧹 Running /clearwarn...', ephemeral: true }); }
  },
  {
    data: new SlashCommandBuilder().setName('crew').setDescription('Crew management').addSubcommand(s => s.setName('rename').setDescription('Rename your crew (Owner/Captain only)').addStringOption(o => o.setName('name').setDescription('New crew name').setRequired(true))),
    async execute(i) { await i.reply({ content: '✏️ Running /crew rename...', ephemeral: true }); }
  },
  {
    data: new SlashCommandBuilder().setName('demand').setDescription('Demand to leave your current team'),
    async execute(i) { await i.reply({ content: '🚪 Running /demand...', ephemeral: true }); }
  },
  {
    data: new SlashCommandBuilder().setName('demote').setDescription('Remove a captain role from a player').addUserOption(o => o.setName('user').setDescription('Player to demote').setRequired(true)),
    async execute(i) { await i.reply({ content: '⬇️ Running /demote...', ephemeral: true }); }
  },
  {
    data: new SlashCommandBuilder().setName('disband').setDescription('Disband your team (Owner or Mod+)'),
    async execute(i) { await i.reply({ content: '💥 Running /disband...', ephemeral: true }); }
  },
  {
    data: new SlashCommandBuilder().setName('help').setDescription('View all available commands'),
    async execute(i) {
      await i.reply({ content: '**📋 CPCW Manager Bot Commands**\n`/addteam` `/appoint` `/bail` `/ban` `/clearstrike` `/clearwarn` `/crew rename` `/demand` `/demote` `/disband` `/kick` `/modstrike` `/mute` `/promote` `/release` `/roleall` `/roster` `/score` `/setup` `/sign` `/strike` `/suspend` `/transactions lock` `/transactions unlock` `/warn` `/warns`', ephemeral: true });
    }
  },
  {
    data: new SlashCommandBuilder().setName('kick').setDescription('Kick a member from the server (Mod+ only)').addUserOption(o => o.setName('user').setDescription('Member to kick').setRequired(true)).addStringOption(o => o.setName('reason').setDescription('Reason')),
    async execute(i) { await i.reply({ content: '👢 Running /kick...', ephemeral: true }); }
  },
  {
    data: new SlashCommandBuilder().setName('modstrike').setDescription('Give a mod a strike — 3 strikes triggers removal').addUserOption(o => o.setName('user').setDescription('Mod to strike').setRequired(true)).addStringOption(o => o.setName('reason').setDescription('Reason')),
    async execute(i) { await i.reply({ content: '⚠️ Running /modstrike...', ephemeral: true }); }
  },
  {
    data: new SlashCommandBuilder().setName('mute').setDescription('Timeout (mute) a member (Mod+ only)').addUserOption(o => o.setName('user').setDescription('Member to mute').setRequired(true)).addIntegerOption(o => o.setName('duration').setDescription('Duration in minutes').setRequired(true)).addStringOption(o => o.setName('reason').setDescription('Reason')),
    async execute(i) { await i.reply({ content: '🔇 Running /mute...', ephemeral: true }); }
  },
  {
    data: new SlashCommandBuilder().setName('promote').setDescription('Give a player on your team a Captain role').addUserOption(o => o.setName('user').setDescription('Player to promote').setRequired(true)),
    async execute(i) { await i.reply({ content: '⬆️ Running /promote...', ephemeral: true }); }
  },
  {
    data: new SlashCommandBuilder().setName('release').setDescription('Release a player from your team').addUserOption(o => o.setName('user').setDescription('Player to release').setRequired(true)),
    async execute(i) { await i.reply({ content: '🚪 Running /release...', ephemeral: true }); }
  },
  {
    data: new SlashCommandBuilder().setName('roleall').setDescription('Assign a role to every member in a team').addStringOption(o => o.setName('team').setDescription('Team name').setRequired(true)).addRoleOption(o => o.setName('role').setDescription('Role to assign').setRequired(true)),
    async execute(i) { await i.reply({ content: '🏷️ Running /roleall...', ephemeral: true }); }
  },
  {
    data: new SlashCommandBuilder().setName('roster').setDescription("View a team's full roster").addStringOption(o => o.setName('team').setDescription('Team name').setRequired(true)),
    async execute(i) { await i.reply({ content: '📋 Running /roster...', ephemeral: true }); }
  },
  {
    data: new SlashCommandBuilder().setName('score').setDescription('Report a match result (Owner/Captain only)').addStringOption(o => o.setName('opponent').setDescription('Opponent team').setRequired(true)).addIntegerOption(o => o.setName('your-score').setDescription('Your score').setRequired(true)).addIntegerOption(o => o.setName('their-score').setDescription('Their score').setRequired(true)),
    async execute(i) { await i.reply({ content: '🏆 Running /score...', ephemeral: true }); }
  },
  {
    data: new SlashCommandBuilder().setName('setup').setDescription('Manual setup guide (Server Owner only)'),
    async execute(i) { await i.reply({ content: '⚙️ Running /setup...', ephemeral: true }); }
  },
  {
    data: new SlashCommandBuilder().setName('sign').setDescription('Sign a player to your team (Owner/Captain only)').addUserOption(o => o.setName('user').setDescription('Player to sign').setRequired(true)),
    async execute(i) { await i.reply({ content: '✍️ Running /sign...', ephemeral: true }); }
  },
  {
    data: new SlashCommandBuilder().setName('strike').setDescription('Issue a strike to a crew (Mod+ only)').addStringOption(o => o.setName('team').setDescription('Team to strike').setRequired(true)).addStringOption(o => o.setName('reason').setDescription('Reason')),
    async execute(i) { await i.reply({ content: '⚡ Running /strike...', ephemeral: true }); }
  },
  {
    data: new SlashCommandBuilder().setName('suspend').setDescription('Suspend a player (Mod+ only)').addUserOption(o => o.setName('user').setDescription('Player to suspend').setRequired(true)).addIntegerOption(o => o.setName('days').setDescription('Days').setRequired(true)).addStringOption(o => o.setName('reason').setDescription('Reason')),
    async execute(i) { await i.reply({ content: '🚫 Running /suspend...', ephemeral: true }); }
  },
  {
    data: new SlashCommandBuilder().setName('transactions').setDescription('Manage transaction window').addSubcommand(s => s.setName('lock').setDescription('Lock transactions — disables signing')).addSubcommand(s => s.setName('unlock').setDescription('Unlock transactions — re-enables signing')),
    async execute(i) { await i.reply({ content: `🔒 Running /transactions ${i.options.getSubcommand()}...`, ephemeral: true }); }
  },
  {
    data: new SlashCommandBuilder().setName('warn').setDescription('Warn a member — they will receive a DM').addUserOption(o => o.setName('user').setDescription('Member to warn').setRequired(true)).addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(true)),
    async execute(i) { await i.reply({ content: '⚠️ Running /warn...', ephemeral: true }); }
  },
  {
    data: new SlashCommandBuilder().setName('warns').setDescription('View warnings for a member (Mod+ only)').addUserOption(o => o.setName('user').setDescription('Member to check').setRequired(true)),
    async execute(i) { await i.reply({ content: '📋 Running /warns...', ephemeral: true }); }
  },
];

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildModeration] });
client.commands = new Collection();
for (const cmd of commands) client.commands.set(cmd.data.name, cmd);

client.once('ready', async () => {
  console.log(`✅ CPCW Manager Bot online as ${client.user.tag}`);
  const rest = new REST().setToken(process.env.TOKEN);
  await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands.map(c => c.data.toJSON()) });
  console.log('✅ Commands registered!');
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    const msg = { content: '❌ Error running this command.', ephemeral: true };
    interaction.replied || interaction.deferred ? await interaction.followUp(msg) : await interaction.reply(msg);
  }
});

client.login(process.env.TOKEN);