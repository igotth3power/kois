// Composite: ảnh nền nhìn qua một lớp nước.
//   - stir: kéo nội dung theo chuột (lấy mẫu tại uv - disp)
//   - wave: normal của mặt sóng -> khúc xạ + highlight + sáng/tối 2 sườn sóng
precision highp float;

uniform sampler2D uImage;
uniform sampler2D uStir;
uniform sampler2D uWave;
uniform vec2 uWaveTexel;
uniform vec2 uCover;     // scale uv để ảnh "cover" màn hình
uniform float uMax;
uniform float uLift;     // sáng lên chỗ bị khuấy
uniform float uChroma;   // tán sắc: mỗi kênh màu khúc xạ lệch một chút
uniform float uNormalK;  // độ dốc mặt sóng
uniform float uRefract;  // độ lệch khúc xạ (uv)
uniform float uSpec;     // highlight phản chiếu
uniform float uShade;    // sáng/tối theo hướng sườn sóng
uniform float uCaustic;  // gom sáng ở đáy sóng (giả caustic)
uniform float uDebug;    // 1 = buffer stir, 2 = heightfield

varying vec2 vUv;

const vec3 LIGHT = vec3(-0.45, 0.6, 0.66);

vec3 bg(vec2 uv) {
  return texture(uImage, (uv - 0.5) * uCover + 0.5).rgb;
}

float height(vec2 uv) { return texture(uWave, uv).r; }

void main() {
  vec2 disp = texture(uStir, vUv).xy;

  float hC = height(vUv);
  float hL = height(vUv - vec2(uWaveTexel.x, 0.0));
  float hR = height(vUv + vec2(uWaveTexel.x, 0.0));
  float hD = height(vUv - vec2(0.0, uWaveTexel.y));
  float hU = height(vUv + vec2(0.0, uWaveTexel.y));

  if (uDebug > 1.5) {
    gl_FragColor = vec4(vec3(0.5 + hC * 0.5), 1.0);
    return;
  }
  if (uDebug > 0.5) {
    gl_FragColor = vec4(0.5 + disp * 4.0, 0.5, 1.0);
    return;
  }

  vec3 N = normalize(vec3((hL - hR) * uNormalK, (hD - hU) * uNormalK, 1.0));
  vec3 L = normalize(LIGHT);

  // Khúc xạ: nhìn xuyên mặt nước nghiêng thì đáy bị lệch theo N.xy.
  vec2 refr = N.xy * uRefract;
  vec2 uv = vUv - disp - refr;
  vec2 ca = (refr + disp) * uChroma;
  vec3 col = vec3(bg(uv - ca).r, bg(uv).g, bg(uv + ca).b);

  // Sườn quay về phía đèn sáng hơn, sườn kia tối hơn -> sóng có khối.
  col *= 1.0 + dot(N.xy, L.xy) * uShade;

  // Caustic: đáy lõm (laplacian dương) gom ánh sáng.
  float lap = (hL + hR + hD + hU - 4.0 * hC);
  col *= 1.0 + max(lap, 0.0) * uCaustic;

  col *= 1.0 + uLift * min(length(disp) / max(uMax, 1e-4), 1.0);

  // Highlight Blinn-Phong, trừ đi phần của mặt phẳng để nước lặng không bị lóa.
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  float spec0 = pow(H.z, 120.0);
  float spec = max(pow(max(dot(N, H), 0.0), 120.0) - spec0, 0.0);
  col += spec * uSpec;

  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
