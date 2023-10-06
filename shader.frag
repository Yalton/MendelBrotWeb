precision highp float;

uniform vec2 resolution;
uniform vec2 center;
uniform float zoom;

vec4 mandelbrotShader() {
  vec2 position = (gl_FragCoord.xy - resolution.xy / 2.0) / zoom + center;
  
  vec2 z = vec2(0.0);
  vec2 c = position;
  
  float iterations = 0.0;
  float maxIterations = 100.0;
  
  for (int i = 0; i < int(maxIterations); i++) {
    if (dot(z, z) > 4.0) {
      break;
    }
    
    float x = z.x * z.x - z.y * z.y + c.x;
    float y = 2.0 * z.x * z.y + c.y;
    
    z = vec2(x, y);
    
    iterations += 1.0;
  }
  
  float smoothColor = iterations + 1.0 - log2(log2(dot(z, z))) / log2(2.0);
  
  float hue = smoothColor / maxIterations;
  float saturation = 1.0;
  float value = smoothColor < maxIterations ? 1.0 : 0.0;
  
  vec3 color = hsv2rgb(vec3(hue, saturation, value));
  
  return vec4(color, 1.0);
}

void main() {
  gl_FragColor = mandelbrotShader();
}