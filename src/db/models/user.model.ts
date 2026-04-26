import { Types , Schema, model, models } from "mongoose";

export enum GenderEnum{
    male = "male",
    female = "female"
}
export enum RoleEnum{
    user = "user",
    admin = "admin"
}

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
    confirmEmailOtp?:string;
    confirmedAt?:Date;
    resetPasswordOtp?:string;
    changeCredentialTime?:Date;
    role:RoleEnum; 
    createdAt:Date;
    updatedAt?:Date;
}

const userSchema = new Schema<IUser>(
    {
        firstName:{type:String , required:true , minLength:2 , maxLength:25 , trim:true},
        lastName:{type:String , required:true , minLength:2 , maxLength:25 , trim:true},
        email:{type:String , required:true , trim:true , unique:true}, 
        phoneNumber:{type:String , required:true},
        gender:{type:String, enum:GenderEnum},
        address:{type:String}, 
        password:{type:String , required:true},
        confirmEmailOtp:{type:String},
        confirmedAt:{type:Date},
        resetPasswordOtp:{type:String},
        changeCredentialTime:{type:Date},
        role:{type:String, enum:RoleEnum, default:RoleEnum.user}, 
    },
    {
        timestamps:true,
        toJSON:{virtuals:true},
        toObject:{virtuals:true}
    }
);

userSchema.virtual("username").set(function(value:string){
    const [firstName , lastName] = value.split(" ") || [];
    this.set({firstName,lastName});
}).get(function(){
    return this.firstName + " " + this.lastName;
})

export const UserModel = models.User || model<IUser>("User",userSchema)