import multer from "multer";
import path from "path";
import fs from "fs";

const employeeDirectory = path.join(
  __dirname,
  "../../uploads/employees"
);

const attendanceDirectory = path.join(
  __dirname,
  "../../uploads/attendance"
);

fs.mkdirSync(employeeDirectory, {
  recursive: true
});

fs.mkdirSync(attendanceDirectory, {
  recursive: true
});

const createStorage = (
  destination: string
): multer.StorageEngine => {
  return multer.diskStorage({
    destination: (
      req,
      file,
      cb
    ) => {
      cb(null, destination);
    },

    filename: (
      req,
      file,
      cb
    ) => {
      const extension =
        path.extname(file.originalname);

      const filename =
        `${Date.now()}-${Math.round(
          Math.random() * 1e9
        )}${extension}`;

      cb(null, filename);
    }
  });
};

const fileFilter: multer.Options["fileFilter"] =
  (
    req,
    file,
    cb
  ) => {
    if (
      file.mimetype.startsWith("image/")
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only image files are allowed"
        )
      );
    }
  };

export const employeeUpload =
  multer({
    storage:
      createStorage(
        employeeDirectory
      ),

    fileFilter,

    limits: {
      fileSize: 5 * 1024 * 1024
    }
  });

export const attendanceUpload =
  multer({
    storage:
      createStorage(
        attendanceDirectory
      ),

    fileFilter,

    limits: {
      fileSize: 5 * 1024 * 1024
    }
  });