// main entry point of the app 
"use client";

import { QRCodeCanvas } from "qrcode.react";

const ATTENDANCE_URL =
  "https://4829-2404-4980-201-1fa6-80a9-351b-59a7-a4a9.ngrok-free.app/attendance/options";

export default function QRPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="flex flex-col items-center text-center">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Attendance
        </h1>

        <p className="mb-8 text-sm text-gray-500">
          Scan the QR code to mark your attendance
        </p>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <QRCodeCanvas
            value={ATTENDANCE_URL}
            size={280}
            level="H"
            includeMargin
            bgColor="#ffffff"
            fgColor="#111111"
          />
        </div>

        <p className="mt-6 text-sm font-medium text-gray-600">
          Scan to continue
        </p>
      </div>
    </main>
  );
}

