// chekout page ui 
"use client";

import { useEffect, useRef, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://attendance-backend-2nky.onrender.com";

export default function AttendancePage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [cameraStarted, setCameraStarted] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Stop camera when leaving page
  useEffect(() => {
    return () => {
      stopCamera();

      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, []);

  // -------------------------
  // STOP CAMERA
  // -------------------------
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    setCameraStarted(false);
  };

  // -------------------------
  // START CAMERA
  // -------------------------
  const startCamera = async () => {
    setError("");
    setMessage("");
    setCameraLoading(true);

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

      setCameraStarted(true);
    } catch (err) {
      console.error(err);

      if (
        err instanceof DOMException &&
        err.name === "NotAllowedError"
      ) {
        setError("Please allow camera access to continue.");
      } else if (
        err instanceof DOMException &&
        err.name === "NotFoundError"
      ) {
        setError("No camera was found on this device.");
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to start camera."
        );
      }
    } finally {
      setCameraLoading(false);
    }
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

    // Mirror front camera image
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
  // RETAKE
  // -------------------------
  const retakePhoto = () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhotoBlob(null);
    setPhotoPreview(null);
    setError("");
    setMessage("");

    startCamera();
  };

  // -------------------------
  // SUBMIT CHECK-OUT
  // -------------------------
  const handleSubmit = async () => {
    setError("");
    setMessage("");

    if (!photoBlob) {
      setError("Please take a photo first.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      formData.append(
        "photo",
        photoBlob,
        "check-out-photo.jpg"
      );

      const response = await fetch(
        `${API_BASE}/api/attendance/checkout`,
        {
          method: "PUT",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Unable to complete check-out."
        );
      }

      setMessage(
        data?.message || "Check-Out completed successfully."
      );

      setPhotoBlob(null);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-10">
      <div className="mx-auto flex min-h-[90vh] max-w-md flex-col justify-center">
        
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-sm font-medium text-gray-500">
            Attendance
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            Check Out
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Take a photo to complete your attendance.
          </p>
        </div>

        {/* Camera */}
        <div className="overflow-hidden rounded-2xl bg-black shadow-sm">
          <div className="relative aspect-[4/3]">
            
            <video
              ref={videoRef}
              muted
              autoPlay
              playsInline
              className={`h-full w-full object-cover ${
                cameraStarted ? "block" : "hidden"
              }`}
            />

            {photoPreview && (
              <img
                src={photoPreview}
                alt="Check-out preview"
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}

            {!cameraStarted && !photoPreview && (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                Camera preview
              </div>
            )}

          </div>
        </div>

        <canvas
          ref={canvasRef}
          className="hidden"
        />

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Success */}
        {message && (
          <div className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-600">
            {message}
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 space-y-3">

          {!cameraStarted && !photoPreview && (
            <button
              type="button"
              onClick={startCamera}
              disabled={cameraLoading}
              className="w-full rounded-xl bg-black px-5 py-4 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
            >
              {cameraLoading
                ? "Opening Camera..."
                : "Open Camera"}
            </button>
          )}

          {cameraStarted && (
            <button
              type="button"
              onClick={capturePhoto}
              className="w-full rounded-xl bg-black px-5 py-4 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Take Photo
            </button>
          )}

          {photoPreview && (
            <>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full rounded-xl bg-black px-5 py-4 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
              >
                {loading
                  ? "Checking Out..."
                  : "Confirm Check Out"}
              </button>

              <button
                type="button"
                onClick={retakePhoto}
                disabled={loading}
                className="w-full rounded-xl border border-gray-300 bg-white px-5 py-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Retake Photo
              </button>
            </>
          )}

        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Your attendance photo will be submitted securely.
        </p>
      </div>
    </main>
  );
}