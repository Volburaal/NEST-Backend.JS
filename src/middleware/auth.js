import jwt from "jsonwebtoken";

export const authenticate =
  (roles = []) =>
  (req, res, next) => {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const user = jwt.verify(token, process.env.JWT_SECRET);


      if (roles.length && !roles.includes(user.role)) {
        return res.status(403).json({ message: "Access Denied" });
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ message: "Unauthorized" });
    }
  };
