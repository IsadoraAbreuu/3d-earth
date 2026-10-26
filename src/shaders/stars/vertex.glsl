attribute float aSize;
uniform float uPixelRatio;

void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float dist = length(mvPosition.xyz);
    gl_PointSize = aSize * uPixelRatio * (80.0 / dist);
    gl_Position = projectionMatrix * mvPosition;
}
