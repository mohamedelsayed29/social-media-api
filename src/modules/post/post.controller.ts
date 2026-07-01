import { Router } from "express";
import postService from "./post.service";
import { authenticationMiddleware, authorizationMiddleware } from "../../middleware/authentication.middleware";
import { endPoint } from "./post.authorization";
import { TokenTypeEnum } from "../../utils/security/token.security";
import { cloudFileUpload, fileValidation, StorageEnum } from "../../utils/multer/cloud.multer";
import * as validators from "./post.validation"
import { validation } from "../../middleware/validation.middleware";

const router:Router = Router();


router.post('/',
    authorizationMiddleware(endPoint.createPost),
    authenticationMiddleware(TokenTypeEnum.access),
    cloudFileUpload({validation:fileValidation.images , storageApproach:StorageEnum.disk}).array("attachments",3),
    validation(validators.createPost), 
    postService.createPost 
)

export default router; 
 