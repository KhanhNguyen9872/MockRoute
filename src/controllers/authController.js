const { sign } = require("../services/tokenService");

function redirectRoot(req, res) {
  res.redirect(req.baseUrl + "/login");
}

function getLogin(req, res) {
  res.render("login", { title: "Log in", error: null, baseUrl: req.baseUrl });
}

function postLogin(req, res) {
  const { username, password } = req.body || {};
  const envUser = (process.env.APP_USERNAME || "").trim();
  const envPass = (process.env.APP_PASSWORD || "").trim();
  const inputUser = (username || "").trim();
  const inputPass = (password || "").trim();
  if (inputUser === envUser && inputPass === envPass) {
    const token = sign({ username: inputUser });
    res.cookie("token", token, { httpOnly: true, sameSite: "lax" });
    return res.redirect(req.baseUrl + "/dashboard");
  }
  return res
    .status(401)
    .render("login", {
      title: "Login",
      error: "Invalid username or password",
    });
}

function getLogout(req, res) {
  res.clearCookie("token");
  return res.redirect(req.baseUrl + "/login");
}

module.exports = { redirectRoot, getLogin, postLogin, getLogout };