module.exports = (app) => {
  const passport = require("passport");
  const jwt = require("jsonwebtoken");
  var router = require("express").Router();
  const accessTokenSecret = "TOP_SECRET";
  const refreshTokenSecret = "TOP_SECRET";
  var refreshTokens = [];

  router.post(
    "/signup",
    passport.authenticate("signup", { session: false }),
    async (req, res, next) => {
      res.json({
        message: "Signup successful",
        user: req.user,
      });
    }
  );

  router.post("/login", async (req, res, next) => {
    passport.authenticate("login", async (err, user, info) => {
      try {
        if (err || !user) {
          const error = new Error("An error occurred.");

          return next(error);
        }

        req.login(user, { session: false }, async (error) => {
          if (error) return next(error);

          const body = { _id: user._id, email: user.email, role: user.role };
          const accessToken = jwt.sign({ user: body }, accessTokenSecret, {
            expiresIn: "20m",
          });
          const refreshToken = jwt.sign({ user: body }, refreshTokenSecret);
          refreshTokens.push(refreshToken);
          return res.json({
            accessToken,
            refreshToken,
          });
        });
      } catch (error) {
        return next(error);
      }
    })(req, res, next);
  });

  router.post("/refresh-token", (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.sendStatus(401);
    }

    if (!refreshTokens.includes(refreshToken)) {
      return res.sendStatus(403);
    }

    jwt.verify(refreshToken, refreshTokenSecret, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }

      const accessToken = jwt.sign(
        { username: user.username, role: user.role },
        accessTokenSecret,
        { expiresIn: "20m" }
      );

      res.json({
        accessToken,
      });
    });
  });
  router.post("/logout", (req, res) => {
    const { refreshToken } = req.body;
    refreshTokens = refreshTokens.filter((t) => t !== refreshToken);

    res.send("Logout successful");
  });
  app.use("/api/auth", router);
};
