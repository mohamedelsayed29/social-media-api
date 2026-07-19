import { Types , Schema, model, models, HydratedDocument } from "mongoose";
import { generateHash } from "../../utils/security/hash.security";
import { emailEventEmitter } from "../../utils/event/email.event";
import { GenderEnum, ProviderEnum, RoleEnum } from "../../common";
import { IUser } from "../../common/interface/user.interface";


const userSchema = new Schema<IUser>(
    {
        firstName:{type:String , required:true , minLength:2 , maxLength:25 , trim:true},
        lastName:{type:String , required:true , minLength:2 , maxLength:25 , trim:true},
        slug:{type:String , required:true , minLength:2 , maxLength:51},
        email:{type:String , required:true , trim:true , unique:true }, 
        phoneNumber:{type:String , required:true},
        gender:{type:String, enum:GenderEnum},
        address:{type:String}, 
        password: {
            type: String,
            required: function (this:any) {
                return this.provider === ProviderEnum.google ? false : true;
            }
        },
        profileImage:{type:String},
        tempProfileImage:{type:String},
        coverImage:[String],
        confirmEmailOtp:{type:String},
        confirmedAt:{type:Date},
        freezeedAt:{type:Date},
        freezeedBy:{type:Types.ObjectId, ref:"User"},
        restoredAt:{type:Date},
        restoredBy:{type:Types.ObjectId, ref:"User"},
        resetPasswordOtp:{type:String},
        changeCredentialTime:{type:Date},
        role:{type:String, enum:RoleEnum, default:RoleEnum.user},
        provider:{type:String, enum:ProviderEnum, default:ProviderEnum.system },
        friends:[{
            type:{type:Types.ObjectId, ref:"User"},
        }]

    },
    {
        timestamps:true,
        toJSON:{virtuals:true},
        toObject:{virtuals:true}
    }
);

userSchema.virtual("username").set(function(value:string){ 
    const [firstName , lastName] = value.split(" ") || [];
    this.set({firstName,lastName ,slug:value.replaceAll(/\s+/g,"-")});
}).get(function(){
    return this.firstName + " " + this.lastName;
})

userSchema.pre("save",async function(this:HUserDocument & {wasNew:boolean ; confirmEmailPlainOtp?:string},next){
    this.wasNew = this.isNew
    if(this.isModified("password")){
        this.password = await generateHash(this.password)
    }
    if(this.isModified("confirmEmailOtp")){
        this.confirmEmailPlainOtp = this.confirmEmailOtp as string
        this.confirmEmailOtp = await generateHash(this.confirmEmailOtp as string)
    }
}); 
userSchema.post("save", async function(doc,next){
    const that = this as HUserDocument & {wasNew:boolean ; confirmEmailPlainOtp?:string}
    if(that.wasNew && that.confirmEmailPlainOtp){
        emailEventEmitter.emit("confirmationEmail",{
            to:this.email,
            username:this.username,
            otp:that.confirmEmailOtp
        })        
    }
})
userSchema.pre(["find","findOne"],async function(next){
    const query = this.getQuery();
    if(query.paranoid === false){
        this.setQuery({...query})
    }else{
        this.setQuery({...query,freezeedAt:{$exists:false}})
    }
})

export const UserModel = models.User || model<IUser>("User",userSchema)
export type HUserDocument = HydratedDocument<IUser>