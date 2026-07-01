import { Types } from "mongoose";
import { AllowCommentsEnum, AvailabilityEnum } from "../../db/models/post.model";

export interface ICreatePostDto {
  content?: string;
  attachments?: string[];
  allowComments?: AllowCommentsEnum;
  availability?: AvailabilityEnum;
  tags?: Types.ObjectId[];
}