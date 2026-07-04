import { Router } from "express";
import postService from "./post.service";
import { authenticationMiddleware, authorizationMiddleware } from "../../middleware/authentication.middleware";
import { endPoint } from "./post.authorization";
import { cloudFileUpload, fileValidation } from "../../utils/multer/cloud.multer";
import * as validators from "./post.validation"
import { validation } from "../../middleware/validation.middleware";
import { StorageEnum, TokenTypeEnum } from "../../common";

const router:Router = Router();


router.post('/',
    authorizationMiddleware(endPoint.createPost),
    authenticationMiddleware(TokenTypeEnum.access),
    cloudFileUpload({validation:fileValidation.images , storageApproach:StorageEnum.disk}).array("attachments",3),
    validation(validators.createPostSchema), 
    postService.createPost 
)

router.patch(
  '/:postId/like',
  authorizationMiddleware(endPoint.createPost),
  authenticationMiddleware(TokenTypeEnum.access),
  validation(validators.likePostSchema),
  postService.likePost
);
export default router; 
 