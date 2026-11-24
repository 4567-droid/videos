import React, {useMemo} from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {Calendario} from '../componentes/Calendario';
import {Camara, temblor} from '../componentes/Camara';
import {SabanaEspacioTiempo, alturaSabana} from '../componentes/Ciencia';
import {Destellos} from '../componentes/Efectos';
import {Escenario3D} from '../componentes/Escenario3D';
import type {V3} from '../componentes/utilidades3d';
import {useEscena} from '../lib/escena';

/**
 * "Diez años después, en 1915, completó la idea: la gravedad no es una fuerza que tira,
 * es el espacio-tiempo curvado por la masa, como una sábana estirada con una bola pesada."
 * Un calendario pasa de 1905 a 1915. Después, sobre una grilla luminosa, una flecha de
 * "fuerza" se tacha; el planeta baja, la grilla se hunde y unas bolitas giran en el pozo.
 */

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const suave = Easing.inOut(Easing.cubic);
const mezclar = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const PROFUNDIDAD = 1.7;
const RADIO_PLANETA = 0.62;

let geoRayado: THREE.BufferGeometry | null = null;
/** Planeta con franjas (colores por cara). */
const obtenerPlanetaRayado = () => {
	if (geoRayado) return geoRayado;
	const geo = new THREE.SphereGeometry(1, 40, 28).toNonIndexed();
	const pos = geo.attributes.position;
	const colores = new Float32Array(pos.count * 3);
	const paleta = ['#FF8C42', '#FFD166', '#EF476F', '#F4A261'].map((c) => new THREE.Color(c));
	for (let i = 0; i < pos.count; i += 3) {
		const y = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3;
		const n = Math.floor((y + 1) * 4.5 + 0.6 * Math.sin(y * 9));
		const c = paleta[((n % paleta.length) + paleta.length) % paleta.length];
		for (let k = 0; k < 3; k++) colores.set([c.r, c.g, c.b], (i + k) * 3);
	}
	geo.setAttribute('color', new THREE.BufferAttribute(colores, 3));
	geoRayado = geo;
	return geo;
};

const BOLITAS = [
	{r: 1.35, vel: 1.9, fase: 0, color: '#7DF9FF', s: 0.13},
	{r: 1.85, vel: 1.25, fase: 2.1, color: '#FF5DA2', s: 0.15},
	{r: 2.4, vel: 0.85, fase: 4.0, color: '#B9FBC0', s: 0.12},
	{r: 2.9, vel: 0.62, fase: 1.2, color: '#FFD23F', s: 0.14},
];

export const GrillaGravedad: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {momento} = useEscena();
	const t = frame / fps;

	const fDiez = momento('diez');
	const f1915 = momento('1915', {fin: true});
	const fCompleto = momento('completó');
	const fGravedad = momento('gravedad');
	const fNo = momento('no');
	const fEspacio = momento('espacio-tiempo');
	const fCurvado = momento('curvado');
	const fMasa = momento('masa', {fin: true});
	const fSabana = momento('sábana');

	// parte 1: calendario 1905 → 1915
	const avanceAnios = interpolate(frame, [fDiez + 4, f1915], [0, 1], {...clamp, easing: suave});
	const calendarioSale = interpolate(frame, [fCompleto, fGravedad - 2], [0, 1], {...clamp, easing: suave});

	// parte 2: la sábana
	const sabana = interpolate(frame, [fCompleto + 6, fGravedad + 4], [0, 1], {...clamp, easing: suave});
	const flecha = spring({frame: frame - fGravedad, fps, config: {damping: 12}}) * (1 - interpolate(frame, [fEspacio - 4, fEspacio + 6], [0, 1], clamp));
	const tachar = spring({frame: frame - fNo - 2, fps, config: {damping: 10, stiffness: 160}});
	const hundir = interpolate(frame, [fCurvado - 6, fMasa], [0, 1], {...clamp, easing: suave});
	const bolitas = interpolate(frame, [fSabana - 10, fSabana + 10], [0, 1], clamp);
	const alturaPlaneta = interpolate(hundir, [0, 1], [1.4, alturaSabana(0, 0, 1, PROFUNDIDAD) + RADIO_PLANETA * 0.85]);

	// cámara: de frente al calendario → desde arriba en diagonal mirando la grilla
	const aGrilla = interpolate(frame, [fCompleto - 4, fGravedad + 6], [0, 1], {...clamp, easing: suave});
	const orbita = 0.4 * Math.sin(t * 0.22) + 0.15;
	const sacudon = temblor(t, 0.5);
	const enGrilla: V3 = [Math.sin(orbita) * 7.2, 4.4, Math.cos(orbita) * 7.2];
	const base = mezclar([0.2, 0.25, 5.2], enGrilla, aGrilla);
	const posicion: V3 = [base[0] + sacudon[0], base[1] + sacudon[1], base[2]];
	const mirarA = mezclar([0, 0.2, 0], [0, -0.55, 0], aGrilla);

	const conos = useMemo(() => new THREE.ConeGeometry(0.22, 0.4, 20), []);

	return (
		<Escenario3D
			fondo="radial-gradient(circle at 50% 40%, #3A0CA3 0%, #240B66 40%, #10063A 72%, #05021A 100%)"
			colorContraluz="#FF5DA2"
		>
			<Camara posicion={posicion} mirarA={mirarA} />

			{calendarioSale < 0.999 ? (
				<Calendario
					dias={[1905, 1915]}
					encabezado="AÑO"
					avance={avanceAnios}
					position={[0, 0.25 + 2.5 * calendarioSale, 0]}
					rotation={[0.05, 0.1 * Math.sin(t), 0]}
					scale={1.45 * (1 - 0.6 * calendarioSale)}
				/>
			) : null}

			{sabana > 0.001 ? (
				<group scale={[sabana, 1, sabana]}>
					<SabanaEspacioTiempo hundir={hundir} profundidad={PROFUNDIDAD} />
				</group>
			) : null}

			{/* planeta pesado */}
			<group position={[0, alturaPlaneta, 0]} scale={RADIO_PLANETA * sabana} rotation={[0.3, t * 0.6, 0.2]}>
				<mesh geometry={obtenerPlanetaRayado()}>
					<meshStandardMaterial vertexColors roughness={0.45} />
				</mesh>
			</group>

			{/* "una fuerza que tira": flecha hacia abajo que se tacha */}
			{flecha > 0.01 ? (
				<group position={[0, alturaPlaneta - 0.95, 0.2]} scale={flecha}>
					<mesh position={[0, 0.25, 0]}>
						<cylinderGeometry args={[0.07, 0.07, 0.6, 12]} />
						<meshStandardMaterial color="#EF233C" emissive="#EF233C" emissiveIntensity={0.3} />
					</mesh>
					<mesh geometry={conos} position={[0, -0.22, 0]} rotation={[Math.PI, 0, 0]}>
						<meshStandardMaterial color="#EF233C" emissive="#EF233C" emissiveIntensity={0.3} />
					</mesh>
					{[-1, 1].map((lado) => (
						<mesh key={lado} position={[0, 0.05, 0.25]} rotation={[0, 0, lado * 0.78]} scale={[tachar, 1, 1]}>
							<boxGeometry args={[1.3, 0.12, 0.08]} />
							<meshBasicMaterial color="#FFFFFF" toneMapped={false} />
						</mesh>
					))}
				</group>
			) : null}

			{/* bolitas girando dentro del pozo */}
			{BOLITAS.map((b, i) => {
				const a = b.fase + t * b.vel;
				const x = Math.cos(a) * b.r;
				const z = Math.sin(a) * b.r;
				const k = Math.max(0, Math.min(1, bolitas * 1.6 - i * 0.2));
				return k > 0.01 ? (
					<mesh key={i} position={[x, alturaSabana(x, z, hundir, PROFUNDIDAD) + b.s, z]} scale={b.s * k}>
						<sphereGeometry args={[1, 20, 14]} />
						<meshStandardMaterial color={b.color} emissive={b.color} emissiveIntensity={0.35} roughness={0.3} />
					</mesh>
				) : null;
			})}

			<Destellos t={t} cantidad={60} rango={[12, 8, 8]} centro={[0, 1.5, -2]} tamano={0.04} semilla="grilla" colores={['#FFFFFF', '#7DF9FF', '#FF5DA2']} />
		</Escenario3D>
	);
};
