import { Router } from "express";
import { authenticationMiddleware, authorizationMiddleware } from "../../middleware/authentication.middleware";
import userService from "./user.service";
import { endPoint } from "./user.authorization";
import { validation } from "../../middleware/validation.middleware";
import * as validators from './user.validation'
import { cloudFileUpload, fileValidation } from "../../utils/multer/cloud.multer";
import { StorageEnum, TokenTypeEnum } from "../../common";
import chatRouter from "../chat/chat.controller"
const router:Router = Router();

//http://localhot:3000/api/user/{userId}/chat
router.get("/profile",
    authorizationMiddleware(endPoint.profile),
    userService.profile
);

router.patch("/profile",
    authenticationMiddleware(TokenTypeEnum.access),
    validation(validators.updateProfileSchema),
    userService.updateProfile
);

router.get("/search",
    authenticationMiddleware(TokenTypeEnum.access),
    validation(validators.searchUsersSchema),
    userService.searchUsers
);

router.get("/friend-requests",
    authenticationMiddleware(TokenTypeEnum.access),
    validation(validators.getFriendRequestsSchema),
    userService.getFriendRequests
);

router.use("/:userId/chat",chatRouter)

router.get("/:userId",
    authenticationMiddleware(TokenTypeEnum.access),
    validation(validators.getPublicProfileSchema),
    userService.publicProfile
);

router.patch("/profile-image",
    authenticationMiddleware(),
    cloudFileUpload({validation:fileValidation.images,storageApproach:StorageEnum.disk,maxSize:5}).single("image"),
    userService.profileImage 
);

router.patch("/profile-cover-image",
    authenticationMiddleware(),
    cloudFileUpload({validation:fileValidation.images,storageApproach:StorageEnum.disk}).array("images",5),
    userService.profileCoverImage 
);

router.delete("{/:userId}/freeze-account",
    authenticationMiddleware(),
    validation(validators.freezeAccount),
    userService.freezeAccount
);

router.delete("/:userId/hard-delete-account",
    authorizationMiddleware(endPoint.hardDeleteAccount),
    validation(validators.hardDeleteAccount),
    userService.hardDeleteAccount
);


router.patch("{/:userId}/restore-account",
    authorizationMiddleware(endPoint.restoreAccount),
    validation(validators.restoreAccount),
    userService.restoreAccount
);


router.post("/logout",
    authenticationMiddleware(),
    validation(validators.logout),
    userService.logout
);

router.post ("/refresh-token",
    authenticationMiddleware(TokenTypeEnum.refresh),
    userService.refreshToken
);

router.post("/:userId/friend-requests",
    authenticationMiddleware(TokenTypeEnum.access),
    authorizationMiddleware(endPoint.friendRequest),
    validation(validators.friendRequestShema),
    userService.friendRequest
);

router.patch("/:requestId/accept",
    authenticationMiddleware(TokenTypeEnum.access),
    authorizationMiddleware(endPoint.acceptFriendRequest),
    validation(validators.acceptFriendRequestSchema),
    userService.acceptFriendRequest
);

router.patch("/:requestId/reject",
    authenticationMiddleware(TokenTypeEnum.access),
    authorizationMiddleware(endPoint.acceptFriendRequest),
    validation(validators.rejectFriendRequestSchema),
    userService.rejectFriendRequest
);

router.delete("/:requestId/friend-requests",
    authenticationMiddleware(TokenTypeEnum.access),
    authorizationMiddleware(endPoint.acceptFriendRequest),
    validation(validators.cancelFriendRequestSchema),
    userService.cancelFriendRequest
);

router.delete("/:userId/friend",
    authenticationMiddleware(TokenTypeEnum.access),
    authorizationMiddleware(endPoint.acceptFriendRequest),
    validation(validators.deleteFriendSchema),
    userService.deleteFriend
);


export default router
