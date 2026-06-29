import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const avatarStorage = multer.diskStorage({
  destination: path.resolve(__dirname, '../../uploads/avatars'),
  filename: (_req, _file, cb) => cb(null, `${Date.now()}_${uuidv4()}${path.extname(_file.originalname)}`),
});

const imageStorage = multer.diskStorage({
  destination: path.resolve(__dirname, '../../uploads/images'),
  filename: (_req, _file, cb) => cb(null, `${Date.now()}_${uuidv4()}${path.extname(_file.originalname)}`),
});

const resourceStorage = multer.diskStorage({
  destination: path.resolve(__dirname, '../../uploads/resources'),
  filename: (_req, _file, cb) => cb(null, `${Date.now()}_${uuidv4()}${path.extname(_file.originalname)}`),
});

export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('只支持 jpg/png/webp 格式的图片'));
  },
});

export const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|gif|webp)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('只支持 jpg/png/gif/webp 格式的图片'));
  },
});

export const uploadResource = multer({
  storage: resourceStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.pptx', '.docx', '.xlsx', '.zip', '.rar'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('只支持 pdf/pptx/docx/xlsx/zip/rar 格式的文件'));
  },
});
