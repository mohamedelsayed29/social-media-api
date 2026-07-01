import { RoleEnum } from "../../db/models/user.model";

export const endPoint ={
    createPost:[RoleEnum.user,RoleEnum.admin],
}