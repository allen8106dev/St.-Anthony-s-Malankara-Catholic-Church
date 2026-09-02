from enum import StrEnum
from app.models.domain import RoleName

class Permission(StrEnum):
    CONTENT_MANAGE = "content:manage"
    MEMBERS_VIEW = "members:view"
    MEMBERS_MANAGE = "members:manage"
    DUES_VIEW = "dues:view"
    DUES_MANAGE = "dues:manage"
    PAYMENTS_VIEW = "payments:view"
    PAYMENTS_MANAGE = "payments:manage"
    DONATIONS_VIEW = "donations:view"
    ADMIN_USERS_MANAGE = "admin_users:manage"
    SETTINGS_MANAGE = "settings:manage"

ROLE_PERMISSIONS: dict[RoleName, frozenset[Permission]] = {
    RoleName.SUPER_ADMIN: frozenset(Permission),
    RoleName.CONTENT_ADMIN: frozenset({Permission.CONTENT_MANAGE}),
    RoleName.MEMBER_ADMIN: frozenset({Permission.MEMBERS_VIEW, Permission.MEMBERS_MANAGE, Permission.DUES_VIEW, Permission.DUES_MANAGE}),
    RoleName.TREASURER: frozenset({Permission.DUES_VIEW, Permission.DUES_MANAGE, Permission.PAYMENTS_VIEW, Permission.PAYMENTS_MANAGE, Permission.DONATIONS_VIEW}),
}

def has_permission(role: RoleName, permission: Permission) -> bool:
    return permission in ROLE_PERMISSIONS.get(role, frozenset())
