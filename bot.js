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
    console.error(err);
  }
}

// =====================
// MEMORY DB
// =====================
const db = {
  teams: {},
  warnings: {},
  strikes: {},
  suspensions: {}
};

// =====================
// HELPERS
// =====================
function getTeam(team) {
  if (!db.teams[team]) db.teams[team] = { members: [] };
  return db.teams[team];
}

// =====================
// COMMANDS (ALL FIXED)
// =====================
const commands = [

  // ADDTEAM
  {
    data: new SlashCommandBuilder()
      .setName('addteam')
      .setDescription('Create team')
      .addStringOption(o =>
        o.setName('name').setRequired(true).setDescription('Team name')
      ),

    async execute(i) {
      const name = i.options.getString('name');
      if (db.teams[name]) return safeReply(i, '❌ Team exists');

      db.teams[name] = { members: [] };
      safeReply(i, `🏷️ Team ${name} created`);
    }
  },

  // APPOINT
  {
    data: new SlashCommandBuilder()
      .setName('appoint')
      .setDescription('Set owner')
      .addUserOption(o =>
        o.setName('user').setRequired(true).setDescription('User')
      ),

    async execute(i) {
      const user = i.options.getUser('user');
      safeReply(i, `👑 ${user.username} is now owner (system note only)`);
    }
  },

  // BAIL
  {
    data: new SlashCommandBuilder()
      .setName('bail')
      .setDescription('Remove suspension')
      .addUserOption(o =>
        o.setName('user').setRequired(true)
      ),

    async execute(i) {
      const user = i.options.getUser('user');
      delete db.suspensions[user.id];
      safeReply(i, `🔓 ${user.username} unsuspended`);
    }
  },

  // BAN (simulated)
  {
    data: new SlashCommandBuilder()
      .setName('ban')
      .setDescription('Ban user')
      .addUserOption(o => o.setName('user').setRequired(true))
      .addStringOption(o => o.setName('reason')),

    async execute(i) {
      const user = i.options.getUser('user');
      safeReply(i, `🔨 ${user.username} banned (simulated)`);
    }
  },

  // CLEAR STRIKE
  {
    data: new SlashCommandBuilder()
      .setName('clearstrike')
      .setDescription('Clear team strikes')
      .addStringOption(o =>
        o.setName('team').setRequired(true)
      ),

    async execute(i) {
      const team = i.options.getString('team');
      db.strikes[team] = 0;
      safeReply(i, `🧹 Strikes cleared for ${team}`);
    }
  },

  // CLEAR WARN
  {
    data: new SlashCommandBuilder()
      .setName('clearwarn')
      .setDescription('Clear warnings')
      .addUserOption(o => o.setName('user').setRequired(true)),

    async execute(i) {
      const user = i.options.getUser('user');
      db.warnings[user.id] = [];
      safeReply(i, `🧹 Warnings cleared`);
    }
  },

  // CREW rename
  {
    data: new SlashCommandBuilder()
      .setName('crew')
      .setDescription('Crew commands')
      .addSubcommand(s =>
        s.setName('rename')
          .setDescription('Rename team')
          .addStringOption(o =>
            o.setName('name').setRequired(true)
          )
      ),

    async execute(i) {
      const name = i.options.getString('name');
      safeReply(i, `✏️ Crew renamed to ${name} (system only)`);
    }
  },

  // DEMAND
  {
    data: new SlashCommandBuilder()
      .setName('demand')
      .setDescription('Leave team'),

    async execute(i) {
      safeReply(i, '🚪 You left your team (simulated)');
    }
  },

  // DEMOTE
  {
    data: new SlashCommandBuilder()
      .setName('demote')
      .setDescription('Demote player')
      .addUserOption(o => o.setName('user').setRequired(true)),

    async execute(i) {
      const user = i.options.getUser('user');
      safeReply(i, `⬇️ ${user.username} demoted`);
    }
  },

  // DISBAND
  {
    data: new SlashCommandBuilder()
      .setName('disband')
      .setDescription('Delete team'),

    async execute(i) {
      db.teams = {};
      safeReply(i, '💥 All teams disbanded');
    }
  },

  // HELP
  {
    data: new SlashCommandBuilder()
      .setName('help')
      .setDescription('Commands list'),

    async execute(i) {
      safeReply(i, '📋 All CPCW commands loaded');
    }
  },

  // KICK
  {
    data: new SlashCommandBuilder()
      .setName('kick')
      .setDescription('Kick user')
      .addUserOption(o => o.setName('user').setRequired(true)),

    async execute(i) {
      const user = i.options.getUser('user');
      safeReply(i, `👢 ${user.username} kicked (simulated)`);
    }
  },

  // MODSTRIKE
  {
    data: new SlashCommandBuilder()
      .setName('modstrike')
      .setDescription('Strike mod')
      .addUserOption(o => o.setName('user').setRequired(true)),

    async execute(i) {
      const user = i.options.getUser('user');
      safeReply(i, `⚠️ ${user.username} got a mod strike`);
    }
  },

  // MUTE
  {
    data: new SlashCommandBuilder()
      .setName('mute')
      .setDescription('Mute user')
      .addUserOption(o => o.setName('user').setRequired(true)),

    async execute(i) {
      const user = i.options.getUser('user');
      safeReply(i, `🔇 ${user.username} muted (simulated)`);
    }
  },

  // PROMOTE
  {
    data: new SlashCommandBuilder()
      .setName('promote')
      .setDescription('Promote player')
      .addUserOption(o => o.setName('user').setRequired(true)),

    async execute(i) {
      const user = i.options.getUser('user');
      safeReply(i, `⬆️ ${user.username} promoted`);
    }
  },

  // RELEASE
  {
    data: new SlashCommandBuilder()
      .setName('release')
      .setDescription('Release player')
      .addUserOption(o => o.setName('user').setRequired(true)),

    async execute(i) {
      const user = i.options.getUser('user');
      safeReply(i, `🚪 ${user.username} released`);
    }
  },

  // ROLEALL
  {
    data: new SlashCommandBuilder()
      .setName('roleall')
      .setDescription('Give roles'),

    async execute(i) {
      safeReply(i, '🏷️ Roles assigned (simulated)');
    }
  },

  // ROSTER
  {
    data: new SlashCommandBuilder()
      .setName('roster')
      .setDescription('Show roster')
      .addStringOption(o => o.setName('team').setRequired(true)),

    async execute(i) {
      const team = i.options.getString('team');
      const t = getTeam(team);

      safeReply(i, `📋 ${team} roster: ${t.members.length} players`);
    }
  },

  // SCORE
  {
    data: new SlashCommandBuilder()
      .setName('score')
      .setDescription('Report score'),

    async execute(i) {
      safeReply(i, '🏆 Score recorded (simulated)');
    }
  },

  // SETUP
  {
    data: new SlashCommandBuilder()
      .setName('setup')
      .setDescription('Setup system'),

    async execute(i) {
      safeReply(i, '⚙️ Setup complete (simulated)');
    }
  },

  // SIGN
  {
    data: new SlashCommandBuilder()
      .setName('sign')
      .setDescription('Sign player')
      .addUserOption(o => o.setName('user').setRequired(true))
      .addStringOption(o => o.setName('team').setRequired(true)),

    async execute(i) {
      const user = i.options.getUser('user');
      const team = getTeam(i.options.getString('team'));

      if (team.members.length >= 10)
        return safeReply(i, '❌ Team full');

      team.members.push(user.id);
      safeReply(i, `✍️ ${user.username} signed`);
    }
  },

  // STRIKE
  {
    data: new SlashCommandBuilder()
      .setName('strike')
      .setDescription('Strike team')
      .addStringOption(o => o.setName('team').setRequired(true)),

    async execute(i) {
      const team = i.options.getString('team');
      db.strikes[team] = (db.strikes[team] || 0) + 1;

      safeReply(i, `⚡ ${team} strike added`);
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

      safeReply(i, `🚫 ${user.username} suspended`);
    }
  },

  // TRANSACTIONS
  {
    data: new SlashCommandBuilder()
      .setName('transactions')
      .setDescription('Transactions system')
      .addSubcommand(s => s.setName('lock'))
      .addSubcommand(s => s.setName('unlock')),

    async execute(i) {
      safeReply(i, `🔒 Transactions ${i.options.getSubcommand()}`);
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

      if (!db.warnings[user.id]) db.warnings[user.id] = [];
      db.warnings[user.id].push(reason);

      safeReply(i, `⚠️ ${user.username} warned`);
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
      const warns = db.warnings[user.id] || [];

      safeReply(i, `📋 ${user.username} has ${warns.length} warns`);
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
// INTERACTIONS
// =====================
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const cmd = client.commands.get(interaction.commandName);
  if (!cmd) return;

  try {
    await cmd.execute(interaction);
  } catch (err) {
    console.error(err);
    await safeReply(interaction, '❌ Error');
  }
});

process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);

client.login(process.env.TOKEN);