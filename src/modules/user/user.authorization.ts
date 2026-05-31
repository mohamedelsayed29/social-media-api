import { RoleEnum } from "../../db/models/user.model";

export const endPoint ={
    profile:[RoleEnum.user,RoleEnum.admin],
    restoreAccount:[RoleEnum.admin],
    hardDeleteAccount:[RoleEnum.admin]
}