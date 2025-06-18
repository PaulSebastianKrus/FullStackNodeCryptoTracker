import nodemailer from 'nodemailer';

async function sendWelcomeEmail() {
  try {
    
    const testAccount = await nodemailer.createTestAccount();
   
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user, 
        pass: testAccount.pass, 
      },
    });

    //TODO 
    const mailOptions = {
      from: '"Crypto Tracker" <paul.email@example.com>', 
      to: 'user@example.com', 
      subject: 'Welcome to Crypto Tracker!', 
      text: 'Welcome to Crypto Tracker! Start tracking your crypto today.',
      html: '<p>Welcome to <b>Crypto Tracker</b>! Start tracking your crypto today.</p>',
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

export default sendWelcomeEmail;