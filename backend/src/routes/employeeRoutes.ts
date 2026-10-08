import { Router } from "express";

import {
  registerEmployee,
  getEmployees,
  getEmployee
} from "../controllers/employeeController";

import {
  employeeUpload
} from "../middleware/upload";

const router =
  Router();

router.post(
  "/",
  employeeUpload.single("photo"),
  registerEmployee
);

router.get(
  "/",
  getEmployees
);

router.get(
  "/:employeeId",
  getEmployee
);

export default router;