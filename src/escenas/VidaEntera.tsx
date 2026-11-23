import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {Easing, interpolate, interpolateColors, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {Avatar} from '../componentes/Avatar';
import {Camara, temblor} from '../componentes/Camara';
import {Contador} from '../componentes/Contador';
import {obtenerGeometriaCorazon} from '../componentes/Corazon3D';
import {Resplandor} from '../componentes/Efectos';
import {Escenario3D} from '../componentes/Escenario3D';
import {TAU, type V3} from '../componentes/utilidades3d';
import {useEscena} from '../lib/escena';
import {acumular, envolventeLatido} from '../lib/latido';

/**
 * "En toda una vida suma casi 3 mil millones de latidos, sin tomarse ni un solo día libre."
 * Un muñeco camina sobre un planeta mientras crece y envejece (el pelo se vuelve gris).
 * Alrededor se forma una galaxia de corazones a medida que el contador llega a 2.920.000.000.
 * Al final se detiene y saluda a cámara.
 */

const BPM = 70;
const RADIO_PLANETA = 1.6;
const TOTAL_LATIDOS = 2_920_000_000;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const mezclar = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

export const VidaEntera: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {momento, duracion} = useEscena();
	const t = frame / fps;
	const fase = (t * BPM) / 60 + 0.85;
	const latido = envolventeLatido(fase);

	const fSuma = momento('suma');
	const fLatidos = momento('latidos', {fin: true});
	const fLibre = momento('libre');
	const fFin = momento('libre', {fin: true});

	// contador y galaxia
	const progreso = interpolate(frame, [fSuma - 2, fLatidos + 6], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
	const aparicion = spring({frame: frame - fSuma + 8, fps, config: {damping: 14}});
	const pop = spring({frame: frame - fLatidos - 6, fps, config: {damping: 9, stiffness: 160}});

	// la vida del muñeco: crece y le salen canas
	const edad = interpolate(frame, [6, fLibre], [0, 1], clamp);
	const escala = 0.38 + 0.24 * Easing.out(Easing.cubic)(Math.min(1, edad / 0.4));
	const pelo = interpolateColors(edad, [0, 0.55, 1], ['#3B2416', '#4a3424', '#E6E6EA']);

	// al final se frena y saluda
	const saludo = interpolate(frame, [fLibre - 4, fFin + 8], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
	const giroPlaneta = useMemo(
		() =>
			acumular(
				(seg) => 0.5 * (1 - interpolate(seg * fps, [fLibre - 4, fFin + 8], [0, 1], clamp)),
				duracion,
				fps,
			),
		[duracion, fps, fLibre, fFin],
	);

	// golpe final de latido
	const golpeFinal = interpolate(frame, [fFin, fFin + 5, fFin + 26], [0, 1, 0], clamp);

	// cámara: de cerca del muñeco a plano general con la galaxia
	const abrir = interpolate(frame, [4, fLatidos + 10], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
	const sacudon = temblor(t, 0.6);
	const base = mezclar([0.75, 2.45, 3.1], [1.6, 2.9, 9.4], abrir);
	const orbita = 0.25 * Math.sin(t * 0.35);
	const posicion: V3 = [base[0] + orbita + sacudon[0], base[1] + sacudon[1], base[2]];
	const mirarA = mezclar([0, 2.02, 0], [0, 0.78, 0], abrir);

	return (
		<Escenario3D
			fondo="radial-gradient(circle at 50% 50%, #3d1a8f 0%, #23105e 40%, #0c0530 75%, #05021a 100%)"
			colorContraluz="#b18cff"
			overlay={
				<Contador
					valor={progreso * TOTAL_LATIDOS}
					etiqueta="latidos en 80 años"
					color="#FF2E63"
					aparicion={aparicion}
					pop={pop + golpeFinal * 0.5}
				/>
			}
		>
			<Camara posicion={posicion} mirarA={mirarA} />
			<Estrellas />

			<Planeta angulo={-giroPlaneta(frame)} />

			<group position={[0, RADIO_PLANETA - 0.02, 0]}>
				<Avatar
					t={t}
					mezcla={[
						{animacion: 'caminar', peso: 1 - saludo},
						{animacion: 'saludar', peso: saludo},
					]}
					frecuencia={1 - 0.15 * edad}
					rotation={[0, saludo * 0.2, 0]}
					scale={escala}
					latido={Math.min(1, latido + golpeFinal)}
					colores={{remera: '#FF5DA2', pantalon: '#3A86FF', zapatillas: '#FFFFFF', piel: '#F1B38A', pelo}}
				/>
			</group>
			<OndaFinal progreso={interpolate(frame, [fFin, fFin + 32], [0, 1], clamp)} />
			<Resplandor color="#ff4d8d" escala={2 + 6 * golpeFinal} opacidad={0.25 + 0.6 * golpeFinal} position={[0, RADIO_PLANETA + 0.55, 0.3]} />

			<group rotation={[0.38, 0, 0.12]}>
				<GalaxiaCorazones t={t} progreso={progreso} brillo={golpeFinal + 0.25 * latido} />
			</group>
		</Escenario3D>
	);
};

/** Onda expansiva única cuando termina la frase. */
const OndaFinal: React.FC<{progreso: number}> = ({progreso}) =>
	progreso > 0 && progreso < 1 ? (
		<mesh position={[0, RADIO_PLANETA + 0.45, 0.2]} scale={0.4 + Math.sqrt(progreso) * 5}>
			<torusGeometry args={[1, 0.02, 6, 96]} />
			<meshBasicMaterial color="#ffd6e4" transparent opacity={(1 - progreso) ** 1.4} toneMapped={false} depthWrite={false} />
		</mesh>
	) : null;

let geometriaPlaneta: THREE.BufferGeometry | null = null;
const obtenerPlaneta = () => {
	if (geometriaPlaneta) return geometriaPlaneta;
	const geo = new THREE.IcosahedronGeometry(RADIO_PLANETA, 3); // sin índice: 3 vértices por cara
	const pos = geo.attributes.position;
	const colores = new Float32Array(pos.count * 3);
	const c = new THREE.Color();
	const tierra = ['#3FAE5A', '#5CD674', '#7BDB6B'];
	for (let i = 0; i < pos.count; i += 3) {
		const x = (pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2)) / 3;
		const y = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3;
		const z = (pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)) / 3;
		const ruido = Math.sin(x * 2.1 + 1.3) * Math.sin(y * 2.7 + 0.4) * Math.sin(z * 1.9 + 2.2) + 0.35 * Math.sin(x * 5.3 + z * 4.1);
		if (ruido > 0.02) c.set(tierra[Math.floor(((ruido * 10) % 3 + 3) % 3)]);
		else c.set(ruido > -0.12 ? '#41C9F5' : '#2E9BFF');
		for (let k = 0; k < 3; k++) colores.set([c.r, c.g, c.b], (i + k) * 3);
	}
	geo.setAttribute('color', new THREE.BufferAttribute(colores, 3));
	geometriaPlaneta = geo;
	return geo;
};

const Planeta: React.FC<{angulo: number}> = ({angulo}) => {
	const arboles = useMemo(() => {
		const lista: {pos: THREE.Vector3; q: THREE.Quaternion; s: number; color: string}[] = [];
		let i = 0;
		while (lista.length < 14 && i < 400) {
			i++;
			const dir = new THREE.Vector3(random(`pl-x-${i}`) - 0.5, random(`pl-y-${i}`) - 0.5, random(`pl-z-${i}`) - 0.5).normalize();
			if (Math.abs(dir.x) < 0.3) continue; // dejar libre el camino del muñeco
			lista.push({
				pos: dir.clone().multiplyScalar(RADIO_PLANETA - 0.02),
				q: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir),
				s: 0.55 + random(`pl-s-${i}`) * 0.5,
				color: ['#2D6A4F', '#40916C', '#1B9C85', '#52B788'][i % 4],
			});
		}
		return lista;
	}, []);
	return (
		<group rotation={[angulo, 0, 0]}>
			<mesh geometry={obtenerPlaneta()}>
				<meshStandardMaterial vertexColors flatShading roughness={0.85} />
			</mesh>
			{arboles.map((a, i) => (
				<group key={i} position={a.pos} quaternion={a.q} scale={a.s}>
					<mesh position={[0, 0.1, 0]}>
						<cylinderGeometry args={[0.03, 0.04, 0.2, 5]} />
						<meshStandardMaterial color="#8B5A2B" flatShading />
					</mesh>
					<mesh position={[0, 0.3, 0]}>
						<icosahedronGeometry args={[0.16, 0]} />
						<meshStandardMaterial color={a.color} flatShading roughness={0.8} />
					</mesh>
				</group>
			))}
		</group>
	);
};

const Estrellas: React.FC = () => {
	const geo = useMemo(() => {
		const n = 700;
		const pos = new Float32Array(n * 3);
		for (let i = 0; i < n; i++) {
			const dir = new THREE.Vector3(random(`es-x-${i}`) - 0.5, random(`es-y-${i}`) - 0.5, random(`es-z-${i}`) - 0.5).normalize();
			dir.multiplyScalar(60 + random(`es-r-${i}`) * 40);
			pos.set([dir.x, dir.y, dir.z], i * 3);
		}
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
		return g;
	}, []);
	return (
		<points geometry={geo}>
			<pointsMaterial color="#ffffff" size={2.6} sizeAttenuation={false} transparent opacity={0.85} />
		</points>
	);
};

const COLORES_GALAXIA = ['#FF2E63', '#FF5DA2', '#FFD23F', '#FF8C42', '#FF4D6D', '#C77DFF'];

/** Miles de corazoncitos en espiral; aparecen a medida que sube el contador. */
const GalaxiaCorazones: React.FC<{t: number; progreso: number; brillo: number}> = ({t, progreso, brillo}) => {
	const ref = useRef<THREE.InstancedMesh>(null);
	const materialRef = useRef<THREE.MeshStandardMaterial>(null);
	const cantidad = 1100;
	const datos = useMemo(
		() =>
			new Array(cantidad).fill(0).map((_, i) => {
				const r = 2.3 + 5.2 * Math.pow(random(`gal-r-${i}`), 0.75);
				const brazo = Math.floor(random(`gal-b-${i}`) * 3);
				return {
					r,
					a0: (brazo * TAU) / 3 + r * 0.7 + (random(`gal-a-${i}`) - 0.5) * 0.9,
					y: (random(`gal-y-${i}`) - 0.5) * 0.5 * (1.2 - r / 8),
					w: 0.75 / Math.pow(r, 0.8),
					s: 0.045 + random(`gal-s-${i}`) * 0.05,
					giro: random(`gal-g-${i}`) * TAU,
					color: COLORES_GALAXIA[Math.floor(random(`gal-c-${i}`) * COLORES_GALAXIA.length)],
				};
			}),
		[],
	);

	useLayoutEffect(() => {
		const m = ref.current;
		if (!m) return;
		const c = new THREE.Color();
		datos.forEach((d, i) => m.setColorAt(i, c.set(d.color)));
		if (m.instanceColor) m.instanceColor.needsUpdate = true;
	}, [datos]);

	useLayoutEffect(() => {
		const m = ref.current;
		if (!m) return;
		const visibles = progreso * cantidad;
		const o = new THREE.Object3D();
		datos.forEach((d, i) => {
			const k = Math.max(0, Math.min(1, (visibles - i) / 40));
			const a = d.a0 + t * d.w;
			o.position.set(Math.cos(a) * d.r, d.y, Math.sin(a) * d.r);
			o.rotation.set(0.3 * Math.sin(t + d.giro), -a + d.giro + t * 0.8, 0);
			o.scale.setScalar(d.s * k * (1 + 0.5 * brillo));
			o.updateMatrix();
			m.setMatrixAt(i, o.matrix);
		});
		m.instanceMatrix.needsUpdate = true;
		if (materialRef.current) materialRef.current.emissiveIntensity = 0.35 + 1.2 * brillo;
	});

	return (
		<instancedMesh ref={ref} args={[obtenerGeometriaCorazon('bajo'), undefined, cantidad]} frustumCulled={false}>
			<meshStandardMaterial ref={materialRef} roughness={0.4} emissive="#ff1f5a" emissiveIntensity={0.35} />
		</instancedMesh>
	);
};
