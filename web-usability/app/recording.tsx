"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type StatusType = "" | "info" | "success" | "error";

type WindowWithWebkitAudioContext = Window & {
	webkitAudioContext?: typeof AudioContext;
};

const MAX_RECORDING_TIME = 60_000;
const VISUALIZER_BAR_COUNT = 30;
const PROMPTS = [
	"Describe your favorite way to spend a weekend.",
	"Tell us about a challenge you overcame recently.",
	"What's your ideal way to learn something new?",
	"Share a memorable experience from your life.",
	"What does creativity mean to you?",
];

export default function Recording() {
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const audioVisualizerRef = useRef<HTMLDivElement | null>(null);

	const mediaStreamRef = useRef<MediaStream | null>(null);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const recordedChunksRef = useRef<Blob[]>([]);
	const recordingStartTimeRef = useRef<number>(0);
	const timerIntervalRef = useRef<number | null>(null);
	const autoStopTimeoutRef = useRef<number | null>(null);

	const audioContextRef = useRef<AudioContext | null>(null);
	const analyserRef = useRef<AnalyserNode | null>(null);
	const animationIdRef = useRef<number | null>(null);

	const [promptText, setPromptText] = useState("Loading prompt...");
	const [statusMessage, setStatusMessage] = useState("");
	const [statusType, setStatusType] = useState<StatusType>("");
	const [timerDisplay, setTimerDisplay] = useState("00:00");

	const [isVideoVisible, setIsVideoVisible] = useState(false);
	const [isRecording, setIsRecording] = useState(false);
	const [canSubmit, setCanSubmit] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);

	const showStatus = useCallback((message: string, type: StatusType) => {
		setStatusMessage(message);
		setStatusType(type);
	}, []);

	const stopTimer = useCallback(() => {
		if (timerIntervalRef.current !== null) {
			window.clearInterval(timerIntervalRef.current);
			timerIntervalRef.current = null;
		}
	}, []);

	const stopAudioVisualizer = useCallback(() => {
		if (animationIdRef.current !== null) {
			cancelAnimationFrame(animationIdRef.current);
			animationIdRef.current = null;
		}
	}, []);

	const loadPrompt = useCallback(() => {
		const randomPrompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
		setPromptText(randomPrompt);
	}, []);

	useEffect(() => {
		loadPrompt();
	}, [loadPrompt]);

	const stopMediaStream = useCallback(() => {
		if (mediaStreamRef.current) {
			mediaStreamRef.current.getTracks().forEach((track) => track.stop());
			mediaStreamRef.current = null;
		}

		if (videoRef.current) {
			videoRef.current.srcObject = null;
		}
	}, []);

	const updateAudioBars = useCallback(() => {
		const analyser = analyserRef.current;
		const visualizer = audioVisualizerRef.current;

		if (!analyser || !visualizer) {
			return;
		}

		const dataArray = new Uint8Array(analyser.frequencyBinCount);
		analyser.getByteFrequencyData(dataArray);

		const bars = visualizer.querySelectorAll<HTMLDivElement>(".audio-bar");
		const barCount = bars.length;

		for (let i = 0; i < barCount; i += 1) {
			const index = Math.floor((i / barCount) * dataArray.length);
			const value = dataArray[index] ?? 0;
			const height = Math.max(2, (value / 255) * 30);
			bars[i].style.height = `${height}px`;
		}

		animationIdRef.current = requestAnimationFrame(updateAudioBars);
	}, []);

	const setupAudioVisualizer = useCallback(() => {
		if (!mediaStreamRef.current || audioContextRef.current || !audioVisualizerRef.current) {
			return;
		}

		const AudioContextCtor =
			window.AudioContext || (window as WindowWithWebkitAudioContext).webkitAudioContext;
		if (!AudioContextCtor) {
			return;
		}

		const audioContext = new AudioContextCtor();
		const source = audioContext.createMediaStreamSource(mediaStreamRef.current);
		const analyser = audioContext.createAnalyser();
		analyser.fftSize = 256;
		source.connect(analyser);

		audioContextRef.current = audioContext;
		analyserRef.current = analyser;

		audioVisualizerRef.current.innerHTML = "";
		for (let i = 0; i < VISUALIZER_BAR_COUNT; i += 1) {
			const bar = document.createElement("div");
			bar.classList.add("audio-bar");
			audioVisualizerRef.current.appendChild(bar);
		}

		updateAudioBars();
	}, [updateAudioBars]);

	const stopAndCleanupAudio = useCallback(() => {
		stopAudioVisualizer();

		if (audioContextRef.current) {
			void audioContextRef.current.close();
			audioContextRef.current = null;
		}

		analyserRef.current = null;
	}, [stopAudioVisualizer]);

	const startTimer = useCallback(() => {
		stopTimer();
		timerIntervalRef.current = window.setInterval(() => {
			const elapsed = Date.now() - recordingStartTimeRef.current;
			const seconds = Math.floor(elapsed / 1000);
			const minutes = Math.floor(seconds / 60);
			const displaySeconds = seconds % 60;
			setTimerDisplay(
				`${String(minutes).padStart(2, "0")}:${String(displaySeconds).padStart(2, "0")}`,
			);
		}, 100);
	}, [stopTimer]);

	const initializeCamera = useCallback(async () => {
		try {
			mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
				video: {
					width: { ideal: 640 },
					height: { ideal: 480 },
				},
				audio: true,
			});

			if (videoRef.current) {
				videoRef.current.srcObject = mediaStreamRef.current;
			}

			showStatus('Camera ready. Click "Start Recording" to begin.', "info");
			return true;
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unknown error";
			showStatus(`Error accessing camera: ${message}`, "error");
			return false;
		}
	}, [showStatus]);

	const stopRecording = useCallback(() => {
		const recorder = mediaRecorderRef.current;
		if (recorder && recorder.state === "recording") {
			recorder.stop();
		}
	}, []);

	const startRecording = useCallback(async () => {
		if (!mediaStreamRef.current) {
			const initialized = await initializeCamera();
			if (!initialized) {
				return;
			}
		}

		if (!mediaStreamRef.current) {
			return;
		}

		setIsVideoVisible(true);
		recordedChunksRef.current = [];
		recordingStartTimeRef.current = Date.now();

		const options: MediaRecorderOptions = {
			videoBitsPerSecond: 2_500_000,
		};

		if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
			options.mimeType = "video/webm;codecs=vp9";
		}

		const recorder = new MediaRecorder(mediaStreamRef.current, options);
		mediaRecorderRef.current = recorder;

		recorder.ondataavailable = (event: BlobEvent) => {
			if (event.data.size > 0) {
				recordedChunksRef.current.push(event.data);
			}
		};

		recorder.onstart = () => {
			setIsRecording(true);
			setCanSubmit(false);
			setupAudioVisualizer();
			startTimer();
			showStatus("Recording in progress...", "info");
		};

		recorder.onstop = () => {
			setIsRecording(false);
			setCanSubmit(true);
			stopAudioVisualizer();
			stopTimer();
			showStatus("Recording stopped. Review and submit or reset to try again.", "success");
		};

		recorder.start();

		if (autoStopTimeoutRef.current !== null) {
			window.clearTimeout(autoStopTimeoutRef.current);
		}

		autoStopTimeoutRef.current = window.setTimeout(() => {
			if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
				stopRecording();
				showStatus(
					'Maximum recording time reached. Click "Submit" to submit your recording.',
					"info",
				);
			}
		}, MAX_RECORDING_TIME);
	}, [initializeCamera, setupAudioVisualizer, showStatus, startTimer, stopAudioVisualizer, stopRecording, stopTimer]);

	const resetRecording = useCallback(() => {
		if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
			mediaRecorderRef.current.stop();
		}

		if (autoStopTimeoutRef.current !== null) {
			window.clearTimeout(autoStopTimeoutRef.current);
			autoStopTimeoutRef.current = null;
		}

		recordedChunksRef.current = [];
		setIsRecording(false);
		setCanSubmit(false);
		setIsVideoVisible(false);
		setTimerDisplay("00:00");

		stopTimer();
		stopAndCleanupAudio();
		stopMediaStream();
		showStatus("", "");
	}, [showStatus, stopAndCleanupAudio, stopMediaStream, stopTimer]);

	const submitRecording = useCallback(() => {
		if (recordedChunksRef.current.length === 0) {
			showStatus("No recording found. Please record before submitting.", "error");
			return;
		}

		const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
		const formData = new FormData();
		formData.append("recording", blob, "recording.webm");
		formData.append("prompt", promptText);

		// Placeholder for server submission.
		console.log("Submitting recording...");
		console.log("Recording size:", blob.size, "bytes");
		console.log("FormData prepared:", formData.has("recording"), formData.has("prompt"));

		stopAndCleanupAudio();
		stopMediaStream();
		setIsSubmitted(true);
		setCanSubmit(false);
	}, [promptText, showStatus, stopAndCleanupAudio, stopMediaStream]);

	const goBack = useCallback(() => {
		window.location.href = "/input";
	}, []);

	const goToFeedback = useCallback(() => {
		setStatusMessage("Redirecting to feedback page...");
		setStatusType("info");
		window.setTimeout(() => {
			window.location.href = "/feedback";
		}, 1500);
	}, []);

	useEffect(() => {
		return () => {
			if (autoStopTimeoutRef.current !== null) {
				window.clearTimeout(autoStopTimeoutRef.current);
			}
			stopTimer();
			stopAndCleanupAudio();
			stopMediaStream();
		};
	}, [stopAndCleanupAudio, stopMediaStream, stopTimer]);

	const statusClassName = useMemo(() => {
		if (!statusMessage) {
			return "";
		}
		return statusType;
	}, [statusMessage, statusType]);

	return (
		<div className="text text-recording">
			<button className="back-button" onClick={goBack}>
				← Back
			</button>
			<h1>Recording Submission</h1>

			{!isSubmitted && (
				<>
					<div id="promptSection">
						<p id="promptLabel">Your Prompt:</p>
						<p id="promptText">{promptText}</p>
						<button id="generatePromptBtn" onClick={loadPrompt}>
							Generate New Prompt
						</button>
					</div>

					<div id="instructions">
						<h4>Instructions</h4>
						<ul>
							<li>Allow camera access when prompted</li>
							<li>Record yourself responding to the prompt above</li>
							<li>Keep your recording to approximately 1 minute</li>
							<li>Click "Stop" when finished, then "Submit"</li>
						</ul>
					</div>

					<div
						id="statusMessage"
						className={statusClassName}
						style={{ display: statusMessage ? "block" : "none" }}
					>
						{statusMessage}
					</div>

					<div id="videoContainer" style={{ display: isVideoVisible ? "block" : "none" }}>
						<video id="videoPreview" ref={videoRef} playsInline autoPlay muted />
						<div id="timerDisplay">{timerDisplay}</div>
						<div id="recordingIndicator" style={{ display: isRecording ? "flex" : "none" }}>
							<span id="recordingDot" />
							RECORDING
						</div>
						<div
							id="audioVisualizerContainer"
							style={{ display: isRecording ? "flex" : "none" }}
						>
							<div id="audioVisualizer" ref={audioVisualizerRef} />
						</div>
					</div>

					<div id="controlsSection">
						<button id="startBtn" onClick={() => void startRecording()} disabled={isRecording}>
							Start Recording
						</button>
						<button id="stopBtn" onClick={stopRecording} disabled={!isRecording}>
							Stop Recording
						</button>
						<button id="resetBtn" onClick={resetRecording}>
							Reset
						</button>
						<button id="submitBtn" onClick={submitRecording} disabled={!canSubmit}>
							Submit
						</button>
					</div>
				</>
			)}

			<div id="submittedScreen" style={{ display: isSubmitted ? "block" : "none" }}>
				<h2>Recording Submitted!</h2>
				<p className="success-message">✓ Your recording has been successfully submitted.</p>
				<p className="success-subtext">Preparing to show your feedback...</p>
				<button id="nextBtn" onClick={goToFeedback}>
					Next
				</button>
			</div>
		</div>
	);
}
