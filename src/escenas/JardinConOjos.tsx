import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Abeja} from '../componentes/Abeja';
import {Camara, temblor} from '../componentes/Camara';
import {CaraFlor, FlorChica} from '../componentes/CaraFlor';
import {Destellos} from '../componentes/Efectos';
import {Escenario3D} from '../componentes/Escenario3D';
import type {V3} from '../componentes/utilidades3d';
import {useEscena} from '../lib/escena';

/**
 * "O sea, para ellas sos un jardín con ojos."
 * La cara con pétalos sonríe y parpadea mientras la abeja le da vueltas.
 * En "jardín" brotan florcitas con ojitos; en "ojos" todas parpadean a la vez.
 */

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const FLORES: {pos: V3; color: string; escala: number}[] = [
	{pos: [-1.3, -0.72, 0.75], color: '#C77DFF', escala: 0.62},
	{pos: [1.35, -0.7, 0.7], color: '#FF8FC7', escala: 0.66},
	{pos: [-0.6, -1.0, 1.45], color: '#FFFFFF', escala: 0.5},
	{pos: [0.7, -1.02, 1.5], color: '#4CC9F0', escala: 0.5},
	{pos: [-1.9, -0.55, -0.3], color: '#FF5DA2', escala: 0.55},
	{pos: [1.95, -0.5, -0.4], color: '#FFD23F', escala: 0.55},
];

export const JardinConOjos: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {momento} = useEscena();
	const t = frame / fps;

	const fJardin = momento('jardín');
	const fOjos = momento('ojos');

	const parpadeoTodos = interpolate(frame, [fOjos, fOjos + 3, fOjos + 6], [0, 1, 0], clamp);

	// la abeja da vueltas alrededor de la cara-flor
	const ang = t * 1.9 + 0.6;
	const posAbeja: V3 = [Math.cos(ang) * 1.5, 0.55 + 0.32 * Math.sin(ang * 2), Math.sin(ang) * 1.05];
	const rumbo = Math.atan2(-Math.sin(ang) * 1.5, Math.cos(ang) * 1.05); // dirección de avance

	const sacudon = temblor(t, 0.5);
	const posicion: V3 = [0.6 * Math.sin(t * 0.45) + sacudon[0], 0.5 + sacudon[1], 8.6 - 0.4 * (t / 4)];

	return (
		<Escenario3D
			fondo="radial-gradient(circle at 50% 30%, #FFFBE6 0%, #A0E7FF 30%, #4EA8DE 62%, #2B2D87 100%)"
			colorContraluz="#FFE58A"
		>
			<Camara posicion={posicion} mirarA={[0, -0.05, 0]} />

			{/* lomita de pasto */}
			<mesh position={[0, -3.2, -0.5]} scale={[4.5, 2.2, 3]}>
				<sphereGeometry args={[1, 48, 24]} />
				<meshStandardMaterial color="#52B788" roughness={0.9} />
			</mesh>

			<CaraFlor
				t={t}
				petalos={1}
				centro={0}
				rasgos={1}
				semillas={0}
				tallo={1}
				ola={0.5}
				parpadeo={Math.max(parpadeoTodos, interpolate(frame, [18, 21, 24], [0, 1, 0], clamp))}
				mirada={[Math.max(-1, Math.min(1, posAbeja[0] / 1.3)), Math.max(-1, Math.min(1, (posAbeja[1] - 0.4) / 0.8))]}
				position={[0, 0.4, 0]}
				rotation={[0, 0.15 * Math.sin(t * 0.8), 0.06 * Math.sin(t * 1.6)]}
				scale={0.6}
			/>

			{FLORES.map((f, i) => (
				<FlorChica
					key={i}
					t={t}
					color={f.color}
					crecer={spring({frame: frame - fJardin - i * 3 + 4, fps, config: {damping: 10, stiffness: 140}})}
					parpadeo={parpadeoTodos}
					mirada={[f.pos[0] > 0 ? -0.6 : 0.6, 0.3]}
					position={f.pos}
					scale={f.escala}
				/>
			))}

			<Abeja t={t} position={posAbeja} rotation={[0.15, rumbo, -0.35 * Math.cos(ang)]} scale={0.42} mirada={[0, 0]} />
			<Destellos t={t} cantidad={45} rango={[7, 7, 3]} centro={[0, 0.8, -1.5]} tamano={0.04} semilla="jardin" colores={['#FFFFFF', '#FFE58A', '#FFC8DD']} />
		</Escenario3D>
	);
};
