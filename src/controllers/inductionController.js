import nodemailer from 'nodemailer';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const OTPs = new Map();

const generateStudentEmail = (rollnumber) => {
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

export const createSession = async (req, res) => {
    try {
        const {subject, body} = req.body;
        const {affiliation} = req.user;

        const oldInduction = await prisma.inductionSession.findMany({
            where: {
                societyId: parseInt(affiliation),
                end: null
            }
        })
        if (oldInduction?.length > 0){
            return res.status(400).json({message: "Please close the currently active session before starting another one"})
        }

        const induction = await prisma.inductionSession.create({
            data:{
                subject,
                body,
                societyId: parseInt(affiliation),
                approvalStage: "MENTOR"
            }
        })
        return res.status(200).json({message: "Induction Session Started Succesfully", induction});
    } catch (error) {
        console.error('Error Starting Induction Session:', error);
        return res.status(500).json({ error: 'Server error while starting induction session' });
    }
};

export const reviewSession = async (req, res) => {
    try {
        const {sessionId, status} = req.body;
        if(status === "APPROVED"){
            const session = await prisma.inductionSession.findUnique({
                where:{
                    id: sessionId,
                }
            })
            let nextReviewer
            if (session.approvalStage === "MENTOR"){
                nextReviewer = "STUDENT_AFFAIRS"
                const studentAffairs = await prisma.user.findMany({
                    where:{role:"STUDENT_AFFAIRS"},
                    include:{
                        assignedFaculty: true
                    }
                })
                let mails = []
                for (const dsa of studentAffairs){
                    if(dsa.assignedFaculty){
                        mails.push(dsa.assignedFaculty.email)
                    }
                }
                const society = await prisma.society.findUnique({
                    where:{id: session.societyId}
                })
                const emailContent = `
                    <h1 style="color:rgb(213, 238, 255); text-align:center; background-color: rgb(67, 0, 87); padding: 2%; margin:0px; border-radius: 50px 50px 0px 0px;">Induction session created by ${society.fullName}</h1>
                    <div style="color: rgb(248, 199, 255); background-color: rgb(49, 49, 49); margin: 0px; padding: 5%; border-radius: 0px 0px 50px 50px;">
                        <p style="font-weight: bold; text-align: center;">Please login to your account and review the induction mail</p>
                    </div>
                `;
                let transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.SENDER_ADDRESS,
                        pass: process.env.EMAIL_APP_PASSWORD,
                    },
                });
                for (const recipient of mails){
                    const mailOptions = {
                        from: process.env.SENDER_ADDRESS,
                        to: recipient,
                        subject: `Induction Session for Review`,
                        html: emailContent,
                    };
            
                    transporter.sendMail(mailOptions, (error, info) => {
                        if (error) {
                          console.error('Error sending email to next reviewer:', error);
                        }
                    });
                }
                await prisma.inductionSession.update({
                    where:{id:sessionId},
                    data:{approvalStage: nextReviewer}
                })
            }
            else if (session.approvalStage === "STUDENT_AFFAIRS"){
                await prisma.inductionSession.update({
                    where:{id:sessionId},
                    data:{approvalStage:null}
                })
                let transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.SENDER_ADDRESS,
                        pass: process.env.EMAIL_APP_PASSWORD,
                    },
                });
                const mailOptions = {
                    from: process.env.SENDER_ADDRESS,
                    to: 'muzammilnoor897@gmail.com',
                    subject: session.subject,
                    text: session.body,
                };
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                      console.error('Error sending email to next reviewer:', error);
                    }
                });
            }

        }
        else if (status === "REJECTED"){
            await prisma.inductionSession.update({
                where: {id:sessionId},
                data:{end: new Date}
            })
            await prisma.inductionApplication.deleteMany({
                where:{inductionId: sessionId}
            })
        }
        else {
            return res.status(400).json({message:"Invalid Option"})
        }
        return res.status(200).json({message: "Session reviewed successfully"});
    } catch (error) {
        console.error('Error reviewing induction session mail:', error);
        return res.status(500).json({ error: 'Server error while reviewing induction session mail' });
    }
};

export const closeSession = async (req, res) => {
    try {
        const { sessionId, societyId } = req.body
        const selectedApplicants = await prisma.inductionApplication.findMany({
            where: {
                inductionId: sessionId,
                selected: true,
            }
        })
        for (let applicant of selectedApplicants){
            await prisma.societyMembership.create({
                data:{
                    studentId: applicant.studentId,
                    societyId: societyId,
                }
            })
        }
        const closing = await prisma.inductionSession.update({
            where:{id: sessionId},
            data:{end: new Date}
        })

        return res.status(200).json({message: "Session Closed Succesfully"});
    } catch (error) {
        console.error('Error closing session:', error);
        return res.status(500).json({ error: 'Server error while closing session' });
    }
};

export const updateSelection = async (req, res) => {
    try {
        const { filterUpdates, sessionId } = req.body;
        
        for (const [key, value] of Object.entries(filterUpdates)) {
            const inductionApplication = await prisma.inductionApplication.findUnique({
                where: {
                    inductionId_studentId: {
                        inductionId: sessionId,
                        studentId: parseInt(key)
                    }
                }
            });

            if (!inductionApplication) {
                continue;
            }
            await prisma.inductionApplication.update({
                where: {
                    id: inductionApplication.id
                },
                data: {
                    selected: value
                }
            });
        }

        return res.status(200).json({ message: "Selection updated successfully" });
    } catch (error) {
        console.error('Error updating selection:', error);
        return res.status(500).json({ error: 'Server error while updating selection' });
    }
};


export const sessionApplication = async (req, res) => {
    try {
        const {selectedSession, rollNumber, phone, whatsapp, residency} = req.body
        const student = await prisma.student.findUnique({
            where:{rollnumber: rollNumber}
        })
        if(!student){
            return res.status(400).json({message:"Student doesnt exist"})
        }
        else{
            const session = await prisma.inductionSession.findUnique({
                where:{
                    id: parseInt(selectedSession)
                }
            })
            const alreadyInSociety = await prisma.societyMembership.findMany({
                where:{
                    societyId: session.societyId,
                    studentId: student.id,
                }
            })
            const alreadyApplied = await prisma.inductionApplication.findMany({
                where:{
                    studentId: student.id,
                    inductionId: parseInt(selectedSession)
                }
            })
            if(alreadyInSociety && alreadyInSociety.length > 0){
                return res.status(400).json({message:"You are already a member in this society"})
            }   
            if(alreadyApplied && alreadyApplied.length > 0){
                return res.status(400).json({message:"You have already applied for induction in this society"})
            }
            else{
                const inductionApplication = await prisma.inductionApplication.create({
                    data:{
                        inductionId: parseInt(selectedSession),
                        studentId: student.id
                    }
                })
                await prisma.student.update({
                    where:{
                        id: student.id,   
                    },
                    data:{
                        phone: phone,
                        whatsapp: whatsapp,
                        residency: residency,
                    }
                })
            }
        }

        return res.status(200).json({message: "Applied to session succesfully"});
    } catch (error) {
      console.error('Error applying to session:', error);
      return res.status(500).json({ error: 'Server error while applying to session' });
    }
};

export const getSessions = async (req, res) => {
    try {
        const {role, affiliation} = req.user
        var sessions = []
        switch (role){
            case "STUDENT":
            case "MENTOR":
                sessions = await prisma.inductionSession.findMany({
                    where:{societyId: parseInt(affiliation)},
                    include:{
                        applicants: {
                            include:{
                                student: true,
                            }
                        }
                    }
                })
                break;
            case "STUDENT_AFFAIRS":
                sessions = await prisma.inductionSession.findMany({
                    where: {
                        end: null,
                    },
                    include: {
                        society: true,
                    }
                })
                break;
            case "GENERAL_USER":
                sessions = await prisma.inductionSession.findMany({
                    where: {end: null},
                    include: {
                        society: true,
                    }
                })
                break;
        }
        return res.status(200).json(sessions);
    } catch (error) {
      console.error('Error getting induction sessions:', error);
      return res.status(500).json({ message: 'Server error while fetching induction sessions' });
    }
};

export const verifyOtp = async(req, res) => {
    try{
        const {OTP, rollNumber} = req.body
        const otp = OTPs.get(rollNumber)
        if(otp){
            if(OTP == otp){
                return res.status(200).json({message: "OTP Verified", status: true})
            }
            else{
                return res.status(400).json({message:"Incorrect OTP", status: false})
            }
        }
        else{
            return res.status(400).json({message: "No OTP found, it may have expired", status: false})
        }
    }
    catch (error){
        console.error("Error verifying OTP:", error)
        return res.status(500).json({message: "Error encountered while verifying OTP"})
    }
}

export const generateOtp = async(req, res) => {
    try{
        const rollNumber = req.body.rollNumber.toUpperCase();
        const student = await prisma.student.findUnique({
            where:{
                rollnumber: rollNumber
            }
        })
        if(!student){
            return res.status(400).json({message:"No student found against provided rollnumber"})
        }

        const otp = Math.floor((Math.random()*899999)+100000)
        OTPs.set(rollNumber, otp)
        setTimeout(() => {
            OTPs.delete(rollNumber);
        }, 5 * 60 * 1000);
        const emailContent =
        `
        <h1 style="color:rgb(213, 238, 255); text-align:center; background-color: rgb(67, 0, 87); padding: 2%; margin:0px; border-radius: 50px 50px 0px 0px;">Induction OTP</h1>
        <div style="color: rgb(248, 199, 255); background-color: rgb(49, 49, 49); margin: 0px; padding: 5%; border-radius: 0px 0px 50px 50px;">
            <h3 style="text-align: center;"><b>Your OTP is ${otp}</b><br></h3>
            <h5 style="text-align: center;"><b>This OTP expires in five minutes</b><br></h5>
            <h5>This email was sent to you because your rollnumber was used to apply for a society induction.<br>If you did not apply then please ignore this email.</h6>
        </div>
        `
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.SENDER_ADDRESS,
              pass: process.env.EMAIL_APP_PASSWORD,
            },
        });
        const mailOptions = {
            from: process.env.SENDER_ADDRESS,
            to: generateStudentEmail(rollNumber),
            subject: "Induction OTP",
            html: emailContent,
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ error: 'Error sending email' });
            }
            return res.status(200).json({ message: 'OTP mail sent'});
        });
        return res.status(200).json({message: "OTP Generated"})
    }
    catch (error){
        console.error('Error generating otp', error);
        return res.status(500).json({ error: 'Server error while generating otp' });
    }
}