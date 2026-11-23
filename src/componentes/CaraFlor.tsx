import React, {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import {Segmento} from './Segmento';
import type {V3} from './utilidades3d';

/**
 * Cara humana que se transforma en flor:
 *  - el pelo (mechones arriba) se convierte en pétalos alrededor,
 *  - la piel pasa a ser el centro amarillo de la flor,
 *  - los rasgos (ojos, nariz, boca) dejan lugar a un espiral de semillas
 *    (el "patrón de formas que se repite").
 */

const R = 1.15; // radio de la cara
const PROF = 0.36; // abultamiento hacia adelante
const zSup = (x: number, y: number) => PROF * Math.sqrt(Math.max(0, 1 - (x * x + y * y) / (R * R)));

const GEO_ESFERA = new THREE.SphereGeometry(1, 32, 20);
const mezclarColor = (a: string, b: string, k: number) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), Math.max(0, Math.min(1, k))).getHexString();

const N_PETALOS = 14;
const N_SEMILLAS = 170;
const ANGULO_DORADO = 2.39996323;

export type PropsCaraFlor = {
	t: number;
	/** 0 = mechones de pelo, 1 = pétalos de flor */
	petalos: number;
	/** 0..1 visibilidad de ojos, cejas, nariz, boca y mejillas */
	rasgos: number;
	/** 0..1 espiral de semillas (aparece desde el centro) */
	semillas: number;
	/** 0 = color piel, 1 = centro amarillo de flor */
	centro: number;
	/** 0..1 tallo y hojas */
	tallo?: number;
	/** 0..1 anillos y líneas que marcan el "patrón" de la cara */
	marcas?: number;
	parpadeo?: number;
	mirada?: [number, number];
	/** pulso que recorre los pétalos (0..1) */
	ola?: number;
	position?: V3;
	rotation?: V3;
	scale?: number;
};

export const CaraFlor: React.FC<PropsCaraFlor> = ({
	t,
	petalos,
	rasgos,
	semillas,
	centro,
	tallo = 0,
	marcas = 0,
	parpadeo = 0,
	mirada = [0, 0],
	ola = 0,
	position,
	rotation,
	scale = 1,
}) => {
	const colorCara = mezclarColor('#F6C59B', '#FFC300', centro);
	const ojo = 1 - 0.93 * Math.max(0, Math.min(1, parpadeo));
	const [mx, my] = mirada;
	const r = Math.max(0, Math.min(1, rasgos));
	const ojos: V3[] = [
		[-0.38, 0.2, zSup(-0.38, 0.2)],
		[0.38, 0.2, zSup(0.38, 0.2)],
	];
	const boca: V3 = [0, -0.4, zSup(0, -0.4)];

	return (
		<group position={position} rotation={rotation} scale={scale}>
			{/* tallo y hojas */}
			{tallo > 0.001 ? (
				<group scale={[1, tallo, 1]}>
					<mesh position={[0, -R - 1.25, -0.15]}>
						<cylinderGeometry args={[0.1, 0.13, 2.7, 12]} />
						<meshStandardMaterial color="#2D9A4C" roughness={0.6} />
					</mesh>
					{[-1, 1].map((lado) => (
						<mesh key={lado} position={[lado * 0.42, -R - 1.15 - lado * 0.25, -0.12]} rotation={[0, 0, lado * -0.6]} scale={[0.5, 0.17, 0.07]} geometry={GEO_ESFERA}>
							<meshStandardMaterial color="#3BB273" roughness={0.6} />
						</mesh>
					))}
				</group>
			) : null}

			{/* pétalos: capa trasera (solo flor) y delantera (pelo → pétalos) */}
			{[0, 1].map((capa) =>
				new Array(N_PETALOS).fill(0).map((_, i) => {
					const a = Math.PI / 2 + ((i + capa * 0.5) / N_PETALOS) * Math.PI * 2;
					const arriba = Math.sin(a) > 0.05; // mechones solo en la mitad de arriba
					const k = capa === 1 ? petalos : arriba ? 1 : petalos;
					if (k <= 0.001) return null;
					const largo = (0.42 + (0.88 - 0.42) * petalos) * (capa === 1 ? 1.06 : 1);
					const ancho = 0.3 + (0.37 - 0.3) * petalos;
					const radio = R * 0.9 + (R - 0.18 + largo - R * 0.9) * petalos;
					const pulso = 1 + 0.12 * ola * Math.max(0, Math.sin(t * 6 - i * 0.9));
					const color =
						capa === 1
							? '#E83F8C'
							: mezclarColor('#4A2C1D', i % 2 === 0 ? '#FF5DA2' : '#FF8FC7', petalos);
					return (
						<group key={`${capa}-${i}`} rotation={[0, 0, a - Math.PI / 2]}>
							<mesh
								geometry={GEO_ESFERA}
								position={[0, radio * pulso, capa === 1 ? -0.14 : -0.06]}
								rotation={[-0.22, 0, 0]}
								scale={[ancho * k, largo * k * pulso, 0.12 * k]}
							>
								<meshStandardMaterial color={color} roughness={0.45} />
							</mesh>
						</group>
					);
				}),
			)}

			{/* cara / centro de la flor */}
			<mesh geometry={GEO_ESFERA} scale={[R, R, PROF]}>
				<meshStandardMaterial color={colorCara} roughness={0.55} />
			</mesh>

			<Semillas progreso={semillas} t={t} />

			{/* rasgos */}
			{r > 0.001 ? (
				<>
					{ojos.map((p, i) => (
						<group key={`ojo-${i}`} position={p} scale={[r, r * ojo, r]}>
							<mesh geometry={GEO_ESFERA} scale={[0.19, 0.23, 0.08]}>
								<meshStandardMaterial color="#FFFFFF" roughness={0.2} />
							</mesh>
							<mesh geometry={GEO_ESFERA} position={[mx * 0.05, my * 0.06, 0.06]} scale={[0.1, 0.12, 0.04]}>
								<meshStandardMaterial color="#1B1B2F" roughness={0.15} />
							</mesh>
							<mesh geometry={GEO_ESFERA} position={[mx * 0.05 + 0.04, my * 0.06 + 0.05, 0.1]} scale={0.03}>
								<meshBasicMaterial color="#FFFFFF" toneMapped={false} />
							</mesh>
						</group>
					))}
					{[-1, 1].map((lado) => (
						<group key={`ceja-${lado}`} scale={r}>
							<Segmento desde={[lado * 0.56, 0.5, zSup(0.56, 0.5) + 0.02]} hasta={[lado * 0.22, 0.56, zSup(0.22, 0.56) + 0.02]} radio={0.035} material={MAT_CEJA} />
						</group>
					))}
					<mesh geometry={GEO_ESFERA} position={[0, -0.05, zSup(0, -0.05)]} scale={0.085 * r}>
						<meshStandardMaterial color="#E8A87C" roughness={0.5} />
					</mesh>
					<mesh position={boca} rotation={[0.2, 0, Math.PI]} scale={r}>
						<torusGeometry args={[0.28, 0.05, 10, 24, Math.PI]} />
						<meshStandardMaterial color="#B5294E" roughness={0.45} />
					</mesh>
					{[-1, 1].map((lado) => (
						<mesh key={`mej-${lado}`} geometry={GEO_ESFERA} position={[lado * 0.68, -0.18, zSup(0.68, -0.18)]} scale={[0.14 * r, 0.09 * r, 0.03]}>
							<meshBasicMaterial color="#FF7B9C" transparent opacity={0.6} toneMapped={false} />
						</mesh>
					))}
				</>
			) : null}

			{/* marcas del patrón: anillos en ojos y boca + triángulo que los une */}
			{marcas > 0.001 ? (
				<group>
					{ojos.map((p, i) => (
						<mesh key={`anillo-${i}`} position={[p[0], p[1], p[2] + 0.08]} scale={0.3 * marcas}>
							<torusGeometry args={[1, 0.08, 8, 40]} />
							<meshBasicMaterial color="#7DF9FF" toneMapped={false} />
						</mesh>
					))}
					<mesh position={[boca[0], boca[1] - 0.12, boca[2] + 0.08]} scale={[0.42 * marcas, 0.2 * marcas, 1]}>
						<torusGeometry args={[1, 0.08, 8, 40]} />
						<meshBasicMaterial color="#7DF9FF" toneMapped={false} />
					</mesh>
					<group scale={[1, 1, 1]}>
						{[
							[ojos[0], ojos[1]],
							[ojos[0], boca],
							[ojos[1], boca],
						].map(([a, b], i) => (
							<Segmento
								key={`linea-${i}`}
								desde={[a[0], a[1], a[2] + 0.1]}
								hasta={[a[0] + (b[0] - a[0]) * marcas, a[1] + (b[1] - a[1]) * marcas, a[2] + 0.1 + (b[2] - a[2]) * marcas]}
								radio={0.022}
								material={MAT_MARCA}
								extremos={false}
							/>
						))}
					</group>
				</group>
			) : null}
		</group>
	);
};

const MAT_CEJA = new THREE.MeshStandardMaterial({color: '#4A2C1D', roughness: 0.6});
const MAT_MARCA = new THREE.MeshBasicMaterial({color: '#7DF9FF', toneMapped: false});

const COLORES_SEMILLA = ['#7A3E12', '#A0521D', '#FF8C00'];

/** Semillas en espiral (ángulo dorado), como el centro de un girasol. */
const Semillas: React.FC<{progreso: number; t: number}> = ({progreso, t}) => {
	const ref = useRef<THREE.InstancedMesh>(null);
	const datos = useMemo(
		() =>
			new Array(N_SEMILLAS).fill(0).map((_, k) => {
				const rho = 0.082 * Math.sqrt(k + 0.6);
				const a = k * ANGULO_DORADO;
				const x = rho * Math.cos(a);
				const y = rho * Math.sin(a);
				return {x, y, z: zSup(x, y) + 0.01, dentro: rho < R * 0.93, color: COLORES_SEMILLA[k % 3]};
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
		const visibles = progreso * N_SEMILLAS;
		const o = new THREE.Object3D();
		datos.forEach((d, k) => {
			const s = d.dentro ? Math.max(0, Math.min(1, (visibles - k) / 6)) : 0;
			o.position.set(d.x, d.y, d.z);
			o.scale.set(0.05 * s, 0.05 * s, 0.03 * s * (1 + 0.15 * Math.sin(t * 4 + k * 0.4)));
			o.updateMatrix();
			m.setMatrixAt(k, o.matrix);
		});
		m.instanceMatrix.needsUpdate = true;
	});
	return (
		<instancedMesh ref={ref} args={[GEO_ESFERA, undefined, N_SEMILLAS]} frustumCulled={false}>
			<meshStandardMaterial roughness={0.4} />
		</instancedMesh>
	);
};

/** Florcita con ojitos para el "jardín". */
export const FlorChica: React.FC<{
	t: number;
	color: string;
	/** 0..1 crecimiento */
	crecer?: number;
	parpadeo?: number;
	mirada?: [number, number];
	position?: V3;
	rotation?: V3;
	scale?: number;
}> = ({t, color, crecer = 1, parpadeo = 0, mirada = [0, 0], position, rotation, scale = 1}) => {
	const k = Math.max(0, crecer);
	if (k <= 0.001) return null;
	const ojo = 1 - 0.93 * Math.max(0, Math.min(1, parpadeo));
	const vaiven = 0.06 * Math.sin(t * 2.2 + (position?.[0] ?? 0) * 3);
	return (
		<group position={position} rotation={rotation} scale={scale * k}>
			<mesh position={[0, -0.65, -0.05]}>
				<cylinderGeometry args={[0.045, 0.06, 1.3, 8]} />
				<meshStandardMaterial color="#2D9A4C" roughness={0.6} />
			</mesh>
			<group rotation={[0, 0, vaiven]}>
				{new Array(6).fill(0).map((_, i) => {
					const a = (i / 6) * Math.PI * 2;
					return (
						<group key={i} rotation={[0, 0, a]}>
							<mesh geometry={GEO_ESFERA} position={[0, 0.4, -0.04]} rotation={[-0.25, 0, 0]} scale={[0.17, 0.3, 0.06]}>
								<meshStandardMaterial color={color} roughness={0.45} />
							</mesh>
						</group>
					);
				})}
				<mesh geometry={GEO_ESFERA} scale={[0.3, 0.3, 0.14]}>
					<meshStandardMaterial color="#FFC300" roughness={0.5} />
				</mesh>
				{[-1, 1].map((lado) => (
					<group key={lado} position={[lado * 0.1, 0.05, 0.12]} scale={[1, ojo, 1]}>
						<mesh geometry={GEO_ESFERA} scale={[0.065, 0.08, 0.035]}>
							<meshStandardMaterial color="#FFFFFF" roughness={0.2} />
						</mesh>
						<mesh geometry={GEO_ESFERA} position={[mirada[0] * 0.02, mirada[1] * 0.02, 0.025]} scale={[0.035, 0.045, 0.02]}>
							<meshStandardMaterial color="#1B1B2F" roughness={0.2} />
						</mesh>
					</group>
				))}
				<mesh position={[0, -0.09, 0.13]} rotation={[0.2, 0, Math.PI]}>
					<torusGeometry args={[0.07, 0.018, 6, 14, Math.PI]} />
					<meshStandardMaterial color="#B5294E" roughness={0.5} />
				</mesh>
			</group>
		</group>
	);
};
