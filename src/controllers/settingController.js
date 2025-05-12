import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const setSettings = async (req, res) => {
    try{
        const {allowInductions, allowProposals, minNotice} = req.body
        await prisma.settings.update({
            where:{id:1},
            data:{
                allowInductions: allowInductions,
                allowProposals: allowProposals,
                minNotice: minNotice
            }
        })
        return res.status(200).json({message:"Settings Updated"})
    }
    catch (error) {
        console.error("Error saving settings:", error);
        res.status(500).json({ error: "Server error" });
    } finally {
        await prisma.$disconnect();
    }
}

export const getSettings = async (req, res) => {
    try{
        const settings = await prisma.settings.findUnique({
            where:{id:1}
        })
        return res.status(200).json({settings})
    }
    catch (error) {
        console.error("Error fetching settings:", error);
        res.status(500).json({ error: "Server error" });
    } finally {
        await prisma.$disconnect();
    }
}


export const addDept = async (req, res) => {
    try{
        const {name, email} = req.body
        const existing = await prisma.zeroDepartment.findUnique({
            where:{
                email: email,
            }
        })
        if(existing){
            return res.status(400).json({message:"Provided email is already in use by " + existing.name})
        }
        const dept = await prisma.zeroDepartment.create({
            data:{
                name: name,
                email: email,
            }
        })
        return res.status(200).json({message:"Department created",dept})
    }
    catch (error) {
        console.error("Error saving settings:", error);
        res.status(500).json({ error: "Server error" });
    } finally {
        await prisma.$disconnect();
    }
}

export const editDept = async (req, res) => {
    try{
        const {id, name, email} = req.body
        const existing = await prisma.zeroDepartment.findUnique({
            where:{
                email: email,
            }
        })
        if(existing){
            return res.status(400).json({message:"Provided email is already in use by " + existing.name})
        }
        const dept = await prisma.zeroDepartment.update({
            where:{id:id},
            data:{
                name: name,
                email: email,
            }
        })
        return res.status(200).json({message:"Department updated", dept})
    }
    catch (error) {
        console.error("Error fetching settings:", error);
        res.status(500).json({ error: "Server error" });
    } finally {
        await prisma.$disconnect();
    }
}

export const getDept = async (req, res) => {
    try{
        const departments = await prisma.zeroDepartment.findMany();
        return res.status(200).json(departments)
    }
    catch (error) {
        console.error("Error fetching settings:", error);
        res.status(500).json({ error: "Server error" });
    } finally {
        await prisma.$disconnect();
    }
}

export const deleteDept = async (req, res) => {
    try{
        const {id} = req.params
        await prisma.zeroDepartment.delete({
            where:{id: parseInt(id)}
        })
        return res.status(200).json({message:"Department Deleted"})
    }
    catch (error) {
        console.error("Error fetching settings:", error);
        res.status(500).json({ error: "Server error" });
    } finally {
        await prisma.$disconnect();
    }
}

export const clearBlcklist = async (req, res) => {
    try {
        await prisma.student.updateMany({
            where:{blacklisted: true},
            data: {blacklisted: false}
        })
        return res.status(200).json({message:"Blacklist Cleared"})
    }
    catch (error) {
        console.error("Error fetching settings:", error);
        res.status(500).json({ error: "Server error" });
    } finally {
        await prisma.$disconnect();
    }
}