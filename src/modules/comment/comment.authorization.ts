import { RoleEnum } from "../../common";

export const endPoint ={
    createComment:[RoleEnum.user,RoleEnum.admin],
    updateComment:[RoleEnum.user,RoleEnum.admin],
    createReply:[RoleEnum.user,RoleEnum.admin],
}