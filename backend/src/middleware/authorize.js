export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.role) {
            return res.status(401).json({ message: "Unauthorized - Role not found" });
        }
        
        if (!roles.includes(req.role)) {
            return res.status(403).json({ message: "Access forbidden: Role unauthorized" });
        }
        
        next();
    };
};
