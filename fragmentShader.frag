
//mendelbrotShader.frag 
precision highp float;

uniform vec2 resolution;
uniform vec2 center;
uniform float zoom;

vec3 hsv2rgb(vec3 hsv) {
  vec3 rgb;
  
  float c = hsv.z * hsv.y;
  float x = c * (1.0 - abs(mod(hsv.x * 6.0, 2.0) - 1.0));
  float m = hsv.z - c;
  
  if (hsv.x < 1.0 / 6.0) {
    rgb = vec3(c, x, 0.0);
  } else if (hsv.x < 2.0 / 6.0) {
    rgb = vec3(x, c, 0.0);
  } else if (hsv.x < 3.0 / 6.0) {
    rgb = vec3(0.0, c, x);
  } else if (hsv.x < 4.0 / 6.0) {
    rgb = vec3(0.0, x, c);
  } else if (hsv.x < 5.0 / 6.0) {
    rgb = vec3(x, 0.0, c);
  } else {
    rgb = vec3(c, 0.0, x);
  }
  
  return rgb + m;
}

vec4 mandelbrotShader() {
  vec2 position = (gl_FragCoord.xy - resolution.xy / 2.0) / zoom + center;
  
  vec2 z = vec2(0.0);
  vec2 c = position;
  
  float iterations = 0.0;
  const float maxIterations = 100.0;
  
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
  vec4 color = mandelbrotShader(); // Calculate Mandelbrot color here
  gl_FragColor = color;
}