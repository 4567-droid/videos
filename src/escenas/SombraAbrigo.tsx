import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {Camara, temblor} from '../componentes/Camara';
import {cajaRedondeada, Habitacion, LucesNoche, PISO_CAMA} from '../componentes/Dormir';
import {Destellos, Resplandor} from '../componentes/Efectos';
import {Escenario3D} from '../componentes/Escenario3D';
import {Segmento} from '../componentes/Segmento';
import {useTexturaCanvas} from '../componentes/texturas';
import type {V3} from '../componentes/utilidades3d';
import {useEscena} from '../lib/escena';

/**
 * "Y quedate con esto: lo que no entendés asusta. Cuando sabés cómo funciona, pierde poder."
 * Una linterna en el piso proyecta en la pared una sombra gigante (sombrero, brazos largos).
 * Cuando se prende la luz del cuarto, la sombra se encoge: era un abrigo colgado en una silla.
 */

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const mezclar = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

const X_SILLA = 0.15;
const Z_SILLA = -0.75;
const ANCHO_SOMBRA = 0.8;
const ALTO_SOMBRA = 1.6;

/** Silueta (borrosa) del abrigo con sombrero colgado en la silla. */
const dibujarSilueta = (ctx: CanvasRenderingContext2D) => {
	ctx.clearRect(0, 0, 512, 1024);
	ctx.filter = 'blur(9px)';
	ctx.fillStyle = 'rgba(6,2,28,0.95)';
	const redondeado = (x: number, y: number, w: number, h: number, r: number) => {
		ctx.beginPath();
		ctx.roundRect(x, y, w, h, r);
		ctx.fill();
	};
	// sombrero
	redondeado(190, 40, 132, 120, 30);
	ctx.beginPath();
	ctx.ellipse(256, 158, 132, 24, 0, 0, Math.PI * 2);
	ctx.fill();
	// cuello y hombros del abrigo
	ctx.beginPath();
	ctx.moveTo(200, 175);
	ctx.quadraticCurveTo(256, 160, 312, 175);
	ctx.quadraticCurveTo(400, 190, 408, 250);
	ctx.lineTo(380, 650);
	ctx.lineTo(132, 650);
	ctx.lineTo(104, 250);
	ctx.quadraticCurveTo(112, 190, 200, 175);
	ctx.fill();
	// mangas largas (brazos)
	for (const lado of [-1, 1]) {
		ctx.beginPath();
		const x0 = 256 + lado * 150;
		ctx.moveTo(x0 - 34, 230);
		ctx.quadraticCurveTo(x0 + lado * 40, 480, x0 + lado * 30, 760);
		ctx.quadraticCurveTo(x0 + lado * 22, 800, x0 - lado * 12, 770);
		ctx.quadraticCurveTo(x0 - lado * 10, 480, x0 + 34 * -lado, 240);
		ctx.fill();
	}
	// asiento y patas de la silla
	redondeado(116, 640, 280, 40, 12);
	for (const [x, w] of [
		[140, 26],
		[346, 26],
		[178, 16],
		[318, 16],
	]) {
		redondeado(x, 660, w, 350, 8);
	}
};

const dibujarHaz = (ctx: CanvasRenderingContext2D) => {
	const g = ctx.createLinearGradient(0, 0, 0, 256);
	g.addColorStop(0, 'rgba(255,240,180,0)');
	g.addColorStop(0.6, 'rgba(255,230,150,0.3)');
	g.addColorStop(1, 'rgba(255,220,120,0.85)');
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, 64, 256);
};

/** Silla con un abrigo, una bufanda y un sombrero colgados. */
const SillaConAbrigo: React.FC<{t: number; position: V3}> = ({t, position}) => {
	const abrigo = '#FF8C42';
	const madera = '#4CC9F0';
	const balanceo = 0.03 * Math.sin(t * 1.6);
	const mat = (color: string) => new THREE.MeshStandardMaterial({color, roughness: 0.6, flatShading: true});
	const mAbrigo = React.useMemo(() => mat(abrigo), []);
	const mBufanda = React.useMemo(() => mat('#06D6A0'), []);
	return (
		<group position={position}>
			{/* silla */}
			<mesh geometry={cajaRedondeada(0.64, 0.07, 0.6, 0.03)} position={[0, 0.5, 0]}>
				<meshStandardMaterial color={madera} roughness={0.5} />
			</mesh>
			{[
				[-0.27, 0.25],
				[0.27, 0.25],
				[-0.27, -0.25],
				[0.27, -0.25],
			].map(([x, z], i) => (
				<mesh key={i} position={[x, 0.25, z]}>
					<cylinderGeometry args={[0.03, 0.035, 0.5, 8]} />
					<meshStandardMaterial color={madera} roughness={0.5} />
				</mesh>
			))}
			{[-0.27, 0.27].map((x) => (
				<mesh key={x} position={[x, 0.86, -0.27]}>
					<cylinderGeometry args={[0.03, 0.03, 0.72, 8]} />
					<meshStandardMaterial color={madera} roughness={0.5} />
				</mesh>
			))}
			<mesh geometry={cajaRedondeada(0.62, 0.1, 0.06, 0.02)} position={[0, 1.15, -0.27]}>
				<meshStandardMaterial color={madera} roughness={0.5} />
			</mesh>

			{/* abrigo colgado del respaldo */}
			<group position={[0, 1.15, -0.25]} rotation={[0, 0, balanceo]}>
				<mesh material={mAbrigo} rotation={[0, 0, Math.PI / 2]}>
					<capsuleGeometry args={[0.08, 0.5, 3, 8]} />
				</mesh>
				<mesh material={mAbrigo} geometry={cajaRedondeada(0.58, 0.74, 0.1, 0.04)} position={[0, -0.36, 0.08]} rotation={[0.08, 0, 0]} />
				<mesh material={mAbrigo} geometry={cajaRedondeada(0.58, 0.7, 0.08, 0.04)} position={[0, -0.35, -0.06]} />
				{[-1, 1].map((lado) => (
					<group key={lado}>
						<Segmento desde={[lado * 0.33, -0.04, 0.04]} hasta={[lado * 0.37, -0.68, 0.1]} radio={0.072} material={mAbrigo} />
						<mesh position={[lado * 0.37, -0.72, 0.1]}>
							<cylinderGeometry args={[0.08, 0.08, 0.07, 10]} />
							<meshStandardMaterial color="#D9603B" />
						</mesh>
					</group>
				))}
				{[-0.2, -0.38, -0.56].map((y) => (
					<mesh key={y} position={[0, y, 0.14]}>
						<sphereGeometry args={[0.028, 8, 6]} />
						<meshStandardMaterial color="#FFD23F" />
					</mesh>
				))}
				{/* bufanda */}
				<mesh material={mBufanda} position={[0, 0.02, 0.06]} rotation={[0, 0, Math.PI / 2]}>
					<capsuleGeometry args={[0.065, 0.42, 3, 8]} />
				</mesh>
				<Segmento desde={[-0.12, 0, 0.12]} hasta={[-0.1, -0.42, 0.16]} radio={0.05} material={mBufanda} />
				<Segmento desde={[0.12, 0, 0.12]} hasta={[0.15, -0.3, 0.16]} radio={0.05} material={mBufanda} />
				{/* sombrero */}
				<group position={[0, 0.1, 0]} rotation={[0.1, 0, -0.08]}>
					<mesh>
						<cylinderGeometry args={[0.24, 0.24, 0.025, 24]} />
						<meshStandardMaterial color="#3A0CA3" roughness={0.6} />
					</mesh>
					<mesh position={[0, 0.11, 0]}>
						<cylinderGeometry args={[0.13, 0.145, 0.2, 20]} />
						<meshStandardMaterial color="#3A0CA3" roughness={0.6} />
					</mesh>
					<mesh position={[0, 0.04, 0]}>
						<cylinderGeometry args={[0.148, 0.148, 0.04, 20]} />
						<meshStandardMaterial color="#FFD23F" roughness={0.5} />
					</mesh>
				</group>
			</group>
		</group>
	);
};

/** Sombra proyectada en la pared (textura de canvas: va dentro del canvas). */
const SombraPared: React.FC<{position: V3; ancho: number; alto: number; opacidad: number}> = ({position, ancho, alto, opacidad}) => {
	const silueta = useTexturaCanvas('silueta-abrigo', 512, 1024, dibujarSilueta);
	return silueta ? (
		<mesh position={position} scale={[ancho, alto, 1]}>
			<planeGeometry args={[1, 1]} />
			<meshBasicMaterial map={silueta} transparent opacity={opacidad} depthWrite={false} toneMapped={false} />
		</mesh>
	) : null;
};

/** Haz de la linterna (cono con degradé). */
const HazLinterna: React.FC<{opacidad: number}> = ({opacidad}) => {
	const haz = useTexturaCanvas('haz-linterna', 64, 256, dibujarHaz);
	return haz && opacidad > 0.005 ? (
		<mesh position={[0, 0.21 + 0.9, 0]}>
			<cylinderGeometry args={[0.75, 0.07, 1.8, 24, 1, true]} />
			<meshBasicMaterial map={haz} transparent opacity={opacidad} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
		</mesh>
	) : null;
};

export const SombraAbrigo: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {momento} = useEscena();
	const t = frame / fps;

	const fAsusta = momento('asusta');
	const fCuando = momento('cuando');
	const fSabes = momento('sabés');
	const fFunciona = momento('funciona', {fin: true});
	const fPoder = momento('poder', {fin: true});

	// la sombra crece y tiembla con "asusta"; con la luz se achica y se aclara
	const asusta = spring({frame: frame - fAsusta + 4, fps, config: {damping: 8, stiffness: 120}});
	const luz = interpolate(frame, [fSabes - 2, fSabes + 10], [0, 1], {...clamp, easing: Easing.out(Easing.quad)});
	const encoge = interpolate(frame, [fSabes, fFunciona + 6], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
	const escala = (2.0 + 0.18 * asusta) * (1 - encoge) + 1.04 * encoge;
	const vibra = asusta * (1 - encoge) * 0.03 * Math.sin(t * 30);
	const opacidad = 0.92 - 0.62 * encoge;
	const chispas = spring({frame: frame - fPoder + 14, fps, config: {damping: 14}});

	// cámara: abajo mirando la sombra gigante → se acerca a la silla
	const acerca = interpolate(frame, [fCuando - 4, fFunciona + 8], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
	const empuje = interpolate(frame, [0, fCuando], [0, 1], clamp);
	const sacudon = temblor(t, 0.6 + 1.6 * asusta * (1 - encoge));
	const base = mezclar([0.0, 0.25, 3.9 - 0.25 * empuje], [0.1, 0.45, 2.5], acerca);
	const posicion: V3 = [base[0] + sacudon[0], base[1] + sacudon[1], base[2]];
	const mirarA = mezclar([0.1, 0.85, -1.2], [0.12, 0.02, -0.8], acerca);

	const alto = ALTO_SOMBRA * escala;
	return (
		<Escenario3D fondo="radial-gradient(circle at 50% 35%, #3B2A8F 0%, #1E1660 55%, #0A0826 100%)" luces={false}>
			<Camara posicion={posicion} mirarA={mirarA} />
			<LucesNoche intensidad={0.5 + 0.5 * luz} luz={luz} />
			<pointLight position={[X_SILLA, PISO_CAMA + 0.15, 0.1]} intensity={2.2 * (1 - luz)} distance={3} color="#FFD6A5" />
			<Habitacion t={t} ventana={false} mesa={false} colorPared="#30267D" />

			{/* sombra en la pared */}
			<SombraPared
				position={[X_SILLA + vibra + 0.06 * encoge, PISO_CAMA + alto / 2 + 0.03 * encoge, -1.43]}
				ancho={ANCHO_SOMBRA * escala}
				alto={alto}
				opacidad={opacidad}
			/>

			<SillaConAbrigo t={t} position={[X_SILLA, PISO_CAMA, Z_SILLA]} />

			{/* linterna en el piso apuntando a la silla */}
			<group position={[X_SILLA, PISO_CAMA + 0.07, 0.15]} rotation={[-1.1, 0, 0]}>
				<mesh>
					<cylinderGeometry args={[0.055, 0.06, 0.28, 14]} />
					<meshStandardMaterial color="#EF233C" roughness={0.4} />
				</mesh>
				<mesh position={[0, 0.17, 0]}>
					<cylinderGeometry args={[0.085, 0.06, 0.08, 16]} />
					<meshStandardMaterial color="#2B2D42" roughness={0.4} />
				</mesh>
				<mesh position={[0, 0.212, 0]} rotation={[-Math.PI / 2, 0, 0]}>
					<circleGeometry args={[0.075, 20]} />
					<meshBasicMaterial color={luz > 0.5 ? '#8D8FA8' : '#FFF3B0'} toneMapped={false} />
				</mesh>
				<HazLinterna opacidad={0.5 * (1 - luz)} />
				<Resplandor color="#FFD23F" escala={0.5} opacidad={0.8 * (1 - luz)} position={[0, 0.24, 0]} />
			</group>

			{chispas > 0.01 ? (
				<Destellos t={t} cantidad={36} rango={[1.4, 1.6, 0.8]} centro={[X_SILLA, -0.05, Z_SILLA]} tamano={0.035 * chispas} semilla="abrigo" colores={['#FFFFFF', '#FFD23F', '#7DF9FF']} />
			) : null}
			<Destellos t={t} cantidad={26} rango={[4, 3, 2]} centro={[0, 1.2, -1.1]} tamano={0.022} semilla="abrigo-fondo" colores={['#B8C4FF', '#FFFFFF']} opacidad={0.5} />
		</Escenario3D>
	);
};
