import { Router } from "express";
import { authenticationMiddleware, authorizationMiddleware } from "../../middleware/authentication.middleware";
import userService from "./user.service";
import { endPoint } from "./user.authorization";
import { validation } from "../../middleware/validation.middleware";
import * as validators from './user.validation'
import { TokenTypeEnum } from "../../utils/security/token.security";
import { cloudFileUpload, fileValidation, StorageEnum } from "../../utils/multer/cloud.multer";

const router:Router = Router();
router.get("/profile",authorizationMiddleware(endPoint.profile),userService.profile)
router.patch("/profile-image" , authenticationMiddleware(), cloudFileUpload({validation:fileValidation.images,storageApproach:StorageEnum.memory}).single("image"),userService.profileImage )
router.post("/logout",authenticationMiddleware(),validation(validators.logout), userService.logout)
router.post ("/refresh-token",authenticationMiddleware(TokenTypeEnum.refresh ),userService.refreshToken)

export default router