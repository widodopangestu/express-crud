module.exports = (sequelize, Sequelize) => {
  const bcrypt = require("bcrypt");
  const User = sequelize.define("user", {
    nama_lengkap: {
      type: Sequelize.STRING(150),
      allowNull: false,
    },
    alamat_lengkap: {
      type: Sequelize.TEXT,
    },
    jenis_identitas: {
      type: Sequelize.ENUM("KTP", "SIM", "PASPOR"),
      allowNull: false,
    },
    no_identitas: {
      type: Sequelize.STRING(50),
      allowNull: false,
    },
    file_identitas: {
      type: Sequelize.STRING,
    },
    pekerjaan: {
      type: Sequelize.STRING,
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    no_hp: {
      type: Sequelize.STRING(50),
      unique: true,
    },
    username: {
      type: Sequelize.STRING(100),
      allowNull: false,
      unique: true,
    },
    role: {
      type: Sequelize.ENUM("admin", "user"),
      defaultValue: "user",
    },
    password: {
      type: Sequelize.STRING,
      is: /^[0-9a-f]{64}$/i,
    },
    last_login: {
      type: Sequelize.DATE,
    },
    is_verified: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
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
