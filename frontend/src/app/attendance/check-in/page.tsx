// this is main chekin page
"use client";

import { useEffect, useRef, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function CheckInPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [cameraStarted, setCameraStarted] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /*
   * --------------------------------------------------
   * STOP CAMERA
   * --------------------------------------------------
   */

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    setCameraStarted(false);
    setCameraLoading(false);
  };

  /*
   * --------------------------------------------------
   * CLEANUP
   * --------------------------------------------------
   */

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      }

      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  /*
   * --------------------------------------------------
   * START CAMERA
   * --------------------------------------------------
   */

  const startCamera = async () => {
    setError("");
    setMessage("");
    setCameraLoading(true);

    try {
      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        throw new Error(
          "Camera access is not supported by this browser."
        );
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: {
              ideal: "user",
            },
            width: {
              ideal: 1280,
            },
            height: {
              ideal: 720,
            },
          },
          audio: false,
        });

      streamRef.current = stream;

      const video = videoRef.current;

      if (!video) {
        throw new Error("Camera is not ready.");
      }

      video.srcObject = stream;
      video.muted = true;
      video.autoplay = true;
      video.playsInline = true;

      await video.play();

      setCameraStarted(true);
      setCameraLoading(false);
    } catch (err) {
      console.error("Camera error:", err);

      setCameraStarted(false);
      setCameraLoading(false);

      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError") {
          setError(
            "Camera permission was denied. Please allow camera access."
          );
        } else if (err.name === "NotFoundError") {
          setError("No camera was found on this device.");
        } else if (err.name === "NotReadableError") {
          setError(
            "The camera is already being used by another application."
          );
        } else {
          setError("Unable to access the camera.");
        }
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to access the camera."
        );
      }
    }
  };

  /*
   * --------------------------------------------------
   * CAPTURE PHOTO
   * --------------------------------------------------
   */

  const capturePhoto = () => {
    setError("");

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      setError("Camera is not ready.");
      return;
    }

    if (
      !streamRef.current ||
      streamRef.current.getVideoTracks().length === 0
    ) {
      setError("Camera stream is not active.");
      return;
    }

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setError(
        "Camera frame is not available yet. Please try again."
      );
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      setError("Unable to capture photo.");
      return;
    }

    /*
     * Mirror front camera
     */

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

        const previewUrl = URL.createObjectURL(blob);

        setPhotoBlob(blob);
        setPhotoPreview(previewUrl);

        stopCamera();
      },
      "image/jpeg",
      0.9
    );
  };

  /*
   * --------------------------------------------------
   * RETAKE PHOTO
   * --------------------------------------------------
   */

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

  /*
   * --------------------------------------------------
   * SUBMIT ATTENDANCE
   * --------------------------------------------------
   */

  const handleSubmit = async () => {
    setError("");
    setMessage("");

    if (!photoBlob) {
      setError(
        "Please capture your attendance photo first."
      );
      return;
    }

    setLoading(true);

    try {
      /*
       * IMPORTANT:
       *
       * Backend route:
       *
       * POST /api/attendance/checkin
       *
       */

      const endpoint =
        `${API_BASE_URL}/api/attendance/checkin`;

      console.log("Attendance API:", endpoint);

      const formData = new FormData();

      formData.append(
        "photo",
        photoBlob,
        "attendance-photo.jpg"
      );

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      /*
       * Handle non-JSON responses safely
       */

      const contentType =
        response.headers.get("content-type");

      let data: any = null;

      if (
        contentType &&
        contentType.includes("application/json")
      ) {
        data = await response.json();
      } else {
        const text = await response.text();

        data = {
          message: text,
        };
      }

      console.log("Attendance response:", {
        status: response.status,
        data,
      });

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Attendance request failed (${response.status})`
        );
      }

      setMessage(
        data?.message ||
          "Attendance marked successfully."
      );

      setPhotoBlob(null);

    } catch (err) {
      console.error(
        "ATTENDANCE SUBMISSION ERROR:",
        err
      );

      /*
       * Browser "Failed to fetch" normally means
       * the request never reached the backend.
       */

      if (
        err instanceof TypeError &&
        err.message === "Failed to fetch"
      ) {
        setError(
          "Unable to connect to the attendance server. Please check that the backend is running and the API URL is correct."
        );
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while marking attendance."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /*
   * --------------------------------------------------
   * UI
   * --------------------------------------------------
   */

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-5 py-10">
      <div className="w-full max-w-md">

        {/* Header */}

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Mark Attendance
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Capture your photo to mark attendance
          </p>
        </div>

        {/* Camera */}

        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">

          <video
            ref={videoRef}
            muted
            autoPlay
            playsInline
            className={`h-full w-full object-cover ${
              cameraStarted
                ? "opacity-100"
                : "opacity-0"
            }`}
          />

          {/* Captured photo */}

          {photoPreview && (
            <img
              src={photoPreview}
              alt="Attendance"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}

          {/* Camera standby */}

          {!cameraStarted && !photoPreview && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">

              <div className="mb-3 text-4xl">
                📷
              </div>

              <p className="text-sm text-gray-300">
                {cameraLoading
                  ? "Starting camera..."
                  : "Camera is ready"}
              </p>

            </div>
          )}

        </div>

        {/* Hidden canvas */}

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
          <div className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-600">
            {message}
          </div>
        )}

        {/* Buttons */}

        <div className="mt-5 space-y-3">

          {/* Open camera */}

          {!cameraStarted && !photoPreview && (
            <button
              type="button"
              onClick={startCamera}
              disabled={cameraLoading}
              className="w-full rounded-xl bg-black px-5 py-4 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cameraLoading
                ? "Starting Camera..."
                : "Open Camera"}
            </button>
          )}

          {/* Capture */}

          {cameraStarted && !photoPreview && (
            <>
              <button
                type="button"
                onClick={capturePhoto}
                className="w-full rounded-xl bg-black px-5 py-4 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Capture Photo
              </button>

              <button
                type="button"
                onClick={stopCamera}
                className="w-full rounded-xl border border-gray-300 bg-white px-5 py-4 text-sm font-medium text-gray-700"
              >
                Cancel
              </button>
            </>
          )}

          {/* Confirm */}

          {photoPreview && !message && (
            <>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full rounded-xl bg-black px-5 py-4 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Submitting..."
                  : "Confirm Attendance"}
              </button>

              <button
                type="button"
                onClick={retakePhoto}
                disabled={loading}
                className="w-full rounded-xl border border-gray-300 bg-white px-5 py-4 text-sm font-medium text-gray-700"
              >
                Retake Photo
              </button>
            </>
          )}

          {/* After success */}

          {message && (
            <button
              type="button"
              onClick={() => {
                setMessage("");
                setPhotoBlob(null);
                setPhotoPreview(null);
              }}
              className="w-full rounded-xl bg-black px-5 py-4 text-sm font-semibold text-white"
            >
              Done
            </button>
          )}

        </div>

      </div>
    </main>
  );
}

