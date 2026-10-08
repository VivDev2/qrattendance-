// this is empolyee register form 

"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://attendance-backend-2nky.onrender.com";

export default function RegisterEmployeePage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // -------------------------
  // CLEANUP
  // -------------------------

  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();

      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, []);

  // -------------------------
  // START CAMERA
  // -------------------------

  const startCamera = async () => {
    setCameraLoading(true);
    setError("");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera is not supported on this device.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "user" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      const video = videoRef.current;

      if (!video) {
        throw new Error("Camera preview is not ready.");
      }

      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;

      await video.play();

      setCameraReady(true);
    } catch (err) {
      console.error(err);

      setCameraReady(false);

      setError(
        err instanceof DOMException &&
          err.name === "NotAllowedError"
          ? "Please allow camera access to register."
          : "Unable to access the camera."
      );
    } finally {
      setCameraLoading(false);
    }
  };

  // -------------------------
  // STOP CAMERA
  // -------------------------

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    setCameraReady(false);
  };

  // -------------------------
  // CAPTURE PHOTO
  // -------------------------

  const capturePhoto = () => {
    setError("");

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      setError("Camera is not ready.");
      return;
    }

    if (!video.videoWidth || !video.videoHeight) {
      setError("Camera is still starting. Please wait.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      setError("Unable to capture photo.");
      return;
    }

    // Mirror front-camera image
    context.save();
    context.translate(canvas.width, 0);
    context.scale(-1, 1);

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    context.restore();

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Unable to create photo.");
          return;
        }

        if (photoPreview) {
          URL.revokeObjectURL(photoPreview);
        }

        setPhotoBlob(blob);
        setPhotoPreview(URL.createObjectURL(blob));

        stopCamera();
      },
      "image/jpeg",
      0.9
    );
  };

  // -------------------------
  // RETAKE PHOTO
  // -------------------------

  const retakePhoto = () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhotoBlob(null);
    setPhotoPreview(null);
    setError("");

    startCamera();
  };

  // -------------------------
  // GENERATE EMPLOYEE ID
  // -------------------------

  const generateEmployeeId = () => {
    return `EMP${Date.now().toString().slice(-8)}`;
  };

  // -------------------------
  // GENERATE EMAIL
  // -------------------------

  const generateEmail = (employeeName: string) => {
    const cleanName = employeeName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.+|\.+$/g, "");

    return `${
      cleanName || "employee"
    }.${Date.now()}@talentronaut.local`;
  };

  // -------------------------
  // REGISTER
  // -------------------------

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const cleanName = name.trim();
    const cleanDepartment = department.trim();

    if (!cleanName) {
      setError("Please enter your name.");
      return;
    }

    if (!cleanDepartment) {
      setError("Please enter your department.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!photoBlob) {
      setError("Please take your photo.");
      return;
    }

    setLoading(true);

    try {
      const employeeId = generateEmployeeId();
      const email = generateEmail(cleanName);

      const formData = new FormData();

      formData.append("employeeId", employeeId);
      formData.append("name", cleanName);
      formData.append("email", email);
      formData.append("department", cleanDepartment);
      formData.append("password", password);
      formData.append(
        "confirmPassword",
        confirmPassword
      );

      formData.append(
        "photo",
        photoBlob,
        `${employeeId}.jpg`
      );

      const response = await fetch(
        `${API_BASE}/api/employees`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.message || "Registration failed."
        );
      }

      setSuccess(
        `Registration successful. Employee ID: ${
          data?.employee?.employeeId || employeeId
        }`
      );

      setName("");
      setDepartment("");
      setPassword("");
      setConfirmPassword("");

      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }

      setPhotoBlob(null);
      setPhotoPreview(null);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Registration failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-10">
      <div className="mx-auto max-w-md">

        {/* Header */}

        <div className="mb-8 text-center">
          <p className="text-sm font-medium text-gray-500">
            TALENTRONAUT
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            Register
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Create your employee account.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          {/* Name */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Full Name
            </label>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-black"
            />
          </div>

          {/* Department */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Department
            </label>

            <input
              value={department}
              onChange={(e) =>
                setDepartment(e.target.value)
              }
              placeholder="e.g. IT"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-black"
            />
          </div>

          {/* Password */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Minimum 6 characters"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-black"
            />
          </div>

          {/* Confirm Password */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Confirm Password
            </label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              placeholder="Repeat password"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-black"
            />
          </div>

          {/* Photo */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Identity Photo
            </label>

            <div className="overflow-hidden rounded-xl bg-black">

              <div className="relative aspect-[4/3]">

                {!photoPreview ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="h-full w-full object-cover"
                    />

                    {!cameraReady && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black text-sm text-white/60">
                        {cameraLoading
                          ? "Opening camera..."
                          : "Camera unavailable"}
                      </div>
                    )}
                  </>
                ) : (
                  <img
                    src={photoPreview}
                    alt="Identity preview"
                    className="h-full w-full object-cover"
                  />
                )}

              </div>
            </div>

            <canvas
              ref={canvasRef}
              className="hidden"
            />

            {!photoPreview ? (
              <button
                type="button"
                onClick={capturePhoto}
                disabled={!cameraReady}
                className="mt-3 w-full rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                Take Photo
              </button>
            ) : (
              <button
                type="button"
                onClick={retakePhoto}
                className="mt-3 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700"
              >
                Retake Photo
              </button>
            )}
          </div>

          {/* Error */}

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Success */}

          {success && (
            <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-600">
              {success}
            </div>
          )}

          {/* Submit */}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-black px-5 py-4 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
          >
            {loading
              ? "Registering..."
              : "Register Employee"}
          </button>

        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          Your identity photo is required for attendance
          verification.
        </p>

      </div>
    </main>
  );
}