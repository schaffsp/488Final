import {Vector3, Vector4} from './vector.js';

export class Matrix4 {
    constructor() {
        /**
         * The Matrix is organized in column-major order (unfortunatley).
         *  --> Below is a 4x4 representation of the matrix.
         * 0  4  8 12
         * 1  5  9 13
         * 2  6 10 14
         * 3  7 11 15
         */
        this.matrix = new Float32Array(16);
    }

    static notConstructorConstructor(arr) {
        /**
         * The Matrix is organized in column-major order (unfortunatley).
         *  --> Below is a 4x4 representation of the matrix.
         * 0  4  8 12
         * 1  5  9 13
         * 2  6 10 14
         * 3  7 11 15
         */
       let out = new Matrix4();
       /*for (let i = 0; i < 16; i++) {
            out.set(i / 4, i % 4, arr[i]);
       }*/
       out.set(0, 0, arr[0]);
       out.set(0, 1, arr[1]);
       out.set(0, 2, arr[2]);
       out.set(0, 3, arr[3]);
       out.set(1, 0, arr[4]);
       out.set(1, 1, arr[5]);
       out.set(1, 2, arr[6]);
       out.set(1, 3, arr[7]);
       out.set(2, 0, arr[8]);
       out.set(2, 1, arr[9]);
       out.set(2, 2, arr[10]);
       out.set(2, 3, arr[11]);
       out.set(3, 0, arr[12]);
       out.set(3, 1, arr[13]);
       out.set(3, 2, arr[14]);
       out.set(3, 3, arr[15]);
       return out;
    }
    
    get(row, column){
        return this.matrix[(column * 4) + row];
    }

    set (row, column, value) {
        this.matrix[(column * 4) + row] = value;
    }

    toBuffer() {
        return this.matrix;
    }

    static ortho(left, right, top, bottom, near, far) {
        return this.notConstructorConstructor([
            (2 / (right-left)), 0, 0, -((right+left)/(right-left)), 
            0, (2 / (top-bottom)), 0, -((top+bottom)/(top-bottom)), 
            0, 0, (2 / (near-far)), ((near+far)/(near-far)),
            0, 0, 0, 1, 
        ])
    }

    static identity(){
        return this.notConstructorConstructor([
            1, 0, 0, 0, 
            0, 1, 0, 0, 
            0, 0, 1, 0,
            0, 0, 0, 1, 
        ])
    }

    static scale(x, y, z) {
        return this.notConstructorConstructor([
            x, 0, 0, 0,
            0, y, 0, 0, 
            0, 0, z, 0,
            0, 0, 0, 1,
        ]);
    }

    static rotateX(deg) {
        let radians = deg * (Math.PI / 180);
        return this.notConstructorConstructor([
            1, 0, 0, 0,
            0, Math.cos(radians), -Math.sin(radians), 0,
            0, Math.sin(radians), Math.cos(radians), 0,
            0, 0, 0, 1
        ]);
    }

    static rotateY(deg) {
        let radians = deg * (Math.PI / 180);
        return this.notConstructorConstructor([
            Math.cos(radians), 0, -Math.sin(radians), 0,
            0, 1, 0, 0,
            Math.sin(radians), 0, Math.cos(radians), 0,
            0, 0, 0, 1
        ]);
    }

    static rotateZ(deg) {
        let radians = deg * (Math.PI / 180);
        return this.notConstructorConstructor([
            Math.cos(radians), -Math.sin(radians), 0, 0,
            Math.sin(radians), Math.cos(radians), 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    }

    static lookAt(from, to, worldUp) {
        let output = new Matrix4();
        let forward = new Vector3();
        forward = from.subtract(to);
        let fx = forward.getX();
        let fy = forward.getY();
        let fz = forward.getZ();
        forward = forward.normalize();
        output.set(2, 0, -fx);
        output.set(2, 1, -fy);
        output.set(2, 2, -fz);
        output.set(3, 3, 1);
        let right = forward.cross(worldUp);
        output.set(0, 0, right.getX());
        output.set(0, 1, right.getY());
        output.set(0, 2, right.getZ());
        let up = right.cross(forward);
        output.set(1, 0, up.getX());
        output.set(1, 1, up.getY());
        output.set(1, 2, up.getZ());
        return output;
    }

    multiplyVector(vector4){
        //returns the product of the matrix and vector as a new vector 4
        let retVector = new Vector4();
        retVector.set(0, this.matrix[0] * vector4.get(0) + 
            this.matrix[4] * vector4.get(1) + 
            this.matrix[8] * vector4.get(2) + 
            this.matrix[12] * vector4.get(3));
        retVector.set(1, this.matrix[1] * vector4.get(0) + 
            this.matrix[5] * vector4.get(1) + 
            this.matrix[9] * vector4.get(2) + 
            this.matrix[13] * vector4.get(3));
        retVector.set(2, this.matrix[2] * vector4.get(0) + 
            this.matrix[6] * vector4.get(1) + 
            this.matrix[10] * vector4.get(2) + 
            this.matrix[14] * vector4.get(3));
        retVector.set(3, this.matrix[3] * vector4.get(0) + 
            this.matrix[7] * vector4.get(1) + 
            this.matrix[11] * vector4.get(2) + 
            this.matrix[15] * vector4.get(3));
        return retVector;
    }

    multiplyMatrix(inputMatrix) {
        let returnMatrix = new Matrix4();
        let r;
        let c;
        for (let i = 0; i < 16; ++i) {
            r = i % 4;
            c = Math.floor(i / 4);
            returnMatrix.set(r, c, 
                inputMatrix.get(0, c) * this.get(r, 0) +
                inputMatrix.get(1, c) * this.get(r, 1) +
                inputMatrix.get(2, c) * this.get(r, 2) +
                inputMatrix.get(3, c) * this.get(r, 3));
        }   

        // (r, (c + 1) % 4)
        return returnMatrix;
    }

    static translate(x, y, z) {
        return this.notConstructorConstructor([
            1, 0, 0, x,
            0, 1, 0, y,
            0, 0, 1, z,
            0, 0, 0, 1,
        ])
    }

    static fovPerspective(verticalFOV, aspectRatio, near, far) {

        let top = Math.tan(verticalFOV/2) * near;
        let right = aspectRatio * top;
        return this.notConstructorConstructor([
            near/right, 0, 0, 0,
            0, near/top, 0, 0,
            0, 0, (near+far)/(near-far), (2*near*far)/(near-far),
            0, 0, -1, 0,
        ])
    }

    static rotateAroundAxis(axis, deg) {
        let a = deg * (Math.PI / 180);
        let s = Math.sin(a);
        let c = Math.cos(a);
        let d = 1 - c;
        let vx = axis.getX();
        let vy = axis.getY();
        let vz = axis.getZ();
        return this.notConstructorConstructor([
            d * vx * vx + c, d * vx * vy - s * vz, d * vx * vz + s * vy, 0,
            d * vy * vx + s * vz, d * vy * vy + c, d * vy * vz - s * vx, 0, 
            d * vz * vx - s * vy, d * vz * vy + s * vx, d * vz * vz + c, 0,
            0, 0, 0, 1,
        ])
    }
}