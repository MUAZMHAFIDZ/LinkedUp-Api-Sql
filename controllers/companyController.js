const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

exports.createCompany = async (req, res) => {
    const { name, address, website } = req.body;

    try {
        const company = await prisma.company.create({
            data: {
                name,
                address,
                website,
            },
        });
        res.status(201).json(company);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getAllCompanies = async (req, res) => {
    try {
        const companies = await prisma.company.findMany();
        res.json(companies);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getCompanyById = async (req, res) => {
    const { id } = req.params;

    try {
        const company = await prisma.company.findUnique({
            where: { id: parseInt(id) },
        });

        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        res.json(company);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateCompany = async (req, res) => {
    const { id } = req.params;
    const { name, address, website } = req.body;

    if (!req.body) {
        return res.status(400).json({ message: "Data tidak valid, silakan kirim ulang." });
    }

    try {
        const updatedCompany = await prisma.company.update({
            where: { id: parseInt(id) },
            data: {
                name,
                address,
                website,
            },
        });
        res.json(updatedCompany);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteCompany = async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.company.delete({
            where: { id: parseInt(id) },
        });
        res.json({ message: 'Company deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.searchCompanies = async (req, res) => {
    const { name } = req.query;

    try {
        const companies = await prisma.company.findMany({
            where: {
                ...(name && {
                    name: {
                        contains: name,
                        // mode: 'insensitive',
                    },
                }),
            },
        });
        res.json(companies);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
