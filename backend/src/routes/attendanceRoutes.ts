import { Router } from "express";

import {
  checkIn,
  checkOut,
  getAttendance,
  getEmployeeAttendance
} from "../controllers/attendanceController";

import {
  attendanceUpload
} from "../middleware/upload";

const router =
  Router();

router.post(
  "/checkin",
  attendanceUpload.single("photo"),
  checkIn
);

router.put(
  "/checkout",
  attendanceUpload.single("photo"),
  checkOut
);

router.get(
  "/",
  getAttendance
);

router.get(
  "/employee/:employeeId",
  getEmployeeAttendance
);

export default router;