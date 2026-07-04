import {JwtPayload, Secret, sign, SignOptions, verify} from "jsonwebtoken"
import { HUserDocument,UserModel } from "../../db/models/user.model"
import { BadRequestException, UnauthorizedException } from "../response/error.responce"
import { UserRepository } from "../../db/repository/user.repository"
import {v4 as uuid} from "uuid"
import { TokenRepository } from "../../db/repository/token.repository"
import { HTokenDocument, TokenModel } from "../../db/models/token.model"
import { RoleEnum, SignatureLevelEnum, TokenTypeEnum } from "../../common"


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

// 1- get signature level Role to detect user or admin 
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

// 2- get signature (Admin signature or User signature)
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
    const jwtid = uuid()
    console.log(signatures);
    
    const accessToken = await generateToken({
        payload:{userId:user._id,role:user.role},
        secret:signatures.access_signature,
        options:{expiresIn:Number(process.env.ACCESS_TOKEN_EXPIRES_IN),jwtid}
    })
    const refreshToken = await generateToken({
        payload:{userId:user._id},
        secret:signatures.refresh_signature,
        options:{expiresIn:Number(process.env.REFRESH_TOKEN_EXPIRES_IN),jwtid}
    })
    return { accessToken, refreshToken };
}

export const decodeToken = async({authorization , tokenType = TokenTypeEnum.access}: {authorization: string , tokenType?: TokenTypeEnum})=>{
    const userModel = new UserRepository(UserModel);
    const tokenModel = new TokenRepository(TokenModel)
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
    if(!decoded?.userId || !decoded?.iat)
        throw new UnauthorizedException("Invalid token data")

    if(await tokenModel.findOne({filter:{jti:decoded.jti as string}}))
        throw new UnauthorizedException("invalid or old Login Credentials")

    const user = await userModel.findOne({ 
        filter: {_id:decoded.userId}
    })

    if(!user) throw new UnauthorizedException("User not found")

    if((user.changeCredentialTime?.getTime() || 0) > decoded.iat * 1000) throw new UnauthorizedException("invalid or old Login Credentials")

    return{user , decoded}
}

export const createRevokeToken = async(decoded:JwtPayload):Promise<HTokenDocument>=>{
    const tokenModel = new TokenRepository(TokenModel)
   const [result] =  await tokenModel.create({
        data:[{
            jti:decoded?.jti as string,
            expiersIn: (decoded?.iat as number)+ Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
            userId:decoded?.userId
        }]
    } ) || [];

    if(!result) throw new BadRequestException("Fail to revoke this Token")
    
    return result
    
}