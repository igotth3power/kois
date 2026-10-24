// Wave pass: mô phỏng mặt nước bằng phương trình sóng 2D (heightfield).
// R = độ cao hiện tại, G = độ cao frame trước. Ping-pong như stir.
precision highp float;

uniform sampler2D uPrev;
uniform vec2 uTexel;
uniform vec2 uA, uB;      // đoạn chuột đi trong substep này (uv)
uniform float uAmount;    // độ sâu nhấn xuống, tỉ lệ với tốc độ chuột
uniform float uRadius;    // bán kính vùng nhấn, đơn vị chiều cao màn hình
uniform float uDamping;   // < 1: sóng tắt dần
uniform float uAspect;

varying vec2 vUv;

// Khoảng cách từ p tới đoạn ab: thả "vết" dạng viên thuốc dọc đường chuột,
// nên chuột nhanh vẫn ra vệt liền chứ không thành chuỗi chấm tròn.
float segDist(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float t = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-8), 0.0, 1.0);
  return length(pa - ba * t);
}

void main() {
  vec2 c = texture(uPrev, vUv).rg;
  float n = texture(uPrev, vUv + vec2(0.0, uTexel.y)).r;
  float s = texture(uPrev, vUv - vec2(0.0, uTexel.y)).r;
  float e = texture(uPrev, vUv + vec2(uTexel.x, 0.0)).r;
  float w = texture(uPrev, vUv - vec2(uTexel.x, 0.0)).r;

  // Sơ đồ sai phân kinh điển (c^2 = 0.5, luôn ổn định):
  // h(t+1) = (tổng 4 lân cận) / 2 - h(t-1)
  float h = (n + s + e + w) * 0.5 - c.g;
  h *= uDamping;

  vec2 asp = vec2(uAspect, 1.0);
  float d = segDist(vUv * asp, uA * asp, uB * asp);
  h -= uAmount * exp(-(d * d) / max(uRadius * uRadius, 1e-6));

  // Tắt sóng sát viền, nếu không sóng dội lại từ mép khung trông như bể kính.
  vec2 ed = smoothstep(vec2(0.0), vec2(0.04), vUv)
          * smoothstep(vec2(0.0), vec2(0.04), 1.0 - vUv);
  h *= mix(0.9, 1.0, min(ed.x, ed.y));

  gl_FragColor = vec4(h, c.r, 0.0, 1.0);
}
