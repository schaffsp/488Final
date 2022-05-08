import {Vector3} from './vector.js';
import {Matrix4} from './matrix.js';

export class Camera {
    constructor(position, looked_at_position, worldUp) {
        this.position = position;
        this.forward = looked_at_position.subtract(position).normalize();
        this.right = this.forward.cross(worldUp).normalize();
        this.worldUp = worldUp.normalize();
        this.eyeFromWorld = this.reorient();
        this.totalPitch = 0;
    }

    //Sets the camera Postion
    setPosition(position) {
        this.position = position;
    }
    
    //Sets the Right Vector 
    setRight(right) {
        this.right = right;
    }
    
    //Sets the forward vector
    setForward(forward) {
        this.forward = forward;
    }
    
    //Sets the Up vector 
    setWorldUp(worldUp) {
        this.worldUp = worldUp;
    }

    setEyeFromWorld(eyeFromWorld) {
        this.eyeFromWorld = eyeFromWorld;
    }
    
    
    /**
     * Builds the eyeFromWorld matrix, which assumes the cameras position,
     *  the forward vector, and the world up vector are already set,
     * Computes the camera's right and up vectors 
     *  and multiplies the rotation and translation matrices together.
     *  _                                   _
     * |    rightX     rightY     rightZ   0 |
     * |       upX        upY        upZ   0 |
     * | -forwardX  -forwardY  -forwardZ   0 |
     * |_ 0          0          0          1_|
     *  Combines this matrix with the translation Matrix to create eyeFromWorldMatrix
     * 
     *  _                    _
     * |  1     0     0     x |
     * |  0     1     0     y |
     * |  0     0     1     z |
     * |_ 0     0     0     1_|
     * This is the Translation Matrix where xyz is the -from.xyz vector respectivly
     *  We do this because we want the camera position to turn form the world space [0 0 0]
     * 
     * eyeFromWorldMatrix = rotationMatrix dot Translation Matrix
     */
    reorient() {
        let eyeFromWorld = new Matrix4();
        this.forward = this.forward.normalize();
        let fx = this.forward.getX();
        let fy = this.forward.getY();
        let fz = this.forward.getZ();
        eyeFromWorld.set(2, 0, -fx);
        eyeFromWorld.set(2, 1, -fy);
        eyeFromWorld.set(2, 2, -fz);
        eyeFromWorld.set(3, 3, 1);
        //console.log(fx, fy, fz);
        this.right = (this.forward.cross(this.worldUp)).normalize();
        eyeFromWorld.set(0, 0, this.right.getX());
        eyeFromWorld.set(0, 1, this.right.getY());
        eyeFromWorld.set(0, 2, this.right.getZ());
        //console.log(this.right);
        let up = (this.right.cross(this.forward)).normalize();
        //console.log(up);
        let ux = up.getX();
        let uy = up.getY();
        let uz = up.getZ();
        //console.log(up);
        //console.log(fx, fy, fz, ux, uy, uz);
        //console.log(this.right.getX(), this.right.getY(), this.right.getZ());
        eyeFromWorld.set(1, 0, ux);
        eyeFromWorld.set(1, 1, uy);
        eyeFromWorld.set(1, 2, uz);
        this.setEyeFromWorld(eyeFromWorld);
        //console.log(eyeFromWorld);

        let translate = Matrix4.translate(-this.position.getX(), -this.position.getY(), -this.position.getZ());
        let final_matrix = eyeFromWorld.multiplyMatrix(translate);
        this.setEyeFromWorld(final_matrix);
        return final_matrix;
    }

    getEyeFromWorld() {
        return this.getEyeFromWorld();
    }
    
    advance(distance){
        this.position = this.position.add(Vector3.notConstructor(this.forward.getX() * distance,
                                                                this.forward.getY() * distance, 
                                                                this.forward.getZ() * distance));
        this.reorient();
    }
    
    strafe(distance) {
        //console.log(this.right.getX() * distance, this.right.getY() * distance, this.right.getZ() * distance);
        
        this.position = this.position.add(Vector3.notConstructor(this.right.getX() * distance,
                                                                this.right.getY() * distance, 
                                                                this.right.getZ() * distance));
        
        this.reorient();
    }
    
    elevate(distance) {
        this.position = this.position.add(this.worldUp.dot(distance));
        this.reorient();
    }

    yaw(degrees) {
        this.forward = Matrix4.rotateAroundAxis(this.worldUp, degrees).multiplyVector(this.forward.toVector4()).toVector3();
        this.reorient();
    }

    pitch(degrees) {
        /*this.totalPitch += degrees;
        if (degrees + this.totalPitch >= 15) {
            degrees = this.totalPitch - 15;
        } else if (degrees + this.totalPitch < -15) {
            degrees = this.totalPitch + 15;
        }*/
        //console.log(degrees);
        //console.log(this.forward);
        //console.log(this.right);
        //console.log(this.up);
        this.forward = Matrix4.rotateAroundAxis(this.right, degrees).multiplyVector(this.forward.toVector4()).toVector3();
        //console.log(this.forward);
        this.reorient();
    }
}

export class TerrainCamera extends Camera {
    constructor(from, to, worldUp, terrain, eyeLevel) {
        super(from, to, worldUp);
        this.terrain = terrain;
        this.eye_level = eyeLevel;
        //console.log(this.position);
        this.bouy();
        //console.log(this.position);
    }

    bouy() {
        // Clamp X
        if (this.position.x >= (this.terrain.width - 1)) {
            console.log("BRUH");
            this.position.x = (this.terrain.width - 1);
        } else if (this.position.x < 0) {
            console.log("BRUH");
            this.position.x = 0;
        }

        // Clamp Z
        if (this.position.z >= (this.terrain.depth - 1)) {
            console.log("BRUH");
            this.position.z = (this.terrain.depth - 1);
        } else if (this.position.z < 0) {
            console.log("BRUH");
            this.position.z = 0;
        }
        //console.log(this.position);
        //console.log("Pos x = ", this.position.x, "Pos z = ",  this.position.z);
        //console.log("Pos y = ", this.position.y);
        //console.log("Terrain.get", this.terrain.get(this.position.x, this.position.z));
        this.position.y = this.terrain.get(this.position.x, this.position.z) + this.eye_level;
        //console.log("Pos y = ", this.position.y);

    }

    advance(distance) {
        //console.log("adv pos= ", this.position);
        this.position = this.position.add(Vector3.notConstructor(this.forward.getX() * distance,
                                                                this.forward.getY() * distance, 
                                                                this.forward.getZ() * distance));
        this.bouy();
        //console.log("adv pos= ", this.position);
        this.reorient();
    }

    strafe(distance) {
        this.position = this.position.add(Vector3.notConstructor(this.right.getX() * distance,
                                                                this.right.getY() * distance, 
                                                                this.right.getZ() * distance));
        this.bouy();
        this.reorient();
    }
}