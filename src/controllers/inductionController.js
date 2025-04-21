import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
        if (oldInduction){
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
        console.log(req.body)
        return res.status(200).json({message: "Minute deleted successfully"});
    } catch (error) {
        console.error('Error reviewing induction session mail:', error);
        return res.status(500).json({ error: 'Server error while reviewing induction session mail' });
    }
};

export const closeSession = async (req, res) => {
    try {
        console.log(req.body)
        return res.status(200).json({message: "Minute deleted successfully"});
    } catch (error) {
        console.error('Error deleting minute:', error);
        return res.status(500).json({ error: 'Server error while deleting minute' });
    }
};

export const updateSelection = async (req, res) => {
    try {
        console.log(req.body)
        return res.status(200).json({message: "Minute deleted successfully"});
    } catch (error) {
      console.error('Error deleting minute:', error);
      return res.status(500).json({ error: 'Server error while deleting minute' });
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
                    where:{societyId: parseInt(affiliation)}
                })
                break;
            case "STUDENT_AFFAIRS":
                break;
        }
        return res.status(200).json(sessions);
    } catch (error) {
      console.error('Error getting induction sessions:', error);
      return res.status(500).json({ error: 'Server error while fetching induction sessions' });
    }
};