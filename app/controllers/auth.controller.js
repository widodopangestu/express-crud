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
    case "signup": {
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
  }
};
// Create and Save a new User
exports.signup = async (req, res) => {
  // Validate request
  const errors = validationResult(req); // Finds the validation errors in this request and wraps them in an object with handy functions

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
