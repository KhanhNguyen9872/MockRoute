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
    return res.render("login-success", {
      title: "Đăng nhập thành công",
      username: inputUser,
      token,
    });
  }
  return res
    .status(401)
    .render("login", {
      title: "Đăng nhập",
      error: "Sai tài khoản hoặc mật khẩu",
    });
}

function getLogout(req, res) {
  res.clearCookie("token");
  res.render("logout", { title: "Đăng xuất" });
}

module.exports = { redirectRoot, getLogin, postLogin, getLogout };