import { Body, Coordinate, Finger, Hand, Thumb, IParser, Side } from "macaw-commons";
import { NormalizedLandmark, NormalizedLandmarkList, Results } from "@mediapipe/holistic";
import * as handLandmarks from './landmarks/hand';

class MediaPipeParser implements IParser<Results> {

    parse(landmarks: Results): Body {
        const leftHand = this.parseHand(Side.Left, landmarks.leftHandLandmarks);
        const rightHand = this.parseHand(Side.Right, landmarks.rightHandLandmarks);

        return new Body(leftHand, rightHand);
    }

    private parseHand(side: Side, landmarks: NormalizedLandmarkList): Hand | undefined {
        if (landmarks) {
            const wrist = this.parseCoordinate(landmarks[handLandmarks.WRIST]);
            const thumb = new Thumb(
                this.parseCoordinate(landmarks[handLandmarks.THUMB_CMC]),
                this.parseCoordinate(landmarks[handLandmarks.THUMB_MCP]),
                this.parseCoordinate(landmarks[handLandmarks.THUMB_IP]),
                this.parseCoordinate(landmarks[handLandmarks.THUMB_TIP]),
            );
            const indexFinger = new Finger(
                this.parseCoordinate(landmarks[handLandmarks.INDEX_FINGER_MCP]),
                this.parseCoordinate(landmarks[handLandmarks.INDEX_FINGER_PIP]),
                this.parseCoordinate(landmarks[handLandmarks.INDEX_FINGER_DIP]),
                this.parseCoordinate(landmarks[handLandmarks.INDEX_FINGER_TIP]),
            );
            const middleFinger = new Finger(
                this.parseCoordinate(landmarks[handLandmarks.MIDDLE_FINGER_MCP]),
                this.parseCoordinate(landmarks[handLandmarks.MIDDLE_FINGER_PIP]),
                this.parseCoordinate(landmarks[handLandmarks.MIDDLE_FINGER_DIP]),
                this.parseCoordinate(landmarks[handLandmarks.MIDDLE_FINGER_TIP]),
            );
            const ringFinger = new Finger(
                this.parseCoordinate(landmarks[handLandmarks.RING_FINGER_MCP]),
                this.parseCoordinate(landmarks[handLandmarks.RING_FINGER_PIP]),
                this.parseCoordinate(landmarks[handLandmarks.RING_FINGER_DIP]),
                this.parseCoordinate(landmarks[handLandmarks.RING_FINGER_TIP]),
            );
            const pinkyFinger = new Finger(
                this.parseCoordinate(landmarks[handLandmarks.PINKY_FINGER_MCP]),
                this.parseCoordinate(landmarks[handLandmarks.PINKY_FINGER_PIP]),
                this.parseCoordinate(landmarks[handLandmarks.PINKY_FINGER_DIP]),
                this.parseCoordinate(landmarks[handLandmarks.PINKY_FINGER_TIP]),
            );
            return new Hand(side, wrist, thumb, indexFinger, middleFinger, ringFinger, pinkyFinger);
        }
        return undefined;
    }

    private parseCoordinate(landmark: NormalizedLandmark): Coordinate {
        return new Coordinate(landmark.x, landmark.y, landmark.z);
    }
}

export { MediaPipeParser };