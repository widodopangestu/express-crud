const paginate = require("express-paginate");
var isBase64 = require("is-base64");
const FileType = require("file-type");
const fs = require("fs");
const db = require("../models");
const Regulasi = db.regulasis;
const Op = db.Sequelize.Op;

const { body } = require("express-validator");
const { validationResult } = require("express-validator");

exports.validate = (method) => {
  switch (method) {
    case "createRegulasi": {
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
    case "updateRegulasi": {
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
// Create and Save a new Regulasi
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

  // Create a Regulasi
  const regulasi = {
    nama: req.body.nama,
    deskripsi: req.body.deskripsi,
    nama_file: file_name,
  };

  // Save Regulasi in the database
  Regulasi.create(regulasi)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the Regulasi.",
      });
    });
};

// Retrieve all Regulasis from the database.
exports.findAll = (req, res) => {
  const nama = req.query.nama;
  var condition = nama ? { nama: { [Op.like]: `%${nama}%` } } : null;

  Regulasi.findAndCountAll({
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

// Find a single Regulasi with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  Regulasi.findByPk(id)
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
        message: "Error retrieving Regulasi with id=" + id,
      });
    });
};

// Update a Regulasi by the id in the request
exports.update = async (req, res) => {
  const id = req.params.id;
  // Create a Regulasi
  let regulasi = req.body;
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

    regulasi["nama_file"] = file_name;
  }
  Regulasi.update(regulasi, {
    where: { id: id },
  })
    .then((num) => {
      if (num == 1) {
        res.send({
          message: "Regulasi was updated successfully.",
        });
      } else {
        res.send({
          message: `Cannot update Regulasi with id=${id}. Maybe Regulasi was not found or req.body is empty!`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error updating Regulasi with id=" + id,
      });
    });
};

// Delete a Regulasi with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  Regulasi.destroy({
    where: { id: id },
  })
    .then((num) => {
      if (num == 1) {
        res.send({
          message: "Regulasi was deleted successfully!",
        });
      } else {
        res.send({
          message: `Cannot delete Regulasi with id=${id}. Maybe Regulasi was not found!`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Could not delete Regulasi with id=" + id,
      });
    });
};

// Delete all Regulasis from the database.
exports.deleteAll = (req, res) => {
  Regulasi.destroy({
    where: {},
    truncate: false,
  })
    .then((nums) => {
      res.send({ message: `${nums} Regulasis were deleted successfully!` });
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while removing all regulasis.",
      });
    });
};

// Find all published Regulasis
exports.findAllByTutorial = (req, res) => {
  const tutorialId = req.params.tutorialId;
  Regulasi.findAll({ where: { tutorialId: tutorialId } })
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving regulasis.",
      });
    });
};
