// Video display variables
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const landmarkContainer = document.getElementsByClassName('landmark-grid-container')[0];
const grid = new LandmarkGrid(landmarkContainer);

// Data variables
const landmarksToFilter = [3, 6, 7, 8] // Landmarks we want to extract each second
const indexToLocation = {
	leftEyeOuter : 0,
	rightEyeOuter : 1,
	leftEar : 2,
	rightEar : 3
} // index position of the landmarks we want to extract in the above array
let elapsedTime = 0
let startedRecording = false
let baselineSaved = false
let baselineLandmarks = []
const savedData = []

// Handle landmark tracking and updating
function onResults(results) {
	if (!results.poseLandmarks) {
		grid.updateLandmarks([]);
		return;
	}

	document.getElementById("loader").className = "loader_remove";

	if (document.getElementById("slider").className == "slide_before"){
		document.getElementById("slider").className = "slide";
	}

	canvasCtx.save();
	canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
	canvasCtx.drawImage(results.segmentationMask, 0, 0,
		canvasElement.width, canvasElement.height);

	// Only overwrite existing pixels.
	canvasCtx.globalCompositeOperation = 'source-in';
	canvasCtx.fillStyle = 'rgba(255,255,255,0)';
	canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);

	// Only overwrite missing pixels.
	canvasCtx.globalCompositeOperation = 'destination-atop';
	canvasCtx.drawImage(
		results.image, 0, 0, canvasElement.width, canvasElement.height);

	canvasCtx.globalCompositeOperation = 'source-over';
	drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
		{ color: 'rgba(237,230,242,0.7)', lineWidth: 3 });
	drawLandmarks(canvasCtx, results.poseLandmarks,
		{ color: 'rgba(237,230,242,0.4)', lineWidth: 1 });
	canvasCtx.restore();
	grid.updateLandmarks(results.poseWorldLandmarks);

	// Save data once the user starts the recording
	if(startedRecording) {
		if (!baselineSaved) {
			baselineLandmarks = landmarksToFilter.map(element => grid.landmarks[element]);
			baselineSaved = true;
		}
		
		// Each second, fetch relevant data for futur processing and visualisation
		const currentRotation = Math.floor(grid.rotation);
		if(currentRotation > elapsedTime) {
			elapsedTime = currentRotation;
			
			// Filter landmarks
			const filteredLandmarks = landmarksToFilter.map(element => grid.landmarks[element]);
			
			// Save data
			currentData = {
				eyeData : eyeDelta(filteredLandmarks)
			}
			savedData.push(currentData);
		}
	}
}

// Determine if arms are crossed
function armCrossed(filteredLandmarks) {
	const leftElbowWristDist = 0;
	const rightElbowWristDist = 0;
	
}

// Determine the eye position 
function eyeDelta(filteredLandmarks) {
	const leftEyeEarDelta = filteredLandmarks[indexToLocation.leftEar].x - filteredLandmarks[indexToLocation.leftEyeOuter].x;
	const leftEyeEarBaselineDelta = baselineLandmarks[indexToLocation.leftEar].x - baselineLandmarks[indexToLocation.leftEyeOuter].x;
	const rightEyeEarDelta = filteredLandmarks[indexToLocation.rightEyeOuter].x - filteredLandmarks[indexToLocation.rightEar].x;
	const rightEyeEarBaselineDelta = baselineLandmarks[indexToLocation.rightEyeOuter].x - baselineLandmarks[indexToLocation.rightEar].x;

	const leftEyeRatio = Math.round(leftEyeEarDelta/leftEyeEarBaselineDelta * 100) 
	const rightEyeRatio = Math.round(rightEyeEarDelta/rightEyeEarBaselineDelta * 100)

	let headPosition = "center"
	if (rightEyeRatio < 60) {
		headPosition = "right";
	} else if (leftEyeRatio < 60) {
		headPosition = "left";
	}

	return {headPosition : headPosition, leftEyeEarDelta : leftEyeEarDelta, rightEyeEarDelta : rightEyeEarDelta}
}

// Function to handle logic onclick of start/stop button
function clickRecording(){
	const slider = document.getElementById("slider");
	if (startedRecording) {
		//Green
		slider.className = "slide";
		slider.innerHTML = "Start";
		console.log(savedData)
	} else {
		//Red
		slider.className = "slide2";
		slider.innerHTML = "Stop";
	}
	startedRecording = !startedRecording;
}

const pose = new Pose({
	locateFile: (file) => {
		return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
	}
});
pose.setOptions({
	modelComplexity: 1,
	smoothLandmarks: true,
	enableSegmentation: true,
	smoothSegmentation: true,
	minDetectionConfidence: 0.75,
	minTrackingConfidence: 0.75
});
pose.onResults(onResults);

const camera = new Camera(videoElement, {
	onFrame: async () => {
		await pose.send({ image: videoElement });
	},
	width: 720,
	height: 405 
});
camera.start();