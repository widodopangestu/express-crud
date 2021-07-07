module.exports = (sequelize, Sequelize) => {
  const Infografi = sequelize.define("infografis", {
    nama: {
      type: Sequelize.STRING,
    },
    deskripsi: {
      type: Sequelize.TEXT,
    },
    nama_file: {
      type: Sequelize.STRING,
    },
    status: {
      type: Sequelize.ENUM("draft", "publish", "not publish"),
      defaultValue: "draft",
    },
  });

  return Infografi;
};
