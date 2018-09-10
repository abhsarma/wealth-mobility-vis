var canvas = {w: 960, h: 500},
	margin = { left: 10, bottom: 10, right: 10, top: 10 };

var div_wealthy = d3.select('#graph-wealthy')
			.append('div')
			.style('position', 'relative')
			.style('left', '0px')
			.style('top', '0px')
			.style('width', canvas.w + 'px')
			.style('height', canvas.h + 'px');

var div_poor = d3.select('#graph-poor')
			.append('div')
			.style('position', 'relative')
			.style('left', '0px')
			.style('top', '0px')
			.style('width', canvas.w + 'px')
			.style('height', canvas.h + 'px');

var count = 5000;

var yScale = d3.scaleLinear()
	.domain([0, 4])
	.range([-0.8, 0.8])

function draw_flow(element, proportionBlack, parent_quintile, white_threshold, black_threshold) {
	var wScale = d3.scaleThreshold()
		.domain(white_threshold)
		.range([0, 1, 2, 3, 4])

	var bScale = d3.scaleThreshold()
		.domain(black_threshold)
		.range([0, 1, 2, 3, 4])

	var data = d3.range(count).map(i => {
		p = Math.random();
		var isB = (p < proportionBlack) ? 1 : 0;
		var q = (isB ? bScale : wScale)( Math.random() );

		return {
			speed: Math.random() * 2 + 1,
			x: Math.random() * 2 - 1,
			y0: yScale(parent_quintile),
			y1: yScale(q),
			dy: Math.random() * 0.2,
			isB
		}
	})

	data = d3.shuffle(data);

	var regl = createREGL({container: element.node()})

	var drawPoints = regl({
		vert: `
			precision mediump float;
			attribute float speed, x, y0, y1, dy;
			attribute float isB;
			varying float c;
			uniform float interp;			
			void main() {
				float t = mod(x + interp*speed, 1.0);
				
				// cubic ease
				float ct = t < 0.5
					? 512.0 * pow(t, 10.0)
					: -0.5 * pow(abs(2.0 * t - 2.0), 10.0) + 1.0;

				float x = mix(-1.0, 1.0, t);
				float y = mix(y0, y1, ct);

				gl_Position = vec4(x, y + dy, 0, 1);
				gl_PointSize = 8.0;

				c = isB;
			}`,

		frag: `
			precision mediump float;
			varying float c;
			void main() {
				vec4 blue = vec4(0.00, 0.65, 1.00, 0.85);
				vec4 orng = vec4(1.00, 0.45, .011, 0.85);

				gl_FragColor = c == 1.0 ? blue : orng;
			}`,

		attributes: {
			speed: data.map(d => d.speed),
			x:	data.map(d => d.x),
			y0: data.map(d => d.y0),
			y1: data.map(d => d.y1),
			dy: data.map(d => d.dy),
			isB: data.map(d => d.isB)
		},
		uniforms: {
			interp: function(context, props){
				return props.interp;
			}
		},
		primitive: 'point',
		count
	})

	regl.frame(({ time }) => {

		drawPoints({ 
			data: data,
			interp: time / 50 
		})
	})
}

draw_flow(div_wealthy, 1/20, 4, [0.067, 0.137, 0.272, 0.583], [0.019, 0.035, 0.479, 0.999]);
draw_flow(div_poor, 2/3, 0, [0.34, 0.63, 0.803, 0.898], [0.447, 0.75, 0.929, 0.983]);