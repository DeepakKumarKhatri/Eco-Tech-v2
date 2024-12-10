class RolePathAuthorizer {
  static ROLE_PATH_MAP = {
    ADMIN: {
      basePath: "/pages/admin-dashboard/",
      allowedPaths: [
        "",
        "index.html",
        "users-submission.html",
        "reporting.html",
        "system-users.html",
        "admin-profile-management.html",
      ],
    },
    USER: {
      basePath: "/pages/user-dashboard/",
      allowedPaths: [
        "",
        "index.html",
        "item-submission.html",
        "history-tracking.html",
        "rewards-redemption.html",
        "dyanmic-search.html",
        "request-pickup.html",
        "profile-management.html",
      ],
    },
  };

  static validateAccess(user) {
    const currentPath = window.location.pathname;

    const roleConfig = Object.entries(this.ROLE_PATH_MAP).find(
      ([role]) => role === user.role
    );

    if (!roleConfig) {
      console.warn(`Unrecognized user role: ${user.role}`);
      return;
    }

    const [role, config] = roleConfig;

    const isPathAllowed = config.allowedPaths.some((allowedPath) =>
      currentPath.includes(config.basePath + allowedPath)
    );

    if (!isPathAllowed) {
      console.log(`Unauthorized access attempt for role ${role}`);
      window.location.href = config.basePath + "index.html";
    }
  }

  static addRoleConfiguration(roleName, roleConfig) {
    this.ROLE_PATH_MAP[roleName] = roleConfig;
  }
}

export const checkValidity = async (user) => {
  RolePathAuthorizer.validateAccess(user);
};

export default RolePathAuthorizer;
