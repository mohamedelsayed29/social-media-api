import { Router } from "express";
import authService from './auth.service'
import { validation } from "../../middleware/validation.middleware";
import * as validators from "./auth.validation";
const router:Router = Router();
router.post("/signup",validation(validators.signup),authService.signup)
router.post("/signup-gmail" , validation(validators.signUpWithGmail),authService.signupWithGmail)
router.post("/login-gmail" , validation(validators.signUpWithGmail),authService.loginWithGmail)
router.patch("/confirm-email",validation(validators.confirmEmail),authService.confirmEmail)
router.post("/login",validation(validators.login),authService.login)
router.patch ("/forgot-password",validation(validators.forgotPassword),authService.forgotPassword)
router.patch ("/verfiy-forgot-password",validation(validators.verfiyForgotPassword ),authService.verfiyForgotPassword)
router.patch ("/reset-forgot-password",validation(validators.resetForgotPassword ),authService.resetForgotPassword)




export default router; 