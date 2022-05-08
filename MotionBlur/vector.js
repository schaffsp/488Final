export class Vector4{

    constructor() {
        this.v_array = [0, 0, 0, 0];
    }

    static fromValues(x, y, z) {
        let vec = new Vector4();
        vec.set(0, x);
        vec.set(1, y);
        vec.set(2, z);
        vec.set(3, 1);
        return vec;
    }

    static notConstructor(x, y, z) {
        let vec = new Vector4();
        vec.set(0, x);
        vec.set(1, y);
        vec.set(2, z);
        vec.set(3, 1);
        return vec;
    }

    get x() {
        return this.v_array[0];
    }

    get y() {
        return this.v_array[1];
    }

    get z() {
        return this.v_array[2];
    }

    get h() {
        return this.v_array[3];
    }

    static notConstructorArray(arr) {
        if (arr.length < 4) {
            return
        }
        
        let out = new Vector4();
        
        for (let i = 0; i < 3; i++) {
            out.set(i, arr[i]);
        }
        out.set(3, 1);

        return out
    }

    get(index) {
        return this.v_array[index];
    }

    getX() {
        return this.v_array[0];
    }

    getY() {
        return this.v_array[1];
    }

    getZ() {
        return this.v_array[2];
    }

    set(index, value) {
        this.v_array[index] = value;
    }

    divide(scalar) {
        this.set(0, this.get(0) / scalar);
        this.set(1, this.get(1) / scalar);
        this.set(2, this.get(2) / scalar);
        this.set(3, this.get(3) / scalar);
    }

    magnitude() {
        return Math.sqrt(Math.abs(this.get(0) * this.get(0) + this.get(1) * this.get(1) + this.get(2) * this.get(2) + this.get(3) * this.get(3)));
    }

    normalize() {
        this.divide(this.magnitude());
        return this;
    }

    dot(other) {
        return this.get(0) * other.get(0) + this.get(1) * other.get(1) + this.get(2) * other.get(2) + this.get(3) * other.get(3);
    }

    toVector3(){
        return Vector3.fromValues(this.get(0), this.get(1), this.get(2));
    }
}

export class Vector3 {
    constructor() {
        this.v_array = [0, 0, 0]
    }

    static notConstructor(x, y, z) {
        let vec = new Vector3();
        vec.setX(x);
        vec.setY(y);
        vec.setZ(z);
        return vec;
    }

    static fromArray(array) {
        if (array.length != 3) return;
        let new_vector = new Vector3();
        new_vector.setX(array[0]);
        new_vector.setY(array[1]);
        new_vector.setZ(array[2]);
        return new_vector;
    }

    static fromValues(x, y, z) {
        let new_vector = new Vector3();
        new_vector.setX(x);
        new_vector.setY(y);
        new_vector.setZ(z);
        return new_vector;
    }

    flatten() {
        return this.v_array;
    }

    divide(scalar) {
        this.setX(this.getX() / scalar);
        this.setY(this.getY() / scalar);
        this.setZ(this.getZ() / scalar);
    }

    magnitude() {
        return Math.sqrt(this.getX() ** 2 + this.getY() ** 2 + this.getZ() ** 2);
    }

    normalize() {
        let m = this.magnitude();
        return Vector3.fromValues(
            this.getX() / m,
            this.getY() / m,
            this.getZ() / m
        );
    }

    subtract(other) {
        return Vector3.fromValues(this.getX() - other.getX(), this.getY() - other.getY(), this.getZ() - other.getZ());
    }
    
    add(other) {
        return Vector3.fromValues(this.getX() + other.getX(), this.getY() + other.getY(), this.getZ() + other.getZ());
    }

    dot(other) {
        return this.getX() * other.getX() + this.getY() * other.getY() + this.getZ() * other.getZ();
    }

    cross(other) {
        return Vector3.fromValues(
            this.getY() * other.getZ() - this.getZ() * other.getY(),
            this.getZ() * other.getX() - this.getX() * other.getZ(),
            this.getX() * other.getY() - this.getY() * other.getX()
        );
    }

    toVector4() {
        return Vector4.notConstructor(this.getX(), this.getY(), this.getZ(), 1);
    }

    get x() {
        return this.v_array[0];
    }

    get y() {
        return this.v_array[1];
    }

    get z() {
        return this.v_array[2];
    }

    get h() {
        return this.v_array[3];
    }

    getX() {
        return this.v_array[0];
    }

    getY() {
        return this.v_array[1];
    }

    getZ() {
        return this.v_array[2];
    }

    setX(value) {
        this.v_array[0] = value;
    }

    setY(value) {
        this.v_array[1] = value;
    }

    setZ(value) {
        this.v_array[2] = value;
    }
}
