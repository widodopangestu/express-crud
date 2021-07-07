const paginate = require("express-paginate");
var isBase64 = require("is-base64");
const FileType = require("file-type");
const fs = require("fs");
const db = require("../models");
const Infografi = db.infografis;
const Op = db.Sequelize.Op;

const { body } = require("express-validator");
const { validationResult } = require("express-validator");

exports.validate = (method) => {
  switch (method) {
    case "createInfografi": {
      return [
        body("nama").exists(),
        body("deskripsi").exists(),
        body("nama_file")
          .exists()
          .custom(async (value) => {
            if (!isBase64(value)) {
              return Promise.reject("File is not base 64 format!");
            }
            const file_type = await FileType.fromBuffer(
              Buffer.from(value, "base64")
            );
            const allowed_file = ["pdf", "doc", "docx"];
            allowed_file.includes(file_type.ext);

            console.log("file_type", file_type);
            if (!allowed_file.includes(file_type.ext)) {
              return Promise.reject("File extension is not alowed!");
            }
          }),
      ];
    }
    case "updateInfografi": {
      return [
        body("nama_file").custom(async (value) => {
          if (!isBase64(value)) {
            return Promise.reject("File is not base 64 format!");
          }
          const file_type = await FileType.fromBuffer(
            Buffer.from(value, "base64")
          );
          const allowed_file = ["pdf", "doc", "docx"];
          allowed_file.includes(file_type.ext);

          console.log("file_type", file_type);
          if (!allowed_file.includes(file_type.ext)) {
            return Promise.reject("File extension is not alowed!");
          }
        }),
      ];
    }
  }
};
// Create and Save a new Infografi
exports.create = async (req, res) => {
  // Validate request
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  const file_type = await FileType.fromBuffer(
    Buffer.from(req.body.nama_file, "base64")
  );
  let file_name = `${Math.floor(Date.now() / 1000)}.${file_type.ext}`;
  let b = Buffer.from(req.body.nama_file, "base64");
  fs.writeFile("public/uploads/" + file_name, b, function (err) {
    if (!err) {
      console.log("file is created");
    }
  });

  // Create a Infografi
  const infografi = {
    nama: req.body.nama,
    deskripsi: req.body.deskripsi,
    nama_file: file_name,
  };

  // Save Infografi in the database
  Infografi.create(infografi)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the Infografi.",
      });
    });
};

// Retrieve all Infografis from the database.
exports.findAll = (req, res) => {
  const nama = req.query.nama;
  var condition = nama ? { nama: { [Op.like]: `%${nama}%` } } : null;

  Infografi.findAndCountAll({
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

// Find a single Infografi with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  Infografi.findByPk(id)
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
        message: "Error retrieving Infografi with id=" + id,
      });
    });
};

// Update a Infografi by the id in the request
exports.update = async (req, res) => {
  const id = req.params.id;
  // Create a Infografi
  let infografi = req.body;
  if (req.body.hasOwnProperty("nama_file")) {
    const file_type = await FileType.fromBuffer(
      Buffer.from(req.body.nama_file, "base64")
    );
    let file_name = `${Math.floor(Date.now() / 1000)}.${file_type.ext}`;
    let b = Buffer.from(req.body.nama_file, "base64");
    fs.writeFile("public/uploads/" + file_name, b, function (err) {
      if (!err) {
        console.log("file is created");
      }
    });

    infografi["nama_file"] = file_name;
  }
  Infografi.update(infografi, {
    where: { id: id },
  })
    .then((num) => {
      if (num == 1) {
        res.send({
          message: "Infografi was updated successfully.",
        });
      } else {
        res.send({
          message: `Cannot update Infografi with id=${id}. Maybe Infografi was not found or req.body is empty!`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error updating Infografi with id=" + id,
      });
    });
};

// Delete a Infografi with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  Infografi.destroy({
    where: { id: id },
  })
    .then((num) => {
      if (num == 1) {
        res.send({
          message: "Infografi was deleted successfully!",
        });
      } else {
        res.send({
          message: `Cannot delete Infografi with id=${id}. Maybe Infografi was not found!`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Could not delete Infografi with id=" + id,
      });
    });
};

// Delete all Infografis from the database.
exports.deleteAll = (req, res) => {
  Infografi.destroy({
    where: {},
    truncate: false,
  })
    .then((nums) => {
      res.send({ message: `${nums} Infografis were deleted successfully!` });
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while removing all infografis.",
      });
    });
};

// Find all published Infografis
exports.findAllByTutorial = (req, res) => {
  const tutorialId = req.params.tutorialId;
  Infografi.findAll({ where: { tutorialId: tutorialId } })
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving infografis.",
      });
    });
};
