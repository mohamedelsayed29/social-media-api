import { Router } from "express";
import { authenticationMiddleware } from "../../middleware/authentication.middleware";
import { TokenTypeEnum } from "../../common";
import { notificationService } from "./notification.service";

const router:Router = Router();

router.get("/",
    authenticationMiddleware(TokenTypeEnum.access),
    notificationService.getNotifications
)

router.patch("/read",
    authenticationMiddleware(TokenTypeEnum.access),
    notificationService.markAllRead
)

export default router;
