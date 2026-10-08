import { Request, Response } from "express";
import Employee from "../models/Employee";
import Attendance from "../models/Attendance";

const getToday = (): string => {
  return new Date()
    .toISOString()
    .split("T")[0];
};

export const checkIn = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      employeeId
    } = req.body;

    if (!employeeId) {
      res.status(400).json({
        success: false,
        message:
          "Employee ID is required"
      });

      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        message:
          "Check-in photo is required"
      });

      return;
    }

    const employee =
      await Employee.findOne({
        employeeId
      });

    if (!employee) {
      res.status(404).json({
        success: false,
        message:
          "Employee not registered"
      });

      return;
    }

    const date =
      getToday();

    const existingAttendance =
      await Attendance.findOne({
        employee:
          employee._id,
        date
      });

    if (
      existingAttendance?.checkIn
        ?.time
    ) {
      res.status(409).json({
        success: false,
        message:
          "Employee has already checked in today"
      });

      return;
    }

    const attendance =
      existingAttendance ||
      new Attendance({
        employee:
          employee._id,
        date
      });

    attendance.checkIn = {
      time: new Date(),
      photo:
        `/uploads/attendance/${req.file.filename}`
    };

    attendance.status =
      "Present";

    await attendance.save();

    res.status(201).json({
      success: true,
      message:
        "Check-in successful",

      attendance: {
        id:
          attendance._id,

        employeeId:
          employee.employeeId,

        employeeName:
          employee.name,

        date:
          attendance.date,

        checkIn:
          attendance.checkIn
      }
    });
  } catch (error) {
    console.error(
      "Check-in error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to check in"
    });
  }
};

export const checkOut = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      employeeId
    } = req.body;

    if (!employeeId) {
      res.status(400).json({
        success: false,
        message:
          "Employee ID is required"
      });

      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        message:
          "Check-out photo is required"
      });

      return;
    }

    const employee =
      await Employee.findOne({
        employeeId
      });

    if (!employee) {
      res.status(404).json({
        success: false,
        message:
          "Employee not registered"
      });

      return;
    }

    const date =
      getToday();

    const attendance =
      await Attendance.findOne({
        employee:
          employee._id,
        date
      });

    if (!attendance) {
      res.status(404).json({
        success: false,
        message:
          "Employee has not checked in today"
      });

      return;
    }

    if (
      !attendance.checkIn.time
    ) {
      res.status(400).json({
        success: false,
        message:
          "Employee has not checked in today"
      });

      return;
    }

    if (
      attendance.checkOut.time
    ) {
      res.status(409).json({
        success: false,
        message:
          "Employee has already checked out today"
      });

      return;
    }

    attendance.checkOut = {
      time: new Date(),

      photo:
        `/uploads/attendance/${req.file.filename}`
    };

    attendance.status =
      "Checked Out";

    await attendance.save();

    res.json({
      success: true,

      message:
        "Check-out successful",

      attendance: {
        id:
          attendance._id,

        employeeId:
          employee.employeeId,

        employeeName:
          employee.name,

        date:
          attendance.date,

        checkIn:
          attendance.checkIn,

        checkOut:
          attendance.checkOut,

        status:
          attendance.status
      }
    });
  } catch (error) {
    console.error(
      "Check-out error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to check out"
    });
  }
};

export const getAttendance = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const records =
      await Attendance.find()
        .populate(
          "employee",
          "employeeId name department"
        )
        .sort({
          date: -1,
          createdAt: -1
        });

    res.json({
      success: true,

      count:
        records.length,

      attendance:
        records
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch attendance"
    });
  }
};

export const getEmployeeAttendance =
  async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const employee =
        await Employee.findOne({
          employeeId:
            req.params.employeeId
        });

      if (!employee) {
        res.status(404).json({
          success: false,
          message:
            "Employee not found"
        });

        return;
      }

      const records =
        await Attendance.find({
          employee:
            employee._id
        }).sort({
          date: -1
        });

      res.json({
        success: true,

        employee: {
          employeeId:
            employee.employeeId,

          name:
            employee.name,

          department:
            employee.department
        },

        count:
          records.length,

        attendance:
          records
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch attendance"
      });
    }
  };