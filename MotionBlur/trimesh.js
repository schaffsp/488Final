import { Vector3 } from "./vector.js";

/* Trimesh stores attributes about a model and has a utility for parsing a .obj file.
*  More details: 'https://howto3d.twodee.org/trimeshes/trimesh-class/'
*/
export class Trimesh{
    constructor(positions, normals, indicies) {
        this.positions = positions;
        this.normals = normals;
        this.indicies = indicies;   
    }

    /* Converts a flat 1D array of positions into an array of vectors and replaces the Trimesh's current positions variable.
    */
    setPositionsFromFlatArray(positions) {
        let vectorized_positions = [];
        for (let i = 0; i < positions.length; i+=3) {
            let new_vector = Vector3.fromValues(positions[i], positions[i+1], positions[i+2]);
            vectorized_positions.push(new_vector);
        }
        this.positions = vectorized_positions;
    }

    /* Returns the indicies of the Trimesh.
    */
    getIndicies() {
        return this.indicies;
    }

    /* Returns the Trimesh's positions, which are normally stored as an array of vectors, as a flat 1D array.
    */
    getFlatPositions() {
        let flattened_positions = [];
        for(let i = 0; i < this.positions.length; i++) {
            flattened_positions.push.apply(flattened_positions, this.positions[i].flatten());
        }
        return flattened_positions;
    }

    /* Returns the Trimesh's normals, which are normally stored as an array of vectors, as a flat 1D array.
    */
    getFlatNormals() {
        let flattened_normals = [];

        for(let i = 0; i < this.normals.length; i++) {
            flattened_normals.push.apply(flattened_normals, this.normals[i].flatten());
        }
        return flattened_normals;
    }

    /* This function computes the minimum and maximum value x, y, and z coordinate for the Trimesh object.
    *  This is useful in generating the centroid.
    *  It returns an array of length six in the format: [min_x, min_y, min_z, max_x, max_y, max_z]
    */
    computeBoundingBox() {
        let max = Vector3.fromValues(Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER);
        let min = Vector3.fromValues(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);

        for (let i = 0; i < this.positions.length; i++) {
            let current_position = this.positions[i];

            if (current_position.getX() < min.getX()) {
                min.setX(current_position.getX());
            } else if (current_position.getX() > max.getX()) {
                max.setX(current_position.getX());
            }

            if (current_position.getY() < min.getY()) {
                min.setY(current_position.getY());
            } else if (current_position.getY() > max.getY()) {
                max.setY(current_position.getY());
            }

            if (current_position.getZ() < min.getZ()) {
                min.setZ(current_position.getZ());
            } else if (current_position.getZ() > max.getZ()) {
                max.setZ(current_position.getZ());
            }
        }

        return min.flatten().concat(max.flatten());
    }

    static fromPositionsAndIndicies(positions, indicies) {
        let normals = [];
        //console.log('before loop in indicies length in fromPositionsAndIndicies', indicies.length);
        //console.log(positions.length);

        for (let i = 0; i < positions.length; i++) {
            normals.push(Vector3.fromValues(0, 0, 0));
        }

        for (let i = 0; i < indicies.length; i += 3) {
            let positionA = positions[indicies[i]];
            let positionB = positions[indicies[i+1]];
            let positionC = positions[indicies[i+2]];

            let vectorAB = positionB.subtract(positionA);
            let vectorAC = positionC.subtract(positionA);

            let faceNormal = vectorAB.cross(vectorAC);
            faceNormal = faceNormal.normalize();

            normals[indicies[i]] = normals[indicies[i]].add(faceNormal);
            normals[indicies[i + 1]] = normals[indicies[i + 1]].add(faceNormal);
            normals[indicies[i + 2]] = normals[indicies[i + 2]].add(faceNormal);
        }

        for (let i = 0; i < normals.length; i++) {
            normals[i] = normals[i].normalize();
            //console.log(normals[i].x, normals[i].y, normals[i].z);
        }

        return new Trimesh(positions, normals, indicies);
    }

    /* Returns a new trimesh object given a string representing a .obj file.
    *  Takes a string version of an obj file as input.
    *  Returns a new trimesh object built from the properties of the file.
    */
    static fromObj(input) {
        let tmpPositions = []
        let tmpNormals = []
        let tmpIndicies = []

        let generatingNormals = true

        /* Reads the data in from an .obj file without any parsing and stores it in the tmp arrays initialized above.
        *  tmpPositions and tmpNormals will be read in as strings, tmpIndicies will be strings since they are not fully broken down.
        *  See 'https://howto3d.twodee.org/trimeshes/obj-files/' for details.
        */
        let lines = input.split('\n');
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].split(" ");
            if (line[0] == 'v') {
                tmpPositions.push(Vector3.fromValues(parseFloat(line[1]), parseFloat(line[2]), parseFloat(line[3])));
            } else if (line[0] == 'vn') {
                generatingNormals = false;
                tmpNormals.push(Vector3.fromValues(parseFloat(line[1]), parseFloat(line[2]), parseFloat(line[3])));
            } else if (line[0] == 'f') {
                /* Have to handle both triangular faces and polygonal faces.
                *  Triangular Faces look like this in the file: ['f', '7//3', '5//3', '6//3']
                *  Polygonal Faces look like this in the file: ['f', '1/1/1', '5/2/1', '7/3/1', '3/4/1']
                *  See the bottom of 'https://howto3d.twodee.org/trimeshes/obj-files/' for details.
                */

                /* Triangular faces will have a length of 4 in once split,
                *  Polygonal faces will have a length of 5.
                */
                if (line.length == 4) {
                    tmpIndicies.push(line[1], line[2], line[3]);
                } else if (line.length > 4) {
                    for (let i = 2; i < line.length - 1; i++) {
                        tmpIndicies.push(line[1], line[i], line[i + 1]);
                    }
                }
                
            }
        }

        //console.log('Initial Data From File:\nTmpPositions:', tmpPositions, '\nTmpNormals:', tmpNormals, '\nTmpIndicies:', tmpIndicies);

        let positions = [];
        let normals = [];
        let indicies = [];
        let slashTokenToIndex = {} //{} = dictionary 
        let fields = [];

        /* The tmpIndicies array is broken down, and new verticies are created to make sure that the length of-
        *  the normals array is the same as the length of the positions array.
        *  See 'https://howto3d.twodee.org/trimeshes/obj-files/' for details.
        */
        for (let i = 0; i < tmpIndicies.length; i += 3) {
            for (let j = 0; j < 3; j++) {
                if (!(tmpIndicies[i + j] in slashTokenToIndex)) {
                    slashTokenToIndex[tmpIndicies[i + j]] = positions.length;
                    fields = tmpIndicies[i + j].split("/").map(x => parseInt(x));
                    positions.push(tmpPositions[fields[0] - 1]);
                    normals.push(tmpNormals[fields[2] - 1]);
                }
                indicies.push(slashTokenToIndex[tmpIndicies[i + j]]);
            }
            if (generatingNormals) {
                /**
                 *  Using Triangle                     A
                 *  Normal =                          / \ 
                 *  ((B - A) x (C - A)).normalize()  B   C
                 */
                let BminusA = positions[i + 1].subtract(positions[i])
                let CminusA = positions[i + 2].subtract(positions[i])
                let normal = BminusA.cross(CminusA)
                normals.push(normal.normalize())
                normals.push(normal.normalize())
                normals.push(normal.normalize())
            }
        }
        return new Trimesh(positions, normals, indicies);
    }

}