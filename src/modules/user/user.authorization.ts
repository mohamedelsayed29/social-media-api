import { RoleEnum } from "../../common";

export const endPoint ={
    profile:[RoleEnum.user,RoleEnum.admin],
    restoreAccount:[RoleEnum.admin],
    hardDeleteAccount:[RoleEnum.admin]
}