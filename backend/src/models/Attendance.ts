import mongoose, {
  Document,
  Schema,
  Types
} from "mongoose";

interface ICheck {
  time: Date | null;
  photo: string | null;
}

export interface IAttendance extends Document {
  employee: Types.ObjectId;
  date: string;
  checkIn: ICheck;
  checkOut: ICheck;
  status: "Present" | "Checked Out";
  createdAt: Date;
  updatedAt: Date;
}

const checkSchema = new Schema<ICheck>(
  {
    time: {
      type: Date,
      default: null
    },

    photo: {
      type: String,
      default: null
    }
  },
  {
    _id: false
  }
);

const attendanceSchema =
  new Schema<IAttendance>(
    {
      employee: {
        type: Schema.Types.ObjectId,
        ref: "Employee",
        required: true
      },

      date: {
        type: String,
        required: true
      },

      checkIn: {
        type: checkSchema,
        default: () => ({
          time: null,
          photo: null
        })
      },

      checkOut: {
        type: checkSchema,
        default: () => ({
          time: null,
          photo: null
        })
      },

      status: {
        type: String,
        enum: [
          "Present",
          "Checked Out"
        ],
        default: "Present"
      }
    },
    {
      timestamps: true
    }
  );

attendanceSchema.index(
  {
    employee: 1,
    date: 1
  },
  {
    unique: true
  }
);

const Attendance =
  mongoose.model<IAttendance>(
    "Attendance",
    attendanceSchema
  );

export default Attendance;