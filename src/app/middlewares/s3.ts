import fs from 'fs';
import path from 'path';
import { Request } from 'express';
import multer, { FileFilterCallback } from 'multer';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import multerS3 from 'multer-s3';

const bucketName = process.env.S3_MEDIA_BUCKET_NAME || 'server-class-bucket';
const rawRegion = process.env.AWS_REGION || process.env.S3_REGION || '';
const isPlaceholder = (val?: string) => !val || val.startsWith('tu_');

export const isS3Configured = (): boolean => {
	if (process.env.NODE_ENV === 'production') {
		return true;
	}
	return (
		!isPlaceholder(rawRegion) &&
		!isPlaceholder(process.env.S3_ACCESS_KEY) &&
		!isPlaceholder(process.env.S3_SECRET_KEY)
	);
};

const s3Region = !isPlaceholder(rawRegion) ? rawRegion : 'us-east-2';
const hasExplicitCredentials =
	!isPlaceholder(process.env.S3_ACCESS_KEY) &&
	!isPlaceholder(process.env.S3_SECRET_KEY);

const s3 = new S3Client({
	region: s3Region,
	...(hasExplicitCredentials
		? {
				credentials: {
					accessKeyId: process.env.S3_ACCESS_KEY as string,
					secretAccessKey: process.env.S3_SECRET_KEY as string,
				},
		  }
		: {}),
});

const sanitizeFileName = (originalName: string): string => {
	const normalized = originalName.normalize('NFC').replace(/[^\x00-\x7F]/g, '_');
	return `${Date.now()}_${normalized}`;
};

const localUploadsDir = path.resolve(process.cwd(), 'uploads');

const localDiskStorage = multer.diskStorage({
	destination: (_req, _file, cb) => {
		if (!fs.existsSync(localUploadsDir)) {
			fs.mkdirSync(localUploadsDir, { recursive: true });
		}
		cb(null, localUploadsDir);
	},
	filename: (_req, file, cb) => {
		cb(null, sanitizeFileName(file.originalname));
	},
});

const s3Storage = multerS3({
	s3: s3,
	bucket: bucketName,
	metadata: (_req, file, cb) => {
		const cleanName = sanitizeFileName(file.originalname);
		file.originalname = cleanName;
		cb(null, {
			fieldName: file.fieldname,
			originalName: cleanName,
			mimetype: file.mimetype,
		});
	},
	key: (_req, file, cb) => {
		cb(null, sanitizeFileName(file.originalname));
	},
});

const fileFilter = (
	_req: Request,
	file: Express.Multer.File,
	cb: FileFilterCallback
) => {
	cb(null, file.mimetype.startsWith('image/'));
};

export const uploadS3 = multer({
	storage: isS3Configured() ? s3Storage : localDiskStorage,
	fileFilter: fileFilter,
	limits: {
		fileSize: 10 * 1024 * 1024, // 10 MB
	},
});

export const resolveUploadedFileUrl = (
	req: Request,
	file: Express.Multer.File | Express.MulterS3.File
): string => {
	const s3File = file as Express.MulterS3.File;
	if (s3File.location) {
		return s3File.location;
	}
	const host = req.get('host') || `localhost:${process.env.PORT || 3000}`;
	return `${req.protocol}://${host}/uploads/${encodeURIComponent(file.filename)}`;
};

export const extractS3Key = (urlOrKey: string): string | null => {
	if (!urlOrKey) return null;
	if (!urlOrKey.startsWith('http://') && !urlOrKey.startsWith('https://')) {
		return urlOrKey;
	}
	try {
		const parsed = new URL(urlOrKey);
		const isS3Host =
			parsed.hostname.includes('amazonaws.com') ||
			parsed.hostname.includes(bucketName);
		if (!isS3Host) {
			return null;
		}
		return decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
	} catch {
		return null;
	}
};

export const deleteImageFromS3 = async (urlOrKey: string) => {
	if (!urlOrKey) return;
	if (urlOrKey.includes('/uploads/')) {
		const filename = decodeURIComponent(urlOrKey.split('/uploads/').pop() || '');
		if (filename) {
			const filePath = path.join(localUploadsDir, path.basename(filename));
			if (fs.existsSync(filePath)) {
				fs.unlinkSync(filePath);
			}
		}
		return;
	}
	if (!isS3Configured()) return;
	const key = extractS3Key(urlOrKey);
	if (!key) return;
	const params = {
		Bucket: bucketName,
		Key: key,
	};
	await s3.send(new DeleteObjectCommand(params));
};
