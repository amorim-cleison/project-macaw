

class BodyFeatures {

    constructor(
        readonly leftHand?: HandFeatures,
        readonly rightHand?: HandFeatures
    ) {
    }
}

class HandFeatures {

    constructor(
        readonly orientation?: Feature,
        readonly movement?: Feature
    ) {
    }
}

class Feature {

    constructor(
        readonly value: string, 
        readonly score?: number
    ) {
    }
}

export { BodyFeatures, HandFeatures, Feature };