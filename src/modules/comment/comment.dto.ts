import { likeActionEnum } from "../../common/enums/post.enum";
import z from "zod";
import { likeCommentSchema } from "./comment.validation";

export interface LikeCommentDTO {
    commentId: string;
    action: likeActionEnum;
}

export type likeCommentQueryInputsDto = z.infer<typeof likeCommentSchema.query>
