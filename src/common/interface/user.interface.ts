import { Types } from "mongoose";
import { GenderEnum, ProviderEnum, RoleEnum } from "../enums/user.enum";

export interface IUser{
    _id:Types.ObjectId;
    firstName:string; 
    lastName:string;
    username:string;
    email:string;
    phoneNumber?:string;
    gender?:GenderEnum
    address?:string; 
    password:string;
    slug?:string;
    confirmEmailOtp?:string; 
    confirmedAt?:Date;
    resetPasswordOtp?:string;
    changeCredentialTime?:Date;
    profileImage?:string
    tempProfileImage?:string
    freezeedAt?:Date;
    freezeedBy?:Types.ObjectId;
    restoredAt?:Date;
    restoredBy?:Types.ObjectId;
    coverImage?:string[]
    role:RoleEnum; 
    provider:ProviderEnum;
    createdAt:Date;
    updatedAt?:Date;
    friends?:Types.ObjectId[];
}