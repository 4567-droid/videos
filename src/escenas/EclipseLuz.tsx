import React, {useLayoutEffect, useMemo} from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {Camara, proyectar, temblor} from '../componentes/Camara';
import {Resplandor} from '../componentes/Efectos';
import {Einstein} from '../componentes/Einstein';
import {Escenario3D} from '../componentes/Escenario3D';
import {Etiqueta} from '../componentes/Etiqueta';
import {Tilde} from '../componentes/Experimento';
import {Estrellas, Planeta} from '../componentes/Planeta';
import {texturaCorona, type V3} from '../componentes/utilidades3d';
import {useEscena} from '../lib/escena';

/**
 * "En 1919, durante un eclipse, se vio que la luz de las estrellas se desviaba cerca del Sol.
 * Einstein tenía razón."
 * La Luna tapa al Sol; el rayo de una estrella pasa cerca del Sol y se curva hacia la Tierra
 * (la línea punteada muestra por dónde "debería" haber ido). Aparece Einstein festejando.
 */

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const suave = Easing.inOut(Easing.cubic);

const SOL: V3 = [0, 0.55, -2];
const ESTRELLA: V3 = [-1.55, 2.25, -3];
const TIERRA: V3 = [1.0, -1.95, 0.6];

const CAMINO = new THREE.CatmullRomCurve3(
	[ESTRELLA, [-0.6, 1.95, -2.5], [0.55, 1.68, -2.0], [1.22, 0.75, -1.2], [1.2, -0.6, -0.2], [TIERRA[0] + 0.02, TIERRA[1] + 0.5, TIERRA[2]]].map(
		(p) => new THREE.Vector3(...(p as V3)),
	),
);

/** Rayo de luz que "crece" a lo largo del camino (drawRange del tubo). */
const Rayo: React.FC<{progreso: number}> = ({progreso}) => {
	const geo = useMemo(() => new THREE.TubeGeometry(CAMINO, 160, 0.045, 10, false), []);
	const geoHalo = useMemo(() => new THREE.TubeGeometry(CAMINO, 160, 0.13, 10, false), []);
	useLayoutEffect(() => {
		for (const g of [geo, geoHalo]) {
			const total = g.index ? g.index.count : g.attributes.position.count;
			const porSegmento = total / 160;
			g.setDrawRange(0, Math.floor(160 * progreso) * porSegmento);
		}
	}, [progreso, geo, geoHalo]);
	return progreso > 0.001 ? (
		<group>
			<mesh geometry={geo}>
				<meshBasicMaterial color="#FFF8D6" toneMapped={false} />
			</mesh>
			<mesh geometry={geoHalo}>
				<meshBasicMaterial color="#FFD166" transparent opacity={0.35} toneMapped={false} depthWrite={false} />
			</mesh>
		</group>
	) : null;
};

/** Línea punteada: por dónde iría la luz si no se curvara. */
const LineaRecta: React.FC<{aparicion: number}> = ({aparicion}) => {
	const desde = new THREE.Vector3(0.55, 1.68, -2.0);
	const dir = new THREE.Vector3(0.55 - ESTRELLA[0], 1.68 - ESTRELLA[1], -2.0 - ESTRELLA[2]).normalize();
	return aparicion > 0.01 ? (
		<group>
			{new Array(9).fill(0).map((_, i) => {
				const p = desde.clone().add(dir.clone().multiplyScalar(0.25 + i * 0.32));
				return (
					<mesh key={i} position={p} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir)} scale={aparicion}>
						<boxGeometry args={[0.18, 0.035, 0.035]} />
						<meshBasicMaterial color="#FFFFFF" transparent opacity={0.6} toneMapped={false} />
					</mesh>
				);
			})}
		</group>
	) : null;
};

export const EclipseLuz: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const {momento, duracion} = useEscena();
	const t = frame / fps;

	const f1919 = momento('1919');
	const fDurante = momento('durante');
	const fEclipse = momento('eclipse', {fin: true});
	const fLuz = momento('luz');
	const fDesviaba = momento('desviaba', {fin: true});
	const fSol = momento('sol', {fin: true});
	const fEinstein = momento('Einstein');
	const fRazon = momento('razón');

	const luna = interpolate(frame, [fDurante - 6, fEclipse + 6], [0, 1], {...clamp, easing: suave});
	const posLuna: V3 = [SOL[0] - 3.6 * (1 - luna), SOL[1] + 0.4 * (1 - luna), SOL[2] + 0.9];
	const rayo = interpolate(frame, [fLuz - 4, fDesviaba + 4], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
	const recta = interpolate(frame, [fDesviaba - 6, fSol], [0, 1], clamp);
	const einstein = spring({frame: frame - fEinstein + 4, fps, config: {damping: 11, stiffness: 110}});
	const tilde = spring({frame: frame - fRazon, fps, config: {damping: 9, stiffness: 170}});
	const anio = spring({frame: frame - f1919, fps, config: {damping: 12}}) * (1 - interpolate(frame, [fLuz, fLuz + 8], [0, 1], clamp));

	const sacudon = temblor(t, 0.5);
	const k = frame / duracion;
	const posicion: V3 = [0.25 * Math.sin(t * 0.4) + sacudon[0], 0.2 + sacudon[1], 7.6 - 0.6 * k];
	const mirarA: V3 = [0, 0.15, -0.6];

	const pAnio = proyectar([SOL[0], SOL[1] - 1.35, SOL[2]], posicion, mirarA, width, height);
	const pTilde = proyectar([-0.1, -0.25, 0.8], posicion, mirarA, width, height);

	return (
		<Escenario3D
			fondo="radial-gradient(circle at 50% 35%, #1B1464 0%, #0B0A33 45%, #04031A 80%, #000000 100%)"
			colorContraluz="#FFD166"
			overlay={
				<>
					<Etiqueta x={pAnio.x} y={pAnio.y} texto="1919" aparicion={anio} fondo="#FFD166" color="#3D2B1F" tamano={56} anclaje="centro" />
					<Tilde x={pTilde.x} y={pTilde.y} aparicion={tilde} tamano={170} />
				</>
			}
		>
			<Camara posicion={posicion} mirarA={mirarA} />
			<Estrellas />

			{/* Sol con corona (los halos van delante del Sol y detrás de la Luna: en el eclipse queda el anillo) */}
			<group position={SOL}>
				<mesh>
					<sphereGeometry args={[1, 48, 32]} />
					<meshBasicMaterial color="#FFC93C" toneMapped={false} />
				</mesh>
				<Resplandor color="#FF9F1C" escala={5.2 + 0.3 * Math.sin(t * 2)} opacidad={1} position={[0, 0, 0.45]} />
				<Resplandor color="#FFF3B0" escala={3.2 + 0.8 * luna} opacidad={0.75 + 0.25 * luna} position={[0, 0, 0.55]} />
				{/* corona: anillo que asoma alrededor de la Luna durante el eclipse */}
				<sprite position={[0, 0, 0.6]} scale={[5.0, 5.0, 1]}>
					<spriteMaterial map={texturaCorona()} transparent opacity={luna} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
				</sprite>
			</group>
			{/* Luna que lo tapa */}
			<mesh position={posLuna}>
				<sphereGeometry args={[1.02, 48, 32]} />
				<meshStandardMaterial color="#1C1C2E" roughness={0.9} />
			</mesh>

			{/* estrella lejana */}
			<group position={ESTRELLA}>
				<Resplandor color="#FFFFFF" escala={0.9 + 0.25 * Math.sin(t * 6)} opacidad={1} />
				<mesh>
					<octahedronGeometry args={[0.12, 0]} />
					<meshBasicMaterial color="#FFFFFF" toneMapped={false} />
				</mesh>
			</group>

			<LineaRecta aparicion={recta} />
			<Rayo progreso={rayo} />

			{/* Tierra (desde donde se observa) */}
			<Planeta radio={0.55} arboles={false} angulo={t * 0.3} position={TIERRA} />

			{/* Einstein festejando */}
			<group scale={einstein}>
				<Einstein t={t} animacion="celebrar" position={[-0.85, -2.2, 0.9]} rotation={[0, 0.35, 0]} scale={0.8} sombra={false} />
			</group>
		</Escenario3D>
	);
};
