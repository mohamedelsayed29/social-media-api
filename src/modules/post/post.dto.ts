import { Types } from "mongoose";
import z from "zod";
import { likePostSchema } from "./post.validation";
import { AllowCommentsEnum, AvailabilityEnum } from "../../common/enums/post.enum";

export interface ICreatePostDto {
  content?: string;
  attachments?: string[];
  allowComments?: AllowCommentsEnum;
  availability?: AvailabilityEnum;
  tags?: Types.ObjectId[];
}

export type likePostQueryInputsDto = z.infer<typeof likePostSchema.query>