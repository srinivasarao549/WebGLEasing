/**
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
var AEROTWIST = AEROTWIST || {};
AEROTWIST.WebGLEasing = new function()
{
	// internal vars
	var camera,
		scene,
		renderer,
		$container 			= $('#container'),
		width				= $container.width(),
		height				= $container.height(),
		expanded			= false,
		monkeyLoaded		= false,
		helixLoaded			= false,
		monkeyMaxY			= 1,
		helixMaxY			= 1,
		callbacks,
		
	// other internal vars
		camVal				= 0,
		attributesLeft		= createAttributes(),
		attributesRight		= createAttributes(),
		attributesMonkey	= createAttributes(),
		uniforms			= createUniforms(),
		
	// core objects
		helix,
		helixLeft,
		helixRight,
		monkey,
		light,
		
	// constants
		PARTICLES		= 800,
		DEPTH 			= 400,
		NEAR 			= 1,
		FAR 			= 10000,
		DEG2RAD			= Math.PI / 180,
		DAMPEN			= .98,
		MONKEY			= 0,
		MONKEY_PERIOD	= 0.07,
		MONKEY_YSCALE	= 1,
		HELIX			= 1,
		HELIX_PERIOD	= 0.035,
		HELIX_YSCALE	= 0,
		fin 			= true;
	
	// GUI vars
	this.duration		= 1.8;
	this.easingType		= 1;
	this.easingOffset	= 4;
	this.magnitude		= 40;
	this.autopan		= true;
	this.mesh			= 0;
	this.crazy			= false;
	
	/**
	 * Initializes the experiment and kicks
	 * everything off. Woot!
	 */
	this.init = function()
	{
		// stop the user selecting by accident
		$container.bind('selectstart', false);
		$container.bind('click', callbacks.onContainerClicked);
				
		// add listeners
		addEventListeners();
		
		// create our stuff
		createRenderer();
		createObjects();
		    
		// start rendering, which will
	    // do nothing until the mesh is loaded
		update();
	};
	
	/**
	 * Called by the GUI
	 */
	this.update = function() {
		
		// update the uniforms based
		// on the selected gui values
		uniforms.t.value = 0;
		uniforms.b.value = (expanded ? 1 : 0);
		uniforms.c.value = (expanded ? -1 : 1);
		uniforms.e.value = this.easingType;
		uniforms.d.value = this.duration * 60;
		uniforms.o.value = this.easingOffset;
		uniforms.m.value = this.magnitude;
		uniforms.crazyScale.value = this.crazy ? 1 : 0;
		
		expanded = !expanded;
	};
	
	/**
	 * Creates the objects we need
	 */
	function createObjects()
	{
		// load the cylinder and monkey meshes
		var loader = new THREE.JSONLoader();
		loader.load({model:"data/cylinder.js", callback:onHelixDataLoaded});
		loader.load({model:"data/monkey.js", callback:onMonkeyDataLoaded});

		// particles!
		particleMaterial	= new THREE.ParticleBasicMaterial({
			color: 0xFF66FF,
			size: 1,
			blending: THREE.AdditiveBlending,
			transparent: true
		});
		particleGeometry = new THREE.Geometry();
		for(var p = 0; p < PARTICLES; p++) {
			particleGeometry.vertices.push(
			new THREE.Vertex(
				new THREE.Vector3(
					Math.random() * 1000 - 500,
					Math.random() * 1000 - 500,
					Math.random() * 1000 - 500)
				)
			);
		}
		
		particleSystem = new THREE.ParticleSystem(particleGeometry, particleMaterial);
		scene.addChild(particleSystem);
	}
	
	/**
	 * Creates the uniforms object
	 */
	function createUniforms() {
		return {
			t: {type: 'f', value: 0},
			b: {type: 'f', value: 0},
			c: {type: 'f', value: 0},
			d: {type: 'f', value: 0},
			e: {type: 'f', value: 0},
			o: {type: 'f', value: 0},
			m: {type: 'f', value: 0},
			maxY: {type: 'f', value: 1.0},
			period: {type: 'f', value: 0.01},
			yScale: {type: 'f', value: 1.0},
			crazyScale: {type: 'f', value: 0.0}
		};
	}
	
	/**
	 * As above but for attributes
	 */
	function createAttributes() {
		
		return {
			easeOffset: {
				type: 'f',
				value: []
			},
			easeMagnitude: {
				type: 'f',
				value: []
			},
			crazy: {
				type: 'f',
				value: []
			}
		};
		
	}
	
	/**
	 * Called when both meshes have loaded
	 */
	function loadComplete() {
	
		// if both haven't loaded stop
		if(!(monkeyLoaded && helixLoaded))
			return;
		
		// go gui
		addGUI();

		// add meshes and switch
		// on whichever we're looking at
		scene.addChild(monkey);
		scene.addChild(helix);
		switchMesh();
	}
	
	/**
	 * Adds the lovely GUI from Google
	 */
	function addGUI() {
		$("#loading").remove();
		
		var gui = new DAT.GUI(),
		$gui	= $('#guidat'),
		msg		= $('#msg').html();
	
		$gui.css({
			right: 'auto',
			left: 10
		});
		
		$gui.find(".guidat").prepend('<div class="msg">'+msg+'</div>');
		gui.add(AEROTWIST.WebGLEasing, 'easingType').name('Easing Type').options({
			'Elastic': 1,
			'Circular': 2,
			'Exponential': 3,
			'Back': 4
		});
		gui.add(AEROTWIST.WebGLEasing, 'magnitude').name('Magnitude').min(10).max(150);
		gui.add(AEROTWIST.WebGLEasing, 'easingOffset').name('Offset').min(0).max(10);
		gui.add(AEROTWIST.WebGLEasing, 'duration').name('Duration').min(0.1).max(10);
		gui.add(AEROTWIST.WebGLEasing, 'mesh').name('Object').options({
			'Monkey': 0,
			'Helix': 1
		}).onChange(switchMesh);
		gui.add(AEROTWIST.WebGLEasing, 'crazy').name('Extra Crazy');
		gui.add(AEROTWIST.WebGLEasing, 'update').name('Go!');
		
		// force the gui to calculate the correct height
		// - sure there must be a better way :-/
		gui.toggle();
		gui.toggle();
	}
	
	/**
	 * Toggles between monkey and helix. Now there's a
	 * comment I never expected to write
	 */
	function switchMesh() {
		if(scene) {
			if(AEROTWIST.WebGLEasing.mesh === MONKEY) {

				uniforms.yScale.value	= MONKEY_YSCALE;
				uniforms.period.value 	= MONKEY_PERIOD;
				uniforms.maxY.value 	= monkeyMaxY;
				
				helixLeft.visible 		= false;
				helixRight.visible 		= false;
				monkey.visible 			= true;
			} else {

				uniforms.yScale.value	= HELIX_YSCALE;
				uniforms.period.value 	= HELIX_PERIOD;
				uniforms.maxY.value 	= helixMaxY;

				helixLeft.visible 		= true;
				helixRight.visible 		= true;
				monkey.visible 			= false;
			}
		}
	}
	
	/**
	 * Callback for the monkey mesh being available.
	 * Monkey see, monkey do
	 */
	function onMonkeyDataLoaded(monkeyGeom) {
		
		for(var v = 0; v < monkeyGeom.vertices.length; v++) {
			attributesMonkey.crazy.value.push(Math.random() * 20);
			attributesMonkey.easeOffset.value.push(monkeyGeom.vertices[v].position.y);
			attributesMonkey.easeMagnitude.value.push(1);
			monkeyGeom.vertices[v].position.multiplyScalar(125);
		}
		
		monkeyGeom.computeBoundingBox();
		
		monkeyMaxY = 1/Math.max(Math.abs(monkeyGeom.boundingBox.y[1]),Math.abs(monkeyGeom.boundingBox.y[0]));
		
		// make monkey
		monkey 	= new THREE.Mesh(
					monkeyGeom,
					new THREE.MeshShaderMaterial({
						attributes: attributesMonkey,
						uniforms: uniforms,
						vertexShader: AEROTWIST.Shaders.Sphere.vertex,
						fragmentShader: AEROTWIST.Shaders.Sphere.fragment
					}));
		
		monkeyLoaded = true;
		monkey.visible = false;
		loadComplete();
	}
	
	/**
	 * Helix mesh available
	 */
	function onHelixDataLoaded(geom)
	{
		var geomLeft 	= new THREE.Geometry(),
			geomRight 	= new THREE.Geometry(),
			particleGeometry,
			particleMaterial,
			particleSystem;
		
		for(var v = 0; v < geom.vertices.length; v++) {
			
			attributesLeft.crazy.value.push(Math.random() * 20);
			attributesRight.crazy.value.push(Math.random() * 20);
			
			attributesLeft.easeOffset.value.push(geom.vertices[v].position.y);
			attributesRight.easeOffset.value.push(geom.vertices[v].position.y);
			
			attributesLeft.easeMagnitude.value.push(1);
			attributesRight.easeMagnitude.value.push(-1);
			
			geom.vertices[v].position.multiplyScalar(25);
			geom.vertices[v].position.y *= 1.5;
		}
		
		geom.computeBoundingBox();
		
		helixMaxY = 1/Math.max(Math.abs(geom.boundingBox.y[1]),Math.abs(geom.boundingBox.y[0]));
		
		$.extend(true, geomLeft, geom);
		$.extend(true, geomRight, geom);
		
		helix 		= new THREE.Object3D();
		helixLeft 	= new THREE.Mesh(
				geomLeft,
			new THREE.MeshShaderMaterial({
				attributes: attributesLeft,
				uniforms: uniforms,
				vertexShader: AEROTWIST.Shaders.Sphere.vertex,
				fragmentShader: AEROTWIST.Shaders.Sphere.fragment
			}));
		
		helixRight 	= new THREE.Mesh(
			geomRight,
			new THREE.MeshShaderMaterial({
				attributes: attributesRight,
				uniforms: uniforms,
				vertexShader: AEROTWIST.Shaders.Sphere.vertex,
				fragmentShader: AEROTWIST.Shaders.Sphere.fragment
			}));
		
		helix.addChild(helixLeft);
		helix.addChild(helixRight);
		
		helixLoaded = true;
		helixLeft.visible = false;
		helixRight.visible = false;
		loadComplete();
	}
	
	/**
	 * Creates the WebGL renderer
	 */
	function createRenderer()
	{
		renderer 					= new THREE.WebGLRenderer({antialias:true});
		
		// I <3'z this new showbiz trackball cam
		camera = new THREE.TrackballCamera({

			fov: 45, 
			aspect: width / height,
			near: 1,
			far: 1e4,
			domElement: $container[0],

			rotateSpeed: 1.0,
			noZoom: true,
			noPan: true,

			staticMoving: false,
			dynamicDampingFactor: 0.05

		});
		scene 						= new THREE.Scene();
	
	    // position the camera
	    camera.position.z			= DEPTH;
	    camera.position.x			= DEPTH;
	    camera.position.y			= DEPTH;
	    
	    // start the renderer
	    renderer.setSize(width, height);
	    $container.append(renderer.domElement);
	}
	
	/**
	 * Sets up the event listeners for 
	 * the window resize
	 */
	function addEventListeners()
	{
		// window event
		$(window).resize(callbacks.windowResize);
		
	}
	
	/**
	 * Updates stuff, mainly just the uniform
	 * in this case
	 */
	function update()
	{
		if(helix) {
			uniforms.t.value++;
		}
		
		// set up a request for a render
		requestAnimationFrame(render);
	}
	
	/**
	 * Renders the current state
	 */
	function render()
	{
		// only render
		if(renderer) {
			renderer.render(scene, camera);
		}
		
		// set up the next frame
		update();
	}
	
	/**
	 * Our internal callbacks object - a neat
	 * and tidy way to organise the various
	 * callbacks in operation.
	 */
	callbacks = {
		windowResize: function() {
			if(renderer)
			{
				WIDTH			= $container.width(),
				HEIGHT			= $container.height(),
				camera.aspect 	= WIDTH / HEIGHT,
				renderer.setSize(WIDTH, HEIGHT);
			
				camera.updateProjectionMatrix();
			}
		}
	};
};