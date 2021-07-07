module.exports = (app) => {
  const passport = require("passport");
  const infografis = require("../controllers/infografi.controller.js");

  var router = require("express").Router();

  // Create a new Infografi
  router.post("/", infografis.validate("createInfografi"), infografis.create);

  // Retrieve all Infografis
  router.get("/", infografis.findAll);

  // Retrieve a single Infografi with id
  router.get("/:id", infografis.findOne);

  // Update a Infografi with id
  router.put("/:id", infografis.validate("updateInfografi"), infografis.update);

  // Delete a Infografi with id
  router.delete("/:id", infografis.delete);

  // Delete all Infografis
  router.delete("/", infografis.deleteAll);

  app.use(
    "/api/infografis",
    passport.authenticate("jwt", { session: false }),
    router
  );
};
