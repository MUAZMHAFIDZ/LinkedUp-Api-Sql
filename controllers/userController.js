const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const path = require('path');
const prisma = new PrismaClient();

exports.getCurrentUser = async (req, res) => {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    res.json(user);
};

exports.updateUser = async (req, res) => {
    const userId = req.user.id;
    const { name, address, phone, experience, gender, education, company, description } = req.body;

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            ...(name !== undefined && { name }), 
            ...(address !== undefined && { address }), 
            ...(phone !== undefined && { phone }), 
            ...(experience !== undefined && { experience }), 
            ...(gender !== undefined && { gender }), 
            ...(education !== undefined && { education }), 
            ...(company !== undefined && { company }), 
            ...(descriptipn !== undefined && { description }), 
        },
    });
    res.json(updatedUser);
};

exports.deleteAccount = async (req, res) => {
    const userId = req.user.id;

    await prisma.user.delete({ where: { id: userId } });
    res.json({ message: 'Account deleted' });
};


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/profiles/');
    },
    filename: async (req, file, cb) => {
        const userId = req.user.id;
        
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true }
        });

        const sanitizedUserName = req.user.name.replace(/\s+/g, '').toLowerCase();
        const imagename = `${sanitizedUserName}${path.extname(file.originalname)}`;
        cb(null, imagename);
    }
});

const upload = multer({ storage: storage }).single('image');

exports.updateImage = async (req, res) => {
    const userId = req.user.id;

    upload(req, res, async function (err) {
        if (err) {
            return res.status(500).json({ error: 'File upload failed', details: err.message });
        }

        const sanitizedUserName = req.user.name.replace(/\s+/g, '').toLowerCase();
        const imagename = `${sanitizedUserName}${path.extname(req.file.originalname)}`;
        const imagePath = `uploads/profiles/${imagename}`;
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                image: imagePath 
            }
        });

        res.json({
            ...updatedUser,
            imageUrl: `${req.protocol}://${req.get('host')}/${imagePath}`
        });
    });
};