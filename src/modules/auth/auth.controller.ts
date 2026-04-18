import { Router } from "express";
import authService from './auth.service'
const router:Router = Router();
router.post("/signup",authService.signup)
router.post("/login",authService.login)


export default router;