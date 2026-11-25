import React, {useEffect, useLayoutEffect, useMemo, useRef} from 'react';
import {random, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {FUENTE} from '../lib/fuente';
import {Avatar, type Animacion} from './Avatar';
import {SignoPregunta} from './Ciencia';
import {Destellos, Resplandor} from './Efectos';
import {Escenario3D} from './Escenario3D';
import {Segmento} from './Segmento';
import {useTexturaCanvas} from './texturas';
import {TAU, texturaRadial, type V3} from './utilidades3d';

/**
 * Serie "misterio" (el gato de Schrödinger): noche violeta con niebla, luces dramáticas,
 * la caja con el signo de pregunta brillante, el gato caricaturesco (sólido o translúcido),
 * Schrödinger con bata, átomo, moneda, hilo de luz, carteles, lupa, plato y molécula.
 */

export const TURQUESA = '#5CFFE4';
export const VIOLETA = '#9B6BFF';
export const LILA = '#C9A7FF';
export const FONDO_MISTERIO = 'radial-gradient(circle at 50% 44%, #3B2287 0%, #22125A 34%, #120936 66%, #06031A 100%)';
const COLOR_NIEBLA = '#1D1050';

// ---------------------------------------------------------------------------
// Escenario: fondo, niebla, luces, piso

export const LucesMisterio: React.FC<{intensidad?: number}> = ({intensidad = 1}) => (
	<>
		<hemisphereLight args={['#B9A6FF', '#1A0B3D', 0.75 * intensidad]} />
		{/* luz principal, fría, desde arriba y adelante */}
		<directionalLight position={[2.5, 6, 5]} intensity={2.1 * intensidad} color="#E6DDFF" />
		{/* contraluces: turquesa a la izquierda, violeta a la derecha */}
		<directionalLight position={[-5, 2.5, -4]} intensity={2.6 * intensidad} color={TURQUESA} />
		<directionalLight position={[5, 3, -3]} intensity={2.2 * intensidad} color="#B26BFF" />
		<ambientLight intensity={0.12 * intensidad} />
	</>
);

const texturaBruma = () =>
	texturaRadial('bruma-misterio', [
		[0, 'rgba(255,255,255,0.9)'],
		[0.35, 'rgba(255,255,255,0.45)'],
		[0.7, 'rgba(255,255,255,0.1)'],
		[1, 'rgba(255,255,255,0)'],
	]);

/** Bancos de niebla suave que se arrastran por el piso (sprites que siempre miran a cámara). */
export const Niebla: React.FC<{t: number; cantidad?: number; ancho?: number; altura?: number; z?: number; opacidad?: number; semilla?: string}> = ({
	t,
	cantidad = 9,
	ancho = 12,
	altura = 0.35,
	z = -1,
	opacidad = 0.16,
	semilla = 'niebla',
}) => (
	<group>
		{new Array(cantidad).fill(0).map((_, i) => {
			const vel = 0.12 + random(`${semilla}-v-${i}`) * 0.18;
			const x0 = (random(`${semilla}-x-${i}`) - 0.5) * ancho;
			const x = ((((x0 + t * vel + ancho / 2) % ancho) + ancho) % ancho) - ancho / 2;
			const zz = z + (random(`${semilla}-z-${i}`) - 0.5) * 5;
			const s = 3 + random(`${semilla}-s-${i}`) * 3.5;
			const color = random(`${semilla}-c-${i}`) > 0.6 ? '#7FE7FF' : '#B9A0FF';
			// se desvanece en los bordes para que no "salte" al dar la vuelta
			const borde = Math.min(1, (ancho / 2 - Math.abs(x)) / 1.5);
			return (
				<sprite key={i} position={[x, altura + Math.sin(t * 0.5 + i) * 0.08, zz]} scale={[s, s * 0.42, 1]}>
					<spriteMaterial map={texturaBruma()} color={color} transparent opacity={opacidad * borde} depthWrite={false} fog={false} />
				</sprite>
			);
		})}
	</group>
);

/** Piso oscuro con un charco de luz en el centro. */
export const PisoMisterio: React.FC<{luz?: number; colorLuz?: string; radioLuz?: number}> = ({luz = 1, colorLuz = '#8C6BFF', radioLuz = 2.6}) => (
	<group>
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]}>
			<circleGeometry args={[40, 48]} />
			<meshStandardMaterial color="#1B1240" roughness={0.92} />
		</mesh>
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]} scale={[radioLuz * 2, radioLuz * 2, 1]}>
			<planeGeometry args={[1, 1]} />
			<meshBasicMaterial map={texturaBruma()} color={colorLuz} transparent opacity={0.45 * luz} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
		</mesh>
	</group>
);

/**
 * Lienzo 3D con el clima de misterio: fondo violeta, niebla (fog + bancos de bruma),
 * luces dramáticas, piso y partículas flotando.
 */
export const EscenarioMisterio: React.FC<{
	t: number;
	children: React.ReactNode;
	overlay?: React.ReactNode;
	fondo?: string;
	piso?: boolean;
	luzPiso?: number;
	niebla?: number;
	cerca?: number;
	lejos?: number;
	particulas?: boolean;
}> = ({t, children, overlay, fondo = FONDO_MISTERIO, piso = true, luzPiso = 1, niebla = 1, cerca = 6, lejos = 24, particulas = true}) => (
	<Escenario3D fondo={fondo} luces={false} overlay={overlay}>
		<fog attach="fog" args={[COLOR_NIEBLA, cerca, lejos]} />
		<LucesMisterio />
		{piso ? <PisoMisterio luz={luzPiso} /> : null}
		{children}
		{niebla > 0 ? <Niebla t={t} opacidad={0.16 * niebla} /> : null}
		{particulas ? (
			<Destellos t={t} cantidad={45} rango={[10, 6, 6]} centro={[0, 2.2, -1.5]} tamano={0.035} semilla="misterio" colores={[TURQUESA, LILA, '#FFFFFF']} opacidad={0.75} />
		) : null}
	</Escenario3D>
);

// ---------------------------------------------------------------------------
// Caja con el signo de pregunta

const cacheCaja = new Map<string, THREE.BufferGeometry>();
const geoCaja = (x: number, y: number, z: number, r: number) => {
	const k = `${x}-${y}-${z}-${r}`;
	if (!cacheCaja.has(k)) cacheCaja.set(k, new RoundedBoxGeometry(x, y, z, 4, r));
	return cacheCaja.get(k)!;
};

export const ANCHO_CAJA = 1.7;
export const ALTO_CAJA = 1.25;
export const FONDO_CAJA = 1.4;

/**
 * Caja de cartón (origen en el piso, centro de la base). Frente hacia +Z.
 * `temblor` la sacude; `abrir` levanta la tapa (bisagra atrás) y deja salir luz violeta;
 * `rayosX` la vuelve translúcida para ver lo de adentro (`children`, en coordenadas de la caja).
 */
export const CajaMisterio: React.FC<{
	t: number;
	temblor?: number;
	abrir?: number;
	luzInterior?: number;
	rayosX?: number;
	brilloSigno?: number;
	/** el signo de pregunta "desinflado" (0..1): cae y se apaga, para la caja ignorada */
	desanimo?: number;
	position?: V3;
	rotation?: V3;
	scale?: number;
	children?: React.ReactNode;
}> = ({t, temblor = 0, abrir = 0, luzInterior, rayosX = 0, brilloSigno = 0.6, desanimo = 0, position, rotation, scale = 1, children}) => {
	const sx = temblor * (0.025 * Math.sin(t * 41) + 0.012 * Math.sin(t * 67));
	const rz = temblor * 0.035 * Math.sin(t * 37);
	const salto = temblor * 0.02 * Math.abs(Math.sin(t * 23));
	const tapa = Math.min(1, abrir + temblor * 0.05 * Math.abs(Math.sin(t * 29)));
	const luz = luzInterior ?? Math.min(1, abrir * 3 + temblor * 0.15);
	const transparente = rayosX > 0.01;
	const opacidad = 1 - 0.78 * rayosX;
	return (
		<group position={position} rotation={rotation} scale={scale}>
			<group position={[sx, salto, 0]} rotation={[0, 0, rz]}>
				{/* cuerpo */}
				<mesh geometry={geoCaja(ANCHO_CAJA, ALTO_CAJA, FONDO_CAJA, 0.05)} position={[0, ALTO_CAJA / 2, 0]} renderOrder={transparente ? 2 : 0}>
					<meshStandardMaterial color="#9B6E4E" roughness={0.88} transparent={transparente} opacity={opacidad} depthWrite={!transparente} />
				</mesh>
				{/* bordes más oscuros (pliegues del cartón) */}
				{[-1, 1].map((lado) => (
					<mesh key={lado} position={[lado * (ANCHO_CAJA / 2 - 0.02), ALTO_CAJA / 2, FONDO_CAJA / 2 + 0.002]}>
						<boxGeometry args={[0.05, ALTO_CAJA - 0.08, 0.01]} />
						<meshStandardMaterial color="#6E4A33" roughness={0.9} transparent={transparente} opacity={opacidad} />
					</mesh>
				))}
				{children ? <group>{children}</group> : null}
				{/* luz que se escapa por la rendija */}
				{luz > 0.01 ? (
					<group position={[0, ALTO_CAJA + 0.01, 0]}>
						<mesh rotation={[-Math.PI / 2, 0, 0]}>
							<planeGeometry args={[ANCHO_CAJA - 0.1, FONDO_CAJA - 0.1]} />
							<meshBasicMaterial color="#B98CFF" transparent opacity={0.5 * luz} toneMapped={false} />
						</mesh>
						<pointLight position={[0, 0.3, 0.3]} color="#A36BFF" intensity={6 * luz} distance={6} />
						{new Array(7).fill(0).map((_, i) => {
							const a = -0.9 + (i / 6) * 1.8;
							const largo = 1.6 + 0.5 * Math.sin(t * 2 + i * 1.7);
							return (
								<mesh key={i} position={[Math.sin(a) * 0.5, largo / 2, Math.cos(a) * 0.25]} rotation={[0, a * 0.3, -a * 0.45]}>
									<planeGeometry args={[0.16, largo]} />
									<meshBasicMaterial color="#B892FF" transparent opacity={0.16 * luz * (0.7 + 0.3 * Math.sin(t * 3 + i))} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} side={THREE.DoubleSide} fog={false} />
								</mesh>
							);
						})}
					</group>
				) : null}
				{/* tapa con bisagra atrás */}
				<group position={[0, ALTO_CAJA, -FONDO_CAJA / 2]} rotation={[-tapa * 0.75, 0, 0]}>
					<mesh geometry={geoCaja(ANCHO_CAJA + 0.08, 0.09, FONDO_CAJA + 0.08, 0.035)} position={[0, 0.045, FONDO_CAJA / 2]}>
						<meshStandardMaterial color="#B07D58" roughness={0.85} transparent={transparente} opacity={opacidad} depthWrite={!transparente} />
					</mesh>
					{/* cinta */}
					<mesh position={[0, 0.093, FONDO_CAJA / 2]}>
						<boxGeometry args={[0.26, 0.01, FONDO_CAJA + 0.09]} />
						<meshStandardMaterial color="#D9B98F" roughness={0.5} transparent={transparente} opacity={opacidad} />
					</mesh>
				</group>
				{/* el signo de pregunta brillante en el frente */}
				<group position={[0, ALTO_CAJA * (0.52 - 0.18 * desanimo), FONDO_CAJA / 2 + 0.1]} rotation={[0, 0, -0.5 * desanimo]}>
					<SignoPregunta t={t} luz={brilloSigno * (1 - 0.75 * desanimo)} color="#9FFFF0" emisivo="#1FE0C4" halo={TURQUESA} scale={0.58 * (1 - 0.25 * desanimo)} />
				</group>
				<pointLight position={[0, 0.7, 1.4]} color={TURQUESA} intensity={2.2 * brilloSigno * (1 - 0.7 * desanimo)} distance={4.5} />
			</group>
		</group>
	);
};

// ---------------------------------------------------------------------------
// El gato

type Rasgo = {pos: V3; escala: V3};
const mezclarV = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const mezclarR = (a: Rasgo, b: Rasgo, k: number): Rasgo => ({pos: mezclarV(a.pos, b.pos, k), escala: mezclarV(a.escala, b.escala, k)});

// sentado (S) y echado durmiendo (E)
const CUERPO = {S: {pos: [0, 0.5, -0.02], escala: [0.46, 0.54, 0.44]} as Rasgo, E: {pos: [0, 0.29, -0.15], escala: [0.5, 0.29, 0.66]} as Rasgo};
const PECHO = {S: {pos: [0, 0.56, 0.2], escala: [0.29, 0.36, 0.25]} as Rasgo, E: {pos: [0, 0.27, 0.27], escala: [0.32, 0.2, 0.28]} as Rasgo};
const CABEZA = {S: [0, 1.1, 0.1] as V3, E: [0, 0.5, 0.46] as V3};
const ANCAS = {S: {pos: [0.28, 0.27, -0.08], escala: [0.2, 0.25, 0.3]} as Rasgo, E: {pos: [0.3, 0.2, -0.45], escala: [0.2, 0.17, 0.3]} as Rasgo};
const HOMBRO = {S: [0.15, 0.62, 0.2] as V3, E: [0.17, 0.27, 0.28] as V3};
const PATA = {S: [0.15, 0.07, 0.3] as V3, E: [0.16, 0.08, 0.68] as V3};
const PATA_ATRAS = {S: [0.3, 0.06, 0.16] as V3, E: [0.3, 0.07, -0.18] as V3};

const GEO_ESFERA = new THREE.SphereGeometry(1, 28, 20);
const GEO_ESFERA_BAJA = new THREE.SphereGeometry(1, 14, 10);
const GEO_OREJA = new THREE.ConeGeometry(1, 1, 18);
const GEO_ARCO = new THREE.TorusGeometry(1, 0.22, 8, 20, Math.PI);

const VERTICE_FANTASMA = /* glsl */ `
	varying vec3 vN;
	varying vec3 vV;
	void main() {
		vec4 mv = modelViewMatrix * vec4(position, 1.0);
		vN = normalize(normalMatrix * normal);
		vV = normalize(-mv.xyz);
		gl_Position = projectionMatrix * mv;
	}`;
const FRAGMENTO_FANTASMA = /* glsl */ `
	uniform vec3 color;
	uniform float opacidad;
	varying vec3 vN;
	varying vec3 vV;
	void main() {
		float f = pow(1.0 - max(dot(normalize(vN), normalize(vV)), 0.0), 2.0);
		gl_FragColor = vec4(color * (0.5 + 1.25 * f), opacidad * (0.3 + 0.7 * f));
		#include <colorspace_fragment>
	}`;

const materialFantasma = (color: string) =>
	new THREE.ShaderMaterial({
		uniforms: {color: {value: new THREE.Color(color)}, opacidad: {value: 0.6}},
		vertexShader: VERTICE_FANTASMA,
		fragmentShader: FRAGMENTO_FANTASMA,
		transparent: true,
		depthWrite: false,
		fog: false,
	});

export type CaraGato = 'normal' | 'feliz' | 'enojado' | 'sorpresa';

type PropsGato = {
	t: number;
	/** 0 = sentado y atento, 1 = echado (durmiendo) */
	echado?: number;
	/** 0..1 apertura de ojos (0 = cerrados, como durmiendo) */
	ojos?: number;
	cara?: CaraGato;
	/** boca abierta (maullido) 0..1 */
	maullido?: number;
	/** giro de la cabeza [arriba/abajo, izquierda/derecha] en radianes */
	mirar?: [number, number];
	/** dónde miran las pupilas, -1..1 */
	pupilas?: [number, number];
	/** 0..1: levanta la pata derecha hacia adelante (golpear el plato) */
	pata?: number;
	/** translúcido con borde brillante (un "estado" del gato) */
	fantasma?: {color: string; opacidad: number} | null;
	pelaje?: string;
	panza?: string;
	rayas?: string;
	iris?: string;
	/** 0..1 cuánto se mueve la cola */
	cola?: number;
	position?: V3;
	rotation?: V3;
	scale?: number;
};

/**
 * Gato caricaturesco y simpático (atigrado naranja por defecto). Origen en el piso, mira a +Z,
 * mide ~1,55 sentado. Puede estar sentado o echado durmiendo, enojado, sorprendido, maullando,
 * y en modo "fantasma" (translúcido con borde de luz) para mostrar los dos estados superpuestos.
 */
export const Gato: React.FC<PropsGato> = ({
	t,
	echado = 0,
	ojos = 1,
	cara = 'normal',
	maullido = 0,
	mirar = [0, 0],
	pupilas = [0, 0],
	pata = 0,
	fantasma = null,
	pelaje = '#F28C38',
	panza = '#FFE7C9',
	rayas = '#B8561A',
	iris = '#A6F05A',
	cola = 1,
	position,
	rotation,
	scale = 1,
}) => {
	const esFantasma = Boolean(fantasma);
	const m = useMemo(() => {
		const solido = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) =>
			new THREE.MeshStandardMaterial({color, roughness: 0.72, ...extra});
		const basico = (color: string) => new THREE.MeshBasicMaterial({color, transparent: true, toneMapped: false});
		return esFantasma
			? {
					pelaje: materialFantasma(pelaje),
					panza: materialFantasma(panza),
					rayas: materialFantasma(rayas),
					oreja: materialFantasma('#FFB8D0'),
					iris: basico(iris),
					pupila: basico('#140A2E'),
					brillo: basico('#FFFFFF'),
					nariz: basico('#FF9EC0'),
					linea: basico('#140A2E'),
					lengua: basico('#FF7FA8'),
					bigote: basico('#FFFFFF'),
					mejilla: basico('#FF8FB5'),
				}
			: {
					pelaje: solido(pelaje),
					panza: solido(panza),
					rayas: solido(rayas),
					oreja: solido('#FFAFC5'),
					iris: solido(iris, {roughness: 0.25, emissive: new THREE.Color(iris), emissiveIntensity: 0.25}),
					pupila: solido('#120A1E', {roughness: 0.2}),
					brillo: basico('#FFFFFF'),
					nariz: solido('#FF8FAB', {roughness: 0.4}),
					linea: solido('#2A1420', {roughness: 0.5}),
					lengua: solido('#FF6F96', {roughness: 0.5}),
					bigote: basico('#FFF8EE'),
					mejilla: basico('#FF7F9F'),
				};
	}, [esFantasma, pelaje, panza, rayas, iris]);

	useEffect(() => () => Object.values(m).forEach((mat) => mat.dispose()), [m]);
	useLayoutEffect(() => {
		if (!fantasma) {
			(m.mejilla as THREE.MeshBasicMaterial).opacity = 0.4;
			return;
		}
		for (const clave of ['pelaje', 'panza', 'rayas', 'oreja'] as const) {
			const mat = m[clave] as THREE.ShaderMaterial;
			mat.uniforms.opacidad.value = fantasma.opacidad;
			mat.uniforms.color.value.set(clave === 'oreja' ? '#FFB8D0' : clave === 'panza' ? '#FFFFFF' : fantasma.color);
		}
		for (const clave of ['iris', 'pupila', 'brillo', 'nariz', 'linea', 'lengua', 'bigote'] as const) {
			(m[clave] as THREE.MeshBasicMaterial).opacity = Math.min(1, fantasma.opacidad * 1.3);
		}
		(m.iris as THREE.MeshBasicMaterial).color.set(fantasma.color);
		(m.mejilla as THREE.MeshBasicMaterial).opacity = 0.35 * fantasma.opacidad;
	});

	const k = echado;
	const cuerpo = mezclarR(CUERPO.S, CUERPO.E, k);
	const pecho = mezclarR(PECHO.S, PECHO.E, k);
	const respira = 1 + (0.015 + 0.03 * k) * Math.sin(t * (2.6 - 1.2 * k));
	const cabeza = mezclarV(CABEZA.S, CABEZA.E, k);
	const ancas = mezclarR(ANCAS.S, ANCAS.E, k);
	const hombro = mezclarV(HOMBRO.S, HOMBRO.E, k);
	const pataBase = mezclarV(PATA.S, PATA.E, k);
	const pataAtras = mezclarV(PATA_ATRAS.S, PATA_ATRAS.E, k);
	// pata derecha levantada hacia adelante
	const pataD: V3 = [pataBase[0] + 0.03 * pata, pataBase[1] + 0.5 * pata, pataBase[2] + 0.32 * pata];
	const giroCabeza: V3 = [mirar[0] + 0.22 * k, mirar[1], 0.2 * k + 0.04 * Math.sin(t * 1.3) * (1 - k)];

	const enojado = cara === 'enojado';
	const sorpresa = cara === 'sorpresa';
	const feliz = cara === 'feliz';
	const apertura = Math.max(0, Math.min(1, ojos)) * (enojado ? 0.7 : sorpresa ? 1.15 : 1);
	const cerrados = apertura < 0.18;

	// cola: cadena de esferas que rodea el cuerpo por la derecha y se curva en la punta
	const segmentosCola = 16;
	const finCola = 1.35 + 0.95 * k;
	const meneo = cola * (1 - 0.7 * k);
	const puntosCola = new Array(segmentosCola).fill(0).map((_, i) => {
		const u = i / (segmentosCola - 1);
		const a = -Math.PI / 2 + u * finCola + meneo * 0.18 * u * Math.sin(t * 2.4 - u * 2.5);
		const r = (0.5 + 0.12 * u) * (1 + 0.2 * k);
		const y = 0.08 + (0.42 * u ** 2.4) * (1 - 0.75 * k) + meneo * 0.04 * u * Math.sin(t * 3.1 + u * 4);
		return {pos: [Math.cos(a) * r, y, Math.sin(a) * r * (1 + 0.15 * k) - 0.05] as V3, radio: 0.078 - 0.026 * u};
	});

	return (
		<group position={position} rotation={rotation} scale={scale}>
			{/* cuerpo y pecho */}
			<mesh geometry={GEO_ESFERA} material={m.pelaje} position={cuerpo.pos} scale={[cuerpo.escala[0] * respira, cuerpo.escala[1] * respira, cuerpo.escala[2]]} />
			<mesh geometry={GEO_ESFERA} material={m.panza} position={pecho.pos} scale={pecho.escala} />
			{/* rayas del lomo */}
			{[-0.12, 0.05, 0.22].map((dz, i) => (
				<mesh
					key={i}
					geometry={GEO_ESFERA_BAJA}
					material={m.rayas}
					position={[0, cuerpo.pos[1] + cuerpo.escala[1] * 0.93 - Math.abs(dz) * 0.15, cuerpo.pos[2] + dz * (1 + 0.6 * k) - 0.12]}
					scale={[0.2, 0.04, 0.055]}
				/>
			))}
			{/* ancas y patas de atrás */}
			{[-1, 1].map((lado) => (
				<group key={`anca-${lado}`}>
					<mesh geometry={GEO_ESFERA} material={m.pelaje} position={[lado * ancas.pos[0], ancas.pos[1], ancas.pos[2]]} scale={ancas.escala} />
					<mesh geometry={GEO_ESFERA_BAJA} material={m.panza} position={[lado * pataAtras[0], pataAtras[1], pataAtras[2]]} scale={[0.1, 0.065, 0.13]} />
				</group>
			))}
			{/* patas delanteras */}
			{[-1, 1].map((lado) => {
				const h: V3 = [lado * hombro[0], hombro[1], hombro[2]];
				const p: V3 = lado > 0 ? pataD : [lado * pataBase[0], pataBase[1], pataBase[2]];
				return (
					<group key={`pata-${lado}`}>
						<Segmento desde={h} hasta={[p[0], p[1] + 0.05, p[2]]} radio={0.078} material={m.pelaje} />
						<mesh geometry={GEO_ESFERA_BAJA} material={m.panza} position={p} scale={[0.1, 0.07, 0.12]} />
					</group>
				);
			})}
			{/* cola */}
			{puntosCola.map((p, i) => (
				<mesh key={`cola-${i}`} geometry={GEO_ESFERA_BAJA} material={i > segmentosCola - 4 ? m.rayas : m.pelaje} position={p.pos} scale={p.radio} />
			))}

			{/* cabeza */}
			<group position={cabeza} rotation={giroCabeza}>
				<mesh geometry={GEO_ESFERA} material={m.pelaje} scale={[0.44, 0.37, 0.38]} />
				{/* rayitas de la frente */}
				{[-0.09, 0, 0.09].map((x, i) => (
					<mesh key={`frente-${i}`} geometry={GEO_ESFERA_BAJA} material={m.rayas} position={[x, 0.27 - Math.abs(x) * 0.3, 0.24]} rotation={[0.9, 0, x * 2]} scale={[0.025, 0.07, 0.02]} />
				))}
				{/* orejas */}
				{[-1, 1].map((lado) => (
					<group key={`oreja-${lado}`} position={[lado * 0.25, 0.28, -0.02]} rotation={[-0.1, 0, lado * -0.42 + (enojado ? lado * -0.25 : 0)]}>
						<mesh geometry={GEO_OREJA} material={m.pelaje} position={[0, 0.1, 0]} scale={[0.14, 0.26, 0.09]} />
						<mesh geometry={GEO_OREJA} material={m.oreja} position={[0, 0.085, 0.045]} scale={[0.085, 0.18, 0.04]} />
					</group>
				))}
				{/* hocico, nariz y boca */}
				{[-1, 1].map((lado) => (
					<mesh key={`hocico-${lado}`} geometry={GEO_ESFERA} material={m.panza} position={[lado * 0.075, -0.11, 0.29]} scale={[0.1, 0.08, 0.08]} />
				))}
				<mesh geometry={GEO_ESFERA} material={m.panza} position={[0, -0.17, 0.25]} scale={[0.09, 0.06, 0.07]} />
				<mesh geometry={GEO_ESFERA_BAJA} material={m.nariz} position={[0, -0.055, 0.375]} scale={[0.045, 0.03, 0.03]} />
				{maullido > 0.05 ? (
					<group position={[0, -0.16, 0.34]}>
						<mesh geometry={GEO_ESFERA_BAJA} material={m.linea} scale={[0.07 + 0.02 * maullido, 0.035 + 0.06 * maullido, 0.03]} />
						<mesh geometry={GEO_ESFERA_BAJA} material={m.lengua} position={[0, -0.025 * maullido, 0.012]} scale={[0.045, 0.025 * maullido, 0.025]} />
					</group>
				) : (
					[-1, 1].map((lado) => (
						<mesh
							key={`boca-${lado}`}
							geometry={GEO_ARCO}
							material={m.linea}
							position={[lado * 0.042, -0.1 + (enojado ? -0.035 : 0), 0.365]}
							rotation={[0, 0, enojado ? 0 : Math.PI]}
							scale={feliz ? 0.05 : 0.042}
						/>
					))
				)}
				{/* bigotes */}
				{[-1, 1].map((lado) =>
					[0, 1, 2].map((i) => (
						<Segmento
							key={`bigote-${lado}-${i}`}
							desde={[lado * 0.15, -0.09 - i * 0.025, 0.33]}
							hasta={[lado * (0.48 + 0.02 * i), -0.02 - i * 0.07 + 0.015 * Math.sin(t * 2 + i), 0.27]}
							radio={0.006}
							material={m.bigote}
							extremos={false}
						/>
					)),
				)}
				{/* mejillas */}
				{[-1, 1].map((lado) => (
					<mesh key={`mejilla-${lado}`} geometry={GEO_ESFERA_BAJA} material={m.mejilla} position={[lado * 0.25, -0.07, 0.27]} scale={[0.06, 0.035, 0.02]} />
				))}
				{/* ojos */}
				{[-1, 1].map((lado) => (
					<group key={`ojo-${lado}`} position={[lado * 0.145, 0.05, 0.31]} rotation={[0, lado * 0.32, 0]}>
						{cerrados ? (
							<mesh geometry={GEO_ARCO} material={m.linea} position={[0, 0.01, 0.03]} rotation={[0, 0, feliz ? 0 : Math.PI]} scale={0.065} />
						) : (
							<group scale={[1, apertura, 1]}>
								<mesh geometry={GEO_ESFERA} material={m.iris} scale={[0.092, 0.11, 0.05]} />
								<mesh
									geometry={GEO_ESFERA_BAJA}
									material={m.pupila}
									position={[pupilas[0] * 0.03, pupilas[1] * 0.03, 0.03]}
									scale={sorpresa ? [0.045, 0.05, 0.03] : [0.032, 0.088, 0.03]}
								/>
								<mesh geometry={GEO_ESFERA_BAJA} material={m.brillo} position={[0.03, 0.045, 0.052]} scale={0.022} />
								<mesh geometry={GEO_ESFERA_BAJA} material={m.brillo} position={[-0.025, -0.035, 0.05]} scale={0.011} />
							</group>
						)}
						{enojado && !cerrados ? (
							<>
								{/* párpado caído hacia adentro: mirada de enojo */}
								<mesh geometry={GEO_ESFERA} material={m.pelaje} position={[lado * -0.012, 0.085, 0.018]} rotation={[0, 0, lado * -0.42]} scale={[0.12, 0.06, 0.06]} />
								<Segmento desde={[lado * 0.1, 0.15, 0.05]} hasta={[lado * -0.07, 0.085, 0.075]} radio={0.026} material={m.linea} />
							</>
						) : null}
					</group>
				))}
			</group>
		</group>
	);
};

/** "Zzz" 3D que suben y se desvanecen (cada Z, hecha con tres barritas). */
export const Zzz3D: React.FC<{t: number; color?: string; position?: V3; scale?: number; opacidad?: number}> = ({t, color = LILA, position, scale = 1, opacidad = 1}) => (
	<group position={position} scale={scale}>
		{[0, 1, 2].map((i) => {
			const fase = (t * 0.55 + i / 3) % 1;
			const s = 0.12 + 0.16 * fase;
			const op = Math.sin(fase * Math.PI) * opacidad;
			return (
				<group key={i} position={[0.35 * fase + 0.06 * Math.sin(t * 2 + i), 0.85 * fase, 0]} scale={s} rotation={[0, 0, 0.15 * Math.sin(t + i)]}>
					{[
						{pos: [0, 0.5, 0] as V3, rot: 0, largo: 1},
						{pos: [0, -0.5, 0] as V3, rot: 0, largo: 1},
						{pos: [0, 0, 0] as V3, rot: Math.atan2(1, 1), largo: Math.SQRT2},
					].map((b, j) => (
						<mesh key={j} position={b.pos} rotation={[0, 0, b.rot]}>
							<boxGeometry args={[b.largo, 0.2, 0.1]} />
							<meshBasicMaterial color={color} transparent opacity={op} toneMapped={false} fog={false} />
						</mesh>
					))}
				</group>
			);
		})}
	</group>
);

/** Los dos estados superpuestos: un gato despierto (turquesa) y otro durmiendo (lila) con "zzz". */
export const GatosSuperpuestos: React.FC<{
	t: number;
	opacidad?: number;
	/** separación lateral entre los dos (0 = exactamente superpuestos) */
	separar?: number;
	/** parpadeo cuántico 0..1 (las opacidades titilan alternadas) */
	titilar?: number;
	position?: V3;
	rotation?: V3;
	scale?: number;
}> = ({t, opacidad = 0.75, separar = 0, titilar = 0.3, position, rotation, scale = 1}) => {
	const a = opacidad * (1 - titilar * 0.4 * (0.5 + 0.5 * Math.sin(t * 7.3)));
	const b = opacidad * (1 - titilar * 0.4 * (0.5 + 0.5 * Math.sin(t * 7.3 + Math.PI)));
	return (
		<group position={position} rotation={rotation} scale={scale}>
			<Gato t={t} echado={1} ojos={0} fantasma={{color: LILA, opacidad: b}} position={[separar * 0.5, 0, 0]} cola={0.3} />
			<Gato t={t} echado={0} ojos={1} fantasma={{color: TURQUESA, opacidad: a}} position={[-separar * 0.5, 0, 0.05]} pupilas={[0, 0]} />
			<Zzz3D t={t} position={[0.25 + separar * 0.5, 0.85, 0.5]} scale={0.9} opacidad={Math.min(1, b * 1.3)} />
		</group>
	);
};

// ---------------------------------------------------------------------------
// Átomo y bolitas

/** Átomo brillante: núcleo de bolitas y tres órbitas con electrones. */
export const Atomo: React.FC<{t: number; color?: string; brillo?: number; electrones?: boolean; position?: V3; scale?: number}> = ({
	t,
	color = '#7CFF7A',
	brillo = 1,
	electrones = true,
	position,
	scale = 1,
}) => {
	const nucleo: V3[] = [
		[0, 0, 0],
		[0.11, 0.05, 0.04],
		[-0.1, 0.06, -0.03],
		[0.02, -0.11, 0.05],
		[0.04, 0.1, -0.09],
		[-0.06, -0.06, -0.09],
		[-0.04, 0.02, 0.11],
	];
	return (
		<group position={position} scale={scale}>
			<Resplandor color={color} escala={1.6 + 0.3 * Math.sin(t * 5)} opacidad={0.55 * brillo} />
			<group rotation={[t * 0.8, t * 1.1, 0]}>
				{nucleo.map((p, i) => (
					<mesh key={i} geometry={GEO_ESFERA_BAJA} position={p} scale={0.095}>
						<meshStandardMaterial color={i % 2 ? color : '#E9FFE6'} emissive={color} emissiveIntensity={0.6 + 0.8 * brillo} roughness={0.35} />
					</mesh>
				))}
			</group>
			{electrones
				? [0, 1, 2].map((i) => {
						const a = t * (2.2 + i * 0.4) + i * 2;
						return (
							<group key={i} rotation={[Math.PI / 2 + (i - 1) * 0.9, (i * TAU) / 3, 0]}>
								<mesh>
									<torusGeometry args={[0.62, 0.008, 6, 80]} />
									<meshBasicMaterial color="#D7FFF6" transparent opacity={0.55} toneMapped={false} />
								</mesh>
								<mesh geometry={GEO_ESFERA_BAJA} position={[Math.cos(a) * 0.62, Math.sin(a) * 0.62, 0]} scale={0.045}>
									<meshBasicMaterial color="#FFFFFF" toneMapped={false} />
								</mesh>
							</group>
						);
					})
				: null}
		</group>
	);
};

/** Bolita brillante (un estado cuántico). */
export const Bolita: React.FC<{color: string; radio?: number; brillo?: number; opacidad?: number; position?: V3}> = ({color, radio = 0.35, brillo = 1, opacidad = 1, position}) => (
	<group position={position}>
		<Resplandor color={color} escala={radio * 6} opacidad={0.5 * brillo * opacidad} />
		<mesh geometry={GEO_ESFERA} scale={radio}>
			<meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5 + 0.7 * brillo} roughness={0.25} transparent={opacidad < 1} opacity={opacidad} />
		</mesh>
		<mesh geometry={GEO_ESFERA_BAJA} position={[radio * 0.35, radio * 0.4, radio * 0.75]} scale={radio * 0.22}>
			<meshBasicMaterial color="#FFFFFF" transparent opacity={0.8 * opacidad} toneMapped={false} />
		</mesh>
	</group>
);

// ---------------------------------------------------------------------------
// Moneda con las dos caras del gato

const dibujarCaraMoneda = (ctx: CanvasRenderingContext2D, despierto: boolean) => {
	const W = ctx.canvas.width;
	const c = W / 2;
	// la cara de atrás de la tapa del cilindro queda girada 180°: se compensa dibujándola girada
	if (!despierto) {
		ctx.translate(W, W);
		ctx.rotate(Math.PI);
	}
	const g = ctx.createRadialGradient(c * 0.8, c * 0.7, 20, c, c, c);
	g.addColorStop(0, '#FFF1A8');
	g.addColorStop(0.55, '#FFC93C');
	g.addColorStop(1, '#C98A12');
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, W, W);
	ctx.strokeStyle = '#9A6408';
	ctx.lineWidth = 16;
	ctx.beginPath();
	ctx.arc(c, c, c * 0.86, 0, TAU);
	ctx.stroke();
	// cara de gato en relieve
	ctx.fillStyle = '#E8A41E';
	ctx.strokeStyle = '#8A5606';
	ctx.lineWidth = 12;
	ctx.lineJoin = 'round';
	ctx.beginPath();
	ctx.moveTo(c - 150, c - 40);
	ctx.lineTo(c - 140, c - 190);
	ctx.lineTo(c - 60, c - 120);
	ctx.quadraticCurveTo(c, c - 140, c + 60, c - 120);
	ctx.lineTo(c + 140, c - 190);
	ctx.lineTo(c + 150, c - 40);
	ctx.quadraticCurveTo(c + 175, c + 130, c, c + 150);
	ctx.quadraticCurveTo(c - 175, c + 130, c - 150, c - 40);
	ctx.closePath();
	ctx.fill();
	ctx.stroke();
	ctx.strokeStyle = '#5E3A04';
	ctx.fillStyle = '#5E3A04';
	ctx.lineWidth = 14;
	ctx.lineCap = 'round';
	for (const lado of [-1, 1]) {
		ctx.beginPath();
		if (despierto) {
			ctx.ellipse(c + lado * 62, c - 10, 30, 40, 0, 0, TAU);
			ctx.fill();
			ctx.fillStyle = '#FFF6D0';
			ctx.beginPath();
			ctx.arc(c + lado * 62 + 10, c - 24, 9, 0, TAU);
			ctx.fill();
			ctx.fillStyle = '#5E3A04';
		} else {
			ctx.arc(c + lado * 62, c - 20, 30, 0.15 * Math.PI, 0.85 * Math.PI);
			ctx.stroke();
		}
	}
	// nariz, boca y bigotes
	ctx.beginPath();
	ctx.moveTo(c - 14, c + 38);
	ctx.lineTo(c + 14, c + 38);
	ctx.lineTo(c, c + 54);
	ctx.closePath();
	ctx.fill();
	ctx.beginPath();
	ctx.arc(c - 22, c + 58, 22, 0, Math.PI);
	ctx.arc(c + 22, c + 58, 22, Math.PI, 0, true);
	ctx.stroke();
	ctx.lineWidth = 8;
	for (const lado of [-1, 1]) {
		for (let i = 0; i < 2; i++) {
			ctx.beginPath();
			ctx.moveTo(c + lado * 70, c + 48 + i * 20);
			ctx.lineTo(c + lado * 150, c + 36 + i * 34);
			ctx.stroke();
		}
	}
	if (!despierto) {
		ctx.font = `900 72px ${FUENTE}`;
		ctx.fillText('z', c + 150, c - 150);
		ctx.font = `900 52px ${FUENTE}`;
		ctx.fillText('z', c + 190, c - 200);
	}
};

/** Moneda que gira en el aire sin caer: de un lado el gato despierto, del otro dormido. */
export const Moneda: React.FC<{t: number; giro: number; position?: V3; rotation?: V3; scale?: number}> = ({giro, position, rotation, scale = 1}) => {
	const caraA = useTexturaCanvas('moneda-despierto', 512, 512, (ctx) => dibujarCaraMoneda(ctx, true));
	const caraB = useTexturaCanvas('moneda-dormido', 512, 512, (ctx) => dibujarCaraMoneda(ctx, false), true);
	const materiales = useMemo(
		() => [
			new THREE.MeshStandardMaterial({color: '#E0A526', metalness: 0.75, roughness: 0.3}),
			new THREE.MeshStandardMaterial({color: '#FFFFFF', metalness: 0.35, roughness: 0.4}),
			new THREE.MeshStandardMaterial({color: '#FFFFFF', metalness: 0.35, roughness: 0.4}),
		],
		[],
	);
	useLayoutEffect(() => {
		materiales[1].map = caraA;
		materiales[2].map = caraB;
		materiales[1].emissiveMap = caraA;
		materiales[2].emissiveMap = caraB;
		materiales[1].emissive.set('#FFFFFF');
		materiales[2].emissive.set('#FFFFFF');
		materiales[1].emissiveIntensity = 0.35;
		materiales[2].emissiveIntensity = 0.35;
		materiales.forEach((mat) => (mat.needsUpdate = true));
	}, [caraA, caraB, materiales]);
	return (
		<group position={position} rotation={rotation} scale={scale}>
			<group rotation={[0, giro, 0]}>
				<mesh material={materiales} rotation={[Math.PI / 2, Math.PI / 2, 0]}>
					<cylinderGeometry args={[0.6, 0.6, 0.07, 64]} />
				</mesh>
			</group>
		</group>
	);
};

// ---------------------------------------------------------------------------
// Hilo de luz

/** Hilo luminoso curvo entre dos puntos, con pulsos que viajan. `progreso` lo va dibujando. */
export const HiloLuz: React.FC<{t: number; desde: V3; hasta: V3; curva?: V3; color?: string; progreso?: number; radio?: number}> = ({
	t,
	desde,
	hasta,
	curva = [0, 0.6, 0],
	color = TURQUESA,
	progreso = 1,
	radio = 0.025,
}) => {
	const clave = JSON.stringify([desde, hasta, curva, radio]);
	const {geo, curvaBezier} = useMemo(() => {
		const medio = new THREE.Vector3((desde[0] + hasta[0]) / 2 + curva[0], (desde[1] + hasta[1]) / 2 + curva[1], (desde[2] + hasta[2]) / 2 + curva[2]);
		const c = new THREE.QuadraticBezierCurve3(new THREE.Vector3(...desde), medio, new THREE.Vector3(...hasta));
		return {geo: new THREE.TubeGeometry(c, 64, radio, 8, false), curvaBezier: c};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [clave]);
	useEffect(() => () => geo.dispose(), [geo]);
	const total = geo.index ? geo.index.count : 0;
	geo.setDrawRange(0, Math.floor((total * Math.max(0, Math.min(1, progreso))) / 6) * 6);
	return (
		<group>
			<mesh geometry={geo}>
				<meshBasicMaterial color={color} transparent opacity={0.9} toneMapped={false} fog={false} />
			</mesh>
			{progreso > 0.98
				? [0, 1, 2].map((i) => {
						const u = (t * 0.7 + i / 3) % 1;
						const p = curvaBezier.getPoint(u);
						return (
							<group key={i} position={[p.x, p.y, p.z]}>
								<mesh geometry={GEO_ESFERA_BAJA} scale={radio * 2.6}>
									<meshBasicMaterial color="#FFFFFF" toneMapped={false} fog={false} />
								</mesh>
								<Resplandor color={color} escala={0.45} opacidad={0.7} />
							</group>
						);
					})
				: null}
		</group>
	);
};

// ---------------------------------------------------------------------------
// Carteles, lupa, plato

/** Cartel de madera con texto o dibujo (canvas). Origen en el centro del tablero. */
export const Cartel3D: React.FC<{
	clave: string;
	dibujar: (ctx: CanvasRenderingContext2D) => void;
	ancho?: number;
	alto?: number;
	palo?: number;
	colorMarco?: string;
	position?: V3;
	rotation?: V3;
	scale?: number;
}> = ({clave, dibujar, ancho = 1.6, alto = 0.8, palo = 0, colorMarco = '#7A4E2D', position, rotation, scale = 1}) => {
	const pxAncho = 1024;
	const pxAlto = Math.round((1024 * alto) / ancho);
	const textura = useTexturaCanvas(clave, pxAncho, pxAlto, dibujar, true);
	return (
		<group position={position} rotation={rotation} scale={scale}>
			{palo > 0 ? (
				<mesh position={[0, -alto / 2 - palo / 2, -0.04]}>
					<boxGeometry args={[0.08, palo, 0.06]} />
					<meshStandardMaterial color="#5C3A20" roughness={0.85} />
				</mesh>
			) : null}
			<mesh position={[0, 0, -0.03]}>
				<boxGeometry args={[ancho + 0.1, alto + 0.1, 0.06]} />
				<meshStandardMaterial color={colorMarco} roughness={0.8} />
			</mesh>
			{textura ? (
				<mesh position={[0, 0, 0.002]}>
					<planeGeometry args={[ancho, alto]} />
					<meshBasicMaterial map={textura} toneMapped={false} />
				</mesh>
			) : null}
		</group>
	);
};

/** Lupa: aro dorado, vidrio y mango. `children` se ve "agrandado" dentro del vidrio. */
export const Lupa: React.FC<{radio?: number; position?: V3; rotation?: V3; scale?: number; children?: React.ReactNode}> = ({radio = 0.5, position, rotation, scale = 1, children}) => (
	<group position={position} rotation={rotation} scale={scale}>
		{children}
		<mesh>
			<circleGeometry args={[radio, 48]} />
			<meshStandardMaterial color="#CFF7FF" transparent opacity={0.16} roughness={0.05} metalness={0.1} depthWrite={false} />
		</mesh>
		<mesh position={[-radio * 0.35, radio * 0.4, 0.01]} rotation={[0, 0, 0.7]}>
			<planeGeometry args={[radio * 0.18, radio * 0.7]} />
			<meshBasicMaterial color="#FFFFFF" transparent opacity={0.35} toneMapped={false} depthWrite={false} />
		</mesh>
		<mesh>
			<torusGeometry args={[radio, radio * 0.11, 14, 64]} />
			<meshStandardMaterial color="#F2C14E" metalness={0.75} roughness={0.25} />
		</mesh>
		<group rotation={[0, 0, Math.PI * 0.75]}>
			<mesh position={[0, radio * 1.45, 0]}>
				<cylinderGeometry args={[radio * 0.09, radio * 0.09, radio * 0.5, 16]} />
				<meshStandardMaterial color="#F2C14E" metalness={0.75} roughness={0.25} />
			</mesh>
			<mesh position={[0, radio * 2.15, 0]}>
				<cylinderGeometry args={[radio * 0.14, radio * 0.12, radio * 1.0, 16]} />
				<meshStandardMaterial color="#5B2A86" roughness={0.5} />
			</mesh>
		</group>
	</group>
);

let geoPlato: THREE.LatheGeometry | null = null;
/** Plato (comedero) vacío. */
export const Plato: React.FC<{position?: V3; rotation?: V3; scale?: number}> = ({position, rotation, scale = 1}) => {
	if (!geoPlato) {
		const perfil = [
			[0.0, 0.0],
			[0.36, 0.0],
			[0.48, 0.07],
			[0.56, 0.2],
			[0.57, 0.23],
			[0.52, 0.23],
			[0.44, 0.1],
			[0.32, 0.055],
			[0.0, 0.055],
		].map(([x, y]) => new THREE.Vector2(x, y));
		geoPlato = new THREE.LatheGeometry(perfil, 48);
	}
	return (
		<group position={position} rotation={rotation} scale={scale}>
			<mesh geometry={geoPlato}>
				<meshStandardMaterial color="#FF4F7B" roughness={0.3} metalness={0.1} side={THREE.DoubleSide} />
			</mesh>
			<mesh position={[0, 0.057, 0]} rotation={[-Math.PI / 2, 0, 0]}>
				<circleGeometry args={[0.32, 32]} />
				<meshStandardMaterial color="#F7E3EA" roughness={0.4} />
			</mesh>
		</group>
	);
};

// ---------------------------------------------------------------------------
// Molécula gigante

type AtomoMol = {pos: V3; color: string; r: number};
const COLORES_MOL = {C: '#596277', N: '#4C7DFF', O: '#FF4D5E', H: '#F1F1F7', S: '#FFD23F', F: '#6BFFB0'};

const armarMolecula = () => {
	const atomos: AtomoMol[] = [];
	const enlaces: [number, number][] = [];
	const agregar = (pos: V3, tipo: keyof typeof COLORES_MOL) => {
		atomos.push({pos, color: COLORES_MOL[tipo], r: tipo === 'H' ? 0.07 : 0.11});
		return atomos.length - 1;
	};
	// anillo central
	const anillo: number[] = [];
	for (let i = 0; i < 12; i++) {
		const a = (i / 12) * TAU;
		anillo.push(agregar([Math.cos(a) * 0.55, Math.sin(a) * 0.55, 0.05 * Math.sin(a * 3)], i % 3 === 0 ? 'N' : 'C'));
		if (i > 0) enlaces.push([anillo[i - 1], anillo[i]]);
	}
	enlaces.push([anillo[11], anillo[0]]);
	// cuatro brazos con cadenas y átomos de los costados
	for (let b = 0; b < 4; b++) {
		const a0 = (b / 4) * TAU + Math.PI / 12;
		let previo = anillo[b * 3 + 1];
		for (let j = 1; j <= 5; j++) {
			const r = 0.55 + j * 0.24;
			const a = a0 + 0.1 * Math.sin(j * 1.7 + b);
			const z = 0.12 * Math.sin(j * 1.3 + b * 2);
			const tipo = j === 5 ? (b % 2 ? 'S' : 'F') : j === 3 ? 'O' : 'C';
			const actual = agregar([Math.cos(a) * r, Math.sin(a) * r, z], tipo);
			enlaces.push([previo, actual]);
			// hidrógenos a los costados
			if (j % 2 === 0) {
				for (const lado of [-1, 1]) {
					const h = agregar([Math.cos(a + lado * 0.28) * (r + 0.02), Math.sin(a + lado * 0.28) * (r + 0.02), z + lado * 0.15], 'H');
					enlaces.push([actual, h]);
				}
			}
			previo = actual;
		}
	}
	return {atomos, enlaces};
};

/** Molécula grande de bolitas de colores con enlaces (instanciada). */
export const Molecula: React.FC<{opacidad?: number; position?: V3; rotation?: V3; scale?: number}> = ({opacidad = 1, position, rotation, scale = 1}) => {
	const {atomos, enlaces} = useMemo(armarMolecula, []);
	const refA = useRef<THREE.InstancedMesh>(null);
	const refE = useRef<THREE.InstancedMesh>(null);
	useLayoutEffect(() => {
		const o = new THREE.Object3D();
		const c = new THREE.Color();
		atomos.forEach((a, i) => {
			o.position.set(...a.pos);
			o.scale.setScalar(a.r);
			o.rotation.set(0, 0, 0);
			o.updateMatrix();
			refA.current!.setMatrixAt(i, o.matrix);
			refA.current!.setColorAt(i, c.set(a.color));
		});
		refA.current!.instanceMatrix.needsUpdate = true;
		if (refA.current!.instanceColor) refA.current!.instanceColor.needsUpdate = true;
		const arriba = new THREE.Vector3(0, 1, 0);
		enlaces.forEach(([i, j], k) => {
			const p = new THREE.Vector3(...atomos[i].pos);
			const q = new THREE.Vector3(...atomos[j].pos);
			const d = q.clone().sub(p);
			o.position.copy(p.clone().lerp(q, 0.5));
			o.quaternion.setFromUnitVectors(arriba, d.clone().normalize());
			o.scale.set(0.028, d.length(), 0.028);
			o.updateMatrix();
			refE.current!.setMatrixAt(k, o.matrix);
		});
		refE.current!.instanceMatrix.needsUpdate = true;
	}, [atomos, enlaces]);
	return (
		<group position={position} rotation={rotation} scale={scale}>
			<instancedMesh ref={refA} args={[undefined, undefined, atomos.length]} frustumCulled={false}>
				<sphereGeometry args={[1, 16, 12]} />
				<meshStandardMaterial roughness={0.3} emissive="#2A1A55" emissiveIntensity={0.4} transparent={opacidad < 1} opacity={opacidad} />
			</instancedMesh>
			<instancedMesh ref={refE} args={[undefined, undefined, enlaces.length]} frustumCulled={false}>
				<cylinderGeometry args={[1, 1, 1, 8]} />
				<meshStandardMaterial color="#D8D2F0" roughness={0.4} transparent={opacidad < 1} opacity={opacidad} />
			</instancedMesh>
		</group>
	);
};

// ---------------------------------------------------------------------------
// Schrödinger

const MAT_BATA = new THREE.MeshStandardMaterial({color: '#F4F6FB', roughness: 0.7, flatShading: true, side: THREE.DoubleSide});
const MAT_OSCURO = new THREE.MeshStandardMaterial({color: '#262335', roughness: 0.4});
const MAT_MONO = new THREE.MeshStandardMaterial({color: '#C2185B', roughness: 0.5});

/** Anteojos redondos (van dentro de la cabeza del Avatar). */
const Anteojos: React.FC = () => (
	<group position={[0, 0.185, 0.2]}>
		{[-1, 1].map((lado) => (
			<mesh key={lado} position={[lado * 0.07, 0, 0]} material={MAT_OSCURO}>
				<torusGeometry args={[0.048, 0.008, 6, 24]} />
			</mesh>
		))}
		<mesh material={MAT_OSCURO} position={[0, 0.01, 0]}>
			<boxGeometry args={[0.045, 0.01, 0.01]} />
		</mesh>
		{[-1, 1].map((lado) => (
			<mesh key={`p-${lado}`} material={MAT_OSCURO} position={[lado * 0.15, 0, -0.08]} rotation={[0, lado * 0.3, 0]}>
				<boxGeometry args={[0.01, 0.01, 0.17]} />
			</mesh>
		))}
	</group>
);

/** Bata de laboratorio y moño (van pegados al torso). */
const Bata: React.FC = () => (
	<group>
		{/* faldón de la bata */}
		<mesh material={MAT_BATA} position={[0, -0.2, 0]}>
			<cylinderGeometry args={[0.2, 0.29, 0.5, 10, 1, true]} />
		</mesh>
		{/* solapas */}
		{[-1, 1].map((lado) => (
			<mesh key={lado} material={MAT_BATA} position={[lado * 0.07, 0.42, 0.205]} rotation={[0.25, 0, lado * 0.4]}>
				<boxGeometry args={[0.06, 0.2, 0.02]} />
			</mesh>
		))}
		{/* moño */}
		{[-1, 1].map((lado) => (
			<mesh key={`m-${lado}`} material={MAT_MONO} position={[lado * 0.035, 0.5, 0.2]} rotation={[0, 0, lado * Math.PI / 2]}>
				<coneGeometry args={[0.03, 0.06, 4]} />
			</mesh>
		))}
		{/* bolsillo con lapiceras */}
		<mesh material={MAT_BATA} position={[0.12, 0.33, 0.215]}>
			<boxGeometry args={[0.08, 0.06, 0.01]} />
		</mesh>
		{['#3A86FF', '#EF233C'].map((color, i) => (
			<mesh key={color} position={[0.1 + i * 0.035, 0.38, 0.215]}>
				<cylinderGeometry args={[0.008, 0.008, 0.07, 6]} />
				<meshStandardMaterial color={color} roughness={0.4} />
			</mesh>
		))}
	</group>
);

/** Erwin Schrödinger estilo muñeco: anteojos redondos, pelo oscuro peinado, bata y moño. */
export const Schrodinger: React.FC<{
	t: number;
	animacion?: Animacion;
	mezcla?: {animacion: Animacion; peso: number}[];
	expresion?: 'feliz' | 'preocupada' | 'serena';
	brazos?: React.ComponentProps<typeof Avatar>['brazos'];
	giroCabeza?: V3;
	guino?: number;
	enMano?: React.ReactNode;
	position?: V3;
	rotation?: V3;
	scale?: number;
}> = (props) => (
	<Avatar
		{...props}
		cejas
		colores={{piel: '#F2C29B', remera: '#F4F6FB', pantalon: '#3A3F55', zapatillas: '#2B2118', pelo: '#3E2B20'}}
		cabeza={<Anteojos />}
		torso={<Bata />}
	/>
);

/** Fondo de las escenas con tiempo (para los componentes que no reciben t). */
export const useTiempo = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return {frame, fps, t: frame / fps};
};
