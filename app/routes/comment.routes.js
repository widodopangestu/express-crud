module.exports = (app) => {
  const passport = require("passport");
  const comments = require("../controllers/comment.controller.js");

  var router = require("express").Router();

  // Create a new Comment
  router.post("/", comments.create);

  // Retrieve all Comments
  router.get("/", comments.findAll);

  // Retrieve all By Tutorial Comments
  router.get("/by-tutrial/:tutorialId", comments.findAllByTutorial);

  // Retrieve a single Comment with id
  router.get("/:id", comments.findOne);

  // Update a Comment with id
  router.put("/:id", comments.update);

  // Delete a Comment with id
  router.delete("/:id", comments.delete);

  // Delete all Comments
  router.delete("/", comments.deleteAll);

  app.use(
    "/api/comments",
    passport.authenticate("jwt", { session: false }),
    router
  );
};
