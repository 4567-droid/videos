import React, {useEffect, useLayoutEffect, useMemo} from 'react';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {FUENTE} from '../lib/fuente';
import {Resplandor} from './Efectos';
import {Segmento} from './Segmento';
import {useTexturaCanvas} from './texturas';
import {TAU, limitar, type V3} from './utilidades3d';

/**
 * Piezas para escenas de dormir (serie "noche"): luces nocturnas, habitación con
 * ventana y luna, cama y un muñeco acostado (Durmiente) con ojos, cejas y boca
 * controlables, brazos y piernas que se pueden "apagar" (gris) y manta opcional.
 *
 * Coordenadas de la cama: el origen es el centro de la parte de arriba del colchón;
 * la cabeza va hacia -Z (cabecera) y los pies hacia +Z. El piso está en y = -0.75.
 */

export const PISO_CAMA = -0.75;

/** Luces de noche: luna fría desde la ventana, relleno cálido y contraluz violeta. `luz` (0..1) prende el cuarto. */
export const LucesNoche: React.FC<{luz?: number; intensidad?: number}> = ({luz = 0, intensidad = 1}) => (
	<>
		<hemisphereLight args={['#B8C4FF', '#2A1B6B', (0.85 + 0.9 * luz) * intensidad]} />
		<directionalLight position={[-3, 4, 2.5]} intensity={(1.7 + 1.0 * luz) * intensidad} color="#C9D6FF" />
		<directionalLight position={[3, 2.5, 4]} intensity={(0.75 + 1.8 * luz) * intensidad} color="#FFD6A5" />
		<directionalLight position={[0, 3, -5]} intensity={1.3 * intensidad} color="#B388FF" />
		<ambientLight intensity={(0.12 + 0.35 * luz) * intensidad} />
	</>
);

const geoRedondeada = new Map<string, THREE.BufferGeometry>();
/** Caja con bordes redondeados (cacheada por tamaño). */
export const cajaRedondeada = (x: number, y: number, z: number, r: number) => {
	const clave = `${x}|${y}|${z}|${r}`;
	let geo = geoRedondeada.get(clave);
	if (!geo) {
		geo = new RoundedBoxGeometry(x, y, z, 3, r);
		geoRedondeada.set(clave, geo);
	}
	return geo;
};

/** Reloj despertador digital (canvas con texto). */
const RelojDigital: React.FC<{hora: string; position?: V3; rotation?: V3}> = ({hora, position, rotation}) => {
	const textura = useTexturaCanvas(
		`reloj-digital-${hora}`,
		256,
		128,
		(ctx) => {
			ctx.fillStyle = '#0B0A1F';
			ctx.fillRect(0, 0, 256, 128);
			ctx.fillStyle = '#FF4D6D';
			ctx.shadowColor = '#FF4D6D';
			ctx.shadowBlur = 18;
			ctx.font = `900 92px ${FUENTE}`;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(hora, 128, 70);
		},
		true,
	);
	return (
		<group position={position} rotation={rotation}>
			<mesh geometry={cajaRedondeada(0.42, 0.22, 0.14, 0.04)}>
				<meshStandardMaterial color="#3A2A80" roughness={0.5} />
			</mesh>
			{textura ? (
				<mesh position={[0, 0, 0.071]}>
					<planeGeometry args={[0.36, 0.17]} />
					<meshBasicMaterial map={textura} toneMapped={false} />
				</mesh>
			) : null}
		</group>
	);
};

/** Habitación de noche: piso, alfombra, pared con ventana y luna, mesa de luz con reloj. */
export const Habitacion: React.FC<{
	t: number;
	ventana?: boolean;
	mesa?: boolean;
	hora?: string;
	/** 0..1: brillo de la luna */
	luna?: number;
	colorPared?: string;
}> = ({t, ventana = true, mesa = true, hora = '3:07', luna = 1, colorPared = '#2D2275'}) => (
	<group>
		<mesh position={[0, PISO_CAMA, 0]} rotation={[-Math.PI / 2, 0, 0]}>
			<planeGeometry args={[14, 14]} />
			<meshStandardMaterial color="#1F1752" roughness={0.9} />
		</mesh>
		<mesh position={[0, PISO_CAMA + 0.005, 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
			<circleGeometry args={[1.9, 40]} />
			<meshStandardMaterial color="#4B2E9B" roughness={0.95} />
		</mesh>
		<mesh position={[0, 2.4, -1.45]}>
			<planeGeometry args={[14, 6.4]} />
			<meshStandardMaterial color={colorPared} roughness={0.95} />
		</mesh>
		{ventana ? (
			<group position={[-0.72, 1.2, -1.42]}>
				<mesh geometry={cajaRedondeada(0.98, 1.08, 0.06, 0.03)}>
					<meshStandardMaterial color="#6A4FCB" roughness={0.6} />
				</mesh>
				<mesh position={[0, 0, 0.032]}>
					<planeGeometry args={[0.84, 0.94]} />
					<meshBasicMaterial color="#0B1645" toneMapped={false} />
				</mesh>
				<mesh position={[0.17, 0.2, 0.036]}>
					<circleGeometry args={[0.15, 32]} />
					<meshBasicMaterial color="#FFF6C9" toneMapped={false} />
				</mesh>
				<mesh position={[0.23, 0.25, 0.038]}>
					<circleGeometry args={[0.12, 32]} />
					<meshBasicMaterial color="#0B1645" toneMapped={false} />
				</mesh>
				<Resplandor color="#FFF3B0" escala={0.9} opacidad={0.45 * luna} position={[0.17, 0.2, 0.06]} />
				{[
					[-0.28, 0.32],
					[-0.1, 0.05],
					[-0.3, -0.25],
					[0.25, -0.28],
					[0.05, -0.12],
					[0.33, 0.02],
				].map(([x, y], i) => (
					<mesh key={i} position={[x, y, 0.037]} scale={0.012 + 0.008 * (0.5 + 0.5 * Math.sin(t * 3 + i * 1.7))}>
						<circleGeometry args={[1, 6]} />
						<meshBasicMaterial color="#FFFFFF" toneMapped={false} />
					</mesh>
				))}
				<mesh position={[0, 0, 0.045]}>
					<boxGeometry args={[0.04, 0.94, 0.02]} />
					<meshStandardMaterial color="#6A4FCB" />
				</mesh>
				<mesh position={[0, 0, 0.045]}>
					<boxGeometry args={[0.84, 0.04, 0.02]} />
					<meshStandardMaterial color="#6A4FCB" />
				</mesh>
			</group>
		) : null}
		{mesa ? (
			<group position={[1.08, PISO_CAMA, -0.95]}>
				<mesh geometry={cajaRedondeada(0.52, 0.62, 0.46, 0.04)} position={[0, 0.31, 0]}>
					<meshStandardMaterial color="#7B4AC9" roughness={0.6} />
				</mesh>
				<mesh position={[0, 0.4, 0.232]}>
					<boxGeometry args={[0.42, 0.02, 0.01]} />
					<meshStandardMaterial color="#4E2E8F" />
				</mesh>
				<mesh position={[0, 0.48, 0.24]}>
					<sphereGeometry args={[0.03, 10, 8]} />
					<meshStandardMaterial color="#FFD23F" />
				</mesh>
				<RelojDigital hora={hora} position={[-0.02, 0.73, 0.02]} rotation={[0, -0.35, 0]} />
			</group>
		) : null}
	</group>
);

/** Cama con colchón, cabecera, pie y almohada. */
export const Cama: React.FC<{colorMarco?: string; almohada?: boolean}> = ({colorMarco = '#7B4AC9', almohada = true}) => (
	<group>
		<mesh geometry={cajaRedondeada(1.32, 0.3, 2.34, 0.07)} position={[0, -0.15, -0.06]}>
			<meshStandardMaterial color="#E9E6FF" roughness={0.85} />
		</mesh>
		<mesh geometry={cajaRedondeada(1.46, 0.24, 2.46, 0.04)} position={[0, -0.38, -0.06]}>
			<meshStandardMaterial color={colorMarco} roughness={0.6} />
		</mesh>
		{[
			[-0.64, -1.2],
			[0.64, -1.2],
			[-0.64, 1.08],
			[0.64, 1.08],
		].map(([x, z], i) => (
			<mesh key={i} position={[x, -0.62, z]}>
				<boxGeometry args={[0.1, 0.26, 0.1]} />
				<meshStandardMaterial color={colorMarco} roughness={0.6} />
			</mesh>
		))}
		<mesh geometry={cajaRedondeada(1.56, 1.2, 0.12, 0.05)} position={[0, 0.02, -1.33]}>
			<meshStandardMaterial color={colorMarco} roughness={0.6} />
		</mesh>
		<mesh geometry={cajaRedondeada(1.22, 0.8, 0.04, 0.03)} position={[0, 0.06, -1.26]}>
			<meshStandardMaterial color="#9D74E0" roughness={0.7} />
		</mesh>
		<mesh geometry={cajaRedondeada(1.56, 0.5, 0.1, 0.04)} position={[0, -0.34, 1.16]}>
			<meshStandardMaterial color={colorMarco} roughness={0.6} />
		</mesh>
		{almohada ? (
			<mesh geometry={cajaRedondeada(0.98, 0.2, 0.52, 0.09)} position={[0, 0.07, -0.93]} rotation={[-0.12, 0, 0]}>
				<meshStandardMaterial color="#FFFFFF" roughness={0.9} />
			</mesh>
		) : null}
	</group>
);

const campana = (u: number) => (Math.abs(u) >= 1 ? 0 : (1 - u * u) ** 0.7);
const paso = (a: number, b: number, x: number) => {
	const k = limitar((x - a) / (b - a));
	return k * k * (3 - 2 * k);
};

/** Altura del cuerpo acostado sobre el colchón (para que la manta lo cubra con bultos). */
const alturaCuerpo = (x: number, z: number) => {
	const enTorso = paso(-0.78, -0.62, z) * (1 - paso(-0.02, 0.14, z));
	const enPiernas = paso(-0.02, 0.14, z) * (1 - paso(0.74, 0.9, z));
	const torso = 0.38 * campana(x / 0.44);
	const piernas = 0.25 * Math.max(campana((x - 0.13) / 0.2), campana((x + 0.13) / 0.2));
	const pies = 0.33 * Math.max(campana((x - 0.14) / 0.13), campana((x + 0.14) / 0.13)) * campana((z - 0.84) / 0.12);
	return Math.max(torso * enTorso, piernas * enPiernas, pies);
};

/** Altura de la superficie de la manta (cae por los costados y por el pie de la cama). */
export const alturaManta = (x: number, z: number) => {
	let y = Math.max(alturaCuerpo(x, z) + 0.045, 0.055);
	const ax = Math.abs(x);
	if (ax > 0.64) y -= (ax - 0.64) * 2.4;
	if (z > 1.08) y -= (z - 1.08) * 2.4;
	return y;
};

const texturaManta = (ctx: CanvasRenderingContext2D) => {
	ctx.fillStyle = '#3F6DF2';
	ctx.fillRect(0, 0, 512, 512);
	// estrellitas y lunitas
	for (let i = 0; i < 26; i++) {
		const x = ((i * 137) % 512) + 10;
		const y = 70 + ((i * 89) % 430);
		ctx.save();
		ctx.translate(x, y);
		ctx.rotate(i);
		ctx.fillStyle = i % 3 === 0 ? '#FFFFFF' : '#FFD23F';
		ctx.beginPath();
		for (let k = 0; k < 10; k++) {
			const r = k % 2 === 0 ? 13 : 5.5;
			const a = (k / 10) * TAU;
			ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
		}
		ctx.closePath();
		ctx.fill();
		ctx.restore();
	}
	// doblez de la sábana arriba
	ctx.fillStyle = '#F4F1FF';
	ctx.fillRect(0, 0, 512, 46);
	ctx.fillStyle = '#C9C2F2';
	ctx.fillRect(0, 46, 512, 6);
};

/** Manta con bultos del cuerpo, desde `hasta` (z del borde de arriba) hasta los pies. */
const Manta: React.FC<{hasta: number; respira: number}> = ({hasta, respira}) => {
	const textura = useTexturaCanvas('manta-estrellas', 512, 512, texturaManta);
	const geo = useMemo(() => {
		const largo = 1.24 - hasta;
		const g = new THREE.PlaneGeometry(1.6, largo, 32, 40);
		g.rotateX(-Math.PI / 2);
		g.translate(0, 0, hasta + largo / 2);
		const pos = g.attributes.position;
		for (let i = 0; i < pos.count; i++) {
			pos.setY(i, alturaManta(pos.getX(i), pos.getZ(i)));
		}
		g.computeVertexNormals();
		return g;
	}, [hasta]);
	useEffect(() => () => geo.dispose(), [geo]);
	return (
		<mesh geometry={geo} scale={[1, 1 + 0.035 * respira, 1]}>
			<meshStandardMaterial map={textura} color="#FFFFFF" roughness={0.85} side={THREE.DoubleSide} />
		</mesh>
	);
};

export type BocaDurmiente = 'o' | 'sonrisa' | 'linea' | 'ronca';

type PropsDurmiente = {
	t: number;
	/** 0 = ojos cerrados, 1 = abiertos, hasta 1.35 = abiertos de par en par */
	abiertos?: number;
	/** hacia dónde miran las pupilas (-1..1) */
	mirar?: [number, number];
	/** -1 = asustado (cejas arqueadas), 0 = normal, 1 = relajado */
	cejas?: number;
	boca?: BocaDurmiente;
	/** 0..1 tamaño de la boca abierta ('o' y 'ronca') */
	abrirBoca?: number;
	/** 0..1: brazos y piernas "apagados" (grises) */
	apagado?: number;
	/** 0..1: amplitud de la respiración */
	respira?: number;
	/** 0..1: tiembla (cuerpo rígido que intenta moverse) */
	temblor?: number;
	antifaz?: boolean;
	/** z del borde de arriba de la manta (null = sin manta) */
	manta?: number | null;
	/** brazos abrazando una almohada sobre el pecho */
	abrazaAlmohada?: boolean;
	colorPijama?: string;
	position?: V3;
	rotation?: V3;
	scale?: number;
};

const GRIS_APAGADO = new THREE.Color('#4E5070');
const PIEL_APAGADA = new THREE.Color('#8E90A8');

/** Muñeco acostado boca arriba sobre la cama (cabeza en la almohada). */
export const Durmiente: React.FC<PropsDurmiente> = ({
	t,
	abiertos = 0,
	mirar = [0, 0],
	cejas = 0,
	boca = 'linea',
	abrirBoca = 0.5,
	apagado = 0,
	respira = 0.6,
	temblor = 0,
	antifaz = false,
	manta = null,
	abrazaAlmohada = false,
	colorPijama = '#FF7AA2',
	position,
	rotation,
	scale = 1,
}) => {
	const m = useMemo(() => {
		const mat = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial({flatShading: true, roughness: 0.62, ...p});
		return {
			piel: mat({color: '#F1B38A'}),
			pielExt: mat({color: '#F1B38A'}),
			pijama: mat({}),
			pijamaExt: mat({}),
			detalle: mat({color: '#FFFFFF'}),
			pelo: mat({color: '#3B2416', roughness: 0.8}),
			blanco: new THREE.MeshBasicMaterial({color: '#FFFFFF'}),
			pupila: new THREE.MeshBasicMaterial({color: '#1B1B2F'}),
			boca: new THREE.MeshBasicMaterial({color: '#6E1F33'}),
			mejillas: new THREE.MeshBasicMaterial({color: '#FF7B8A', transparent: true, opacity: 0.55}),
			antifaz: mat({color: '#9B5DE5', roughness: 0.5, flatShading: false}),
			almohada: new THREE.MeshStandardMaterial({color: '#FFE5EC', roughness: 0.9}),
		};
	}, []);
	useEffect(() => () => Object.values(m).forEach((x) => x.dispose()), [m]);
	useLayoutEffect(() => {
		const k = limitar(apagado);
		m.pijama.color.set(colorPijama);
		m.pijamaExt.color.set(colorPijama).lerp(GRIS_APAGADO, k);
		m.pielExt.color.set('#F1B38A').lerp(PIEL_APAGADA, k * 0.85);
		m.pijamaExt.emissive.set(colorPijama);
		m.pijamaExt.emissiveIntensity = 0.12 * (1 - k);
	});

	const resp = respira * Math.sin((TAU * t) / 3.2);
	const vib = (fase: number) => temblor * 0.012 * Math.sin(t * 47 + fase);
	const yBrazo = (x: number, z: number, natural: number) =>
		manta !== null && z > manta ? Math.max(natural, alturaManta(x, z) + 0.065) : natural;

	// ojos
	const ojo = Math.max(0, abiertos);
	const cerrados = ojo < 0.18;
	const grande = Math.max(0, ojo - 1);
	const preocupa = Math.max(0, -cejas);
	const relaja = Math.max(0, cejas);
	const subeCejas = 0.012 + 0.03 * Math.min(1, ojo) + 0.05 * grande - 0.012 * relaja;

	return (
		<group position={position} rotation={rotation} scale={scale}>
			{/* torso */}
			<group position={[0, 0.19, -0.3]}>
				<mesh material={m.pijama} rotation={[Math.PI / 2, 0, 0]} scale={[1.15, 1, 0.85 + 0.05 * resp]}>
					<capsuleGeometry args={[0.2, 0.34, 4, 10]} />
				</mesh>
				{[-0.1, 0.06].map((z, i) => (
					<mesh key={i} material={m.detalle} position={[0, 0.17 + 0.01 * resp, z]}>
						<sphereGeometry args={[0.025, 8, 6]} />
					</mesh>
				))}
			</group>
			{/* cuello */}
			<mesh material={m.piel} position={[0, 0.25, -0.66]} rotation={[Math.PI / 2 - 0.5, 0, 0]}>
				<cylinderGeometry args={[0.07, 0.08, 0.16, 8]} />
			</mesh>
			{/* hombros */}
			{[-1, 1].map((lado) => (
				<mesh key={lado} material={m.pijamaExt} position={[lado * 0.29, 0.24, -0.55]}>
					<icosahedronGeometry args={[0.095, 1]} />
				</mesh>
			))}

			{/* brazos */}
			{[-1, 1].map((lado) => {
				const hombro: V3 = [lado * 0.3, 0.24, -0.55];
				const codo: V3 = abrazaAlmohada
					? [lado * 0.42, 0.34, -0.27]
					: [lado * 0.37 + vib(lado), yBrazo(lado * 0.37, -0.24, 0.15), -0.24];
				const mano: V3 = abrazaAlmohada
					? [lado * 0.13, 0.5, -0.38]
					: [lado * 0.39 + vib(lado * 2), yBrazo(lado * 0.39, 0.08, 0.11) + vib(lado * 3) * 0.5, 0.08];
				return (
					<group key={lado}>
						<Segmento desde={hombro} hasta={codo} radio={0.075} material={m.pijamaExt} />
						<Segmento desde={codo} hasta={mano} radio={0.068} material={m.pijamaExt} />
						<mesh material={m.pielExt} position={mano}>
							<icosahedronGeometry args={[0.078, 1]} />
						</mesh>
					</group>
				);
			})}

			{/* piernas */}
			{[-1, 1].map((lado) => {
				const cadera: V3 = [lado * 0.12, 0.14, 0.02];
				const tobillo: V3 = [lado * 0.14 + vib(lado * 5) * 0.6, 0.11, 0.76];
				return (
					<group key={lado}>
						<Segmento desde={cadera} hasta={tobillo} radio={0.092} material={m.pijamaExt} />
						<mesh material={m.pielExt} position={[tobillo[0], 0.2, 0.83]} rotation={[-0.2, 0, 0]}>
							<boxGeometry args={[0.13, 0.22, 0.1]} />
						</mesh>
					</group>
				);
			})}

			{abrazaAlmohada ? (
				<mesh geometry={cajaRedondeada(0.58, 0.2, 0.36, 0.08)} material={m.almohada} position={[0, 0.46, -0.36]} rotation={[0.25, 0, 0.06]} />
			) : null}

			{/* cabeza (apoyada en la almohada, mirando hacia arriba y un poco hacia los pies) */}
			<group position={[0, 0.34, -0.88]} rotation={[-(Math.PI / 2 - 0.55), 0, 0]}>
				<mesh material={m.piel}>
					<icosahedronGeometry args={[0.25, 2]} />
				</mesh>
				<mesh material={m.pelo} position={[0, 0.02, -0.03]} rotation={[-0.68, 0, 0]}>
					<sphereGeometry args={[0.268, 12, 8, 0, TAU, 0, Math.PI * 0.42]} />
				</mesh>
				{[-0.11, -0.03, 0.06].map((x, i) => (
					<mesh key={i} material={m.pelo} position={[x, 0.2, 0.15]} rotation={[0.4, 0, 0.3 * (i - 1)]} scale={[1.2, 0.7, 1]}>
						<icosahedronGeometry args={[0.07, 0]} />
					</mesh>
				))}
				{/* orejas */}
				{[-1, 1].map((lado) => (
					<mesh key={lado} material={m.piel} position={[lado * 0.245, 0, 0]} scale={[0.5, 1, 0.8]}>
						<icosahedronGeometry args={[0.065, 1]} />
					</mesh>
				))}

				{antifaz ? (
					<group>
						<mesh material={m.antifaz} position={[0, 0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
							<torusGeometry args={[0.252, 0.022, 6, 32]} />
						</mesh>
						{[-1, 1].map((lado) => (
							<group key={lado} position={[lado * 0.09, 0.04, 0.228]}>
								<mesh material={m.antifaz} scale={[0.11, 0.075, 0.035]} rotation={[0, lado * 0.35, 0]}>
									<sphereGeometry args={[1, 16, 12]} />
								</mesh>
								<mesh material={m.blanco} position={[0, -0.005, 0.04]} rotation={[0, lado * 0.35, Math.PI]}>
									<torusGeometry args={[0.042, 0.009, 4, 12, Math.PI]} />
								</mesh>
							</group>
						))}
					</group>
				) : (
					[-1, 1].map((lado) => (
						<group key={lado} position={[lado * 0.09, 0.035, 0]}>
							{cerrados ? (
								<mesh material={m.pupila} position={[0, 0.0, 0.232]} rotation={[0.2, 0, Math.PI]}>
									<torusGeometry args={[0.042, 0.011, 4, 12, Math.PI]} />
								</mesh>
							) : (
								<>
									<mesh material={m.blanco} position={[0, 0, 0.198]} scale={[1 + 0.18 * grande, Math.min(1, ojo) + 0.25 * grande, 0.55]}>
										<sphereGeometry args={[0.068, 14, 10]} />
									</mesh>
									<mesh
										material={m.pupila}
										position={[mirar[0] * 0.028, mirar[1] * 0.022 * Math.min(1, ojo), 0.232]}
										scale={[1 - 0.25 * grande, Math.min(1, ojo) * (1 - 0.25 * grande), 0.5]}
									>
										<sphereGeometry args={[0.032, 10, 8]} />
									</mesh>
								</>
							)}
							<Segmento
								desde={[lado * 0.045, 0.085 + subeCejas - 0.004 * relaja, 0.19]}
								hasta={[-lado * 0.03, 0.085 + subeCejas + 0.035 * preocupa, 0.205]}
								radio={0.014}
								material={m.pelo}
							/>
						</group>
					))
				)}

				{[-1, 1].map((lado) => (
					<mesh key={lado} material={m.mejillas} position={[lado * 0.135, -0.05, 0.19]} scale={[1, 0.7, 0.4]}>
						<sphereGeometry args={[0.036, 8, 6]} />
					</mesh>
				))}

				{boca === 'sonrisa' ? (
					<mesh material={m.boca} position={[0, -0.085, 0.232]} rotation={[0.25, 0, Math.PI]}>
						<torusGeometry args={[0.05, 0.013, 5, 12, Math.PI]} />
					</mesh>
				) : boca === 'linea' ? (
					<mesh material={m.boca} position={[0, -0.1, 0.232]} rotation={[0, 0, Math.PI / 2]}>
						<capsuleGeometry args={[0.011, 0.06, 2, 6]} />
					</mesh>
				) : (
					<mesh
						material={m.boca}
						position={[0, -0.105, 0.226]}
						scale={[boca === 'ronca' ? 0.9 : 0.75, 0.35 + 0.75 * limitar(abrirBoca), 0.35]}
					>
						<sphereGeometry args={[0.045, 12, 8]} />
					</mesh>
				)}
			</group>

			{manta !== null ? <Manta hasta={manta} respira={resp} /> : null}
		</group>
	);
};
