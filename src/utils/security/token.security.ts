import {JwtPayload, Secret, sign, SignOptions, verify} from "jsonwebtoken"
import { HUserDocument, RoleEnum, UserModel } from "../../db/models/user.model"
import { UnauthorizedException } from "../response/error.responce"
import { UserRepository } from "../../db/repository/user.repository"

export enum SignatureLevelEnum{
    Bearer = "Bearer",
    System = "System"
}

export enum TokenTypeEnum{
    access = "access",
    refresh = "refresh"
}

export const generateToken = async({
    payload,
    secret = process.env.ACCESS_USER_TOKEN_SIGNATURE as string,
    options={expiresIn:Number(process.env.ACCESS_TOKEN_EXPIRES_IN)}
}:{payload:Object,secret?:Secret,options?:SignOptions | undefined
}):Promise<string>=>{
    return sign(payload,secret , options)
}

export const verifyToken = async({
    token,
    secret = process.env.ACCESS_USER_TOKEN_SIGNATURE as string,
}:{token:string,secret?:Secret
}):Promise<JwtPayload>=>{
    return verify(token,secret) as JwtPayload
}


export const detectSignatureLevel = async(role: RoleEnum = RoleEnum.user): Promise<SignatureLevelEnum>=>{
    let signatureLevel:SignatureLevelEnum = SignatureLevelEnum.Bearer;
    switch(role){
        case RoleEnum.admin:
            signatureLevel = SignatureLevelEnum.System; 
            break;
        default:
            signatureLevel = SignatureLevelEnum.Bearer;
    }

    return signatureLevel;
}

export const getSignatures  = async(signatureLevel: SignatureLevelEnum = SignatureLevelEnum.Bearer): Promise<{access_signature:string , refresh_signature:string}>=>{
    let signatures:{access_signature:string , refresh_signature:string} = {access_signature:"",refresh_signature:""};
    switch(signatureLevel){
        case SignatureLevelEnum.System:
            signatures.access_signature = process.env.ACCESS_SYSTEM_TOKEN_SIGNATURE as string;
            signatures.refresh_signature = process.env.REFRESH_SYSTEM_TOKEN_SIGNATURE as string;
            break;
        default:
            signatures.access_signature = process.env.ACCESS_USER_TOKEN_SIGNATURE as string;
            signatures.refresh_signature = process.env.REFRESH_USER_TOKEN_SIGNATURE as string;
    }

    return signatures;
}

export const createLoginCredentials = async(user:HUserDocument)=>{
    const signatureLevel = await detectSignatureLevel(user.role);
    const signatures = await getSignatures(signatureLevel);
    console.log(signatures);
    
    const accessToken = await generateToken({
        payload:{userId:user._id,role:user.role},
        secret:signatures.access_signature,
        options:{expiresIn:Number(process.env.ACCESS_TOKEN_EXPIRES_IN)}
    })
    const refreshToken = await generateToken({
        payload:{userId:user._id},
        secret:signatures.refresh_signature,
        options:{expiresIn:Number(process.env.REFRESH_TOKEN_EXPIRES_IN)}
    })
    return { accessToken, refreshToken };
}

export const decodeToken = async({authorization , tokenType = TokenTypeEnum.access}: {authorization: string , tokenType?: TokenTypeEnum})=>{
    const userModel = new UserRepository(UserModel);
    const [BearerKey , token] = authorization.split(" ")
    if(!BearerKey || !token) throw new UnauthorizedException("missing token Parts")

    const signatures = await getSignatures(BearerKey as SignatureLevelEnum);
    const decoded = await verifyToken({
        token,
        secret:
        tokenType === TokenTypeEnum.refresh
            ? signatures.refresh_signature 
            : signatures.access_signature
    })
    if(!decoded?._id || !decoded?.iat) throw new UnauthorizedException("Invalid token data")

    const user = await userModel.findById({ id: decoded._id})

    if(!user) throw new UnauthorizedException("User not found")
        
    return {user , decoded}
} 