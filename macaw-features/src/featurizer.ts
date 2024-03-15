// import Coordinate from '';

import { Body, Dictionary, Hand, Side, Vector } from "macaw-commons";
import { BodyFeatures, Feature, HandFeatures } from "./model/features";


class Featurizer {

    // Directions, according to user's perspective.
    // Index are: [negative, positive].
    DIRECTIONS_LABELS: Dictionary<string[]> = {
        x: ["left", "right"],
        y: ["up", "down"],
        z: ["front", "body"]
    }

    MOVE_THRESHOLD = 0.30
    ORIENTATION_THRESHOLD = 0.30
    CONFIDENCE_THRESHOLD = 0.15


    public extractFeatures(body: Body, lastBody?: Body): BodyFeatures {
        const leftHand = body.leftHand ? this.extractHandFeatures(body.leftHand, lastBody?.leftHand) : undefined;
        const rightHand = body.rightHand ? this.extractHandFeatures(body.rightHand, lastBody?.rightHand) : undefined;

        return new BodyFeatures(
            leftHand,
            rightHand
        );
    }

    private extractHandFeatures(hand: Hand, lastHand?: Hand) {
        const orientation = this.getPalmOrientation(hand);
        const movement = this.getHandMovement(hand, lastHand);

        return new HandFeatures(
            orientation,
            movement
        );
    }

    /**
     * Calculate palm orientation and return one (or the combination of more 
     * than one) of the options  `[right, left, up, down, front, body]`.
     * 
     * @param hand 
     * @returns 
     */
    private getPalmOrientation(hand: Hand) {
        // Calculation is made by find the normal vector of the plane
        // defined by # three main hand keypoints(fist, base of the pinky
        // finger, and base of the index finger).
        // Normal vector is defined as the cross product between two
        // vectors in the plane.
        // https://mathinsight.org/forming_planes
        // https://mathinsight.org/forming_plane_examples
        const wrist = hand.wrist;
        const index_base = hand.indexFinger.mcp_joint;
        const pinky_base = hand.pinkyFinger.mcp_joint;
        let b, c;

        if (hand.side == Side.Left) {
            b = Vector.fromCoordinates(wrist, pinky_base);
            c = Vector.fromCoordinates(wrist, index_base);
        }
        else if (hand.side == Side.Right) {
            b = Vector.fromCoordinates(wrist, index_base);
            c = Vector.fromCoordinates(wrist, pinky_base);
        } else {
            throw Error("Invalid hand size");
        }

        // TODO: calculate 'body' relative to the body itselt (considering 
        // that body is not always aligned with camera)
        const normal = b.crossProduct(c).toNormalized();
        const direction = this.getDirectionLabel(normal, this.ORIENTATION_THRESHOLD);
        /* score = normal.score; */
        return this.createFeatureIfAboveThreshold(direction, /*score*/);
    }

    /**
     * Calculate movement in space and return one (or the combination of more 
     * than one) of the options `[right, left, up, down, front, body]`.
     * 
     * @param hand 
     * @param lastHand 
     * @returns 
     */
    private getHandMovement(hand: Hand, lastHand?: Hand) {
        if (hand && lastHand) {
            const displacement = Vector.fromCoordinates(lastHand.middleFinger.mcp_joint, hand.middleFinger.mcp_joint).toNormalized();
            const direction = this.getDirectionLabel(displacement, this.MOVE_THRESHOLD);
            /* score = displacement.score */
            return this.createFeatureIfAboveThreshold(direction, /* score */);
        }
    }

    private getDirectionLabel(vector: Vector, threshold: number): string {
        // Warning: labels are considering the users' perspective of axis. 
        // e.g.: 'left' means the left side for the user
        const getDirectionName = (value: number, labels: string[], threshold: number) => {
            const [NEGATIVE, POSITIVE] = [0, 1]
            let direction = "";

            if (value > threshold) {
                direction = labels[POSITIVE]
            } else if (value < (threshold * -1)) {
                direction = labels[NEGATIVE]
            }
            return direction;
        };

        const directions = [
            getDirectionName(vector.x, this.DIRECTIONS_LABELS.x, threshold),
            getDirectionName(vector.y, this.DIRECTIONS_LABELS.y, threshold),
            getDirectionName(vector.z, this.DIRECTIONS_LABELS.z, threshold),
        ];
        return directions.join("_");
    }

    private createFeatureIfAboveThreshold(value: string, score?: number): Feature | undefined {
        if (!score || score > this.CONFIDENCE_THRESHOLD) {
            return new Feature(value, score);
        }
        return undefined;
    }

    // def extract_attributes(self, data, skeleton, last_skeleton, cur_index,
    //                     total_frames):
    //     attributes = dict()
    //     attributes.update(
    //         self.get_hand_attributes("hand_right", data, skeleton,
    //                                 last_skeleton, cur_index, total_frames))
    //     attributes.update(
    //         self.get_hand_attributes("hand_left", data, skeleton,
    //                                 last_skeleton, cur_index, total_frames))
    //     attributes.update({
    //         "non_manual": {
    //             "mouth_opening": self.get_mouth_opening(skeleton)
    //         }
    //     })
    //     return attributes

    // def get_hand_attributes(self, hand, data, skeleton, last_skeleton,
    //                         cur_index, total_frames):
    //     from constant import HAND_DOMINANCE
    //     dom = HAND_DOMINANCE[hand]
    //     movement = None
    //     orientation = None
    //     handshape = None

    //     if self.__has_handshape_action(hand, data):
    //         movement = self.get_hand_movement(hand, skeleton, last_skeleton)
    //         orientation = self.get_palm_orientation(hand, skeleton)
    //         handshape = self.get_hand_shape(hand, data, cur_index,
    //                                         total_frames)
    //     return {
    //         f"movement_{dom}": movement,
    //         f"orientation_{dom}": orientation,
    //         f"handshape_{dom}": handshape
    //     }

    // def get_hand_shape(self, hand, data, frame_idx, num_frames):
    //     """
    //     Obtain the handshape of the hand, based on the provided `data`.
    //     """
    //     from constant import HAND_HANDSHAPE

    //     def get_shape(data, frame_idx, names):
    //         return data[names["start"]] \
    //             if (frame_idx <= (num_frames / 2)) \
    //             else data[names["end"]]

    //     if hand not in HAND_HANDSHAPE:
    //         raise Exception("Unknown hand")
    //     shape = get_shape(data, frame_idx, HAND_HANDSHAPE[hand])
    //     return self.create_result(shape)

    // def get_hand_movement(self, hand, keypoints, last_keypoints):
    //     """
    //     Calculate movement in space and return one (or the combination of more
    //     than one) of the options `[right, left, up, down, front, body]`.
    //     """
    //     from constant import MOVE_THRESHOLD, DIRECTIONS
    //     hand_keypoints = keypoints[hand]
    //     hand_last_keypoints = last_keypoints[hand] if last_keypoints else None

    //     if hand_keypoints and hand_last_keypoints:
    //         # displacement = hand_keypoints["wrist"] - \
    //         #     hand_last_keypoints["wrist"]
    //         displacement = (hand_keypoints["middle_finger_base"] -
    //                         hand_last_keypoints["middle_finger_base"])\
    //             .to_normalized()
    //         direction = self._get_directions(displacement, DIRECTIONS,
    //                                         MOVE_THRESHOLD)
    //         score = displacement.score
    //         return self.create_result("_".join(direction), score)

    // def get_palm_orientation(self, hand, keypoints):
    //     """
    //     Calculate palm orientation and return one (or the combination of more
    //     than one) of the options  `[right, left, up, down, front, body]`.
    //     """
    //     from constant.constants import DIRECTIONS, ORIENTATION_THRESHOLD
    //     hand_keypoints = keypoints[hand]

    //     if hand_keypoints:
    //         # Calculation is made by find the normal vector of the plane
    //         # defined by # three main hand keypoints (fist, base of the pinky
    //         # finger, and base of the index finger).
    //         # Normal vector is defined as the cross product between two
    //         # vectors in the plane.
    //         # https://mathinsight.org/forming_planes
    //         # https://mathinsight.org/forming_plane_examples
    //         wrist = hand_keypoints["wrist"]
    //         index_base = hand_keypoints["index_finger_base"]
    //         pinky_base = hand_keypoints["pinky_base"]

    //         if hand == "hand_right":
    //             b = wrist - pinky_base
    //             c = wrist - index_base
    //         elif hand == "hand_left":
    //             b = wrist - index_base
    //             c = wrist - pinky_base
    //         else:
    //             raise Exception("Unknown hand")

    //         normal = b.cross_product(c).to_normalized()
    //         direction = self._get_directions(normal, DIRECTIONS,
    //                                         ORIENTATION_THRESHOLD)
    //         score = normal.score
    //         return self.create_result("_".join(direction), score)

    // def _get_directions(self, vector, names, threshold=0.0):
    //     def calculate_move(value, labels):
    //         INDEXES = NEGATIVE, POSITIVE = 0, 1
    //         assert len(labels) == len(INDEXES), "Invalid labels size."

    //         direction = list()
    //         if value > threshold:
    //             direction.append(labels[POSITIVE])
    //         elif value < (threshold * -1):
    //             direction.append(labels[NEGATIVE])
    //         else:
    //             pass
    //         return direction

    //     # Warning: labels must consider "mirrored" interpretation due
    //     # to the target user's (inside video) perspective axes.
    //     directions = list()
    //     directions.extend(calculate_move(vector.x, names["x"]))
    //     directions.extend(calculate_move(vector.y, names["y"]))
    //     directions.extend(calculate_move(vector.z, names["z"]))
    //     return directions

    // def get_mouth_opening(self, keypoints):
    //     """
    //     Calculate the degree of `openness` for the mouth.
    //     """
    //     from statistics import mean
    //     """
    //     Check calculation in the paper:
    //     'Normal growth and development of the lips : a 3-dimensional
    //     study from 6 years to adulthood using a geometric model'
    //     (VIRGILIO F. FERRARIO, CHIARELLA SFORZA, JOHANNES H. SCHMITZ, VERONICA
    //     CIUSA AND ANNA COLOMBO), Pg. 3
    //     """
    //     face_keypoints = keypoints["face"]

    //     if face_keypoints:
    //         ch_l = face_keypoints["lips_outer_left"]  # cheilion left
    //         ch_r = face_keypoints["lips_outer_right"]  # cheilion left
    //         ls = face_keypoints["lips_outer_top"]  # labiale superius
    //         li = face_keypoints["lips_outer_bottom"]  # labiale inferius

    //         mouth_width = ch_l.dist_to(ch_r)  # mouth width = ch_r - ch_l
    //         vermilion_height = li.dist_to(ls)  # vermilion height = ls - li

    //         vermilion_height_to_mouth_width = vermilion_height / mouth_width
    //         score = mean([ch_l.score, ch_r.score, ls.score, li.score])

    //         # TODO: test the calculation above
    //         return self.create_result(vermilion_height_to_mouth_width, score)

    // def __has_handshape_action(self, hand, data):
    //     from constant import HAND_HANDSHAPE
    //     handshape = HAND_HANDSHAPE[hand]
    //     return data[handshape["start"]] or data[handshape["end"]]
}

export { Featurizer };