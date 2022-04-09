const vertex = `
varying vec2 vUv;

void main() {
	vUv = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
const fragment = `
varying vec2 vUv;
uniform sampler2D map;

void main() {
 gl_FragColor = texture2D(map, vUv);
}
`;

export default {
  fragment,
  vertex
};
