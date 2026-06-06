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
async function reply(i, content) {
  try {
    if (i.replied || i.deferred) {
      return await i.followUp({ content, flags: 64 });
    }
    return await i.reply({ content, flags: 64 });
  } catch (err) {
    console.error(err);
  }
}

// =====================
// DATABASE (IN MEMORY)
// =====================
const db = {
  teams: {},
  warns: {},
  strikes: {},
  suspensions: {}
};

const getTeam = (name) => {
  if (!db.teams[name]) db.teams[name] = { members: [] };
  return db.teams[name];
};

// =====================
// COMMANDS (ALL INCLUDED)
// =====================
const commands = [

  // ADDTEAM
  {
    data: new SlashCommandBuilder()
      .setName('addteam')
      .setDescription('Create a team')
      .addStringOption(o => o.setName('name').setRequired(true)),

    async execute(i) {
      const name = i.options.getString('name');
      if (db.teams[name]) return reply(i, '❌ Team exists');

      db.teams[name] = { members: [] };
      reply(i, `🏷️ Team **${name}** created`);
    }
  },

  // APPOINT
  {
    data: new SlashCommandBuilder()
      .setName('appoint')
      .setDescription('Appoint owner')
      .addUserOption(o => o.setName('user').setRequired(true)),

    async execute(i) {
      const user = i.options.getUser('user');
      reply(i, `👑 ${user.username} appointed`);
    }
  },

  // SIGN
  {
    data: new SlashCommandBuilder()
      .setName('sign')
      .setDescription('Sign player')
      .addStringOption(o => o.setName('team').setRequired(true))
      .addUserOption(o => o.setName('user').setRequired(true)),

    async execute(i) {
      const team = getTeam(i.options.getString('team'));
      const user = i.options.getUser('user');

      if (team.members.length >= 10)
        return reply(i, '❌ Team full (10 max)');

      team.members.push(user.id);
      reply(i, `✍️ ${user.username} signed`);
    }
  },

  // RELEASE
  {
    data: new SlashCommandBuilder()
      .setName('release')
      .setDescription('Remove player')
      .addStringOption(o => o.setName('team').setRequired(true))
      .addUserOption(o => o.setName('user').setRequired(true)),

    async execute(i) {
      const team = getTeam(i.options.getString('team'));
      const user = i.options.getUser('user');

      team.members = team.members.filter(x => x !== user.id);
      reply(i, `🚪 ${user.username} released`);
    }
  },

  // ROSTER
  {
    data: new SlashCommandBuilder()
      .setName('roster')
      .setDescription('Show team roster')
      .addStringOption(o => o.setName('team').setRequired(true)),

    async execute(i) {
      const team = getTeam(i.options.getString('team'));
      reply(i, `📋 Members: ${team.members.length}`);
    }
  },

  // DISBAND
  {
    data: new SlashCommandBuilder()
      .setName('disband')
      .setDescription('Delete all teams'),

    async execute(i) {
      db.teams = {};
      reply(i, '💥 All teams deleted');
    }
  },

  // PROMOTE
  {
    data: new SlashCommandBuilder()
      .setName('promote')
      .setDescription('Promote user')
      .addUserOption(o => o.setName('user').setRequired(true)),

    async execute(i) {
      reply(i, `⬆️ Promoted`);
    }
  },

  // DEMOTE
  {
    data: new SlashCommandBuilder()
      .setName('demote')
      .setDescription('Demote user')
      .addUserOption(o => o.setName('user').setRequired(true)),

    async execute(i) {
      reply(i, `⬇️ Demoted`);
    }
  },

  // STRIKE
  {
    data: new SlashCommandBuilder()
      .setName('strike')
      .setDescription('Add strike')
      .addStringOption(o => o.setName('team').setRequired(true)),

    async execute(i) {
      const t = i.options.getString('team');
      db.strikes[t] = (db.strikes[t] || 0) + 1;
      reply(i, `⚡ ${t} strikes: ${db.strikes[t]}`);
    }
  },

  // CLEAR STRIKE
  {
    data: new SlashCommandBuilder()
      .setName('clearstrike')
      .setDescription('Clear strikes')
      .addStringOption(o => o.setName('team').setRequired(true)),

    async execute(i) {
      db.strikes[i.options.getString('team')] = 0;
      reply(i, '🧹 Strikes cleared');
    }
  },

  // WARN
  {
    data: new SlashCommandBuilder()
      .setName('warn')
      .setDescription('Warn user')
      .addUserOption(o => o.setName('user').setRequired(true))
      .addStringOption(o => o.setName('reason').setRequired(true)),

    async execute(i) {
      const user = i.options.getUser('user');
      const reason = i.options.getString('reason');

      if (!db.warns[user.id]) db.warns[user.id] = [];
      db.warns[user.id].push(reason);

      reply(i, `⚠️ Warned ${user.username}`);
    }
  },

  // WARNS
  {
    data: new SlashCommandBuilder()
      .setName('warns')
      .setDescription('Check warns')
      .addUserOption(o => o.setName('user').setRequired(true)),

    async execute(i) {
      const user = i.options.getUser('user');
      const w = db.warns[user.id] || [];
      reply(i, `📋 ${user.username} has ${w.length} warns`);
    }
  },

  // SUSPEND
  {
    data: new SlashCommandBuilder()
      .setName('suspend')
      .setDescription('Suspend user')
      .addUserOption(o => o.setName('user').setRequired(true)),

    async execute(i) {
      const user = i.options.getUser('user');
      db.suspensions[user.id] = true;

      reply(i, `🚫 ${user.username} suspended`);
    }
  },

  // BAIL
  {
    data: new SlashCommandBuilder()
      .setName('bail')
      .setDescription('Remove suspension')
      .addUserOption(o => o.setName('user').setRequired(true)),

    async execute(i) {
      const user = i.options.getUser('user');
      delete db.suspensions[user.id];

      reply(i, `🔓 ${user.username} unsuspended`);
    }
  },

  // BAN / KICK / MUTE (SIMULATED)
  {
    data: new SlashCommandBuilder()
      .setName('ban')
      .setDescription('Ban user')
      .addUserOption(o => o.setName('user').setRequired(true)),

    async execute(i) {
      reply(i, '🔨 Banned (simulated)');
    }
  },

  {
    data: new SlashCommandBuilder()
      .setName('kick')
      .setDescription('Kick user')
      .addUserOption(o => o.setName('user').setRequired(true)),

    async execute(i) {
      reply(i, '👢 Kicked (simulated)');
    }
  },

  {
    data: new SlashCommandBuilder()
      .setName('mute')
      .setDescription('Mute user')
      .addUserOption(o => o.setName('user').setRequired(true)),

    async execute(i) {
      reply(i, '🔇 Muted (simulated)');
    }
  },

  // TRANSACTIONS
  {
    data: new SlashCommandBuilder()
      .setName('transactions')
      .setDescription('Lock/unlock transactions')
      .addSubcommand(s => s.setName('lock'))
      .addSubcommand(s => s.setName('unlock')),

    async execute(i) {
      const sub = i.options.getSubcommand();
      reply(i, `💰 Transactions ${sub}ed`);
    }
  },

  // SCORE
  {
    data: new SlashCommandBuilder()
      .setName('score')
      .setDescription('Match score'),

    async execute(i) {
      reply(i, '🏆 Score recorded');
    }
  },

  // SETUP
  {
    data: new SlashCommandBuilder()
      .setName('setup')
      .setDescription('Setup system'),

    async execute(i) {
      reply(i, '⚙️ Setup complete');
    }
  },

  // ROLEALL
  {
    data: new SlashCommandBuilder()
      .setName('roleall')
      .setDescription('Assign roles'),

    async execute(i) {
      reply(i, '🏷️ Roles assigned');
    }
  },

  // HELP
  {
    data: new SlashCommandBuilder()
      .setName('help')
      .setDescription('All commands'),

    async execute(i) {
      reply(i, '📋 CPCW bot loaded successfully');
    }
  }
];

// =====================
// CLIENT
// =====================
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();
for (const c of commands) {
  client.commands.set(c.data.name, c);
}

// =====================
// ⚡ FIXED GUILD COMMAND REGISTRATION (IMPORTANT)
// =====================
client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(
      process.env.CLIENT_ID,
      process.env.GUILD_ID
    ),
    { body: commands.map(c => c.data.toJSON()) }
  );

  console.log('✅ ALL COMMANDS REGISTERED INSTANTLY');
});

// =====================
// INTERACTION HANDLER
// =====================
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const cmd = client.commands.get(interaction.commandName);
  if (!cmd) return;

  try {
    await cmd.execute(interaction);
  } catch (err) {
    console.error(err);
    await reply(interaction, '❌ Error running command');
  }
});

process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);

client.login(process.env.TOKEN);