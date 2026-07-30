import { Types , Schema, model, models, HydratedDocument } from "mongoose";
import { generateHash } from "../../utils/security/hash.security";
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
            type:Types.ObjectId,
            ref:"User",
        }],
        savedPosts:[{
            type:Types.ObjectId,
            ref:"Post",
        }]

    },
    {
        timestamps:true,
        toJSON:{virtuals:true},
        toObject:{virtuals:true}
    }
);

userSchema.virtual("username").set(function(value:string){
    const fullName = (value || "").trim();
    if(!fullName) return;
    const [firstName , ...rest] = fullName.split(/\s+/);
    const lastName = rest.join(" ");
    // Only overwrite the real paths we can actually derive, otherwise a
    // single-word value would wipe an explicitly provided lastName.
    const update:Record<string,string> = {slug:fullName.replaceAll(/\s+/g,"-")};
    if(firstName) update.firstName = firstName;
    if(lastName) update.lastName = lastName;
    this.set(update);
}).get(function(){
    return this.firstName + " " + this.lastName;
})

userSchema.pre("save",async function(this:HUserDocument,next){
    if(this.isModified("password")){
        this.password = await generateHash(this.password)
    }
    if(this.isModified("confirmEmailOtp")){
        this.confirmEmailOtp = await generateHash(this.confirmEmailOtp as string)
    }
});
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
