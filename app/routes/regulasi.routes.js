module.exports = (app) => {
  const passport = require("passport");
  const regulasis = require("../controllers/regulasi.controller.js");

  var router = require("express").Router();

  // Create a new Regulasi
  router.post("/", regulasis.validate("createRegulasi"), regulasis.create);

  // Retrieve all Regulasis
  router.get("/", regulasis.findAll);

  // Retrieve a single Regulasi with id
  router.get("/:id", regulasis.findOne);

  // Update a Regulasi with id
  router.put("/:id", regulasis.validate("updateRegulasi"), regulasis.update);

  // Delete a Regulasi with id
  router.delete("/:id", regulasis.delete);

  // Delete all Regulasis
  router.delete("/", regulasis.deleteAll);

  app.use(
    "/api/regulasis",
    passport.authenticate("jwt", { session: false }),
    router
  );
};
