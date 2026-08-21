function useRecorder({ token, onTranscribed }) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [recError, setRecError] = useState("");
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);

  const mediaRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const startedAtRef = useRef(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    mediaRef.current = null;
  }, []);

  const start = useCallback(async () => {
    setRecError("");
    setDuration(0);

    if (!navigator.mediaDevices?.getUserMedia) {
      setRecError("Brauzeringiz mikrofon yozishni qo‘llab-quvvatlamaydi.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      const mimeCandidates = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
      ];

      const mimeType =
        mimeCandidates.find((type) =>
          MediaRecorder.isTypeSupported(type)
        ) || "";

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        cleanup();

        const actualType =
          recorder.mimeType || mimeType || "audio/webm";

        const blob = new Blob(chunksRef.current, {
          type: actualType,
        });

        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }

        const localUrl = URL.createObjectURL(blob);
        setAudioUrl(localUrl);

        setBusy(true);

        try {
          const base64 = await blobToBase64(blob);

          const data = await api("/speaking/transcribe", {
            token,
            method: "POST",
            body: {
              audioBase64: base64,
              mimeType: actualType,
              durationSeconds: duration,
            },
            timeoutMs: AI_TIMEOUT_MS,
          });

          onTranscribed?.(
            data.transcript || "",
            data.pronunciationNote || null
          );
        } catch (error) {
          setRecError(
            error.message || "Audio tahlilida xatolik yuz berdi."
          );
        } finally {
          setBusy(false);
        }
      };

      mediaRef.current = recorder;

      recorder.start(250);
      startedAtRef.current = Date.now();

      timerRef.current = setInterval(() => {
        const elapsed = Math.floor(
          (Date.now() - startedAtRef.current) / 1000
        );

        setDuration(elapsed);
      }, 250);

      setRecording(true);
    } catch (error) {
      cleanup();

      if (error?.name === "NotAllowedError") {
        setRecError(
          "Mikrofondan foydalanishga ruxsat berilmadi."
        );
      } else if (error?.name === "NotFoundError") {
        setRecError("Mikrofon topilmadi.");
      } else {
        setRecError(
          "Mikrofonni ishga tushirishda xatolik yuz berdi."
        );
      }
    }
  }, [token, onTranscribed, cleanup, audioUrl, duration]);

  const stop = useCallback(() => {
    const recorder = mediaRef.current;

    if (!recorder || recorder.state === "inactive") {
      return;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    recorder.stop();
    setRecording(false);
  }, []);

  useEffect(() => {
    return () => {
      cleanup();

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [cleanup, audioUrl]);

  return {
    recording,
    busy,
    recError,
    duration,
    audioUrl,
    start,
    stop,
  };
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      const result = reader.result;

      if (typeof result !== "string") {
        reject(new Error("Audio faylini o‘qib bo‘lmadi."));
        return;
      }

      resolve(result.split(",")[1]);
    };

    reader.onerror = () => {
      reject(new Error("Audio faylini o‘qishda xatolik."));
    };

    reader.readAsDataURL(blob);
  });
}
