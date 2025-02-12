const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET || "mysecretkey";
function verifyToken(req, res, next) {
  const token = req.header("Authorization");
  console.log(token);
  if (!token) return res.status(403).json({ message: "Access denied" });

  try {
    console.log("---", token.split(" ")[1]);
    const verified = jwt.verify(token.split(" ")[1], SECRET_KEY);
    console.log(verified);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid token" });
  }
}
module.exports=verifyToken;