import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();
const prisma = new PrismaClient();

// Configure multer storage
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Configure multer upload
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowedTypes.includes(ext));
  }
});

// Create uploads directory if not exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

// Error handling middleware
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      message: err.code === 'LIMIT_FILE_SIZE' 
        ? 'File size exceeds 5MB limit'
        : 'Too many files (max 5)'
    });
  }
  if (err) return res.status(400).json({ message: err.message });
  next();
};

// File upload route
router.post('/proposal/:proposalId/upload',
  authenticate(['STUDENT']),
  upload.array('files', 5),
  handleUploadErrors,
  async (req, res) => {
    try {
      const proposalId = parseInt(req.params.proposalId);
      const user = req.user;
      const files = req.files;

      // Verify proposal ownership
      const proposal = await prisma.proposal.findUnique({
        where: { id: proposalId }
      });

      if (!proposal || proposal.submittedById !== user.id) {
        await cleanup(files);
        return res.status(403).json({ message: 'Unauthorized access' });
      }

      // Save files to database
      const savedFiles = await prisma.$transaction(
        files.map(file => 
          prisma.file.create({
            data: {
              filename: file.originalname,
              path: `/uploads/${file.filename}`,
              proposalId: proposalId
            }
          })
        )
      );

      res.status(201).json(savedFiles);
    } catch (error) {
      await cleanup(req.files);
      console.error('Upload error:', error);
      res.status(500).json({ message: 'File upload failed' });
    }
  }
);

// File cleanup utility
async function cleanup(files) {
  if (!files) return;
  await Promise.all(
    files.map(file => 
      fs.unlink(file.path).catch(() => {})
    )
  );
}

// Get proposal files
router.get('/proposal/:proposalId',
  async (req, res) => {
    try {
      const proposalId = parseInt(req.params.proposalId);
      const files = await prisma.file.findMany({
        where: { proposalId },
        select: {
          id: true,
          filename: true,
          uploadedAt: true,
          proposalId: true
        }
      });
      res.json(files);
    } catch (error) {
      console.error('File fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch files' });
    }
  }
);

// File download route
router.get('/:fileId',
  async (req, res) => {
    try {
      const fileId = parseInt(req.params.fileId);
      const file = await prisma.file.findUnique({
        where: { id: fileId },
        include: { proposal: true }
      });

      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }

      const filePath = path.resolve(__dirname, '../../', file.path);
      res.download(filePath, file.filename);
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ message: 'File download failed' });
    }
  }
);

// Delete file route
router.delete('/:fileId',
  async (req, res) => {
    try {
      const fileId = parseInt(req.params.fileId);
      const file = await prisma.file.findUnique({
        where: { id: fileId },
        include: { proposal: true }
      });

      if (!file) return res.status(404).json({ message: 'File not found' });
      if (file.proposal.submittedById !== req.user.id) {
        return res.status(403).json({ message: 'Unauthorized access' });
      }
      if (file.proposal.status !== 'PENDING') {
        return res.status(400).json({ message: 'Cannot delete files from non-pending proposals' });
      }

      await prisma.$transaction([
        prisma.file.delete({ where: { id: fileId } }),
        fs.unlink(file.path)
      ]);

      res.json({ message: 'File deleted successfully' });
    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({ message: 'File deletion failed' });
    }
  }
);

export default router;