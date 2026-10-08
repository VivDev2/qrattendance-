import "dotenv/config";

import express, {
  Request,
  Response,
  NextFunction
} from "express";

import cors from "cors";
import path from "path";

import connectDB from "./config/db";

import employeeRoutes
  from "./routes/employeeRoutes";

import attendanceRoutes
  from "./routes/attendanceRoutes";

const app =
  express();

const PORT =
  process.env.PORT || 5000;

connectDB();

app.use(cors());

app.use(
  express.json()
);

app.use(
  express.urlencoded({
    extended: true
  })
);

app.use(
  "/uploads",
  express.static(
    path.join(
      __dirname,
      "../uploads"
    )
  )
);

app.get(
  "/",
  (
    req: Request,
    res: Response
  ) => {
    res.json({
      success: true,
      message:
        "Attendance API is running"
    });
  }
);

app.get(
  "/api/health",
  (
    req: Request,
    res: Response
  ) => {
    res.json({
      success: true,
      message:
        "Server is healthy"
    });
  }
);

app.use(
  "/api/employees",
  employeeRoutes
);

app.use(
  "/api/attendance",
  attendanceRoutes
);

app.use(
  (
    req: Request,
    res: Response
  ) => {
    res.status(404).json({
      success: false,
      message:
        "Route not found"
    });
  }
);

app.use(
  (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    console.error(err);

    if (
      err.message ===
      "Only image files are allowed"
    ) {
      res.status(400).json({
        success: false,
        message: err.message
      });

      return;
    }

    res.status(500).json({
      success: false,
      message:
        "Something went wrong"
    });
  }
);

app.listen(
  PORT,
  () => {
    console.log(
      `Server running on http://localhost:${PORT}`
    );
  }
);