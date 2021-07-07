const passport = require("passport");
const localStrategy = require("passport-local").Strategy;
const JWTstrategy = require("passport-jwt").Strategy;
const ExtractJWT = require("passport-jwt").ExtractJwt;
const db = require("../models");
const User = db.users;
const { Op } = require("sequelize");

passport.use(
  "login",
  new localStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      try {
        const user = await User.findOne({
          where: {
            [Op.or]: [{ email: email }, { username: email }],
          },
        });
        console.log(user);
        if (!user) {
          return done(new Error("User not found."), false);
        }
        isValid = await user.isValidPassword(password);
        if (!isValid) {
          return done(new Error("Wrong Password."), false);
        }
        if (user && !user.is_verified) {
          return done(new Error("User is not verified."), false);
        }
        return done(null, user);
      } catch (error) {
        console.log("ke sini error", user);
        return done(error);
      }
    }
  )
);

passport.use(
  new JWTstrategy(
    {
      secretOrKey: process.env.JWT_SECRET,
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    },
    async (token, done) => {
      try {
        return done(null, token.user);
      } catch (error) {
        done(error);
      }
    }
  )
);
