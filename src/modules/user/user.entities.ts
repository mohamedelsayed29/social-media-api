import { HUserDocument } from "../../db/models/user.model";

export interface IProfileResponse {
    user:Partial <HUserDocument>
}

export interface ICoverImageResponse {
    user:Partial <HUserDocument>
}
