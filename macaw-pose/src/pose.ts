import { Holistic, InputImage, Results } from "@mediapipe/holistic";
import { Body, IParser } from "macaw-commons";
import { MediaPipeParser } from "./parser/mediapipe/parser";

class PoseEstimator {

    private estimator: Holistic;
    private onPoseEstimatedListener: PoseEstimatedListener | undefined;
    private landmarksParser: MediaPipeParser;

    constructor() {
        this.landmarksParser = new MediaPipeParser();
        this.estimator = new Holistic({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
            }
        });
        this.estimator.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true, 
            enableSegmentation: false,
            smoothSegmentation: false,
            refineFaceLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
        this.estimator.onResults((results: Results) => {
            if (this.onPoseEstimatedListener) {
                const parsedLandmarks = this.landmarksParser.parse(results);
                this.onPoseEstimatedListener(parsedLandmarks, results);
            }
        })
    }

    public initialize() {
    }

    public onPoseEstimated(listener: PoseEstimatedListener) {
        this.onPoseEstimatedListener = listener;
    }

    public async estimateForFrame(frame: Object) {
        if (this.estimator) {
            await this.estimator.send({ image: frame as InputImage });
        }
    }
}

type PoseEstimatedListener = (body: Body, rawResult: Object) => (Promise<void> | void);

export { PoseEstimator, PoseEstimatedListener };