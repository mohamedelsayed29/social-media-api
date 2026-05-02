import z from "zod";
import * as validators from "./auth.validation";

export type ISignupDto = z.infer<typeof validators.signup.body>
export type IConfirmEmailDto = z.infer<typeof validators.confirmEmail.body>
export type ILoginDto = z.infer<typeof validators.login.body> 