import * as THREE from 'https://unpkg.com/three@0.124.0/build/three.module.js';

function bezierCurve3( bezierObj = { c0, c1, c2, c3, t } ) {

    const result = new THREE.Vector3();
    
    const v0 = bezierObj.c0.clone();
    const v1 = bezierObj.c1.clone();
    const v2 = bezierObj.c2.clone();
    const v3 = bezierObj.c3.clone();

    if ( correctObj( bezierObj ) ) {
        const t = bezierObj.t;
        const k = 1 - t;

        const r0 = k * k * k;
        const r1 = 3 * k * k * t;
        const r2 = 3 * k * t * t;
        const r3 = t * t * t;

        result.add( v0.multiplyScalar( r0 ) );
        result.add( v1.multiplyScalar( r1 ) );
        result.add( v2.multiplyScalar( r2 ) );
        result.add( v3.multiplyScalar( r3 ) );
    }

    return result;
}

// check if type of properties in bezierObj are correct
function correctObj( bezierObj ) {
	
    return ( bezierObj.c0.isVector3 &&
             bezierObj.c1.isVector3 &&
             bezierObj.c2.isVector3 &&
             bezierObj.c3.isVector3 &&
             typeof bezierObj.t === 'number' &&
             bezierObj.t >= 0 &&
             bezierObj.t <= 1) ? true : false;
}

export { bezierCurve3 };