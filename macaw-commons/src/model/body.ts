import { Coordinate } from "./geometry";

export enum Side {
    Left = "left",
    Right = "right"
}

export class Body {

    readonly timestamp = new Date();

    constructor(
        readonly leftHand: Hand | undefined,
        readonly rightHand: Hand | undefined
    ) {
    }

}


export class Hand {

    constructor(
        readonly side: Side,
        readonly wrist: Coordinate,
        readonly thumb: Thumb,
        readonly indexFinger: Finger,
        readonly middleFinger: Finger,
        readonly ringFinger: Finger,
        readonly pinkyFinger: Finger
    ) {
    }
}

export class Thumb {

    /**
     * 
     * @param cmc_joint Carpometacarpal joint
     * @param mcp_joint Metacarpophalangeal joint
     * @param ip_joint Interphalangeal joint
     * @param tip finger tip
     */
    constructor(
        readonly cmc_joint: Coordinate,
        readonly mcp_joint: Coordinate,
        readonly ip_joint: Coordinate,
        readonly tip: Coordinate
    ) {
    }
}

export class Finger {

    /**
     * 
     * @param mcp_joint Metacarpophalangeal joint
     * @param pip_joint Proximal Interphalangeal joint
     * @param dip_joint Distal Iterphalangeal joint
     * @param tip finger tip
     */
    constructor(
        readonly mcp_joint: Coordinate,
        readonly pip_joint: Coordinate,
        readonly dip_joint: Coordinate,
        readonly tip: Coordinate
    ) {
    }
}