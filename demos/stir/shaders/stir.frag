// Stir pass: ping-pong buffer, RG = displacement (screen uv units).
// Mỗi frame: advect theo drift -> suy giảm -> cộng vận tốc chuột -> saturate -> fade viền.
precision highp float;

uniform sampler2D uPrev;
uniform vec2 uPtr;       // vị trí chuột (uv)
uniform vec2 uPtrVel;    // delta uv của chuột trong frame này
uniform vec2 uDrift;     // dòng chảy nền (uv / giây)
uniform float uDt;
uniform float uFade;     // giây để còn 5%
uniform float uRadius;   // bán kính splat, đơn vị chiều cao màn hình
uniform float uStrength;
uniform float uMax;      // trần displacement
uniform float uAspect;   // width / height

varying vec2 vUv;

void main() {
  // Chỉ advect theo dòng nền, KHÔNG theo chính displacement -> tránh nổ noise.
  vec2 back = vUv - uDrift * uDt;
  float tau = max(uFade, 1e-3) / 3.0;
  vec2 d = texture(uPrev, back).xy * exp(-uDt / tau);

  // Splat vận tốc (không phải vị trí): chuột đứng yên thì không có gợn.
  vec2 p = (vUv - uPtr) * vec2(uAspect, 1.0);
  d += uPtrVel * uStrength * exp(-dot(p, p) / max(uRadius * uRadius, 1e-6));

  // Saturate mềm thay cho clamp: clamp làm gãy đạo hàm -> nếp gấp trên ảnh.
  float m = length(d);
  if (m > 1e-6) d = (d / m) * uMax * (1.0 - exp(-m / max(uMax, 1e-6)));

  // Fade 6% viền để lookup không bao giờ ra khỏi khung (tránh vệt clamp-to-edge).
  vec2 e = smoothstep(vec2(0.0), vec2(0.06), vUv)
         * smoothstep(vec2(0.0), vec2(0.06), 1.0 - vUv);
  gl_FragColor = vec4(d * min(e.x, e.y), 0.0, 1.0);
}
