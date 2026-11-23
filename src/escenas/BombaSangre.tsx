import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {Camara, proyectar, temblor} from '../componentes/Camara';
import {Contador} from '../componentes/Contador';
import {Corazon3D} from '../componentes/Corazon3D';
import {Destellos, OndasLatido, Resplandor} from '../componentes/Efectos';
import {Escenario3D} from '../componentes/Escenario3D';
import {TAU, type V3} from '../componentes/utilidades3d';
import {FUENTE} from '../lib/fuente';
import {useEscena} from '../lib/escena';
import {acumular, envolventeLatido} from '../lib/latido';

/**
 * "Con cada latido empuja un chorrito de sangre, y en un solo día bombea unos 7 mil litros."
 * Primer plano del corazón bombeando glóbulos rojos por un caño de vidrio;
 * la cámara se abre y muestra un tanque gigante que se llena (0 → 7.000 litros).
 */

const BPM = 75;
const DESFASE = 0.8;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const POS_CORAZON: V3 = [-0.5, 1.2, 0];
const TANQUE = {x: 0.5, z: 0, base: -1.9, alto: 1.9, radio: 0.9};
const SALIDA: V3 = [0.85, 0.36, 0];

const CANO = new THREE.CatmullRomCurve3(
	[
		new THREE.Vector3(-0.15, 1.3, 0),
		new THREE.Vector3(0.45, 1.5, 0),
		new THREE.Vector3(0.95, 1.55, 0),
		new THREE.Vector3(1.25, 1.2, 0),
		new THREE.Vector3(1.2, 0.72, 0),
		new THREE.Vector3(SALIDA[0], SALIDA[1], SALIDA[2]),
	],
	false,
	'catmullrom',
	0.5,
);

const mezclar = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

export const BombaSangre: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const {momento, duracion} = useEscena();
	const t = frame / fps;

	const fase = (t * BPM) / 60 + DESFASE;
	const latido = envolventeLatido(fase);

	// flujo pulsátil por el caño (fracción del caño por segundo)
	const flujo = useMemo(
		() => acumular((seg) => 0.12 + 1.35 * envolventeLatido((seg * BPM) / 60 + DESFASE), duracion, fps),
		[duracion, fps],
	);
	const recorrido = flujo(frame);

	// momentos del guion
	const fChorrito = momento('chorrito');
	const fSangre = momento('sangre');
	const fBombea = momento('bombea');
	const fMil = momento('mil', {fin: true});
	const fDia = momento('día');

	// cámara: primer plano del corazón → plano general con el tanque
	const abrir = interpolate(frame, [fSangre - 8, fBombea + 4], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
	const sacudon = temblor(t, 0.8);
	const camBase = mezclar([-0.15, 1.45, 4.1], [1.1, 0.75, 8.4], abrir);
	const posicion: V3 = [camBase[0] + sacudon[0], camBase[1] + sacudon[1], camBase[2]];
	const mirarA = mezclar([-0.45, 1.22, 0], [0.05, 0.38, 0], abrir);

	// llenado del tanque
	const llenado = interpolate(frame, [fBombea - 4, fMil + 2], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
	const nivel = 0.03 + 0.9 * llenado;

	// etiquetas ancladas a objetos 3D
	const pCorazon = proyectar([POS_CORAZON[0], POS_CORAZON[1] - 0.92, 0.3], posicion, mirarA, width, height);
	const pTanque = proyectar([TANQUE.x, TANQUE.base + TANQUE.alto * 0.42, TANQUE.radio], posicion, mirarA, width, height);
	const etiquetaMl = spring({frame: frame - fChorrito, fps, config: {damping: 13}}) * (1 - interpolate(frame, [fDia - 14, fDia - 2], [0, 1], clamp));
	const aparicionContador = spring({frame: frame - fBombea + 6, fps, config: {damping: 14}});
	const pop = spring({frame: frame - fMil - 2, fps, config: {damping: 9, stiffness: 160}});

	return (
		<Escenario3D
			fondo="radial-gradient(circle at 50% 40%, #36e2d4 0%, #1a8fe3 36%, #2a3eb1 68%, #120a45 100%)"
			colorContraluz="#9ff3ff"
			overlay={
				<>
					<EtiquetaFlotante x={pCorazon.x} y={pCorazon.y} aparicion={etiquetaMl} texto="≈ 70 ml por latido" />
					<Contador
						valor={llenado * 7000}
						etiqueta="litros por día"
						color="#E5383B"
						aparicion={aparicionContador}
						pop={pop}
						top={pTanque.y - 110}
						desplazamientoX={(pTanque.x - width / 2) * 0.6}
					/>
				</>
			}
		>
			<Camara posicion={posicion} mirarA={mirarA} />

			<group position={POS_CORAZON} rotation={[0, 0.25 + 0.08 * Math.sin(t * 0.9), 0]}>
				<Corazon3D latido={latido} scale={0.62} color="#FF1F4B" />
			</group>
			<Resplandor color="#ff4d6d" escala={3.2 + 1.4 * latido} opacidad={0.45 + 0.4 * latido} position={[POS_CORAZON[0], POS_CORAZON[1], -0.6]} />

			<Cano />
			<Globulos recorrido={recorrido} />
			<Chorro t={t} intensidad={0.35 + 1.3 * envolventeLatido(fase - 0.18)} nivel={nivel} />
			<Tanque nivel={nivel} t={t} fase={fase} />

			<Destellos t={t} cantidad={45} rango={[7, 9, 5]} centro={[0.2, 0.2, -1]} tamano={0.05} semilla="bomba" colores={['#ffffff', '#9ff3ff', '#FFD23F']} />
		</Escenario3D>
	);
};

const EtiquetaFlotante: React.FC<{x: number; y: number; aparicion: number; texto: string}> = ({x, y, aparicion, texto}) =>
	aparicion > 0.01 ? (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				transform: `translate(-50%, 0) scale(${0.7 + 0.3 * aparicion})`,
				opacity: aparicion,
				padding: '16px 36px',
				borderRadius: 999,
				background: '#FFFFFF',
				color: '#C1121F',
				fontFamily: FUENTE,
				fontWeight: 900,
				fontSize: 58,
				whiteSpace: 'nowrap',
				boxShadow: '0 8px 0 rgba(0,0,0,0.25), 0 14px 34px rgba(0,0,0,0.3)',
			}}
		>
			{texto}
		</div>
	) : null;

const Cano: React.FC = () => (
	<group>
		<mesh renderOrder={2}>
			<tubeGeometry args={[CANO, 120, 0.12, 14, false]} />
			<meshStandardMaterial color="#DFFBFF" transparent opacity={0.3} roughness={0.08} depthWrite={false} />
		</mesh>
		{/* boca del caño */}
		<mesh position={SALIDA} rotation={[0, 0, 0.75]}>
			<torusGeometry args={[0.125, 0.035, 8, 24]} />
			<meshStandardMaterial color="#E9F7FF" roughness={0.2} />
		</mesh>
	</group>
);

/** Glóbulos rojos (rosquitas) avanzando a empujones por el caño. */
const Globulos: React.FC<{recorrido: number}> = ({recorrido}) => {
	const ref = useRef<THREE.InstancedMesh>(null);
	const cantidad = 30;
	const datos = useMemo(
		() =>
			new Array(cantidad).fill(0).map((_, i) => ({
				u0: i / cantidad + random(`glob-u-${i}`) * 0.02,
				dx: (random(`glob-x-${i}`) - 0.5) * 0.08,
				dy: (random(`glob-y-${i}`) - 0.5) * 0.08,
				giro: random(`glob-g-${i}`) * TAU,
			})),
		[],
	);
	useLayoutEffect(() => {
		const m = ref.current;
		if (!m) return;
		const o = new THREE.Object3D();
		const p = new THREE.Vector3();
		datos.forEach((g, i) => {
			const u = (g.u0 + recorrido) % 1;
			CANO.getPointAt(u, p);
			const visible = Math.min(1, u / 0.06, (1 - u) / 0.04);
			o.position.set(p.x + g.dx, p.y + g.dy, p.z);
			o.rotation.set(g.giro + recorrido * 9, g.giro, recorrido * 5);
			o.scale.setScalar(Math.max(0, visible));
			o.updateMatrix();
			m.setMatrixAt(i, o.matrix);
		});
		m.instanceMatrix.needsUpdate = true;
	});
	return (
		<instancedMesh ref={ref} args={[undefined, undefined, cantidad]} frustumCulled={false}>
			<torusGeometry args={[0.055, 0.032, 6, 12]} />
			<meshStandardMaterial color="#E01E37" emissive="#7a0010" emissiveIntensity={0.5} roughness={0.35} />
		</instancedMesh>
	);
};

/** Chorrito que cae desde el caño al tanque, más fuerte en cada latido. */
const Chorro: React.FC<{t: number; intensidad: number; nivel: number}> = ({t, intensidad, nivel}) => {
	const ref = useRef<THREE.InstancedMesh>(null);
	const cantidad = 16;
	const superficie = TANQUE.base + 0.08 + TANQUE.alto * nivel;
	useLayoutEffect(() => {
		const m = ref.current;
		if (!m) return;
		const o = new THREE.Object3D();
		for (let j = 0; j < cantidad; j++) {
			const p = (t * 1.9 + j / cantidad) % 1;
			const y = SALIDA[1] - 0.05 - p * p * (SALIDA[1] - superficie);
			o.position.set(SALIDA[0] - 0.12 * p + Math.sin(j * 7.1) * 0.02, y, Math.cos(j * 3.3) * 0.02);
			o.scale.set(1, 1.6, 1).multiplyScalar(0.55 + 0.45 * Math.min(1.4, intensidad));
			o.updateMatrix();
			m.setMatrixAt(j, o.matrix);
		}
		m.instanceMatrix.needsUpdate = true;
	});
	return (
		<instancedMesh ref={ref} args={[undefined, undefined, cantidad]} frustumCulled={false}>
			<sphereGeometry args={[0.055, 8, 6]} />
			<meshStandardMaterial color="#E01E37" emissive="#7a0010" emissiveIntensity={0.6} roughness={0.25} />
		</instancedMesh>
	);
};

const Tanque: React.FC<{nivel: number; t: number; fase: number}> = ({nivel, t, fase}) => {
	const alto = TANQUE.alto * nivel;
	const superficie = TANQUE.base + 0.08 + alto;
	const burbujas = useMemo(
		() =>
			new Array(14).fill(0).map((_, i) => ({
				x: (random(`bur-x-${i}`) - 0.5) * 1.2,
				z: (random(`bur-z-${i}`) - 0.5) * 1.2,
				v: 0.25 + random(`bur-v-${i}`) * 0.35,
				f: random(`bur-f-${i}`),
				s: 0.025 + random(`bur-s-${i}`) * 0.03,
			})),
		[],
	);
	return (
		<group position={[TANQUE.x, 0, TANQUE.z]}>
			{/* base */}
			<mesh position={[0, TANQUE.base - 0.02, 0]}>
				<cylinderGeometry args={[TANQUE.radio + 0.08, TANQUE.radio + 0.12, 0.16, 40]} />
				<meshStandardMaterial color="#2B2D42" roughness={0.5} />
			</mesh>
			{/* sangre */}
			<mesh position={[0, TANQUE.base + 0.08 + alto / 2, 0]}>
				<cylinderGeometry args={[TANQUE.radio - 0.04, TANQUE.radio - 0.04, Math.max(0.001, alto), 40]} />
				<meshStandardMaterial color="#C1121F" emissive="#5c0010" emissiveIntensity={0.45} roughness={0.3} />
			</mesh>
			<mesh position={[0, superficie + 0.001, 0]} rotation={[-Math.PI / 2 + 0.03 * Math.sin(t * 3), 0.03 * Math.cos(t * 2.6), 0]}>
				<circleGeometry args={[TANQUE.radio - 0.04, 40]} />
				<meshStandardMaterial color="#FF4D6D" emissive="#a0102a" emissiveIntensity={0.35} roughness={0.15} />
			</mesh>
			<OndasLatido
				fase={fase - 0.2}
				bpm={BPM}
				t={t}
				radio={0.12}
				expansion={3}
				duracion={0.8}
				color="#FFC2CF"
				position={[SALIDA[0] - TANQUE.x - 0.1, superficie + 0.012, 0]}
				rotation={[-Math.PI / 2, 0, 0]}
			/>
			{burbujas.map((b, i) => {
				const y = TANQUE.base + 0.1 + ((t * b.v + b.f) % 1) * Math.max(0, alto - 0.12);
				return alto > 0.15 ? (
					<mesh key={i} position={[b.x * 0.8, y, b.z * 0.8]}>
						<sphereGeometry args={[b.s, 8, 6]} />
						<meshBasicMaterial color="#FF8FA3" transparent opacity={0.7} />
					</mesh>
				) : null;
			})}
			{/* vidrio */}
			<mesh position={[0, TANQUE.base + TANQUE.alto / 2 + 0.04, 0]} renderOrder={3}>
				<cylinderGeometry args={[TANQUE.radio, TANQUE.radio, TANQUE.alto + 0.08, 48, 1, true]} />
				<meshStandardMaterial color="#E0FBFF" transparent opacity={0.2} roughness={0.05} side={THREE.DoubleSide} depthWrite={false} />
			</mesh>
			<mesh position={[0, TANQUE.base + TANQUE.alto + 0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
				<torusGeometry args={[TANQUE.radio, 0.035, 8, 48]} />
				<meshStandardMaterial color="#F1FAFF" roughness={0.2} />
			</mesh>
			{/* marcas de medida */}
			{[0.2, 0.4, 0.6, 0.8].map((k) => (
				<mesh key={k} position={[-TANQUE.radio * 0.62, TANQUE.base + 0.08 + TANQUE.alto * k, TANQUE.radio * 0.79]} rotation={[0, -0.67, 0]}>
					<boxGeometry args={[0.28, 0.025, 0.01]} />
					<meshBasicMaterial color="#FFFFFF" transparent opacity={0.8} />
				</mesh>
			))}
		</group>
	);
};
