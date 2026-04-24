import z from "zod";
import * as validators from "./auth.validation";

export type ISignupDto = z.infer<typeof validators.signup.body>