/**
 * Middleware to authorize users based on their roles.
 * Expects `req.user` to be populated by `checkJWTToken` middleware.
 * 
 * @param {...string} allowedRoles - List of roles that are allowed to access the route.
 * @returns {Function} Express middleware function.
 */
export const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized - No user data" });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `Access denied - Role '${req.user.role}' is not authorized to access this resource` 
            });
        }

        next();
    };
};
