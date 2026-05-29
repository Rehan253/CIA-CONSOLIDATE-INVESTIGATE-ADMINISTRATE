import {Router} from 'express';
import AuthController from '../controller/AuthController';
import {validateEmpty} from '../middlewares/checkBody';
import {checkJwt} from '../middlewares/checkJwt';

const router = Router();
// Login route

router.post('/login', [validateEmpty], AuthController.login);
router.post('/register', [validateEmpty], AuthController.register);
router.get('/me', [checkJwt], AuthController.getMe);
router.post('/change-password', [checkJwt], AuthController.changePassword);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);

export default router;
