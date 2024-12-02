const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.addExperience = async (req, res) => {
    const { jobTitle, company } = req.body;
    const userId = req.user.id;

    try {
        const experience = await prisma.experience.create({
            data: {
                jobTitle,
                company,
                user: { connect: { id: userId } },
            },
        });
        res.status(201).json(experience);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getExperience = async (req, res) => {
    const userId = req.user.id;

    try {
        const experienceList = await prisma.experience.findMany({
            where: { userId },
        });
        res.json(experienceList);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};