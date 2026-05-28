import { Router } from 'express';
import ProductController from '../controller/ProductController';
import { checkJwt } from '../middlewares/checkJwt';
import { checkRole } from '../middlewares/checkRole';

const router = Router();

// Get all products
router.get('/', [checkJwt], ProductController.listAll);

// Get one product
router.get('/:id([0-9]+)', [checkJwt], ProductController.getOneById);

// Create a new product (admin only)
router.post('/', [checkJwt, checkRole(['ADMIN'])], ProductController.newProduct);

// Edit a product (admin only)
router.patch('/:id([0-9]+)', [checkJwt, checkRole(['ADMIN'])], ProductController.editProduct);

// Delete a product (admin only)
router.delete('/:id([0-9]+)', [checkJwt, checkRole(['ADMIN'])], ProductController.deleteProduct);

export default router;
