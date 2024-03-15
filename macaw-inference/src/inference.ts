import { InferenceSession, Tensor } from 'onnxruntime-web';
import { BodyFeatures } from 'macaw-commons';

class Inferencer {

    private session?: InferenceSession;

    constructor() {

    }

    private getSession(): InferenceSession {
        if (!this.session) {
            throw new Error("Session is not initialized");
        }
        return this.session;
    }

    async initialize() {
        console.log("Initializing ONNX session...")

        try {
            // TODO: externalize model path configuration
            this.session = await InferenceSession.create('./model/squeezenet1_1.onnx', {
                // https://onnxruntime.ai/docs/api/js/interfaces/InferenceSession.ExecutionProviderOptionMap.html
                executionProviders: [ 'webgpu', 'webgl', 'wasm' ],
                graphOptimizationLevel: 'all'
            });
            console.log("ONNX session initialized")
        }
        catch (e) {
            console.error(`Failed to initialize ONNX session: ${e}`)
        }
    }

    async infer(features: BodyFeatures) {
        const session = this.getSession();
        const feeds: Record<string, Tensor> = {};

        const dims: number[] = [1, 3, 224, 224]
        const float32Data: number[] = this.generateMockVector(dims);
        const preprocessedData = new Tensor("float32", float32Data, dims);

        feeds[session.inputNames[0]] = preprocessedData;

        const outputData = await session.run(feeds);

        const output = outputData[session.outputNames[0]];
        
        const data = await output.getData();

        // TODO: review this
        return data.toString();
    }

    generateMockVector(dims: number[]){
        const length = dims.reduce((acc, current) => { return acc * current; });
        return new Array(length).fill(1);
    }
}

export { Inferencer };