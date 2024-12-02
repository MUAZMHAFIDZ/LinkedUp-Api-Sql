const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.addEducation = async (req, res) => {
    const { degree } = req.body;
    const userId = req.user.id;

    try {
        const education = await prisma.education.create({
            data: {
                degree,
                user: { connect: { id: userId } },
            },
        });
        res.status(201).json(education);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getEducation = async (req, res) => {
    const userId = req.user.id;

    try {
        const educationList = await prisma.education.findMany({
            where: { userId },
        });
        res.json(educationList);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};