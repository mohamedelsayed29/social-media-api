import { Router } from "express";
import { authenticationMiddleware, authorizationMiddleware } from "../../middleware/authentication.middleware";
import userService from "./user.service";
import { endPoint } from "./user.authorization";
import { validation } from "../../middleware/validation.middleware";
import * as validators from './user.validation'
import { cloudFileUpload, fileValidation } from "../../utils/multer/cloud.multer";
import { StorageEnum, TokenTypeEnum } from "../../common";

const router:Router = Router();
router.get("/profile",authorizationMiddleware(endPoint.profile),userService.profile);

router.patch("/profile-image",
    authenticationMiddleware(),
    // cloudFileUpload({validation:fileValidation.images,storageApproach:StorageEnum.disk}).single("image"),
    userService.profileImage 
);

router.patch("/profile-cover-image",
    authenticationMiddleware(),
    cloudFileUpload({validation:fileValidation.images,storageApproach:StorageEnum.disk}).array("images",5),
    userService.profileCoverImage 
);

router.delete("{/:userId}/freeze-account",authenticationMiddleware(),validation(validators.freezeAccount),userService.freezeAccount);

router.delete("/:userId/hard-delete-account",authorizationMiddleware(endPoint.hardDeleteAccount),validation(validators.hardDeleteAccount),userService.hardDeleteAccount);


router.patch("{/:userId}/restore-account",authorizationMiddleware(endPoint.restoreAccount),validation(validators.restoreAccount),userService.restoreAccount);


router.post("/logout",authenticationMiddleware(),validation(validators.logout), userService.logout);

router.post ("/refresh-token",authenticationMiddleware(TokenTypeEnum.refresh ),userService.refreshToken);

export default router