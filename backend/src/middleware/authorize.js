export const authorize = (...roles) => {
    return (req, res, next) => {
        // Fallback to req.user.role if req.role is missing
        const currentRole = req.role || req.user?.role;

        if (!currentRole) {
            return res.status(401).json({ message: "Unauthorized - Role not found" });
        }

        // Global bypass for Super Admin - they should always have access
        if (currentRole === "Super Admin") {
            return next();
        }

        if (!roles.includes(currentRole)) {
            console.log(`[AUTH DEBUG] 403 Forbidden. Current Role: "${currentRole}", Allowed Roles: ${JSON.stringify(roles)}`);
            return res.status(403).json({ message: "Access forbidden: Role unauthorized" });
        }

        next();
    };
};
