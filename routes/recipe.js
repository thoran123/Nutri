const express = require('express');
const router = express.Router();
const recipeController = require('../controller/recipeController.js');
const { authenticateToken } = require('../middleware/authenticateToken');
const { validateRecipe } = require('../validators/recipeValidator.js');
const validateRequest = require('../middleware/validateRequest.js');

router.post('/createRecipe', authenticateToken, validateRecipe, validateRequest, recipeController.createAndSaveRecipe);

router.get('/user/:user_id', authenticateToken, (req, res, next) => {
  req.query.user_id = req.params.user_id;
  next();
}, recipeController.getUserRecipes);

router.get('/:id', recipeController.getRecipeById);
router.post('/', authenticateToken, recipeController.getRecipes);
router.delete('/', authenticateToken, recipeController.deleteRecipe);

module.exports = router;
