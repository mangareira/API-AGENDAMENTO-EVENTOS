import multer from "multer";
import path from 'path';
import crypto from 'node:crypto';

export const upload = multer({
    dest: path.resolve(__dirname, 'tmp', 'uploads'),
    limits: { fileSize: 1024 * 1024 * 4 },
    storage: multer.diskStorage({
        destination(req, file, callback) {
            callback(null, path.resolve(__dirname, 'tmp', 'uploads'));
        },
        filename(req, file, callback) {
            // Substituindo espaços por hífens no nome original do arquivo
            const originalName = file.originalname.replace(/\s+/g, '-');
            const fileName = `${crypto.randomBytes(20).toString('hex')}-${originalName}`;
            callback(null, fileName);
        }
    })
});
