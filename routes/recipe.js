const express = require('express');
const router = express.Router();
const recipeController = require('../controller/recipeController.js');
const { validateRecipe } = require('../validators/recipeValidator.js');
const validateRequest = require('../middleware/validateRequest.js');
const { authenticateToken } = require('../middleware/authenticateToken');
const authorizeRoles = require('../middleware/authorizeRoles');

// Validate and create recipe
router.post('/createRecipe', validateRecipe, validateRequest, recipeController.createAndSaveRecipe);

router.get('/admin/all', authenticateToken, authorizeRoles('admin'), recipeController.listAdminRecipes);
router.patch('/admin/:id/visibility', authenticateToken, authorizeRoles('admin'), recipeController.updateRecipeCommunityVisibility);
router.get('/community', recipeController.listCommunityRecipes);
router.post('/:id/share-community', recipeController.shareRecipeToCommunity);
router.post('/:id/unshare-community', recipeController.unshareRecipeFromCommunity);
router.post('/', recipeController.getRecipes);
router.delete('/', recipeController.deleteRecipe);

module.exports = router;
