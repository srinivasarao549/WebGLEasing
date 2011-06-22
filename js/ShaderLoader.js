var AEROTWIST = AEROTWIST || {};
AEROTWIST.Shaders = AEROTWIST.Shaders || {};

// on doc ready load them in
$(document).ready(function(){

	// only bother if we think we support
	// WebGL in the browser
	if(Modernizr.webgl) {
		
		$("#loading").show();
		
		// get all the shaders from the DOM
		var fragmentShaders = $('script[type="x-shader/x-fragment"]');
		var vertexShaders	= $('script[type="x-shader/x-vertex"]');
		var shaderCount		= fragmentShaders.length + vertexShaders.length;
		
		/**
		 * Checks if we have finished loading
		 * all of the shaders in the DOM
		 */
		function checkForComplete() {
			if(!shaderCount) {
				
				// GO!
				AEROTWIST.WebGLEasing.init();
			}
		}
		
		/**
		 * Loads a shader using AJAX
		 * 
		 * @param {Object} The script tag from the DOM
		 * @param {String} The type of shader [vertex|fragment]
		 */
		function loadShader(shader, type) {
			
			// wrap up the shader for convenience
			var $shader = $(shader);
			
			// request the file over AJAX
			$.ajax({
				url: $shader.data('src'),
				dataType: 'text',
				context: {
					name: $shader.data('name'),
					type: type
				},
				complete: processShader
			});
		}
		
		/**
		 * Processes a shader that comes back from
		 * the AJAX and stores it in the Shaders
		 * Object for later on
		 * 
		 * @param {Object} The jQuery XHR object
		 * @param {String} The response text, e.g. success, error
		 */
		function processShader(jqXHR, textStatus) {
			
			// one down... some to go?
			shaderCount--;
			
			// create a placeholder if needed
			if(!AEROTWIST.Shaders[this.name]) {
				AEROTWIST.Shaders[this.name] = {
					vertex: '',
					fragment: ''
				};
			}
			
			// store it and check if we're done
			AEROTWIST.Shaders[this.name][this.type] = jqXHR.responseText;
			checkForComplete();
		}
		
		// load the fragment shaders
		for(var f = 0; f < fragmentShaders.length; f++) {
			var fShader = fragmentShaders[f];
			loadShader(fShader, 'fragment');
		}
		
		// and the vertex shaders
		for(var v = 0; v < vertexShaders.length; v++) {
			var vShader = vertexShaders[v];
			loadShader(vShader, 'vertex');
		}
		
		// there may be none so just
		// check that here
		checkForComplete();
	} else {
		$("#loading").hide();
		$(document.body).addClass('no-webgl');
	}
});