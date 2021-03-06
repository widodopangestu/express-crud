const paginate = require("express-paginate");
var isBase64 = require("is-base64");
const FileType = require("file-type");
const fs = require("fs");
const db = require("../models");
const User = db.users;
const Op = db.Sequelize.Op;

const { body } = require("express-validator");
const { validationResult } = require("express-validator");

exports.validate = (method) => {
  switch (method) {
    case "createUser": {
      return [
        body("nama_lengkap").exists(),
        body("alamat_lengkap").exists(),
        body("jenis_identitas").exists(),
        body("no_identitas").exists(),
        body("file_identitas")
          .exists()
          .custom(async (value) => {
            if (!isBase64(value)) {
              return Promise.reject("File is not base 64 format!");
            }
            const file_type = await FileType.fromBuffer(
              Buffer.from(value, "base64")
            );
            const allowed_file = ["png", "jpg", "jpeg"];
            allowed_file.includes(file_type.ext);

            console.log("file_type", file_type);
            if (!allowed_file.includes(file_type.ext)) {
              return Promise.reject("File extension is not alowed!");
            }
          }),
        body("pekerjaan").exists(),
        body("email")
          .isEmail()
          .custom((value) => {
            return User.findOne({ where: { email: value } }).then((user) => {
              if (user) {
                return Promise.reject("E-mail already in use!");
              }
            });
          }),
        body("username").custom((value) => {
          return User.findOne({ where: { username: value } }).then((user) => {
            if (user) {
              return Promise.reject("Username already in use!");
            }
          });
        }),
        body("no_hp").custom((value) => {
          return User.findOne({ where: { no_hp: value } }).then((user) => {
            if (user) {
              return Promise.reject("No HP already in use!");
            }
          });
        }),
        body("password").exists(),
      ];
    }
    case "updateUser": {
      return [
        body("file_identitas").custom(async (value) => {
          if (!isBase64(value)) {
            return Promise.reject("File is not base 64 format!");
          }
          const file_type = await FileType.fromBuffer(
            Buffer.from(value, "base64")
          );
          const allowed_file = ["png", "jpg", "jpeg"];
          allowed_file.includes(file_type.ext);

          console.log("file_type", file_type);
          if (!allowed_file.includes(file_type.ext)) {
            return Promise.reject("File extension is not alowed!");
          }
        }),
        body("email")
          .isEmail()
          .custom((value) => {
            return User.findOne({ where: { email: value } }).then((user) => {
              if (user) {
                return Promise.reject("E-mail already in use!");
              }
            });
          }),
        body("password").exists(),
      ];
    }
  }
};
// Create and Save a new User
exports.create = async (req, res) => {
  // Validate request
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  const file_type = await FileType.fromBuffer(
    Buffer.from(req.body.file_identitas, "base64")
  );
  let file_name = Math.floor(Date.now() / 1000) + "." + file_type.ext;
  let b = Buffer.from(req.body.file_identitas, "base64");
  fs.writeFile("public/uploads/" + file_name, b, function (err) {
    if (!err) {
      console.log("file is created");
    }
  });

  const user = {
    nama_lengkap: req.body.nama_lengkap,
    alamat_lengkap: req.body.alamat_lengkap,
    jenis_identitas: req.body.jenis_identitas,
    no_identitas: req.body.no_identitas,
    file_identitas: file_name,
    pekerjaan: req.body.pekerjaan,
    email: req.body.email,
    no_hp: req.body.no_hp,
    username: req.body.username,
    password: req.body.password,
  };

  // Save User in the database
  User.create(user)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while creating the User.",
      });
    });
};

// Retrieve all Users from the database.
exports.findAll = (req, res) => {
  const email = req.query.email;
  var condition = email ? { email: { [Op.like]: `%${email}%` } } : null;

  User.findAndCountAll({
    where: condition,
    limit: req.query.limit,
    offset: req.skip,
  })
    .then((results) => {
      const itemCount = results.count;
      const pageCount = Math.ceil(results.count / req.query.limit);
      res.send({
        results: results.rows,
        pageCount,
        itemCount,
        pages: paginate.getArrayPages(req)(3, pageCount, req.query.page),
      });
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving users.",
      });
    });
};

// Find a single User with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  User.findByPk(id)
    .then((data) => {
      if (data == null) {
        res.status(404).send({
          message: "Error retrieving Infografi with id=" + id,
        });
      } else {
        res.send(data);
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error retrieving User with id=" + id,
      });
    });
};

// Update a User by the id in the request
exports.update = async (req, res) => {
  const id = req.params.id;

  let user = req.body;
  if (req.body.hasOwnProperty("file_identitas")) {
    const file_type = await FileType.fromBuffer(
      Buffer.from(req.body.file_identitas, "base64")
    );
    let file_name = Math.floor(Date.now() / 1000) + "." + file_type.ext;
    let b = Buffer.from(req.body.file_identitas, "base64");
    fs.writeFile("public/uploads/" + file_name, b, function (err) {
      if (!err) {
        console.log("file is created");
      }
    });

    user["file_identitas"] = file_name;
  }
  User.update(user, {
    where: { id: id },
  })
    .then((num) => {
      if (num == 1) {
        res.send({
          message: "User was updated successfully.",
        });
      } else {
        res.send({
          message: `Cannot update User with id=${id}. Maybe User was not found or req.body is empty!`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error updating User with id=" + id,
      });
    });
};

// Delete a User with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  User.destroy({
    where: { id: id },
  })
    .then((num) => {
      if (num == 1) {
        res.send({
          message: "User was deleted successfully!",
        });
      } else {
        res.send({
          message: `Cannot delete User with id=${id}. Maybe User was not found!`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Could not delete User with id=" + id,
      });
    });
};

// Delete all Users from the database.
exports.deleteAll = (req, res) => {
  User.destroy({
    where: {},
    truncate: false,
  })
    .then((nums) => {
      res.send({ message: `${nums} Users were deleted successfully!` });
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while removing all users.",
      });
    });
};

// Find all published Users
exports.findAllPublished = (req, res) => {
  User.findAll({ where: { published: true } })
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving users.",
      });
    });
};
