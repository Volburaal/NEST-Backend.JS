export const generateStudentEmail = (rollnumber) => {
    // const campusCodes = {
    //   F: 'cfd',
    //   I: 'isb',
    //   L: 'lhr',
    //   P: 'pwr',
    //   K: 'khi',
    // };
  
    const batch = rollnumber.substring(0, 2);
    const campus = rollnumber[2].toLowerCase();
    const studentNumber = rollnumber.substring(4);
    
    return `${campus}${batch}${studentNumber}@cfd.nu.edu.pk`;
    //return `${campus}${batch}${studentNumber}@${campusCodes[campus]}.nu.edu.pk`;
};

export const sendEmail = (recipents, subject, body, htmlOrText) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SENDER_ADDRESS,
          pass: process.env.EMAIL_APP_PASSWORD,
        },
      });
      let mailOptions
      if(htmlOrText){
        mailOptions = {
            from: process.env.SENDER_ADDRESS,
            to: '',
            bcc: [recipents],
            subject: subject,
            html: body,
          };
      }
      else{
        mailOptions = {
            from: process.env.SENDER_ADDRESS,
            to: '',
            bcc: [recipents],
            subject: emailTitle,
            text: emailBody,
          };
      }
      if(recipents){
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error('Error sending email:', error);
            return res.status(500).json({ error: 'Error sending account creation email' });
          }
          return res.status(200).json({ message: 'Creation Email Sent'});
        });
      }
}
