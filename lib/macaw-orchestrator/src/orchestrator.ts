import { PoseEstimator } from "macaw-pose";
import { Featurizer } from 'macaw-features';
import { Body, BodyFeatures } from 'macaw-commons';
import { Inferencer } from 'macaw-inference';

class Orchestrator {

    private poseEstimator: PoseEstimator;
    private featurizer: Featurizer;
    private inferencer: Inferencer;
    private onResultListener: ResultListener | undefined;

    private lastPose?: Body = undefined;

    constructor() {
        this.featurizer = new Featurizer();
        this.poseEstimator = new PoseEstimator();
        this.poseEstimator.onPoseEstimated((result: Body, rawResult: Object) => this.runPipeline(result, rawResult));
        this.inferencer = new Inferencer();
    }

    public async initialize() {
        await this.poseEstimator.initialize();
        await this.inferencer.initialize();
    }

    public onResult(listener: ResultListener) {
        this.onResultListener = listener;
    }

    public async processFrame(frame: Object) {
        if (this.poseEstimator) {
            await this.poseEstimator.estimateForFrame(frame);
        }
    }

    private async runPipeline(pose: Body, rawResult: Object) {
        // TODO: remove `rawResult` parameter
        // TODO: verify parameters
        const bodyFeatures = this.featurizer.extractFeatures(pose, this.lastPose);
        const infereceResult = await this.inferencer.infer(bodyFeatures);

        this.logDebug(bodyFeatures, infereceResult);

        if (this.onResultListener) {
            // TODO: review this argument passed
            this.onResultListener(bodyFeatures, rawResult);
        }

        this.lastPose = pose;
    }

    private logDebug(body: BodyFeatures, inferenceResult: string) {
        console.log(`Hand orientation: \t L => '${body.leftHand?.orientation?.value}' \t R => '${body.rightHand?.orientation?.value}'`);
        console.log(`Hand movement: \t\t L => '${body.leftHand?.movement?.value}' \t R => '${body.rightHand?.movement?.value}'`);
     
        console.log(`Inferenced: \t\t '${inferenceResult.substring(0, 100)}' ... `);
    }
}

type ResultListener = (body: BodyFeatures, rawResult: Object | undefined) => (Promise<void> | void);

export { Orchestrator };