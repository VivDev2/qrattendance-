import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import Employee from "../models/Employee";

const generateEmployeeId = (): string => {
  return `EMP${Date.now()
    .toString()
    .slice(-8)}`;
};

export const registerEmployee = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      employeeId,
      name,
      email,
      department,
      password,
      confirmPassword
    } = req.body;

    if (
      !name ||
      !department ||
      !password
    ) {
      res.status(400).json({
        success: false,
        message:
          "Name, department and password are required"
      });

      return;
    }

    if (
      password !== confirmPassword
    ) {
      res.status(400).json({
        success: false,
        message: "Passwords do not match"
      });

      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters"
      });

      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        message:
          "Employee photo is required"
      });

      return;
    }

    const finalEmployeeId =
      employeeId ||
      generateEmployeeId();

    const existingEmployee =
      await Employee.findOne({
        employeeId: finalEmployeeId
      });

    if (existingEmployee) {
      res.status(409).json({
        success: false,
        message:
          "Employee already exists"
      });

      return;
    }

    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );

    const generatedEmail =
      `${name
        .toLowerCase()
        .replace(
          /[^a-z0-9]+/g,
          "."
        )
        .replace(
          /^\.+|\.+$/g,
          ""
        )}.${Date.now()}@talentronaut.local`;

    const employeeEmail =
      email || generatedEmail;

    const employee =
      await Employee.create({
        employeeId:
          finalEmployeeId,

        name,

        email:
          employeeEmail,

        department,

        password:
          hashedPassword,

        photo:
          `/uploads/employees/${req.file.filename}`
      });

    res.status(201).json({
      success: true,

      message:
        "Employee registered successfully",

      employee: {
        id: employee._id,
        employeeId:
          employee.employeeId,
        name:
          employee.name,
        email:
          employee.email,
        department:
          employee.department,
        photo:
          employee.photo
      }
    });
  } catch (error) {
    console.error(
      "Register employee error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to register employee"
    });
  }
};

export const getEmployees = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const employees =
      await Employee.find()
        .select("-password")
        .sort({
          createdAt: -1
        });

    res.json({
      success: true,
      count:
        employees.length,
      employees
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch employees"
    });
  }
};

export const getEmployee = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const employee =
      await Employee.findOne({
        employeeId:
          req.params.employeeId
      }).select("-password");

    if (!employee) {
      res.status(404).json({
        success: false,
        message:
          "Employee not found"
      });

      return;
    }

    res.json({
      success: true,
      employee
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch employee"
    });
  }
};