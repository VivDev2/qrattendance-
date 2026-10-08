// ui after scanning the qr page 
"use client";

import { useRouter } from "next/navigation";

export default function AttendanceOptionsPage() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-5">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Attendance
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Select an option to continue
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          {/* Check In */}
          <button
            type="button"
            onClick={() =>
              router.push("/attendance/check-in")
            }
            className="w-full rounded-2xl bg-black px-6 py-6 text-left text-white transition hover:bg-gray-800 active:scale-[0.99]"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  Start
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Check In
                </h2>

                <p className="mt-1 text-sm text-gray-400">
                  Mark your arrival
                </p>
              </div>

              <span className="text-3xl">→</span>
            </div>
          </button>

          {/* Check Out */}
          <button
            type="button"
            onClick={() =>
              router.push("/attendance")
            }
            className="w-full rounded-2xl border border-gray-200 bg-white px-6 py-6 text-left text-gray-900 transition hover:bg-gray-100 active:scale-[0.99]"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  Finish
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Check Out
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Mark your departure
                </p>
              </div>

              <span className="text-3xl">→</span>
            </div>
          </button>
        </div>

        {/* Small footer */}
        <p className="mt-8 text-center text-xs text-gray-400">
          Taletronaut Attendance System
        </p>
      </div>
    </main>
  );
}

