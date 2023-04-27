import * as THREE from 'three';

//================================================================================================
//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% StarBackground
//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
//
//  * library, that manages 3D space populated by stars
//  * area is specified as square
//  * uses BufferGeometry, PointsMaterial and Points (mesh)
//  * adjustable properties specified in TConstructorParameters

export type TConstructorParameters = {
    scene:THREE.Scene,
    starCount:number,
    width:number,
    height:number,
    depth:number,
    direction:'up' | 'down',
    axis: 'x' | 'y' | 'z',
    speed:number
}

//--------- TUpdateMethod
//---------------------------------------------------------------
// for fine performance, two methods are available, one is picked based on parameters
type TUpdateMethod = (
    axis:number,
    speed:number,
    boundary:number,
    returnPoints:number,
    stars: Float32Array,
    i:number
) => void;

//==============================================================
//========== class StarBackground
//==============================================================
export class StarBackground {

    width:number;
    height:number;
    depth:number;

    direction: 'up' | 'down';
    updateMeasure: 'width' | 'height' | 'depth';
    translatedAxis: 0 | 1 | 2;
    speed:number;
    boundary:number;

    scene:THREE.Scene;
    geometry:THREE.BufferGeometry;
    starCount:number;
    vertices:Float32Array;
    verticesColors:Float32Array;
    material:THREE.PointsMaterial;
    mesh:THREE.Points;

    updateStar:TUpdateMethod;

    //--------- constructor start
    //---------------------------------------------------------------
    constructor (parameters:TConstructorParameters) {

        this.scene = parameters.scene;
        this.geometry = new THREE.BufferGeometry();
        this.starCount = parameters.starCount;
        this.vertices = new Float32Array(this.starCount * 3);
        this.verticesColors = new Float32Array(this.starCount * 3);
        this.material = new THREE.PointsMaterial();
        this.mesh = new THREE.Points(this.geometry, this.material);

        this.width = parameters.width;
        this.height = parameters.height;
        this.depth = parameters.depth;

        this.speed = parameters.speed;
        this.direction = parameters.direction;

        switch (parameters.axis) {
            case 'x':
                this.translatedAxis = 0;
                this.updateMeasure = 'width';
                break;
            case 'y':
                this.translatedAxis = 1;
                this.updateMeasure = 'height';
                break;
            case 'z':
                this.translatedAxis = 2;
                this.updateMeasure = 'depth';
                break;
        }

        // selection of proper updateMethod
        switch (this.direction) {
            case 'up':
                this.updateStar = this.updateStarUp;
                break;
            case 'down':
                this.updateStar = this.updateStarDown;
                break;
        }
        
        // boundary, after which are particles "respawned" at the opposite end of geometry
        this.boundary = (this[this['updateMeasure']]) / 2;

        for (let i=0, j=0;i<this.starCount;i++, j+=3) {
        
            const x = this.createRandomStarPositionX();
            const y = this.createRandomStarPositionY();
            const z = this.createRandomStarPositionZ();
    
            this.vertices[j] = x;
            this.vertices[j+1] = y;
            this.vertices[j+2] = z;

            this.verticesColors[j] = 1;
            this.verticesColors[j+1] = 0;
            this.verticesColors[j+2] = 0;
        }

        this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.vertices, 3));
        this.geometry.computeBoundingBox();

        this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(this.verticesColors, 3));

        const starSprite = new THREE.TextureLoader().load('./src/images/star.png');
        this.material = new THREE.PointsMaterial({
            map:starSprite,
            vertexColors: true,
            size:10,
            transparent: true,
            blending: THREE.AdditiveBlending
        });

        const starMesh = new THREE.Points(this.geometry, this.material);
    
        this.scene.add(starMesh);
    }
    //---------------------------------------------------------------
    //--------- constructor end

    createDebugWireframeMesh () {

        const geometry = new THREE.BoxGeometry( this.width, this.height, this.depth );

        const wireframe = new THREE.WireframeGeometry( geometry );
        
        const line = new THREE.LineSegments( wireframe ) as any;
        line.material.depthTest = false;
        line.material.opacity = 1;
        line.material.transparent = true;
        line.material.color = 0x00cccc;

        return line;
    }

    // works with box currently
    createRandomStarPositionX () {
        return Math.floor(Math.random() * this.width - this.width / 2);
    }

    // works with box currently
    createRandomStarPositionY () {
        return Math.floor(Math.random() * this.height - this.height / 2);
    }
    
    // works with box currently
    createRandomStarPositionZ () {
        return Math.floor(Math.random() * this.depth - this.depth / 2);
    }

    updateStarUp:TUpdateMethod = function (axis, speed, boundary, returnPoints, stars, i) {

        stars[i+axis] += speed;

        if (stars[i+axis] >= boundary)
        {
            stars[i+axis] = stars[i+axis] - returnPoints;
        }
    };

    updateStarDown:TUpdateMethod = (axis, speed, boundary, returnPoints, stars, i) => {

        stars[i+axis] -= speed;

        if (stars[i+axis] <= -boundary)
        {
            stars[i+axis] = stars[i+axis] + returnPoints;
        }
    };

    update () {

        const positionAttribute = this.geometry.attributes.position as unknown as {array:Float32Array};
        const stars = positionAttribute.array;

        const axis:number = this.translatedAxis;
        const returnPoints:number = this[this.updateMeasure];
        const speed:number = this.speed;
        const boundary:number = this.boundary;

        for (let i = 0; i < this.vertices.length; i += 3)
        {
            this.updateStar(axis, speed, boundary, returnPoints, stars, i);
        }

        this.geometry.getAttribute('position').needsUpdate = true;
    }
}