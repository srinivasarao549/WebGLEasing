/**
 * Vertex Shader
 * 
 * Uses Easing Equations v2.0
 * September 1, 2003
 * (c) 2003 Robert Penner, all rights reserved. 
 * Equations are subject to the terms in http://www.robertpenner.com/easing_terms_of_use.html.
 *
 * Everything else is:
 *
 * Copyright (C) 2011 by Paul Lewis
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
const float PI = 3.14159265;

/**
 * Easing Equations
 */
float circEaseInOut (float t, float b, float c, float d) {
	if ((t/=d/2.0) < 1.0) return -c/2.0 * (sqrt(1.0 - t*t) - 1.0) + b;
	return c/2.0 * (sqrt(1.0 - (t-=2.0)*t) + 1.0) + b;
}

float elasticEaseInOut (float t, float b, float c, float d) {
	
	float a=c;
	float p=d*(.3 * 1.5);
	float s=p/4.0;
	
	if (t<=0.0) return b;
	if ((t/=d/2.0)==2.0)
		return b+c;
	
	if (t < 1.0)
		return -.5*(a*pow(2.0,10.0*(t-=1.0)) * sin( (t*d-s)*(2.0*PI)/p )) + b;
	
	return a*pow(2.0,-10.0*(t-=1.0)) * sin( (t*d-s)*(2.0*PI)/p )*.5 + c + b;
}

float expoEaseInOut (float t, float b, float c, float d) {
	if (t<=0.0) return b;
	if (t==d) return b+c;
	if ((t/=d/2.0) < 1.0) return c/2.0 * pow(2.0, 10.0 * (t - 1.0)) + b;
	return c/2.0 * (-pow(2.0, -10.0 * --t) + 2.0) + b;
}

float backEaseInOut (float t, float b, float c, float d) {
	float s = 1.70158; 
	if ((t/=d/2.0) < 1.0) return c/2.0*(t*t*(((s*=(1.525))+1.0)*t - s)) + b;
	return c/2.0*((t-=2.0)*t*(((s*=(1.525))+1.0)*t + s) + 2.0) + b;
}

/**
 * Everything else!
 */

// stuff to send through to the
// fragment shader later
varying vec3 lightPos, vNormal;
varying float colorWeighting, yRelative;

// the easing variables
uniform float t,b,c,d,e,o,m,maxY,period,yScale, crazyScale;

// values per vertex
attribute float easeOffset, easeMagnitude, crazy;

/**
 * The main, the top dog, the big kahuna,
 * the fine cheese, the boss, the magnum,
 * the heavyweight, the be-all-and-end-all
 */
void main() {

	// update the vertex normal
	vNormal 	= normalMatrix * normal;
	
	// fake a simple light
	lightPos	= normalize(vec3(0.5,0.2,1.0));
	
	// work out where this vertex is in the global
	// y position - used for the colouring
	yRelative = ((position.y * maxY) + 1.0) * .5;
	
	// take a copy of the vertex position because
	// it will be read only
	vec3 translatedPosition = position;
	
	// set a time value for this vertex will
	// take into account the offset
	float tVal 		= t - (easeOffset * o + crazy * crazyScale);
	
	// assume we're at the base value
	float easeVal	= b;
	
	// check we are in the animation bounds
	if(tVal > 0.0) {
		if(tVal < d) {
			// now choose the correct
			// easing equation
			if(e > 3.0) {
				easeVal = backEaseInOut(tVal,b,c,d);
			} else if(e > 2.0) {
				easeVal = expoEaseInOut(tVal,b,c,d);
			} else if(e > 1.0) {
				easeVal = circEaseInOut(tVal,b,c,d);
			} else if(e > 0.0) {
				easeVal = elasticEaseInOut(tVal,b,c,d);
			}	
		} else {
			// we're outside the bounds
			// so just add the change val
			// to the base val
			easeVal += c;
		}
	}
	
	// update the vertex based on the y position to create a helix
	translatedPosition.z += sin(translatedPosition.y * period) * easeVal * m * easeMagnitude;
	translatedPosition.x += cos(translatedPosition.y * period) * easeVal * m * easeMagnitude;
	translatedPosition.y *= 1.0 + (easeVal * yScale);
	
	// use this to weight the colouring
	colorWeighting = easeVal;
	
	// finally do the actual required
	// step of setting the vertex position
	gl_Position = projectionMatrix *
                  modelViewMatrix *
                  vec4(translatedPosition,1.0);
	
}