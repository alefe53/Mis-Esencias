import multer from "multer";

const storage = multer.memoryStorage();

const limits = {
	fileSize: 5 * 1024 * 1024, // 5 MB
};

const fileFilter = (_req, file, cb) => {
	if (file.mimetype.startsWith("image/")) {
		cb(null, true);
	} else {
		cb(new Error("El archivo no es una imagen!"), false);
	}
};

const upload = multer({ storage, limits, fileFilter });

export default upload;
