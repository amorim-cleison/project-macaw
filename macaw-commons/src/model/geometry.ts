
class Base {

    readonly x: number;
    readonly y: number;
    readonly z: number;

    constructor(x: number, y: number, z: number) {
        this.x = this.getValidOrZero(x);
        this.y = this.getValidOrZero(y);
        this.z = this.getValidOrZero(z);
    }

    private getValidOrZero(value: number): number {
        return (value && Number.isFinite(value)) ? value : 0.0;
    }

    protected assertValid(other: Object): void {
        if (!other) {
            throw new Error("'other' parameter provided is invalid.")
        }
    }
}

class Coordinate extends Base {

    constructor(
        x: number,
        y: number,
        z: number,
        readonly score: number | undefined = undefined) {
        super(x, y, z);
    }

    protected averageScores(scoreA: number | undefined, scoreB: number | undefined): number | undefined {
        if (scoreA && scoreB) {
            return (scoreA + scoreB) / 2;
        }
        return undefined;
    }

    public subtract(other: Coordinate): Vector {
        this.assertValid(other);
        return Vector.fromCoordinates(other, this);
    }
}

class Vector extends Base {

    static fromCoordinates(a: Coordinate, b: Coordinate) {
        return new Vector(
            b.x - a.x,
            b.y - a.y,
            b.z - a.z
        );
    }

    public crossProduct(other: Vector): Vector {
        // Cx = AyBz − AzBy
        // Cy = AzBx − AxBz
        // Cz = AxBy − AyBx
        const cx = (this.y * other.z) - (this.z * other.y);
        const cy = (this.z * other.x) - (this.x * other.z);
        const cz = (this.x * other.y) - (this.y * other.x);
        return new Vector(cx, cy, cz);
    }

    public dotProduct(other: Vector): number {
        // A·B = AxBx + AyBy + AzBz
        return (this.x * other.x)
            + (this.y * other.y)
            + (this.z * other.z);
    }

    public toNormalized() {
        /** 
         * To normalize a vector, you perform the Pythagorean theorem on the components 
         * of the vector: square each component, add them together, and take the square 
         * root of that number. To get the normalized coordinates, you divide each component
         * by the length. This tells you what percentage of the overall vector each 
         * component makes up.
         * https://www.informit.com/articles/article.aspx?p=2854376&seqNum=4#:~:text=To%20normalize%20a%20vector%2C%20you,%2B%2016%20%2B%200%20%3D%2025.
         */
        const length = Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);
        return new Vector(
            this.x / length,
            this.y / length,
            this.z / length
        );
    }
}

export { Coordinate, Vector };