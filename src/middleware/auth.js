const { verify } = require("../services/tokenService");

function authMiddleware(req, res, next) {
  const header = req.headers["authorization"] || "";
  let token = (header.startsWith("Bearer ") && header.substring(7)) || null;
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  if (!token) {
    return res.redirect(req.baseUrl + "/login");
  }
  try {
    const payload = verify(token);
    req.user = payload;
    return next();
  } catch (err) {
    return res.redirect(req.baseUrl + "/login");
  }
}

module.exports = { authMiddleware };
