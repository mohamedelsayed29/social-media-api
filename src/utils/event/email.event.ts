import EventEmitter from "node:events";
import Mail from "nodemailer/lib/mailer";
import { sendEmail } from "../email/send.email";
import { verifyEmailTemplate } from "../../templates/verify.template.email";

export const emailEventEmitter = new EventEmitter(); 

emailEventEmitter.on("confirmationEmail", async(data:Mail.Options)=>{
    try {
        data.subject = "confirmation email";
        data.html =verifyEmailTemplate({otp:"2343",title:"Email Confirmation"})
        await sendEmail(data);
    } catch (error) {
        console.error("Error sending confirmation email:", error);
    }
})