import { Router } from "express";
import { authorizationMiddleware } from "../../middleware/authentication.middleware";
import userService from "./user.service";
import { endPoint } from "./user.authorization";

const router:Router = Router();
router.get("/profile",authorizationMiddleware(endPoint.profile),userService.profile)

export default router