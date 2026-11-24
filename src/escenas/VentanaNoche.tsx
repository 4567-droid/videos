import React from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {CelularChico} from '../componentes/Amor';
import {Avatar} from '../componentes/Avatar';
import {Camara, temblor} from '../componentes/Camara';
import {cajaRedondeada, LucesNoche} from '../componentes/Dormir';
import {Destellos, Resplandor} from '../componentes/Efectos';
import {Escenario3D} from '../componentes/Escenario3D';
import {useTexturaCanvas} from '../componentes/texturas';
import type {V3} from '../componentes/utilidades3d';
import {useEscena} from '../lib/escena';

/**
 * "¿Por qué cuesta tanto dejar a alguien que ya no está?"
 * De noche, una persona mira por la ventana (luna, estrellas, ciudad a lo lejos) con el
 * celular encendido en la mano. Hombros caídos; al final levanta un poco la cabeza hacia el cielo.
 */

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ZV = -1.28; // plano de la ventana

const dibujarCielo = (ctx: CanvasRenderingContext2D) => {
	const g = ctx.createLinearGradient(0, 0, 0, 640);
	g.addColorStop(0, '#0C1240');
	g.addColorStop(0.7, '#262062');
	g.addColorStop(1, '#3B2C78');
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, 512, 640);
	for (let i = 0; i < 40; i++) {
		const x = (i * 173) % 512;
		const y = (i * 97) % 430;
		ctx.fillStyle = `rgba(255,255,255,${0.35 + ((i * 37) % 60) / 100})`;
		ctx.beginPath();
		ctx.arc(x, y, 1.5 + (i % 3), 0, Math.PI * 2);
		ctx.fill();
	}
	// ciudad a lo lejos
	ctx.fillStyle = '#15103A';
	const edificios = [
		[0, 520, 70],
		[60, 480, 60],
		[115, 545, 80],
		[190, 500, 55],
		[240, 455, 70],
		[305, 530, 65],
		[365, 490, 75],
		[435, 540, 80],
	];
	for (const [x, y, w] of edificios) ctx.fillRect(x, y, w, 640 - y);
	ctx.fillStyle = '#FFD9A0';
	for (let i = 0; i < 26; i++) {
		const [x, y, w] = edificios[i % edificios.length];
		const fx = x + 8 + ((i * 23) % Math.max(10, w - 18));
		const fy = y + 14 + ((i * 41) % 80);
		ctx.globalAlpha = 0.5 + (i % 4) * 0.12;
		ctx.fillRect(fx, fy, 8, 10);
	}
	ctx.globalAlpha = 1;
};

const CieloVentana: React.FC = () => {
	const cielo = useTexturaCanvas('cielo-ventana', 512, 640, dibujarCielo);
	return cielo ? (
		<mesh position={[0, 1.45, ZV - 0.02]}>
			<planeGeometry args={[1.5, 1.75]} />
			<meshBasicMaterial map={cielo} toneMapped={false} />
		</mesh>
	) : null;
};

export const VentanaNoche: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {momento, duracion} = useEscena();
	const t = frame / fps;

	const fAlguien = momento('alguien');
	const fEsta = momento('está', {fin: true});
	// mira el celular y después levanta la mirada al cielo
	const levanta = interpolate(frame, [fAlguien - 6, fEsta], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
	const brilloCelu = 0.85 + 0.15 * Math.sin(t * 2.2);

	const k = frame / Math.max(1, duracion);
	const sacudon = temblor(t, 0.35);
	const posicion: V3 = [1.2 - 0.12 * k + sacudon[0], 1.5 + sacudon[1], 2.7 - 0.35 * k];
	const mirarA: V3 = [-0.1, 1.65, -0.9];

	return (
		<Escenario3D fondo="radial-gradient(circle at 50% 35%, #2E2A78 0%, #1B1850 55%, #0B0A26 100%)" luces={false}>
			<Camara posicion={posicion} mirarA={mirarA} />
			<LucesNoche intensidad={0.75} />
			<directionalLight position={[-0.5, 2.5, -4]} intensity={1.6} color="#9FB4FF" />
			<pointLight position={[0.42, 1.25, -0.6]} intensity={0.9} distance={1.4} color="#9BD3FF" />

			{/* cuarto */}
			<mesh rotation={[-Math.PI / 2, 0, 0]}>
				<planeGeometry args={[10, 10]} />
				<meshStandardMaterial color="#1D1850" roughness={0.95} />
			</mesh>
			<mesh position={[0, 2, ZV - 0.04]}>
				<planeGeometry args={[10, 6]} />
				<meshStandardMaterial color="#2B2570" roughness={0.95} />
			</mesh>
			<CieloVentana />
			{/* luna */}
			<group position={[-0.58, 2.06, ZV - 0.01]}>
				<Resplandor color="#FFF3C4" escala={1.1} opacidad={0.55} />
				<mesh>
					<circleGeometry args={[0.13, 32]} />
					<meshBasicMaterial color="#FFF6D6" toneMapped={false} />
				</mesh>
			</group>
			{/* marco, cruz y alféizar */}
			{[
				{pos: [0, 2.36, ZV] as V3, tam: [1.66, 0.1, 0.08] as V3},
				{pos: [0, 0.54, ZV] as V3, tam: [1.66, 0.1, 0.08] as V3},
				{pos: [-0.8, 1.45, ZV] as V3, tam: [0.1, 1.9, 0.08] as V3},
				{pos: [0.8, 1.45, ZV] as V3, tam: [0.1, 1.9, 0.08] as V3},
				{pos: [0, 1.45, ZV + 0.01] as V3, tam: [0.05, 1.75, 0.04] as V3},
				{pos: [0, 1.6, ZV + 0.01] as V3, tam: [1.5, 0.05, 0.04] as V3},
			].map((b, i) => (
				<mesh key={i} position={b.pos} geometry={cajaRedondeada(b.tam[0], b.tam[1], b.tam[2], 0.015)}>
					<meshStandardMaterial color="#6A5ACD" roughness={0.6} />
				</mesh>
			))}
			<mesh position={[0, 0.5, ZV + 0.12]} geometry={cajaRedondeada(1.85, 0.07, 0.3, 0.03)}>
				<meshStandardMaterial color="#7F6FD6" roughness={0.6} />
			</mesh>
			{/* cortinas */}
			{[-1, 1].map((lado) =>
				[0, 1, 2, 3].map((i) => (
					<mesh key={`${lado}-${i}`} position={[lado * (1.0 + i * 0.11), 1.4, ZV + 0.15 + 0.03 * Math.sin(i * 2 + t)]}>
						<cylinderGeometry args={[0.075, 0.09, 2.5, 10]} />
						<meshStandardMaterial color={i % 2 === 0 ? '#9C8AD6' : '#8774C8'} roughness={0.8} />
					</mesh>
				)),
			)}

			<Avatar
				t={t}
				animacion="reposo"
				expresion="preocupada"
				cejas
				encoger={0.45 - 0.25 * levanta}
				giroCabeza={[0.32 - 0.6 * levanta, -0.15 * levanta, 0]}
				colores={{remera: '#8E7CC3', pantalon: '#3A3270', zapatillas: '#E9E5FF', pelo: '#2B1B12'}}
				brazos={{izq: {codo: [-0.33, 0.16, 0.05], mano: [-0.3, 0.1, 0.27]}}}
				manoObjeto="izq"
				enMano={
					<group rotation={[1.0, 0, 0]}>
						<CelularChico brillo={brilloCelu} rotation={[0, Math.PI, 0]} position={[0, 0.06, 0]} />
					</group>
				}
				position={[0.1, 0, -0.45]}
				rotation={[0, Math.PI - 0.5, 0]}
			/>
			<Destellos t={t} cantidad={26} rango={[3, 2, 1.5]} centro={[0, 1.8, -0.6]} tamano={0.018} semilla="ventana" colores={['#FFFFFF', '#C9D6FF']} opacidad={0.5} />
		</Escenario3D>
	);
};
