require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
  SlashCommandBuilder
} = require('discord.js');

// =====================
// SAFE REPLY
// =====================
async function safeReply(i, content) {
  try {
    if (i.replied || i.deferred) {
      return await i.followUp({ content, flags: 64 });
    }
    return await i.reply({ content, flags: 64 });
  } catch (err) {
    console.error('Reply error:', err);
  }
}

// =====================
// MEMORY DATABASE
// =====================
const db = {
  teams: {},
  warnings: {},
  strikes: {},
  suspensions: {}
};

// =====================
// COMMANDS
// =====================
const commands = [

  // ADD TEAM
  {
    data: new SlashCommandBuilder()
      .setName('addteam')
      .setDescription('Create a crew')
      .addStringOption(o =>
        o.setName('name').setDescription('Team name').setRequired(true)
      ),

    async execute(i) {
      const name = i.options.getString('name');

      if (db.teams[name]) {
        return safeReply(i, '❌ Team already exists.');
      }

      db.teams[name] = { members: [] };

      safeReply(i, `🏷️ Team **${name}** created.`);
    }
  },

  // SIGN
  {
    data: new SlashCommandBuilder()
      .setName('sign')
      .setDescription('Add player to team')
      .addStringOption(o =>
        o.setName('team').setDescription('Team').setRequired(true)
      )
      .addUserOption(o =>
        o.setName('user').setDescription('User').setRequired(true)
      ),

    async execute(i) {
      const team = i.options.getString('team');
      const user = i.options.getUser('user');

      if (!db.teams[team]) return safeReply(i, '❌ Team not found.');
      if (db.teams[team].members.length >= 10) {
        return safeReply(i, '❌ Team is full (10 max).');
      }

      db.teams[team].members.push(user.id);

      safeReply(i, `✍️ ${user.username} signed to ${team}`);
    }
  },

  // RELEASE
  {
    data: new SlashCommandBuilder()
      .setName('release')
      .setDescription('Remove player')
      .addStringOption(o =>
        o.setName('team').setDescription('Team').setRequired(true)
      )
      .addUserOption(o =>
        o.setName('user').setDescription('User').setRequired(true)
      ),

    async execute(i) {
      const team = i.options.getString('team');
      const user = i.options.getUser('user');

      if (!db.teams[team]) return safeReply(i, '❌ Team not found.');

      db.teams[team].members =
        db.teams[team].members.filter(id => id !== user.id);

      safeReply(i, `🚪 ${user.username} removed from ${team}`);
    }
  },

  // STRIKE
  {
    data: new SlashCommandBuilder()
      .setName('strike')
      .setDescription('Add strike to team')
      .addStringOption(o =>
        o.setName('team').setDescription('Team').setRequired(true)
      ),

    async execute(i) {
      const team = i.options.getString('team');

      if (!db.teams[team]) return safeReply(i, '❌ Team not found.');

      db.strikes[team] = (db.strikes[team] || 0) + 1;

      safeReply(i, `⚡ ${team} has ${db.strikes[team]} strike(s)`);
    }
  },

  // WARN
  {
    data: new SlashCommandBuilder()
      .setName('warn')
      .setDescription('Warn user')
      .addUserOption(o =>
        o.setName('user').setDescription('User').setRequired(true)
      )
      .addStringOption(o =>
        o.setName('reason').setDescription('Reason').setRequired(true)
      ),

    async execute(i) {
      const user = i.options.getUser('user');
      const reason = i.options.getString('reason');

      if (!db.warnings[user.id]) db.warnings[user.id] = [];
      db.warnings[user.id].push(reason);

      safeReply(i, `⚠️ ${user.username} warned: ${reason}`);
    }
  },

  // WARNS
  {
    data: new SlashCommandBuilder()
      .setName('warns')
      .setDescription('Check warnings')
      .addUserOption(o =>
        o.setName('user').setDescription('User').setRequired(true)
      ),

    async execute(i) {
      const user = i.options.getUser('user');
      const warns = db.warnings[user.id] || [];

      safeReply(i, `📋 ${user.username} has ${warns.length} warning(s)`);
    }
  },

  // SUSPEND
  {
    data: new SlashCommandBuilder()
      .setName('suspend')
      .setDescription('Suspend player')
      .addUserOption(o =>
        o.setName('user').setDescription('User').setRequired(true)
      )
      .addIntegerOption(o =>
        o.setName('days').setDescription('Days').setRequired(true)
      ),

    async execute(i) {
      const user = i.options.getUser('user');
      const days = i.options.getInteger('days');

      db.suspensions[user.id] = Date.now() + days * 86400000;

      safeReply(i, `🚫 ${user.username} suspended for ${days} day(s)`);
    }
  },

  // BAIL
  {
    data: new SlashCommandBuilder()
      .setName('bail')
      .setDescription('Remove suspension')
      .addUserOption(o =>
        o.setName('user').setDescription('User').setRequired(true)
      ),

    async execute(i) {
      const user = i.options.getUser('user');

      delete db.suspensions[user.id];

      safeReply(i, `🔓 ${user.username} is no longer suspended`);
    }
  },

  // HELP
  {
    data: new SlashCommandBuilder()
      .setName('help')
      .setDescription('Commands list'),

    async execute(i) {
      safeReply(i,
        `📋 Commands:
/addteam /sign /release /strike /warn /warns /suspend /bail`
      );
    }
  }
];

// =====================
// BOT
// =====================
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();
for (const c of commands) {
  client.commands.set(c.data.name, c);
}

// =====================
// REGISTER
// =====================
client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands.map(c => c.data.toJSON()) }
  );

  console.log('✅ Commands registered!');
});

// =====================
// FIXED INTERACTIONS
// =====================
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const cmd = client.commands.get(interaction.commandName);
  if (!cmd) return;

  try {
    await cmd.execute(interaction);
  } catch (err) {
    console.error(err);
    await safeReply(interaction, '❌ Error running command.');
  }
});

process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);

client.login(process.env.TOKEN);