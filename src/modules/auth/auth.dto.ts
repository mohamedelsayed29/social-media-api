import z from "zod";
import * as validators from "./auth.validation";

export type ISignupDto = z.infer<typeof validators.signup.body>
export type IConfirmEmailDto = z.infer<typeof validators.confirmEmail.body>
export type ILoginDto = z.infer<typeof validators.login.body> 
export type IGmailDto = z.infer<typeof validators.signUpWithGmail.body>
export type IForgotPasswordDto = z.infer<typeof validators.forgotPassword.body>
export type IVerfiyForgotPasswordDto = z.infer<typeof validators.verfiyForgotPassword.body>
export type IResetForgotPasswordDto = z.infer<typeof validators.resetForgotPassword.body>

