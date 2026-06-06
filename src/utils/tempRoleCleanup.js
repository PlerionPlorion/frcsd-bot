const DEFAULT_ROLE_COLOR = 0x808080;
const DISCORD_DEFAULT_ROLE_COLOR = 0;

function getTempRoleType(role) {
    if (!role.name.includes("|")) {
        return null;
    }

    if (/\bPrimary$/i.test(role.name)) {
        return "primary";
    }

    if (/\bSecondary$/i.test(role.name)) {
        return "secondary";
    }

    return null;
}

function getMainRoleName(tempRole) {
    return tempRole.name.replace(/\s+\b(Primary|Secondary)$/i, "");
}

function getRoleMemberIds(role) {
    return role.members?.map((member) => member.id) || [];
}

function hasDefaultTeamColor(role) {
    return role.color === DEFAULT_ROLE_COLOR || role.color === DISCORD_DEFAULT_ROLE_COLOR;
}

function buildCleanupPlans(rolesInput) {
    const roles = Array.from(rolesInput.values ? rolesInput.values() : rolesInput);
    const rolesByName = new Map(roles.map((role) => [role.name, role]));
    const groups = new Map();

    for (const role of roles) {
        const type = getTempRoleType(role);

        if (!type) {
            continue;
        }

        const mainRoleName = getMainRoleName(role);

        if (!groups.has(mainRoleName)) {
            groups.set(mainRoleName, {
                mainRoleName,
                primaryRole: null,
                secondaryRole: null,
            });
        }

        groups.get(mainRoleName)[`${type}Role`] = role;
    }

    return Array.from(groups.values()).map((group) => {
        const mainRole = rolesByName.get(group.mainRoleName) || null;
        const primaryMemberIds = group.primaryRole ? getRoleMemberIds(group.primaryRole) : [];
        const secondaryMemberIds = group.secondaryRole ? getRoleMemberIds(group.secondaryRole) : [];
        const mainMemberIdsBefore = mainRole ? getRoleMemberIds(mainRole) : [];
        const memberIdsToAdd = Array.from(new Set([...primaryMemberIds, ...secondaryMemberIds]));
        const rolesToDelete = [group.primaryRole, group.secondaryRole].filter(Boolean);

        let colorToSet = null;

        if (mainRole && hasDefaultTeamColor(mainRole)) {
            if (group.primaryRole) {
                colorToSet = group.primaryRole.color;
            } else if (
                group.secondaryRole &&
                mainMemberIdsBefore.length === 0 &&
                secondaryMemberIds.length > 0
            ) {
                colorToSet = group.secondaryRole.color;
            }
        }

        return {
            ...group,
            mainRole,
            memberIdsToAdd,
            mainMemberIdsBefore,
            rolesToDelete,
            colorToSet,
        };
    });
}

module.exports = {
    DEFAULT_ROLE_COLOR,
    buildCleanupPlans,
    getRoleMemberIds,
    getTempRoleType,
};
