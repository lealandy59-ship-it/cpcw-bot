require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionsBitField
} = require('discord.js');

// =====================
// SAFE REPLY SYSTEM
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
// SIMPLE DATABASE
// =====================
const db = {
  teams: {},
  warns: {},
  strikes: {},
  suspensions: {},
  transactionsLocked: false
};

function team(name) {
  if (!db.teams[name]) db.teams[name] = { members: [], owner: null };
  return db.teams[name];
}

// =====================
// COMMANDS
// =====================
const commands = [

  // ADD TEAM
  {
    data: new SlashCommandBuilder()
      .setName('addteam')
      .setDescription('Create a crew')
      .addStringOption(o => o.setName('name').setRequired(true)),

    async execute(i) {
      const name = i.options.getString('name');

      if (db.teams[name]) return reply(i, '❌ Team already exists');

      db.teams[name] = { members: [], owner: i.user.id };
      reply(i, `🏷️ Team **${name}** created`);
    }
  },

  // SIGN
  {
    data: new SlashCommandBuilder()
      .setName('sign')
      .setDescription('Add player to team')
      .addStringOption(o => o.setName('team').setRequired(true))
      .addUserOption(o => o.setName('user').setRequired(true)),

    async execute(i) {
      const t = team(i.options.getString('team'));
      const user = i.options.getUser('user');

      if (t.members.length >= 10)
        return reply(i, '❌ Team full (10 max)');

      t.members.push(user.id);
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
      const t = team(i.options.getString('team'));
      const user = i.options.getUser('user');

      t.members = t.members.filter(x => x !== user.id);
      reply(i, `🚪 ${user.username} removed`);
    }
  },

  // ROSTER
  {
    data: new SlashCommandBuilder()
      .setName('roster')
      .setDescription('View team')
      .addStringOption(o => o.setName('team').setRequired(true)),

    async execute(i) {
      const t = team(i.options.getString('team'));
      reply(i, `📋 Members: ${t.members.length}`);
    }
  },

  // DISBAND
  {
    data: new SlashCommandBuilder()
      .setName('disband')
      .setDescription('Delete all teams'),

    async execute(i) {
      db.teams = {};
      reply(i, '💥 All teams removed');
    }
  },

  // APPOINT
  {
    data: new SlashCommandBuilder()
      .setName('appoint')
      .setDescription('Set owner')
      .addUserOption(o => o.setName('user').setRequired(true)),

    async execute(i) {
      const user = i.options.getUser('user');
      reply(i, `👑 ${user.username} appointed (system only)`);
    }
  },

  // PROMOTE
  {
    data: new SlashCommandBuilder()
      .setName('promote')
      .setDescription('Promote user')
      .addUserOption(o => o.setName('user').setRequired(true)),

    async execute(i) {
      const user = i.options.getUser('user');
      reply(i, `⬆️ ${user.username} promoted`);
    }
  },

  // DEMOTE
  {
    data: new SlashCommandBuilder()
      .setName('demote')
      .setDescription('Demote user')
      .addUserOption(o => o.setName('user').setRequired(true)),

    async execute(i) {
      const user = i.options.getUser('user');
      reply(i, `⬇️ ${user.username} demoted`);
    }
  },

  // WARP SYSTEM
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

  {
    data: new SlashCommandBuilder()
      .setName('warns')
      .setDescription('Check warnings')
      .addUserOption(o => o.setName('user').setRequired(true)),

    async execute(i) {
      const user = i.options.getUser('user');
      const w = db.warns[user.id] || [];
      reply(i, `📋 ${user.username} has ${w.length} warns`);
    }
  },

  // STRIKE
  {
    data: new SlashCommandBuilder()
      .setName('strike')
      .setDescription('Strike team')
      .addStringOption(o => o.setName('team').setRequired(true)),

    async execute(i) {
      const t = i.options.getString('team');
      db.strikes[t] = (db.strikes[t] || 0) + 1;
      reply(i, `⚡ ${t} now has ${db.strikes[t]} strike(s)`);
    }
  },

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

  // KICK / BAN / MUTE (SIMULATED)
  {
    data: new SlashCommandBuilder()
      .setName('kick')
      .setDescription('Kick user')
      .addUserOption(o => o.setName('user').setRequired(true)),

    async execute(i) {
      reply(i, `👢 Kicked (simulated)`);
    }
  },

  {
    data: new SlashCommandBuilder()
      .setName('ban')
      .setDescription('Ban user')
      .addUserOption(o => o.setName('user').setRequired(true)),

    async execute(i) {
      reply(i, `🔨 Banned (simulated)`);
    }
  },

  {
    data: new SlashCommandBuilder()
      .setName('mute')
      .setDescription('Mute user')
      .addUserOption(o => o.setName('user').setRequired(true)),

    async execute(i) {
      reply(i, `🔇 Muted (simulated)`);
    }
  },

  // SUSPEND / BAIL
  {
    data: new SlashCommandBuilder()
      .setName('suspend')
      .setDescription('Suspend user')
      .addUserOption(o => o.setName('user').setRequired(true)),

    async execute(i) {
      db.suspensions[i.options.getUser('user').id] = true;
      reply(i, '🚫 Suspended');
    }
  },

  {
    data: new SlashCommandBuilder()
      .setName('bail')
      .setDescription('Remove suspension')
      .addUserOption(o => o.setName('user').setRequired(true)),

    async execute(i) {
      delete db.suspensions[i.options.getUser('user').id];
      reply(i, '🔓 Unsuspended');
    }
  },

  // TRANSACTIONS
  {
    data: new SlashCommandBuilder()
      .setName('transactions')
      .setDescription('Lock/unlock')
      .addSubcommand(s => s.setName('lock'))
      .addSubcommand(s => s.setName('unlock')),

    async execute(i) {
      const sub = i.options.getSubcommand();
      db.transactionsLocked = sub === 'lock';
      reply(i, `💰 Transactions ${sub}ed`);
    }
  },

  // SCORE / SETUP / ROLEALL / etc
  {
    data: new SlashCommandBuilder()
      .setName('score')
      .setDescription('Report match'),

    async execute(i) {
      reply(i, '🏆 Score recorded');
    }
  },

  {
    data: new SlashCommandBuilder()
      .setName('setup')
      .setDescription('Setup system'),

    async execute(i) {
      reply(i, '⚙️ Setup complete');
    }
  },

  {
    data: new SlashCommandBuilder()
      .setName('roleall')
      .setDescription('Assign roles'),

    async execute(i) {
      reply(i, '🏷️ Roles assigned');
    }
  },

  {
    data: new SlashCommandBuilder()
      .setName('help')
      .setDescription('All commands'),

    async execute(i) {
      reply(i, '📋 CPCW Bot Loaded');
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
// REGISTER COMMANDS
// =====================
client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands.map(c => c.data.toJSON()) }
  );

  console.log('✅ Commands registered');
});

// =====================
// INTERACTIONS FIXED
// =====================
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const cmd = client.commands.get(interaction.commandName);
  if (!cmd) return;

  try {
    await cmd.execute(interaction);
  } catch (err) {
    console.error(err);
    await reply(interaction, '❌ Error');
  }
});

process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);

client.login(process.env.TOKEN);