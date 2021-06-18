module.exports = (sequelize, Sequelize) => {
  const bcrypt = require("bcrypt");
  const User = sequelize.define("user", {
    first_name: {
      type: Sequelize.STRING,
    },
    last_name: {
      type: Sequelize.STRING,
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    role: {
      type: Sequelize.ENUM("admin", "user"),
    },
    password: {
      type: Sequelize.STRING,
      is: /^[0-9a-f]{64}$/i,
    },
    last_login: {
      type: Sequelize.DATE,
    },
  });
  User.prototype.isValidPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
  };
  User.beforeCreate(async (user, options) => {
    console.log("beforeCreate", user.password);
    if (user.changed("password")) {
      const hashedPassword = await bcrypt.hash(
        user.password,
        bcrypt.genSaltSync(8)
      );
      console.log("hashedPassword", hashedPassword);
      user.password = hashedPassword;
    }
  });
  User.beforeUpdate(async (user, options) => {
    console.log("beforeUpdate", user.password);
    if (user.changed("password")) {
      const hashedPassword = await bcrypt.hash(
        user.password,
        bcrypt.genSaltSync(8)
      );
      console.log("hashedPassword", hashedPassword);
      user.password = hashedPassword;
    }
  });
  return User;
};
