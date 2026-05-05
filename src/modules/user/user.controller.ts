import { Router } from "express";
import { authenticationMiddleware, authorizationMiddleware } from "../../middleware/authentication.middleware";
import userService from "./user.service";
import { endPoint } from "./user.authorization";
import { validation } from "../../middleware/validation.middleware";
import * as validators from './user.validation'

const router:Router = Router();
router.get("/profile",authorizationMiddleware(endPoint.profile),userService.profile)
router.post("/logout",authenticationMiddleware(),validation(validators.logout), userService.logout)

export default router