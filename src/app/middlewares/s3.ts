import { Request } from 'express';
import multer, { FileFilterCallback } from 'multer';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import multerS3 from 'multer-s3';

const s3 = new S3Client({
	region: process.env.S3_REGION,
	credentials: {
		accessKeyId: process.env.S3_ACCESS_KEY || '',
		secretAccessKey: process.env.S3_SECRET_KEY || '',
	},
});

const s3Storage = multerS3({
	s3: s3,
	bucket: 'server-class-bucket',
	metadata: (req, file, cb) => {
		let cleanName = file.originalname.normalize('NFC');
		cleanName = cleanName.replace(/[^\x00-\x7F]/g, '_');
		file.originalname = cleanName;
		cb(null, { ...file });
	},
	acl: 'public-read',
	key: (req, file, cb) => {
		let cleanName = file.originalname.normalize('NFC');
		cleanName = cleanName.replace(/[^\x00-\x7F]/g, '_'); // Reemplaza caracteres no ASCII por "_"
		cb(null, cleanName);
	},
});

const fileFilter = (
	req: Request,
	file: Express.Multer.File,
	cb: FileFilterCallback
) => {
	cb(null, file.mimetype.startsWith('image/'));
};

export const uploadS3 = multer({
	storage: s3Storage,
	fileFilter: fileFilter,
});

export const deleteImageFromS3 = async (key:string) => {
	const params = {
		Bucket:'server-class-bucket',
		Key: key,
	};
	await s3.send(new DeleteObjectCommand(params));
}
