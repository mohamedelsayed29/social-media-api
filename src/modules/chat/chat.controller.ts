import { Router } from "express";
import { validation } from "../../middleware/validation.middleware";
import * as validators from "./chat.validation";
import { authenticationMiddleware, authorizationMiddleware } from "../../middleware/authentication.middleware";
import { TokenTypeEnum } from "../../common";
import { endPoint } from "./chat.authorization";
import { chatService } from "./chat.service";
const router:Router = Router({
    mergeParams:true
});

// getChat
router.get('/',
    authenticationMiddleware(TokenTypeEnum.access),
    authorizationMiddleware(endPoint.getchat),
    validation(validators.getChatSchema),
    chatService.getChat
)



export default router; 