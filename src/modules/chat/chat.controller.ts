import { Router } from "express";
import { validation } from "../../middleware/validation.middleware";
import * as validators from "./chat.validation";
import { authenticationMiddleware, authorizationMiddleware } from "../../middleware/authentication.middleware";
import { TokenTypeEnum } from "../../common";
import { endPoint } from "./chat.authorization";
import { chatService } from "./chat.service";
import { cloudFileUpload, fileValidation } from "../../utils/multer/cloud.multer";
import { StorageEnum } from "../../common";
const router:Router = Router({
    mergeParams:true
});

router.post('/groups',
    authenticationMiddleware(TokenTypeEnum.access),
    cloudFileUpload({validation:fileValidation.images,storageApproach:StorageEnum.disk,maxSize:5}).single("image"),
    validation(validators.createGroupSchema),
    chatService.createGroup
)

router.get('/groups',
    authenticationMiddleware(TokenTypeEnum.access),
    chatService.getGroups
)

router.patch('/groups/:groupId/members',
    authenticationMiddleware(TokenTypeEnum.access),
    validation(validators.addGroupMembersSchema),
    chatService.addGroupMembers
)

router.get('/groups/:groupId',
    authenticationMiddleware(TokenTypeEnum.access),
    validation(validators.getGroupSchema),
    chatService.getGroup
)

// getChat
router.get('/',
    authenticationMiddleware(TokenTypeEnum.access),
    authorizationMiddleware(endPoint.getchat),
    validation(validators.getChatSchema),
    chatService.getChat
)



export default router;
