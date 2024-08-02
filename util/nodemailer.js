const nodemailer = require('nodemailer');

async function sendEmail() {
    let transporter = nodemailer.createTransport({
        host: 'smtp.example.com',
        port: 587,
        secure: false, 
        auth: {
            user: 'your_email@example.com', 
            pass: 'your_password' 
        }
    });

    let mailOptions = {
        from: 'your_email@example.com', 
        to: 'recipient@example.com',
        subject: 'Subject of your email',
        html:`<h1>Testing Mail</h1>`
    };

    try {
        let info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ', info.messageId);
    } catch (error) {
        console.error('Error sending email: ', error);
    }
}

module.exports = { sendEmail };
