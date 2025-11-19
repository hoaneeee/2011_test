import React, { useState, useEffect, Suspense, useRef, useMemo } from "react";
import "./App.css";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { ShaderMaterial } from "three";
import { GradientTexture } from "@react-three/drei";

// ----- CUSTOM FRESNEL SHADER -----
const CustomFresnelShader = {
  uniforms: {
    color: { value: new THREE.Color("#ffb6ff") },
    power: { value: 2.5 },
  },
  vertexShader: `
    varying float vDot;
    void main() {
      vec3 worldNormal = normalize(normalMatrix * normal);
      vec3 I = normalize(vec3(modelViewMatrix * vec4(position, 1.0)));
      vDot = pow(1.0 - dot(worldNormal, I), 2.0);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 color;
    varying float vDot;
    void main() {
      gl_FragColor = vec4(color * vDot, vDot);
    }
  `,
};
/* ========= Plane hiển thị ảnh, giữ đúng tỉ lệ ========= */

function ImagePlane({ texture, size = 0.8 }) {
  const ref = useRef();

  useEffect(() => {
    if (!texture || !texture.image || !ref.current) return;
    const img = texture.image;
    const aspect = img.width / img.height || 1;

    // Chiều rộng = size, chiều cao = size / aspect
    ref.current.scale.set(size, size / aspect, 1);
  }, [texture, size]);

  return (
    <mesh ref={ref}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} transparent />
    </mesh>
  );
}

// 👉 Ảnh cô giáo (có thể đổi sang import local)
const TEACHER_IMAGE_URL =
  "https://images.pexels.com/photos/4260323/pexels-photo-4260323.jpeg";

const TEACHER_NAME = "Cô giáo của tụi em";

function App() {
  const [stage, setStage] = useState("bouquet"); // "bouquet" | "letter" | "universe"
  const [letterOpened, setLetterOpened] = useState(false);

  useEffect(() => {
    if (stage === "letter") {
      const openId = setTimeout(() => setLetterOpened(true), 150);
      return () => clearTimeout(openId);
    }
    const closeId = setTimeout(() => setLetterOpened(false), 0);
    return () => clearTimeout(closeId);
  }, [stage]);

  return (
    <div className="app-root">
      <div className="background-gradient" />

      {stage === "bouquet" && (
        <BouquetScreen onClick={() => setStage("letter")} />
      )}

      {stage === "letter" && (
        <LetterScreen
          teacherImage={TEACHER_IMAGE_URL}
          teacherName={TEACHER_NAME}
          opened={letterOpened}
          onSeeUniverse={() => setStage("universe")}
        />
      )}

      {stage === "universe" && (
        <UniverseScreen
          teacherImage={TEACHER_IMAGE_URL}
          teacherName={TEACHER_NAME}
          onBackToLetter={() => setStage("letter")}
        />
      )}
    </div>
  );
}

/* =============== MÀN 1: BÓ HOA =============== */

function BouquetScreen({ onClick }) {
  return (
    <div className="screen screen--center">
      <div className="bouquet-card" onClick={onClick}>
        <div className="bouquet-glow" />
        <div className="bouquet-icon">
          <span role="img" aria-label="bouquet">
            💐
          </span>
        </div>
        <div className="bouquet-content">
          <h1>Chúc mừng 20/11</h1>
          <p>Nhấn vào bó hoa để mở lá thư dành riêng cho cô giáo.</p>
        </div>
        <div className="bouquet-hint">Nhấn vào đây nhé</div>
      </div>
    </div>
  );
}

/* =============== MÀN 2: LÁ THƯ =============== */

function LetterScreen({ teacherImage, teacherName, opened, onSeeUniverse }) {
  return (
    <div className="screen screen--center">
      <div className="letter-layout">
        {/* Ảnh cô */}
        <div className="teacher-photo-wrapper">
          <div className="teacher-photo-border">
            <div
              className="teacher-photo"
              style={
                teacherImage
                  ? { backgroundImage: `url(${teacherImage})` }
                  : undefined
              }
            >
              {!teacherImage && (
                <span className="teacher-photo-placeholder">Ảnh cô</span>
              )}
            </div>
          </div>
          <div className="teacher-caption">{teacherName}</div>
        </div>

        {/* Phong bì */}
        <div className="envelope-wrapper">
          <div className={`envelope ${opened ? "envelope--open" : ""}`}>
            <div className="envelope-back" />
            <div className="envelope-flap" />
            <div className="envelope-letter">
              <div className="letter-inner">
                <h2>Gửi cô nhân ngày 20/11</h2>
                <p>
                  Nhân ngày Nhà giáo Việt Nam, tụi em cảm ơn cô vì những giờ học
                  đầy tâm huyết, vì sự kiên nhẫn, dịu dàng và cả những lần cô
                  nghiêm khắc để tụi em trưởng thành hơn.
                </p>
                <p>
                  Mong cô luôn khỏe mạnh, bình an, lúc nào cũng giữ được nụ cười
                  thật tươi và có nhiều niềm vui nhỏ xinh như chính những bài
                  giảng của cô mỗi ngày.
                </p>
                <p className="letter-sign">
                  – Lời chúc nhỏ bé từ “học trò nhỏ” của cô –
                </p>
              </div>
            </div>
            <div className="envelope-shadow" />
          </div>

          <button
            className="primary-button letter-button"
            onClick={onSeeUniverse}
          >
            Xem vũ trụ chỉ có cô giáo
          </button>
        </div>
      </div>
    </div>
  );
}

/* =============== MÀN 3: VŨ TRỤ 3D =============== */

function UniverseScreen({ teacherImage, teacherName, onBackToLetter }) {
  return (
    <div className="screen universe-screen">
      <div className="universe-bg" />

      <div className="universe-top-bar">
        <button className="ghost-button" onClick={onBackToLetter}>
          ← Quay lại lá thư
        </button>
      </div>

      <div className="universe-center">
        <div className="universe-title">
          <h1>Vũ trụ chỉ có {teacherName}</h1>
          <p>
            Kéo – xoay – phóng to thu nhỏ để khám phá vũ trụ nơi cô là tâm điểm.
          </p>
        </div>

        <div className="universe-canvas-wrapper">
          <Canvas camera={{ position: [0, 2.5, 10], fov: 60 }} dpr={[1, 2]}>
            <color attach="background" args={["#050516"]} />
            <fog attach="fog" args={["#0b0e28", 10, 35]} />
            <Suspense fallback={null}>
              <UniverseScene teacherImage={teacherImage} />
            </Suspense>
          </Canvas>
        </div>
      </div>
    </div>
  );
}

/* ----- Bên trong Canvas: hành tinh, vành ảnh cô, sao, camera… ----- */

function UniverseScene({ teacherImage }) {
  const texture = useTexture(teacherImage);

  return (
    <>
      {/* Ánh sáng */}
      <ambientLight intensity={0.45} />
      <directionalLight intensity={1.2} position={[5, 5, 5]} color={0xffccdd} />
      <pointLight intensity={0.6} position={[-4, -2, -6]} color={0x88ccff} />
      {/* Sao nền */}
      <Stars
        radius={200}
        depth={80}
        count={6000}
        factor={3}
        saturation={0}
        fade
        speed={0.5}
      />
      {/* Hành tinh trung tâm */}
      <PlanetCore />
      {/* Vành đai ảnh cô bay xung quanh */}
      <ImageRing texture={texture} />
      {/* Một “dải ảnh” xa xa kiểu background */}
      <FloatingImageBelt texture={texture} />
      ánh sáng fill để ảnh cô sáng hơn ở không gian tối
      <ambientLight intensity={0.25} />
      {/* Điều khiển camera */}
      <OrbitControls
        enablePan={false}
        minDistance={4}
        maxDistance={10}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </>
  );
}

/* --------- Hành tinh trung tâm --------- */

function PlanetCore() {
  const planetRef = useRef();

  useFrame((_, delta) => {
    if (planetRef.current) {
      planetRef.current.rotation.y += delta * 0.2;
    }
  });

  // ⭐ Tạo Fresnel material từ shader tùy chỉnh
  const fresnelMaterial = new ShaderMaterial({
    uniforms: THREE.UniformsUtils.clone(CustomFresnelShader.uniforms),
    vertexShader: CustomFresnelShader.vertexShader,
    fragmentShader: CustomFresnelShader.fragmentShader,
    transparent: true,
  });

  return (
    <group ref={planetRef}>
      {/* Hành tinh gradient */}
      <mesh>
        <sphereGeometry args={[1.8, 64, 64]} />
        <meshStandardMaterial
          roughness={0.15}
          metalness={0.7}
          envMapIntensity={1.4}
        >
          <GradientTexture
            attach="map"
            stops={[0, 0.3, 1]}
            colors={["#ffe0f7", "#d4a8ff", "#8f6aff"]}
            size={256}
          />
        </meshStandardMaterial>
      </mesh>

      {/* Hành tinh Fresnel Glow */}
      <mesh>
        <sphereGeometry args={[1.82, 64, 64]} />
        <shaderMaterial attach="material" args={[fresnelMaterial]} />
      </mesh>

      {/* Vòng sáng */}
      <mesh rotation={[Math.PI / 2.6, 0, 0]}>
        <torusGeometry args={[2.4, 0.04, 32, 220]} />
        <meshBasicMaterial color={"white"} transparent opacity={0.9} />
      </mesh>

      <mesh rotation={[Math.PI / 2.6, 0, Math.PI / 4]}>
        <torusGeometry args={[2.4, 0.04, 32, 220]} />
        <meshBasicMaterial color={"#e0f2fe"} transparent opacity={0.6} />
      </mesh>
    </group>
  );
}


/* --------- Vòng lớn ảnh cô xung quanh --------- */

function ImageRing({ texture }) {
  const ringRef = useRef();
  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.y += delta * 0.4;
    }
  });

  const count = 26;
  const radius = 33;
  const images = Array.from({ length: count });

  return (
    <group ref={ringRef}>
      {images.map((_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = Math.sin(angle * 2) * 0.6;

        return (
          <group key={i} position={[x, y, z]} rotation={[0, -angle, 0]}>
            <ImagePlane texture={texture} size={0.75} />
          </group>
        );
      })}
    </group>
  );
}

/* --------- Dải ảnh xa xa (belt) --------- */

function FloatingImageBelt({ texture }) {
  const beltRef = useRef();

  const count = 80;
  const radius = 6;

  // Tạo vị trí ổn định (pure) bằng pseudoNoise
  const positions = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const noise = pseudoNoise(i); // số từ 0 → 1, ổn định theo i
      const y = (noise - 0.5) * 1.5;

      return { x, y, z, angle };
    });
  }, [count, radius]);

  useFrame((_, delta) => {
    if (beltRef.current) {
      beltRef.current.rotation.y -= delta * 0.12;
    }
  });

  return (
    <group ref={beltRef} position={[0, 0.6, -1]}>
      {positions.map(({ x, y, z, angle }, i) => (
        <group key={i} position={[x, y, z]} rotation={[0, -angle, 0]}>
          <ImagePlane texture={texture} size={0.45} />
        </group>
      ))}
    </group>
  );
}

/* --------- Hàm noise thuần (pure) --------- */

function pseudoNoise(i) {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x); // trả về số trong [0, 1)
}

/* --------- Mây nebula mờ phía sau --------- */


export default App;
