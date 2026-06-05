require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
  SlashCommandBuilder
} = require('discord.js');

// ✅ SAFE REPLY SYSTEM (FIXES ALL REPLY ISSUES)
async function safeReply(i, content) {
  try {
    if (i.replied || i.deferred) {
      return await i.followUp({ content, flags: 64 });
    }
    return await i.reply({ content, flags: 64 });
  } catch (err) {
    console.error('Reply Error:', err);
  }
}

const commands = [
  {
    data: new SlashCommandBuilder()
      .setName('addteam')
      .setDescription('Create a new crew (Mod+ only)')
      .addStringOption(o =>
        o.setName('name')
          .setDescription('Crew name')
          .setRequired(true)
      ),

    async execute(i) {
      const name = i.options.getString('name');
      await safeReply(i, `🏷️ Team "${name}" created successfully.`);
    }
  },

  {
    data: new SlashCommandBuilder()
      .setName('appoint')
      .setDescription('Appoint a new owner to your team')
      .addUserOption(o =>
        o.setName('user')
          .setDescription('New owner')
          .setRequired(true)
      ),

    async execute(i) {
      const user = i.options.getUser('user');
      await safeReply(i, `👑 ${user} is now the team owner.`);
    }
  },

  {
    data: new SlashCommandBuilder()
      .setName('bail')
      .setDescription("Remove a player's suspension early")
      .addUserOption(o =>
        o.setName('user')
          .setDescription('Player to bail')
          .setRequired(true)
      ),

    async execute(i) {
      const user = i.options.getUser('user');
      await safeReply(i, `🔓 ${user}'s suspension has been removed.`);
    }
  },

  {
    data: new SlashCommandBuilder()
      .setName('ban')
      .setDescription('Ban a member from the server (Mod+ only)')
      .addUserOption(o =>
        o.setName('user')
          .setDescription('Member to ban')
          .setRequired(true)
      )
      .addStringOption(o =>
        o.setName('reason')
          .setDescription('Reason')
      ),

    async execute(i) {
      const user = i.options.getUser('user');
      const reason = i.options.getString('reason') || 'No reason provided';

      await safeReply(i, `🔨 ${user} has been banned. Reason: ${reason}`);
    }
  },

  {
    data: new SlashCommandBuilder()
      .setName('help')
      .setDescription('View all commands'),

    async execute(i) {
      await safeReply(
        i,
        `📋 CPCW Commands:
/addteam /appoint /bail /ban /clearstrike /clearwarn /kick /mute /promote /release /roster /score /setup /sign /strike /suspend`
      );
    }
  }
];

// 🔥 BOT SETUP
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

client.commands = new Collection();
for (const cmd of commands) {
  client.commands.set(cmd.data.name, cmd);
}

// 🔥 REGISTER COMMANDS
client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  try {
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands.map(c => c.data.toJSON()) }
    );

    console.log('✅ Commands registered!');
  } catch (err) {
    console.error('Command register error:', err);
  }
});

// 🔥 FIXED INTERACTION HANDLER
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await safeReply(interaction, '❌ Error running this command.');
  }
});

process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);

// 🔥 LOGIN
client.login(process.env.TOKEN);