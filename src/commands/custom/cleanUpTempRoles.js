const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionsBitField,
    SlashCommandBuilder,
} = require("discord.js");
const {
    DEFAULT_ROLE_COLOR,
    buildCleanupPlans,
    getRoleMemberIds,
    getTempRoleType,
} = require("../../utils/tempRoleCleanup");

const UNDO_TIMEOUT_MS = 120_000;

function formatDeletedRoles(deletedRoles) {
    if (deletedRoles.length === 0) {
        return "No temporary Primary or Secondary roles were found to delete.";
    }

    return [
        `Deleted ${deletedRoles.length} temporary role${deletedRoles.length === 1 ? "" : "s"}:`,
        ...deletedRoles.map((role) => `- ${role.name}`),
    ].join("\n");
}

function createUndoButton(customId, disabled = false) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(customId)
            .setLabel("Undo cleanup")
            .setStyle(ButtonStyle.Danger)
            .setDisabled(disabled)
    );
}

async function applyCleanupPlan(guild, plan) {
    const deletedRoles = [];

    if (!plan.mainRole) {
        return {
            deletedRoles,
            skippedReason: `No main team role found for ${plan.mainRoleName}.`,
        };
    }

    if (plan.colorToSet !== null) {
        await plan.mainRole.setColor(plan.colorToSet, "Cleaning up temporary team color roles");
    }

    for (const memberId of plan.memberIdsToAdd) {
        const member = await guild.members.fetch(memberId);
        await member.roles.add(plan.mainRole, "Cleaning up temporary team color roles");
    }

    for (const role of plan.rolesToDelete) {
        deletedRoles.push({
            id: role.id,
            name: role.name,
            color: role.color,
            position: role.position,
            memberIds: getRoleMemberIds(role),
        });
        await role.delete("Temporary team color role cleanup");
    }

    return { deletedRoles };
}

async function undoCleanup(interaction, cleanupRecords) {
    const restoredRoles = [];

    for (const record of cleanupRecords) {
        if (record.mainRole) {
            await record.mainRole.setColor(record.mainRoleColorBefore, "Undoing temporary role cleanup");
        }

        for (const deletedRole of record.deletedRoles) {
            const restoredRole = await interaction.guild.roles.create({
                name: deletedRole.name,
                color: deletedRole.color,
                position: deletedRole.position,
                reason: "Undoing temporary role cleanup",
            });

            restoredRoles.push(restoredRole.name);

            for (const memberId of deletedRole.memberIds) {
                const member = await interaction.guild.members.fetch(memberId);
                await member.roles.add(restoredRole, "Undoing temporary role cleanup");
            }
        }

        if (record.mainRole) {
            for (const memberId of record.memberIdsAddedByCleanup) {
                const member = await interaction.guild.members.fetch(memberId);
                await member.roles.remove(record.mainRole, "Undoing temporary role cleanup");
            }
        }
    }

    return restoredRoles;
}

module.exports = {
    category: "custom",
    cooldown: 10,
    data: new SlashCommandBuilder()
        .setName("cleanuptemproles")
        .setDescription("Moves temp Primary/Secondary role members to team roles, then deletes temp roles.")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: false });
        await interaction.guild.roles.fetch();
        await interaction.guild.members.fetch();

        const plans = buildCleanupPlans(interaction.guild.roles.cache);
        const cleanupRecords = [];
        const skipped = [];

        for (const plan of plans) {
            const mainRoleColorBefore = plan.mainRole?.color;
            const result = await applyCleanupPlan(interaction.guild, plan);

            if (result.skippedReason) {
                skipped.push(result.skippedReason);
                continue;
            }

            cleanupRecords.push({
                mainRole: plan.mainRole,
                mainRoleColorBefore,
                memberIdsAddedByCleanup: plan.memberIdsToAdd.filter(
                    (memberId) => !plan.mainMemberIdsBefore.includes(memberId)
                ),
                deletedRoles: result.deletedRoles,
            });
        }

        const deletedRoles = cleanupRecords.flatMap((record) => record.deletedRoles);
        const undoId = `cleanup_temp_roles_undo_${interaction.id}`;
        const contentParts = [formatDeletedRoles(deletedRoles)];

        if (skipped.length > 0) {
            contentParts.push(["Skipped:", ...skipped.map((reason) => `- ${reason}`)].join("\n"));
        }

        if (deletedRoles.length === 0) {
            await interaction.editReply({
                content: contentParts.join("\n\n"),
                components: [],
            });
            return;
        }

        const reply = await interaction.editReply({
            content: contentParts.join("\n\n"),
            components: [createUndoButton(undoId)],
        });

        const collector = reply.createMessageComponentCollector({
            filter: (buttonInteraction) =>
                buttonInteraction.customId === undoId &&
                buttonInteraction.user.id === interaction.user.id,
            time: UNDO_TIMEOUT_MS,
            max: 1,
        });

        collector.on("collect", async (buttonInteraction) => {
            await buttonInteraction.deferUpdate();
            const restoredRoles = await undoCleanup(interaction, cleanupRecords);
            await interaction.editReply({
                content: [
                    formatDeletedRoles(deletedRoles),
                    `Undo complete. Restored ${restoredRoles.length} temporary role${restoredRoles.length === 1 ? "" : "s"}.`,
                ].join("\n\n"),
                components: [createUndoButton(undoId, true)],
            });
        });

        collector.on("end", async (collected) => {
            if (collected.size > 0) {
                return;
            }

            await interaction.editReply({
                content: contentParts.join("\n\n"),
                components: [createUndoButton(undoId, true)],
            });
        });
    },
    DEFAULT_ROLE_COLOR,
    buildCleanupPlans,
    getTempRoleType,
};
