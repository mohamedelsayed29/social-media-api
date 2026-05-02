import EventEmitter from "node:events";
import Mail from "nodemailer/lib/mailer";
import { sendEmail } from "../email/send.email";
import { verifyEmailTemplate } from "../../templates/verify.template.email";

export const emailEventEmitter = new EventEmitter(); 
interface IEmail extends Mail.Options {
    otp:number
}
emailEventEmitter.on("confirmationEmail", async(data:IEmail)=>{
    try {
        data.subject = "confirmation email";
        data.html = verifyEmailTemplate({otp:data.otp,title:"Email Confirmation"})
        await sendEmail(data);
    } catch (error) {
        console.error("Error sending confirmation email:", error);
    }
}) ;