const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    const token = req.cookies?.luminix_token || (req.headers.authorization && req.headers.authorization.split(" ")[1]);

    if (!token) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    try{
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }catch{
        res.status(401).json({message: "Invalid token"});
    }
};

module.exports = authMiddleware;