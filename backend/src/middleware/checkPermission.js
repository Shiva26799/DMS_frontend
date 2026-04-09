import { RolePermission } from "../models/rolePermission.model.js";

/**
 * Middleware to check if the current user's role has a specific permission
 * @param {string} module - The module name (leads, dealers, orders)
 * @param {string} action - The action name (view, create, approvePayment, etc.)
 */
export const checkPermission = (module, action) => {
    return async (req, res, next) => {
        try {
            const user = req.user;
            if (!user || !user.role) {
                return res.status(401).json({ message: "Unauthorized - Role not found" });
            }

            // Super Admin bypasses all checks
            if (user.role === "Super Admin") {
                return next();
            }

            // Fetch permissions for the user's role
            const rolePerm = await RolePermission.findOne({ role: user.role });
            
            if (!rolePerm) {
                return res.status(403).json({ message: "Access forbidden: Role permissions not configured" });
            }

            const hasPermission = rolePerm.permissions?.[module]?.[action];

            if (!hasPermission) {
                return res.status(403).json({ 
                    message: `Access forbidden: You do not have permission to perform '${action}' on ${module}` 
                });
            }

            // Attached for further use in controllers if needed (e.g., "Own only" strings)
            req.permissionValue = hasPermission;
            
            next();
        } catch (error) {
            console.error("Permission check error:", error);
            res.status(500).json({ message: "Internal server error during permission check" });
        }
    };
};
