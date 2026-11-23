import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {Easing, interpolate, interpolateColors, random, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {Avatar} from '../componentes/Avatar';
import {Camara, temblor} from '../componentes/Camara';
import {Cielo, Resplandor} from '../componentes/Efectos';
import {Escenario3D} from '../componentes/Escenario3D';
import {suavizar, type V3} from '../componentes/utilidades3d';
import {FUENTE} from '../lib/fuente';
import {useEscena} from '../lib/escena';
import {acumular, crearFase, envolventeLatido, ondaECG} from '../lib/latido';

/**
 * "En reposo late unas 70 veces por minuto, pero al salir a correr puede superar las 150."
 * El muñeco respira tranquilo y, al decir "correr", sale corriendo por una ruta al atardecer.
 * Abajo, un monitor muestra el pulso (70 → 150+) y un electrocardiograma en vivo.
 */

const HORIZONTE = '#FFB38A';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const mezclar = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

export const CorredorPulso: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {momento, duracion} = useEscena();
	const t = frame / fps;

	const fSalir = momento('salir');
	const fCorrer = momento('correr');
	const f150 = momento('150', {fin: true});

	// 0 = en reposo, 1 = corriendo
	const carrera = interpolate(frame, [fSalir, fCorrer + 6], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});

	const {bpm, fase, distancia} = useMemo(() => {
		const tSalir = fSalir / fps;
		const t150 = Math.max(tSalir + 0.5, f150 / fps);
		const ritmo = (seg: number) =>
			seg < tSalir ? 70 : seg < t150 ? 70 + 80 * suavizar((seg - tSalir) / (t150 - tSalir)) : 150 + (seg - t150) * 4;
		const velocidad = (seg: number) => 7.5 * suavizar((seg * fps - fSalir) / (fCorrer + 6 - fSalir));
		return {
			bpm: ritmo,
			fase: crearFase(ritmo, duracion / fps + 1, 0.85),
			distancia: acumular(velocidad, duracion, fps),
		};
	}, [fSalir, fCorrer, f150, fps, duracion]);

	const latido = envolventeLatido(fase(t));
	const d = distancia(frame);

	// cámara: plano tranquilo → plano bajo y dinámico cuando corre
	const avance = frame / duracion;
	const camReposo: V3 = [1.95 - 0.3 * avance, 1.4, 5.2 - 0.3 * avance];
	const camCarrera: V3 = [2.35, 0.72, 4.7];
	const sacudon = temblor(t * (1 + carrera), 0.4 + 1.2 * carrera);
	const base = mezclar(camReposo, camCarrera, carrera);
	const posicion: V3 = [base[0] + sacudon[0], base[1] + sacudon[1] + 0.02 * Math.abs(Math.sin(t * 9.1)) * carrera, base[2]];
	const mirarA: V3 = [0, 0.84 + 0.03 * carrera, 0];

	return (
		<Escenario3D
			fondo={HORIZONTE}
			colorContraluz="#ff9ecf"
			overlay={<Monitor bpm={bpm} fase={fase} t={t} carrera={carrera} latido={latido} />}
		>
			<Camara posicion={posicion} mirarA={mirarA} />
			<fog attach="fog" args={[HORIZONTE, 14, 80]} />
			<Cielo arriba="#4A1FA0" horizonte={HORIZONTE} abajo="#FF8FA3" />
			<Sol />

			<Avatar
				t={t}
				mezcla={[
					{animacion: 'reposo', peso: 1 - carrera},
					{animacion: 'correr', peso: carrera},
				]}
				rotation={[0, 0.32 * (1 - carrera), 0]}
				latido={latido}
				pantalonCorto
				colores={{remera: '#00B4D8', pantalon: '#1D3557', zapatillas: '#FFD23F', piel: '#E8A87C', pelo: '#2B1B12'}}
			/>

			<Ruta d={d} />
			<Arboles d={d} />
			<Montanas />
			<LineasVelocidad d={d} intensidad={carrera} />
		</Escenario3D>
	);
};

const Sol: React.FC = () => (
	<group position={[-55, 17, -90]} rotation={[0, 0.55, 0]}>
		<mesh>
			<circleGeometry args={[5.5, 40]} />
			<meshBasicMaterial color="#FFE7A3" fog={false} toneMapped={false} />
		</mesh>
		<Resplandor color="#FFD27A" escala={48} opacidad={0.9} />
	</group>
);

const Ruta: React.FC<{d: number}> = ({d}) => {
	const ref = useRef<THREE.InstancedMesh>(null);
	const cantidad = 34;
	const separacion = 2.4;
	useLayoutEffect(() => {
		const m = ref.current;
		if (!m) return;
		const o = new THREE.Object3D();
		for (let i = 0; i < cantidad; i++) {
			const z = 9 - ((i * separacion + d) % (cantidad * separacion));
			o.position.set(0, 0.005, z);
			o.updateMatrix();
			m.setMatrixAt(i, o.matrix);
		}
		m.instanceMatrix.needsUpdate = true;
	});
	return (
		<group>
			{/* pasto */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, -40]}>
				<planeGeometry args={[260, 200]} />
				<meshStandardMaterial color="#5DBB63" roughness={1} />
			</mesh>
			{/* asfalto */}
			<mesh position={[0, -0.02, -30]}>
				<boxGeometry args={[2.6, 0.04, 90]} />
				<meshStandardMaterial color="#3C3F58" roughness={0.9} />
			</mesh>
			{[-1.22, 1.22].map((x) => (
				<mesh key={x} position={[x, 0.002, -30]}>
					<boxGeometry args={[0.08, 0.01, 90]} />
					<meshBasicMaterial color="#F4F1DE" />
				</mesh>
			))}
			<instancedMesh ref={ref} args={[undefined, undefined, cantidad]} frustumCulled={false}>
				<boxGeometry args={[0.12, 0.01, 1]} />
				<meshBasicMaterial color="#F4F1DE" />
			</instancedMesh>
		</group>
	);
};

const VERDES = ['#2D6A4F', '#40916C', '#52B788', '#1B9C85', '#3A9D5D'];

const Arboles: React.FC<{d: number}> = ({d}) => {
	const datos = useMemo(
		() =>
			new Array(30).fill(0).map((_, i) => {
				const lado = i % 2 === 0 ? -1 : 1;
				return {
					x: lado * (2.8 + random(`arb-x-${i}`) * 6),
					z0: random(`arb-z-${i}`) * 72,
					escala: 0.75 + random(`arb-s-${i}`) * 0.8,
					color: VERDES[Math.floor(random(`arb-c-${i}`) * VERDES.length)],
					pino: random(`arb-p-${i}`) > 0.45,
				};
			}),
		[],
	);
	return (
		<group>
			{datos.map((a, i) => {
				const z = 11 - ((a.z0 + d) % 72);
				return (
					<group key={i} position={[a.x, 0, z]} scale={a.escala}>
						<mesh position={[0, 0.35, 0]}>
							<cylinderGeometry args={[0.1, 0.14, 0.7, 6]} />
							<meshStandardMaterial color="#8B5A2B" flatShading />
						</mesh>
						{a.pino ? (
							<>
								<mesh position={[0, 1.25, 0]}>
									<coneGeometry args={[0.75, 1.4, 7]} />
									<meshStandardMaterial color={a.color} flatShading roughness={0.8} />
								</mesh>
								<mesh position={[0, 1.95, 0]}>
									<coneGeometry args={[0.52, 1.1, 7]} />
									<meshStandardMaterial color={a.color} flatShading roughness={0.8} />
								</mesh>
							</>
						) : (
							<mesh position={[0, 1.35, 0]}>
								<icosahedronGeometry args={[0.75, 0]} />
								<meshStandardMaterial color={a.color} flatShading roughness={0.8} />
							</mesh>
						)}
					</group>
				);
			})}
		</group>
	);
};

const Montanas: React.FC = () => {
	const datos = useMemo(
		() =>
			new Array(9).fill(0).map((_, i) => ({
				x: -40 + i * 10 + (random(`mon-x-${i}`) - 0.5) * 6,
				z: -58 - random(`mon-z-${i}`) * 18,
				r: 7 + random(`mon-r-${i}`) * 6,
				h: 7 + random(`mon-h-${i}`) * 9,
				color: ['#8E6CC9', '#B07BD8', '#6C4AB6'][i % 3],
			})),
		[],
	);
	return (
		<group>
			{datos.map((m, i) => (
				<mesh key={i} position={[m.x, m.h / 2 - 0.5, m.z]}>
					<coneGeometry args={[m.r, m.h, 6]} />
					<meshStandardMaterial color={m.color} flatShading roughness={1} />
				</mesh>
			))}
		</group>
	);
};

/** Rayas blancas que pasan rápido cuando corre (sensación de velocidad). */
const LineasVelocidad: React.FC<{d: number; intensidad: number}> = ({d, intensidad}) => {
	const ref = useRef<THREE.InstancedMesh>(null);
	const cantidad = 26;
	const datos = useMemo(
		() =>
			new Array(cantidad).fill(0).map((_, i) => ({
				x: (i % 2 === 0 ? -1 : 1) * (0.8 + random(`vel-x-${i}`) * 2.2),
				y: 0.2 + random(`vel-y-${i}`) * 2.6,
				z0: random(`vel-z-${i}`) * 30,
				largo: 0.8 + random(`vel-l-${i}`) * 1.6,
			})),
		[],
	);
	useLayoutEffect(() => {
		const m = ref.current;
		if (!m) return;
		const o = new THREE.Object3D();
		datos.forEach((l, i) => {
			o.position.set(l.x, l.y, 6 - ((l.z0 + d * 1.7) % 30));
			o.scale.set(1, 1, l.largo * intensidad);
			o.updateMatrix();
			m.setMatrixAt(i, o.matrix);
		});
		m.instanceMatrix.needsUpdate = true;
	});
	return (
		<instancedMesh ref={ref} args={[undefined, undefined, cantidad]} frustumCulled={false} visible={intensidad > 0.05}>
			<boxGeometry args={[0.025, 0.025, 1]} />
			<meshBasicMaterial color="#FFFFFF" transparent opacity={0.55 * intensidad} fog={false} />
		</instancedMesh>
	);
};

/** Monitor de pulso con electrocardiograma (HTML + SVG). */
const Monitor: React.FC<{
	bpm: (seg: number) => number;
	fase: (seg: number) => number;
	t: number;
	carrera: number;
	latido: number;
}> = ({bpm, fase, t, carrera, latido}) => {
	const valor = Math.round(bpm(t));
	const color = interpolateColors(valor, [70, 110, 150], ['#3DDC97', '#FFB627', '#FF3B5C']);
	const ancho = 960;
	const alto = 118;
	const ventana = 2.6;
	const muestras = 900;
	const puntos: string[] = [];
	let ultimo = {x: 0, y: 0};
	for (let k = 0; k <= muestras; k++) {
		const ts = t - ventana + (k / muestras) * ventana;
		const v = ondaECG(fase(ts));
		const x = (k / muestras) * (ancho - 30);
		const y = alto * 0.64 - v * alto * 0.56;
		puntos.push(`${k === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`);
		ultimo = {x, y};
	}
	const estado = carrera < 0.5 ? 'EN REPOSO' : 'CORRIENDO';
	return (
		<div
			style={{
				position: 'absolute',
				top: 1372,
				left: 60,
				width: ancho,
				height: 262,
				borderRadius: 42,
				background: 'rgba(16, 8, 40, 0.78)',
				border: `5px solid ${color}`,
				boxShadow: `0 0 46px ${color}88, 0 14px 0 rgba(0,0,0,0.25)`,
				overflow: 'hidden',
				fontFamily: FUENTE,
			}}
		>
			<div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 34px 0 30px'}}>
				<div style={{display: 'flex', alignItems: 'center', gap: 18}}>
					<svg width={78} height={78} viewBox="0 0 24 24" style={{transform: `scale(${1 + 0.22 * latido})`, filter: `drop-shadow(0 0 10px ${color})`}}>
						<path
							d="M12 21.2s-7.4-4.6-9.8-9C.6 8.6 2.6 4.6 6.6 4.6c2.2 0 3.8 1.2 5.4 3.1 1.6-1.9 3.2-3.1 5.4-3.1 4 0 6 4 4.4 7.6-2.4 4.4-9.8 9-9.8 9z"
							fill={color}
						/>
					</svg>
					<span style={{fontSize: 118, fontWeight: 900, color: '#FFFFFF', lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em'}}>
						{valor}
					</span>
					<span style={{fontSize: 34, fontWeight: 900, color, lineHeight: 1.05, marginTop: 30}}>
						LATIDOS
						<br />
						POR MIN
					</span>
				</div>
				<div
					style={{
						padding: '12px 24px',
						borderRadius: 999,
						background: color,
						color: '#140827',
						fontSize: 34,
						fontWeight: 900,
						letterSpacing: '0.04em',
					}}
				>
					{estado}
				</div>
			</div>
			<svg width={ancho} height={alto} style={{position: 'absolute', left: 14, bottom: 8}}>
				<path d={puntos.join(' ')} fill="none" stroke={color} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" style={{filter: `drop-shadow(0 0 6px ${color})`}} />
				<circle cx={ultimo.x} cy={ultimo.y} r={10} fill="#FFFFFF" />
			</svg>
		</div>
	);
};
