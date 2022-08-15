const Discord = require('discord.js');
const editJsonFile = require("edit-json-file");
const { DError } = require('./utils');
const { formatDistance } = require('date-fns');

const Client = new Discord.Client({intents: [new Discord.IntentsBitField(32767), Discord.IntentsBitField.Flags.MessageContent]});

Client.on('ready', () => {
    console.log('Ready!');
    Client.user.setActivity({
        type: Discord.ActivityType.Watching,
        name: 'AC08 for safety and security'
    })
    Client.guilds.cache.forEach(guild => {
        guild.members.cache.forEach(member => {
            if(!member.user.bot) {
                let role = guild.roles.cache.get("1008525402785984604");
                if(!role) return;
                member.roles.add(role);
            }
        })
    })

    setInterval(() => {
        let config = editJsonFile('./settings.json');
        let guild = Client.guilds.cache.get("959178877408784415");
        if(!guild) return;
        guild.members.cache.forEach(member => {
            let banRole = member.roles.cache.get("1004147643066372126");
            if(banRole) {
                let bans = config.get("bans");
                let userBan = bans.find(b => b.user === member.id);
                if(userBan) {
                    if(new Date(userBan.expiresAt).getTime() <= new Date().getTime()) {
                        console.log(`> Ban removed for: ${userBan.user} `);
                        member.roles.remove(banRole);
                        bans.splice(bans.indexOf(userBan), 1);
                        config.set("bans", bans);
                    }
                }
            }
        })
        config.save();
    }, 10000)
})

Client.on('guildMemberAdd', (member) => {
    const channel = member.guild.channels.cache.get("1008525636429692938");
    if (!channel) return;
    let role = member.guild.roles.cache.get("1008525402785984604");
    if (!role) return;
    member.roles.add(role);
    channel.send({embeds: [
        new Discord.EmbedBuilder()
            .setColor('#330aa5')
            .setDescription(`Welcome **${member.user.tag}** to the server! ( **${formatDistance(member.user.createdAt, new Date(), {addSuffix: true})}** )`)
    ], components: [ 
        new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId("welcomer")
                    .setStyle(Discord.ButtonStyle.Secondary)
                    .setDisabled(true)
                    .setLabel(`${new Date().toLocaleDateString('en-US')}`)
                )
            ]
        });

    let statusMembers = member.guild.channels.cache.get("1008526149883801720");
    if(!statusMembers) return;

    statusMembers.setName(`Member Count: ${member.guild.members.cache.size}`);
})

Client.on('guildMemberRemove', (member) => {
    let statusMembers = member.guild.channels.cache.get("1008526149883801720");
    if(!statusMembers) return;

    statusMembers.setName(`Member Count: ${member.guild.members.cache.size}`);
})

Client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    let config = editJsonFile('./settings.json');
    let prefix = config.get('prefix');

    let command = message.content.trim().split(' ')[0].toLocaleLowerCase();
    let args = message.content.trim().split(' ').slice(1);

    if (command === prefix + 'announce') {
        if(!message.member.permissions.has("Administrator")) {
            return new DError(message, 'You do not have permission to use this command.').send();
        }
        let channel = message.mentions.channels.get(args[0].replace(/[<#>]/g, ''));
        if (!channel) return new DError(message, 'Please mention a channel').send();

        let announcement = args.slice(1).join(' ');
        if (!announcement) return new DError(message, 'Please provide an announcement').send();

        channel.send({embeds: [new Discord.EmbedBuilder().setColor('#330aa5').setTitle("📢").setDescription(`${announcement}`)], components: [ 
            new Discord.ActionRowBuilder()
                .addComponents(
                    new Discord.ButtonBuilder()
                        .setCustomId("date-announce")
                        .setStyle(Discord.ButtonStyle.Secondary)
                        .setDisabled(true)
                        .setLabel(`${new Date().toLocaleDateString('en-US')}`)
                    )
                ]});

        if(message.deletable) message.delete();
    }

    if(command === prefix + "prefix") {
        if(!message.member.permissions.has("Administrator")) {
            return new DError(message, 'You do not have permission to use this command.').send();
        }
        let newPrefix = args[0];
        if(!newPrefix) return new DError(message, 'Please provide a new prefix').send();
        if(newPrefix.length > 8) {
            return new DError(message, 'Prefix cannot be longer than 8 characters').send();
        }
        config.set('prefix', newPrefix);
        config.save();
        message.channel.send({embeds: [new Discord.EmbedBuilder().setColor('#330aa5').setDescription(`<:gSuccess:1003325347225423922> The prefix has been changed to **${args[0]}**`)]});
    }

    if(command === prefix + "random") {
        let random = Math.floor(Math.random() * 99999);
        message.channel.send({embeds: [new Discord.EmbedBuilder().setColor('#330aa5').setDescription(`🎲 Your random number is: **${random}**`)]});
    }

    if(command === prefix + "ping") {
        message.channel.send({embeds: [new Discord.EmbedBuilder().setColor('#330aa5').setDescription(`🏓 Pong! Latency: **${Client.ws.ping}ms**`)]});
    }

    if(command === prefix + "ticket") {
        if(!message.member.permissions.has("Administrator")) {
            return new DError(message, 'You do not have permission to use this command.').send();
        }
        let row = new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId("ticket-start")
                    .setStyle(Discord.ButtonStyle.Primary)
                    .setDisabled(false)
                    .setLabel("New Ticket")
            )
        
        let emb = new Discord.EmbedBuilder().setDescription(`**Create a ticket**\nOpen a ticket for questions or premium buy & support.`).setColor('#330aa5');
        message.channel.send({embeds: [emb], components: [row]});
    }

    if(command === prefix + "nuke") {
        if(!message.member.permissions.has("Administrator")) {
            return new DError(message, 'You do not have permission to use this command.').send();
        }

        let channel = await message.channel.clone();
        message.channel.delete();

        let emb = new Discord.EmbedBuilder().setColor('#330aa5').setDescription(`🔥 Channel nuked by **${message.author.tag}**!`).setImage('https://media3.giphy.com/media/oe33xf3B50fsc/giphy.gif');
        channel.send({embeds: [emb]});
        
    }

    if(command === prefix + "purge") {
        if(!message.member.permissions.has("ManageMessages")) {
            return new DError(message, 'You do not have permission to use this command.').send();
        }
        let amount = parseInt(args[0]);
        if(amount < 0 || !amount) amount = 10;
        if(amount > 100) return new DError(message, 'Please provide a number less than **100**').send();
        message.channel.bulkDelete(amount + 1);
        let msg = await message.channel.send({embeds: [new Discord.EmbedBuilder().setColor('#330aa5').setDescription(`🗑️ Deleted **${amount}** messages by **${message.author.tag}**`)]});
    }

    if(command === prefix + "feedback") {
        if(!message.member.permissions.has("Administrator")) {
            return new DError(message, 'You do not have permission to use this command.').send();
        }

        let row = new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId("feedback")
                    .setStyle(Discord.ButtonStyle.Success)
                    .setDisabled(false)
                    .setLabel("Feedback")
            )
        
        let emb = new Discord.EmbedBuilder().setDescription(`**Give us a feedback**\nPress the green button for a feedback. In total we have **${config.get("feedbacks").length}** feedbacks.`).setColor('#330aa5');
        message.channel.send({embeds: [emb], components: [row]});
    }
})

Client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    if(interaction.customId === "ticket-close") {
        let ticket = interaction.message.channel;
        if(ticket)
        {
            ticket.delete();
        }
    }

    //1004159568890302517

    if(interaction.customId === "banstats") {
        let config = editJsonFile('./settings.json');
        let bans = config.get('bans');
        let ban = bans.find(b => b.user === interaction.member.id)
        if(!ban) {
            return new DError(interaction, 'You are not banned.').sendInteraction();
        }
        let emb = new Discord.EmbedBuilder().setColor('#330aa5').setDescription(`**Ban Stats**\nBanned by: **${ban.author}**\nTime Left: **${formatDistance(new Date(), new Date(ban.expiresAt))}**\nBanned At: **${formatDistance(new Date(ban.bannedAt), new Date())}**\nReason: **${ban.reason}**.`);
        interaction.reply({ephemeral: true, embeds: [emb]});
    }

    if(interaction.customId === "feedback") {
        let user = interaction.member;
        
        let config = editJsonFile('./settings.json');
        let feedbacks = config.get("feedbacks");
        if(feedbacks.find(u => u === user.id.toString())) {
            return new DError(interaction, 'You have already given feedback.').sendInteraction();
        }
        feedbacks.push(user.id.toString());
        config.set("feedbacks", feedbacks);
        config.save();

        let row = new Discord.ActionRowBuilder()
        .addComponents(
            new Discord.ButtonBuilder()
                .setCustomId("feedback")
                .setStyle(Discord.ButtonStyle.Success)
                .setDisabled(false)
                .setLabel("Feedback")
        )
    
        interaction.reply({ephemeral: true, embeds: [new Discord.EmbedBuilder().setColor('#330aa5').setDescription(`Thank you for your feedback! You can upvote our bot [Here!](https://discordbotlist.com/bots/ac08-generator/upvote)`)]});
        let emb = new Discord.EmbedBuilder().setDescription(`**Give us a feedback**\nPress the green button for a feedback. In total we have **${config.get("feedbacks").length}** feedbacks.`).setColor('#330aa5');
        interaction.channel.messages.cache.get("1008526680496812143").edit(
            {embeds: [emb], components: [row]}
        )
    }

    if (interaction.customId === "ticket-start") {
        let foundChannel = interaction.guild.channels.cache.find(c => c.name === `ticket-${interaction.member.user.id}`)
        if(foundChannel) {
            return new DError(interaction, 'You already have a ticket open.').sendInteraction();
        }
        let ticketChannel = await interaction.guild.channels.create({
            name: `ticket-${interaction.member.user.id}`,
            type: Discord.ChannelType.GuildText,
            position: 0,
            permissionOverwrites: [
                {
                    id: interaction.guild.roles.everyone.id,
                    deny: [Discord.PermissionsBitField.Flags.ViewChannel, Discord.PermissionsBitField.Flags.SendMessages, Discord.PermissionsBitField.Flags.AddReactions]
                },
                {
                    id: interaction.member.id,
                    allow: [Discord.PermissionsBitField.Flags.ViewChannel, Discord.PermissionsBitField.Flags.SendMessages, Discord.PermissionsBitField.Flags.AddReactions],
                },
                {
                    id: interaction.guild.roles.cache.get("1008527714740883637").id,
                    allow: [Discord.PermissionsBitField.Flags.ViewChannel, Discord.PermissionsBitField.Flags.SendMessages, Discord.PermissionsBitField.Flags.AddReactions]
                }
            ]
        })

        let ticketEmbed = new Discord.EmbedBuilder()
            .setColor('#330aa5')
            .setDescription(`**${interaction.member.user.tag}** has opened a ticket.`)
        
        let row = new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId("ticket-close")
                    .setStyle(Discord.ButtonStyle.Danger)
                    .setDisabled(false)
                    .setLabel("Close Ticket")
            )
        ticketChannel.send({embeds: [ticketEmbed], components: [row]});
    }
})

Client.login(process.env.TOKEN || "hidden");
