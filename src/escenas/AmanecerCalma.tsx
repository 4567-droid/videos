import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Sol} from '../componentes/Amor';
import {Avatar} from '../componentes/Avatar';
import {Camara, temblor} from '../componentes/Camara';
import {Destellos, Resplandor} from '../componentes/Efectos';
import {Escenario3D} from '../componentes/Escenario3D';
import type {V3} from '../componentes/utilidades3d';
import {useEscena} from '../lib/escena';

/**
 * "Y quedate con esto: extrañar no significa que tengas que volver. Es tu cerebro acostumbrado.
 * Dale tiempo y cuidate."  (enseñanza)
 * Amanecer: la persona, de frente, con la mano en el pecho y una sonrisa chiquita; atrás sale
 * el sol entre colinas suaves y pasan unos pájaros. Con "cuidate" se enciende un brillo en el pecho.
 */

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const mezclar = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

const COLINAS: {pos: V3; esc: V3; color: string}[] = [
	{pos: [-3.2, -1.2, -9], esc: [5, 2.2, 2], color: '#A98AD0'},
	{pos: [3.4, -1.4, -10], esc: [6, 2.5, 2], color: '#B993D3'},
	{pos: [0.4, -2.2, -6.5], esc: [7, 2.6, 2], color: '#C99BCF'},
	{pos: [-1.8, -2.6, -4.5], esc: [6, 2.6, 2], color: '#D8A6CF'},
];

const Pajaro: React.FC<{position: V3; t: number; fase: number}> = ({position, t, fase}) => {
	const aleteo = 0.45 * Math.sin(t * 9 + fase);
	return (
		<group position={position} scale={0.07}>
			{[-1, 1].map((lado) => (
				<mesh key={lado} position={[lado * 0.45, 0, 0]} rotation={[0, 0, lado * (0.35 + aleteo)]}>
					<boxGeometry args={[0.9, 0.12, 0.05]} />
					<meshBasicMaterial color="#5B4A8B" />
				</mesh>
			))}
		</group>
	);
};

export const AmanecerCalma: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {momento, duracion} = useEscena();
	const t = frame / fps;

	const fExtranar = momento('extrañar');
	const fDale = momento('dale');
	const fCuidate = momento('cuidate');

	const k = frame / Math.max(1, duracion);
	const sale = interpolate(frame, [0, duracion], [0, 1], {...clamp, easing: Easing.out(Easing.quad)});
	const manoAlPecho = spring({frame: frame - fExtranar + 18, fps, config: {damping: 16, stiffness: 70}});
	const calor = interpolate(frame, [fDale - 4, fCuidate + 10], [0, 1], clamp);
	const brilloPecho = spring({frame: frame - fCuidate + 4, fps, config: {damping: 14}});

	// mano: del costado al pecho (coordenadas del torso; la mano derecha de la persona es la de x negativa)
	const codo = mezclar([-0.33, 0.18, 0.02], [-0.22, 0.18, 0.22], manoAlPecho);
	const mano = mezclar([-0.34, -0.08, 0.04], [0.06, 0.33, 0.25], manoAlPecho);

	const sacudon = temblor(t, 0.2);
	const posicion: V3 = [0.2 - 0.08 * k + sacudon[0], 1.3 + 0.05 * k + sacudon[1], 4.6 - 0.9 * k];
	const mirarA: V3 = [0, 1.32 + 0.03 * k, 0];

	return (
		<Escenario3D
			fondo="linear-gradient(180deg, #7A6BC0 0%, #C98FC4 34%, #F4AFC0 58%, #FFC99A 80%, #FFE3B8 100%)"
			colorContraluz="#FFB36B"
		>
			<Camara posicion={posicion} mirarA={mirarA} />
			<directionalLight position={[0.3, 1.5, -5]} intensity={2.2 + 1.2 * calor} color="#FFB36B" />
			{/* luz suave de frente para que la cara no quede en sombra */}
			<directionalLight position={[0.5, 0.6, 5]} intensity={1.3} color="#FFE6D6" />
			<Sol position={[0.35, 0.55 + 1.35 * sale, -8]} scale={0.85} brillo={0.75 + 0.25 * calor} />
			{COLINAS.map((c, i) => (
				<mesh key={i} position={c.pos} scale={c.esc}>
					<sphereGeometry args={[1, 32, 16]} />
					<meshStandardMaterial color={c.color} roughness={0.95} />
				</mesh>
			))}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
				<circleGeometry args={[3.2, 48]} />
				<meshStandardMaterial color="#B88BD0" roughness={0.95} />
			</mesh>
			{[0, 1, 2].map((i) => (
				<Pajaro key={i} t={t} fase={i * 1.3} position={[-1.6 + t * 0.32 + i * 0.28, 2.15 + 0.12 * i + 0.05 * Math.sin(t * 2 + i), -3.5 - i * 0.3]} />
			))}

			<Avatar
				t={t}
				animacion="reposo"
				expresion="serena"
				cejas
				giroCabeza={[-0.05, 0, 0.05]}
				colores={{remera: '#8E7CC3', pantalon: '#3A3270', zapatillas: '#E9E5FF', pelo: '#2B1B12'}}
				brazos={{izq: {codo, mano}}}
				position={[0, 0, 0]}
			/>
			{brilloPecho > 0.01 ? <Resplandor color="#FF8FAB" escala={0.9 * brilloPecho} opacidad={0.6 * brilloPecho * (0.85 + 0.15 * Math.sin(t * 3))} position={[0.07, 1.42, 0.3]} /> : null}
			<Destellos t={t} cantidad={36} rango={[5, 3, 3]} centro={[0, 2, -1.5]} tamano={0.028} semilla="amanecer" colores={['#FFFFFF', '#FFE3B8', '#FFD6E0']} opacidad={0.7} />
		</Escenario3D>
	);
};
