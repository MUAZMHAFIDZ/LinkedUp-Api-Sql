const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/jobs/');
    },
    filename: (req, file, cb) => {
        const timestamp = `${Math.random().toString(36).substring(2, 10)}-${new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)}`;
        const imagename = `${timestamp}${path.extname(file.originalname)}`;
        cb(null, imagename);
    }
});
const upload = multer({ storage: storage }).single('image');

exports.createJob = async (req, res) => {
    try {
        upload(req, res, async function (err) {
            if (err) {
                return res.status(500).json({ error: 'File upload failed', details: err.message });
            }
            const { title, salary, description, companyId } = req.body;
            const imagename = req.file.filename; 
            const imagePath = `uploads/jobs/${imagename}`;
            const job = await prisma.job.create({
                data: {
                    title,
                    salary: parseInt(salary),
                    description,
                    image: imagePath, 
                    companyId: parseInt(companyId)
                },
            });
            res.status(201).json({
                ...job,
                imageUrl: `${req.protocol}://${req.get('host')}/${imagePath}`
            });
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getAllJobs = async (req, res) => {
    try {
        const cursor = req.query.cursor ? parseInt(req.query.cursor) : null;
        const pageSize = parseInt(req.query.pageSize) || 10;

        const jobs = await prisma.job.findMany({
            where: {
                status: true,
                ...(cursor && { id: { gt: cursor } }),
            },
            include: {
                company: { 
                    select: {
                        id: true,
                        name: true,
                        address: true,
                    }
                }
            },
        });
        const nextCursor = jobs.length > 0 ? jobs[jobs.length - 1].id : null;

        res.json({ jobs, nextCursor });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getJobById = async (req, res) => {
    const { id } = req.params;

    try {
        const job = await prisma.job.findUnique({
            where: { 
                id: parseInt(id) 
            },
            include: {
                company: { 
                    select: {
                        id: true,
                        name: true,
                        address: true,
                    }
                }
            },
        });

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        res.json(job);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateJob = async (req, res) => {
    const { id } = req.params;
    const { title, salary, description, } = req.body;

    if (!req.body) {
        return res.status(400).json({ message: "Data tidak valid, silakan kirim ulang." });
    }

    try {
        const updatedJob = await prisma.job.update({
            where: { id: parseInt(id) },
            data: {
                title,
                salary,
                description,
            },
        });
        res.json(updatedJob);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteJob = async (req, res) => {
    const { id } = req.params;

    try {
        const jobs = await prisma.job.findUnique({
            where: { id: parseInt(id) },
        });
        if (!jobs) {
            return res.status(404).json({ error: 'Job not found' });
        }
        const imagePath = jobs.image; 
        if (imagePath) {
            const absoluteImagePath = path.resolve(imagePath);  
            fs.unlink(absoluteImagePath, (err) => {
                if (err) {
                    console.error('Error deleting image:', err);
                    return res.status(500).json({ error: 'Failed to delete image' });
                }
                console.log('Image deleted successfully');
            });
        }

        await prisma.job.delete({
            where: { id: parseInt(id) },
        });
        res.json({ message: 'Job deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.searchJob = async (req, res) => {
    const { title } = req.query;
    try {
        const cursor = req.query.cursor ? parseInt(req.query.cursor) : null;
        const pageSize = parseInt(req.query.pageSize) || 10;

        const jobs = await prisma.job.findMany({
            where: {
                status: true,
                ...(title && {
                    title: {
                        contains: title,
                        // mode: 'insensitive',
                    },
                }),
                ...(cursor && { id: { lt: cursor } }),
            },
            include: {
                company: { 
                    select: {
                        id: true,
                        name: true,
                        address: true,
                    }
                }
            },
            take: pageSize,
            orderBy: {
                createdAt: 'desc',
            },
        });
        const nextCursor = jobs.length > 0 ? jobs[jobs.length - 1].id : null;
        res.json({ jobs, nextCursor });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.registerForJob = async (req, res) => {
    const { userId, jobId, description, portfolioLink } = req.body;
    try {
        const existingEntry = await prisma.jobUsers.findUnique({
            where: {
                jobId_userId: {
                    jobId: jobId,
                    userId: userId,
                },
            },
        });
        if (existingEntry) {
            return res.status(400).json({ error: 'User is already registered for this job' });
        }
        await prisma.jobUsers.create({
            data: {
                jobId,
                userId,
                description,
                portfolioLink,
            },
        });
        await prisma.job.update({
            where: { id: jobId },
            data: {
                userCount: {
                    increment: 1,
                },
            },
        });
        res.status(201).json({ message: 'User successfully registered for the job' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getJobsForUser = async (req, res) => {
    const { userId } = req.params;
    try {
        const jobs = await prisma.job.findMany({
            where: {
                users: {
                    some: {
                        id: parseInt(userId),
                    },
                },
            },
        });
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.acceptApplicant = async (req, res) => {
    const { userId, jobId } = req.params;

    try {
        const user = await prisma.user.findUnique({
            where: { id: parseInt(userId) },
        });

        if (!user || user.role !== 'company') {
            return res.status(403).json({ error: 'Unauthorized access' });
        }

        const applicant = await prisma.jobUsers.findFirst({
            where: {
                jobId: parseInt(jobId),
                userId: parseInt(req.body.applicantId),
            },
        });

        if (!applicant) {
            return res.status(404).json({ error: 'Applicant not found' });
        }
        await prisma.job.update({
            where: { id: jobId },
            data: {
                status: false, 
            },
        });

        res.json({ message: 'Applicant accepted successfully, job status updated to inactive' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
