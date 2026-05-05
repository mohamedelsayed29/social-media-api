import z from "zod";
import * as validators from "./user.validation";


export type ILogoutDto = z.infer<typeof validators.logout.body >