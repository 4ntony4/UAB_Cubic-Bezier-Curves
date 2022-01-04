import * as THREE from 'https://unpkg.com/three@0.124.0/build/three.module.js';

import { OrbitControls } from 'https://unpkg.com/three@0.124.0/examples/jsm/controls/OrbitControls.js';

import { MyCubicBezierCurve3 } from './MyCubicBezierCurve3.js';

let camera, scene, renderer;
let geometry, material;
let raycaster, mouse, intersects;

// squares
const squareSide = 1;
const midSquareSide = squareSide / 2;
const squareWidth = squareSide;
const squareHeight = squareSide;
const squareDepth = 0;
const squareOpacityDefault = 0.4;
const squares = [];

// max and min coordinates for drawing the Oxy plane
const minCoordinate = -10;
const maxCoordinate = 10;

// spheres
const spheres = [];
const sphereRadius = midSquareSide;
const sphereOpacityDefault = 0.6;
let helperSphere;
const helperSphereRadius = 0.3 * midSquareSide;

// original coordinates of the center of the spheres
const yellowS = new THREE.Vector3( -2, -2, 0 );
const redS = new THREE.Vector3( 2, -2, 0 );
const greenS = new THREE.Vector3( 2, 2, 0 );
const blueS = new THREE.Vector3( -2, 2, 0 );

// lines
const lines = [];

// colors
const defaultColor = 'cornsilk';
const defaultPercent = 0.2; // for gradient purposes

// objects to delete when backspace is pressed
const objects = [];

// clocks
const zClock = new THREE.Clock();
const mixerClock = new THREE.Clock();
let deltaTime;

// mixers and animations
const mixers = [], clipActions = [];

// info
const defaultText = 'No Sphere Selected';
const divSphereSelected = document.getElementById('sphereSelected');
const divSpherePosition = document.getElementById('spherePosition');
divSphereSelected.textContent = defaultText;


init();
animate();


function init() {

    // start clocks
    zClock.start();
    mixerClock.start();

    // set camera
    camera = new THREE.PerspectiveCamera( 
        45,
        window.innerWidth / window.innerHeight,
        1,
        10000);
    camera.position.set( 0, -10, 5 );
    camera.lookAt( 0, 0, 0 );

    // initiate scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x010114 );

    // lights
    const ambientLight = new THREE.AmbientLight( 'white', 0.3 );
    scene.add( ambientLight );
    
    const directionalLight = new THREE.DirectionalLight( 'white', 0.5 );
    directionalLight.position.x = 0;
    directionalLight.position.y = -100;
    directionalLight.position.z = 100;
    scene.add ( directionalLight );

    // axes
    const axesHelper = new THREE.AxesHelper( 10 );
    scene.add ( axesHelper );

    // create Oxy plane
    drawPlane();

    // spheres
    createInstanceSphere( 'yellow', yellowS );
    createInstanceSphere( 'red', redS );
    createInstanceSphere( 'green', greenS );
    createInstanceSphere( 'blue', blueS );

    // create helperSphere
    createHelperSphere();

    // animations
    createMixers();
    createSpheresAnimation( 1, 1, 'slowGrowthAction' );
    createSpheresAnimation( 0.25, 5, 'fastGrowthAction' );
    playSlowGrowthAnimation();
    

    renderer = new THREE.WebGLRenderer( {antialias: true} );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
    
    new OrbitControls( camera, renderer.domElement );
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    window.addEventListener( 'resize', onWindowResize );
    document.addEventListener( 'keydown', onDocumentKeyDown );
    document.addEventListener( 'mousemove', onMouseMove );
}

function isEven( num ) {

    return num % 2 === 0;
}

function capitalizeFirstLetter( s ) {

    return s.charAt(0).toUpperCase() + s.slice(1);
}

// change the value of a primary color (RGB - range 0 to 1) to the value of percent (range 0 to 1)
// original value must be different from 0
function changeRGBValue ( pColor, percent ) {
    return pColor != 0 ? percent : pColor;
}

// plane divided by alternating colored squares
function drawPlane() {

    geometry = new THREE.BoxGeometry( squareWidth, squareHeight, squareDepth );

    for ( let i = minCoordinate + 1; i <= maxCoordinate; i++ ) {
        for ( let j = minCoordinate + 1; j <= maxCoordinate; j++ ) {
            // if i, j are both even OR i, j are both odd
            if ( ( isEven(i) && isEven(j) ) || ( !isEven(i) && !isEven(j) ) ) {
                createInstanceSquare( geometry, 'steelblue', i, j );
            }
            else {
                createInstanceSquare( geometry, 'white', i, j );
            }
        }
    }
}

// create a single square with given geometry, color and two position parameters
function createInstanceSquare( geometry, color, i, j ) {

    const material = new THREE.MeshBasicMaterial( {
        color: color,
        opacity: squareOpacityDefault,
        transparent: true
    } );

    const square = new THREE.Mesh( geometry, material );
    
    square.position.x = squareWidth * i - midSquareSide;
    square.position.y = squareHeight * j - midSquareSide;

    squares.push( square );
    
    scene.add( square );
}

// create a single sphere with given color and position
// position must be a Vector3
// a white line is added from the center of the sphere to the Oxy plane
function createInstanceSphere( color, position ) {
    
    geometry = new THREE.SphereGeometry( sphereRadius, 32, 16 );
    
    material = new THREE.MeshPhongMaterial( { 
        color: color,
        opacity: sphereOpacityDefault,
        transparent: true
    } );
    
    const sphere = new THREE.Mesh( geometry, material );
    
    sphere.position.set( position.x, position.y, position.z);

    sphere.name = color + 'Sphere';

    spheres.push( sphere );

    scene.add( sphere );

    createInstanceLine( position, color );
}

// set spheres to its original positions
function setSpheresOriginalPosition() {

    spheres[0].position.set( yellowS.x, yellowS.y, yellowS.z );
    spheres[1].position.set( redS.x, redS.y, redS.z );
    spheres[2].position.set( greenS.x, greenS.y, greenS.z );
    spheres[3].position.set( blueS.x, blueS.y, blueS.z );
}

// create a sphere to help the user with the raycasting 
function createHelperSphere() {

    geometry = new THREE.SphereGeometry( helperSphereRadius, 32, 16 );

    material = new THREE.MeshPhongMaterial( {
        color: defaultColor,
    } );

    helperSphere = new THREE.Mesh( geometry, material );
    helperSphere.name = "helperSphere";
}

// return true if helpher sphere is in scene
function helperSphereInScene() {

    const helper = scene.getObjectByName( "helperSphere" );

    return helper ? true : false;
}

// restore transparency of all objects in a vector to true
function resetTransparency( vector ) {

    for ( let i = 0; i < vector.length; i++ ) {
        if ( !vector[i].material.transparent ) {
            vector[i].material.transparent = true;
        }
    }
}

// return true if any sphere is selected
// return false otherwise
function isSphereSelected() {

    for ( let i = 0; i < spheres.length; i++ ) {
        if ( !spheres[i].material.transparent ) {
            return true; 
        }
    }
    return false;
}

// return index of selected sphere
// -1 if there is none
function findIndexSelectedSphere() {

    for ( let i = 0; i < spheres.length; i++ ) {
        if ( !spheres[i].material.transparent ) {
            return i;
        }
    }

    return -1;
}

// return index of a given sphere
// -1 if index doesn't exist
function findIndexSphere( sphere ) {

    for ( let i = 0; i < spheres.length; i++ ) {
        if ( spheres[i] === sphere ) {
            return i;
        }
    }
    return -1;
}

// change state of the scene if a sphere is selected
function onSphereSelected( color, v ) {

    updateDivSphereSelected( color, v );
    resetTransparency( spheres );
    v.material.transparent = false;
    helperSphere.material.color.set( color );
}

// change z position of the selected sphere
function changeZPosition( direction ) {

    let increment;

    deltaTime = zClock.getDelta();

    if ( deltaTime > 0.09 ) {
        increment = 0.1;
    }
    else {
        increment = 0.3;
    }
    
    const index = findIndexSelectedSphere();

    if ( index !== -1 ) {
        if ( direction === 'up' ) {
            spheres[index].position.z += increment;
        }
        else if ( direction === 'down' ) {
            spheres[index].position.z -= increment;
        }

        updateLine( index, spheres[index].position );
        updateDivSpherePosition( spheres[index] );
    }
}

// draw a line from a given position to the Oxy plane
// position must be a Vector3
function createInstanceLine( position, color ) {

    const points = [];

    const c = new THREE.Color( color );
    
    const percentR = changeRGBValue( c.r, defaultPercent );
    const percentG = changeRGBValue( c.g, defaultPercent );
    const percentB = changeRGBValue( c.b, defaultPercent );
    
    const colors = [
        percentR, percentG, percentB,
        c.r, c.g, c.b,
    ];
    
    points.push( position );
    points.push( new THREE.Vector3( position.x, position.y, 0 ) );

    geometry = new THREE.BufferGeometry().setFromPoints( points );
    
    geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );

    material = new THREE.LineBasicMaterial( {
        vertexColors: true,
        toneMapped: false
    } );

    const line = new THREE.Line( geometry, material );

    line.name = color + 'Line';

    lines.push( line );
    
    scene.add( line );
}

// update the line between a sphere and the Oxy plane
function updateLine( index, position ) {
    
    const points = [];

    const c = new THREE.Color( lines[index].name.split('L')[0] );
    
    const percentR = changeRGBValue( c.r, defaultPercent );
    const percentG = changeRGBValue( c.g, defaultPercent );
    const percentB = changeRGBValue( c.b, defaultPercent );
    
    const colors = [
        percentR, percentG, percentB,
        c.r, c.g, c.b,
    ];

    points.push( position );
    points.push( new THREE.Vector3( position.x, position.y, 0 ) );

    lines[index].geometry = new THREE.BufferGeometry().setFromPoints( points );
    
    lines[index].geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
}

// update informative text about the selected sphere
function updateDivSphereSelected( color = defaultColor, v = null ) {

    if ( color === defaultColor ) {
        divSphereSelected.style.color = defaultColor;
        divSphereSelected.textContent = defaultText;
    }
    else {
        divSphereSelected.style.color = color;
        divSphereSelected.textContent = capitalizeFirstLetter( color ) + ' Sphere Selected';
    }

    updateDivSpherePosition( v );
}

// update informative text about the position of the selected sphere 
function updateDivSpherePosition( v = null ) {

    if ( v ) {
       divSpherePosition.textContent = positionText( v );
       divSpherePosition.style.padding = '5px';
    }
    else {
        divSpherePosition.textContent = '';
        divSpherePosition.style.padding = '0px';
    }
}

// format informative text about the position of the selected sphere 
function positionText( v ) {

    const x = v.position.x.toFixed( 2 );
    const y = v.position.y.toFixed( 2 );
    const z = v.position.z.toFixed( 2 );

    return `Current Position:\r\n{x: ${x}, y: ${y}, z: ${z}}`;
}

// draw a tube with THREE.TubeGeometry and bezier3 algorithm
function drawTube() {

    const path = new MyCubicBezierCurve3(
        spheres[0].position,
        spheres[1].position,
        spheres[2].position,
        spheres[3].position
    );
        
    geometry = new THREE.TubeGeometry(path, 64, 0.2, 30);

    material = new THREE.MeshNormalMaterial();

    const tube = new THREE.Mesh( geometry, material );

    tube.name = 'bezier3Tube';

    objects.push( tube );

    scene.add( tube );
}

// create mixers for animations
function createMixers() {

    for ( let i = 0; i < spheres.length; i++ ) {
        mixers.push( new THREE.AnimationMixer( spheres[i] ) );
    }
}

// create a THREE.AnimationClip for scaling up an object
function createGrowthAction( duration, pulseScale, clipName ) {

    const k = 20;
    const times = [], values = [], tmp = new THREE.Vector3();
    const trackName = '.scale';

    for ( let i = 0; i < duration * k; i++ ) {
        times.push( i / k );
        const scaleFactor = ( i / k ) * pulseScale;

        tmp.set( scaleFactor, scaleFactor, scaleFactor )
            .toArray( values, values.length );
    }

    const track = new THREE.VectorKeyframeTrack( trackName, times, values );

    return new THREE.AnimationClip ( clipName, duration, [ track ] );
}

// create a scaling up animation for the spheres
function createSpheresAnimation( duration, pulseScale, clipName ) {

    for ( let i = 0; i < spheres.length; i++ ) {
        const index = findIndexSphere( spheres[i] );

        if ( index !== -1 ) {
            const clip = createGrowthAction( duration, pulseScale, clipName );
            
            const clipAction = mixers[index].clipAction( clip );

            clipAction.setLoop( THREE.LoopOnce );
            
            clipActions.push( clipAction );
        }
    }
}

function playSlowGrowthAnimation() {

    for ( let i = 0; i < spheres.length; i++ ) {

        // reset clipAction
        clipActions[i].stop();

        clipActions[i].play();
    }
}

// add helpherSphere to the scene only if a sphere is selected and the mouse intersects the Oxy plane
function checkIntersects() {

    if ( intersects ) {

        if ( intersects.length > 0 && isSphereSelected() ) {

            const intersect = intersects[0];

            if ( !helperSphereInScene() ) {
                scene.add( helperSphere );
            }
            helperSphere.position.copy( intersect.point );
        }
        else if ( intersects.length === 0 && isSphereSelected() ) {
            scene.remove( helperSphere );
        }
    }
}

// window resize event
function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}

// key down event
function onDocumentKeyDown( event ) {

    switch ( event.keyCode ) {

        // digit 1 or numpad 1
        case 49:
        case 97:
            onSphereSelected( 'yellow', spheres[0] );
            break;
        
        // digit 2 or numpad 2
        case 50:
        case 98:
            onSphereSelected( 'red', spheres[1] );
            break;

        // digit 3 or numpad 3
        case 51:
        case 99:
            onSphereSelected( 'green', spheres[2] );
            break;
        
        // digit 4 or numpad 4
        case 52:
        case 100:
            onSphereSelected( 'blue', spheres[3] );
            break;

        // keyCode 32 is the Space key
        case 32:
            if ( intersects ) {
                if ( intersects.length > 0 )  {
                    const intersect = intersects[0];
            
                    const index = findIndexSelectedSphere();
            
                    if ( index !== -1 ) {

                        spheres[index].position.x = intersect.point.x;
                        spheres[index].position.y = intersect.point.y;

                        // reset clipAction
                        clipActions[index + spheres.length].stop();
                        
                        clipActions[index + spheres.length].play();
            
                        updateLine( index, spheres[index].position );
                        updateDivSpherePosition( spheres[index] );
                    }
                }
            }
            
            break;

        // keyCode 87 is key 'w'
        case 87:
            changeZPosition( 'up' );
            break;

        // keyCode 83 is key 's'
        case 83:
            changeZPosition( 'down' );
            break;

        // keyCode 88 is key 'x'
        case 88:
            drawTube();
            break;

        // keyCode 8 is the Backspace key
        case 8:
            updateDivSphereSelected();
            setSpheresOriginalPosition();
            playSlowGrowthAnimation();
            resetTransparency( spheres );
            scene.remove( helperSphere );
            
            for ( let i = 0; i < spheres.length; i++ ) {
                updateLine( i, spheres[i].position );
            }

            // delete from scene all objects in 'objects'
            objects.forEach( object => scene.remove( object ) );
            
            // clear objects array since it's no longer needed
            objects.splice(0, objects.length);

            break;

        default:
            updateDivSphereSelected();
            resetTransparency( spheres );
            scene.remove( helperSphere );
            break;
    }
}

// mouse move event
function onMouseMove( event ) {

    event.preventDefault();

    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    raycaster.setFromCamera( mouse, camera );

    intersects = raycaster.intersectObjects( squares );

    checkIntersects();
}

function animate() {

    requestAnimationFrame( animate );

    render();
}

function render() {

    const delta = mixerClock.getDelta();

    for ( let i = 0; i < spheres.length; i++ ) {
        if ( spheres[i] ) {
            mixers[i].update( delta );
        }
    }

    // render scene
    renderer.render( scene, camera );
}