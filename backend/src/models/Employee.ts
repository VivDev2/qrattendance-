import mongoose, { Document, Schema } from "mongoose";

export interface IEmployee extends Document {
  employeeId: string;
  name: string;
  email: string;
  department: string;
  password: string;
  photo: string;
  createdAt: Date;
  updatedAt: Date;
}

const employeeSchema =
  new Schema<IEmployee>(
    {
      employeeId: {
        type: String,
        required: true,
        unique: true,
        trim: true
      },

      name: {
        type: String,
        required: true,
        trim: true
      },

      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
      },

      department: {
        type: String,
        required: true,
        trim: true
      },

      password: {
        type: String,
        required: true
      },

      photo: {
        type: String,
        required: true
      }
    },
    {
      timestamps: true
    }
  );

const Employee =
  mongoose.model<IEmployee>(
    "Employee",
    employeeSchema
  );

export default Employee;