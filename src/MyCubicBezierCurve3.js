import * as THREE from 'https://unpkg.com/three@0.124.0/build/three.module.js';

import { bezier3 } from './bezier3.mjs';

class MyCubicBezierCurve3 extends THREE.Curve {

	constructor( c0, c1, c2, c3 ) {
		super();

		this.type = 'MyCubicBezierCurve3';

		this.c0 = c0;
		this.c1 = c1;
		this.c2 = c2;
		this.c3 = c3;
	}

	getPoint( t ) {
		const c0 = this.c0, c1 = this.c1, c2 = this.c2, c3 = this.c3;

		return bezier3( { c0, c1, c2, c3, t } );
	}
}

MyCubicBezierCurve3.prototype.isMyCubicBezierCurve3 = true;

export { MyCubicBezierCurve3 };