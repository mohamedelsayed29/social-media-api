import z from "zod";
import * as validators from "./user.validation";


export type ILogoutDto = z.infer<typeof validators.logout.body >

export type IFreezeAccountParams = z.infer<typeof validators.freezeAccount.params>

export type IRestoreAccountParams = z.infer<typeof validators.restoreAccount.params>

export type IHardDeleteAccountParams = z.infer<typeof validators.hardDeleteAccount.params>