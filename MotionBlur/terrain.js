import { Trimesh } from './trimesh';
import { Vector4, Vector3 } from './vector';

export class Terrain {
    constructor(elevations, width, depth) {
        this.elevations = elevations;
        this.width = width;
        this.depth = depth;
    }

    get(width) {
        return width;
    }

    get(depth) {
        return depth;
    }

    get(x, z) {
       // console.log("ELEV = ",this.elevations[z * this.width + x]);
       x = Math.round(x);
       z = Math.round(z);
        return this.elevations[Math.floor(z * this.width + x)];
        //return this.elevations[(z * this.width + x)];
    }

    set(x, z, elevation) {
        elevations[z * width + x] = elevation
    }

    toTrimesh() {
        let positions = [];
        let y;

        console.log('width-depth', this.width, this.depth);
        let count = 0;
        for (let z = 0; z < this.depth; z++) {
            for (let x = 0; x < this.width; x++) {
                y = this.get(x, z);
                positions.push(x, y, z);
                if (!(y >= 0 || y <= 255)) {
                    console.log('xyz', x, y, z);
                }
                //if (x == 0 || z == this.depth) {
                //    console.log('xyz', x, y, z);
                //}
                //console.log('y:', y, 'count:', count);
                //count++;
            }
            //count++
        }
        console.log('positions length, width, depth', positions.length, this.width, this.depth);
        
        let faces = [];
        for (let z = 0; z < this.depth - 1; z++) {
            let nextZ = z + 1;
            for (let x = 0; x < this.width - 1; x++) {
                let nextX = x + 1;
                faces.push( z * this.width + nextX,
                            z * this.width + x,
                            nextZ * this.width + x);
                faces.push( nextZ * this.width + nextX,
                            z * this.width + nextX,
                            nextZ * this.width + x);
            }
        }
        console.log('faces length', faces.length);

        /*for (let i = 1; i < positions.length; i+=3) {
            console.log('y', positions[i]);
        }*/

        return Trimesh.fromPositionsAndIndicies(Vector3.flatToVectors(positions), faces);
    }
    
    blerp(x, z) {
        let floorX = Math.floor(x);
        let floorZ = Math.floor(z);
        let fractionX = x - floorX;
        let fractionZ = z - floorZ;

        let nearLeft = get(floorX, floorZ);
        let nearRight = get(floorX + 1, floorZ);
        let nearMix = lerp(fractionX, nearLeft, nearRight);

        let farLeft = get(floorX, floorZ + 1);
        let farRight = get(floorX + 1, floorZ + 1);
        let farMix = lerp(fractionX, farLeft, farRight);

        return lerp(fractionZ, nearMix, farMix);
    }

    static lerp(t, startY, endY) {
        //let t = (midX - startX) / (endX - startX);
        let midY = (1 - t) * startY + t * endY;

        return midY;
    }
    
}