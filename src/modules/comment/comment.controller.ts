import { Router } from "express";
import { authenticationMiddleware, authorizationMiddleware } from "../../middleware/authentication.middleware";
import { TokenTypeEnum } from "../../common";
import { commentService } from "./comment.service";
import { endPoint } from "./comment.authorization";
import { validation } from "../../middleware/validation.middleware";
import * as validators from "./comment.validation"
import { cloudFileUpload, fileValidation } from "../../utils/multer/cloud.multer";
import { StorageEnum } from "../../common";

const router:Router = Router({
    mergeParams:true
});


router.post('/',
    authenticationMiddleware(TokenTypeEnum.access),
    authorizationMiddleware(endPoint.createComment),
    cloudFileUpload({validation:fileValidation.images, storageApproach:StorageEnum.disk}).array("attachments",3),
    validation(validators.createCommentSchema),
    commentService.createComment
)
 
// path : localhost:3000/api/post/:postId/comment/:commentId/reply
// create reply for comment
router.post('/:commentId/reply',
    authenticationMiddleware(TokenTypeEnum.access),
    authorizationMiddleware(endPoint.createReply),
    cloudFileUpload({validation:fileValidation.images, storageApproach:StorageEnum.disk}).array("attachments",3),
    validation(validators.createReplySchema),
    commentService.createReply
)
export default router;