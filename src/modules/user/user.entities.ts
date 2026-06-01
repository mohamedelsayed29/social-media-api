import { HUserDocument } from "../../db/models/user.model";

export interface IProfileResponse {
    url: string,
}

export interface ICoverImageResponse {
    user:Partial <HUserDocument>
}
