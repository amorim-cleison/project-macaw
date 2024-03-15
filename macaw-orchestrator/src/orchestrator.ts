import { PoseEstimator } from "macaw-pose";
import { Featurizer, BodyFeatures } from 'macaw-features';
import { Body } from 'macaw-commons';

class Orchestrator {

    private poseEstimator: PoseEstimator;
    private featurizer: Featurizer;
    private onResultListener: ResultListener | undefined;

    private lastPose?: Body = undefined;

    constructor() {
        this.featurizer = new Featurizer();
        this.poseEstimator = new PoseEstimator();
        this.poseEstimator.onPoseEstimated((result: Body, rawResult: Object) => this.runPipeline(result, rawResult));
    }

    public initialize() {
        this.poseEstimator.initialize();
    }

    public onResult(listener: ResultListener) {
        this.onResultListener = listener;
    }

    public async processFrame(frame: Object) {
        if (this.poseEstimator) {
            await this.poseEstimator.estimateForFrame(frame);
        }
    }

    private runPipeline(pose: Body, rawResult: Object) {
        // TODO: remove `rawResult` parameter
        // TODO: verify parameters
        const bodyFeatures = this.featurizer.extractFeatures(pose, this.lastPose);

        this.logDebug(bodyFeatures);

        if (this.onResultListener) {
            // TODO: review this argument passed
            this.onResultListener(bodyFeatures, rawResult);
        }

        this.lastPose = pose;
    }

    private logDebug(body: BodyFeatures) {
        // console.debug(`Hand orientation: \t L => '${body.leftHand?.orientation?.value}' \t R => '${body.rightHand?.orientation?.value}'`);
        console.debug(`Hand movement: \t\t L => '${body.leftHand?.movement?.value}' \t R => '${body.rightHand?.movement?.value}'`);
    }
}

type ResultListener = (body: BodyFeatures, rawResult: Object | undefined) => (Promise<void> | void);

export { Orchestrator };