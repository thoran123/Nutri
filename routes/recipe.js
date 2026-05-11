const express = require('express');
const router = express.Router();
const recipeController = require('../controller/recipeController.js');
const { validateRecipe } = require('../validators/recipeValidator.js');
const validateRequest = require('../middleware/validateRequest.js');

// Validate and create recipe
router.post('/createRecipe', validateRecipe, validateRequest, recipeController.createAndSaveRecipe);

router.get('/admin/all', recipeController.listAdminRecipes);
router.patch('/admin/:id/visibility', recipeController.updateRecipeCommunityVisibility);
router.get('/community', recipeController.listCommunityRecipes);
router.post('/:id/share-community', recipeController.shareRecipeToCommunity);
router.post('/:id/unshare-community', recipeController.unshareRecipeFromCommunity);
router.post('/', recipeController.getRecipes);
router.delete('/', recipeController.deleteRecipe);

module.exports = router;
