import React from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camara, temblor} from '../componentes/Camara';
import {SignoPregunta} from '../componentes/Ciencia';
import {Destellos} from '../componentes/Efectos';
import {Einstein} from '../componentes/Einstein';
import {Escenario3D} from '../componentes/Escenario3D';
import type {V3} from '../componentes/utilidades3d';
import {useEscena} from '../lib/escena';

/**
 * Enseñanza: "Y quedate con esto: cuestioná lo que todos dan por hecho.
 * Las grandes ideas empiezan con una pregunta."
 * Einstein señala un signo de pregunta gigante que se enciende en "pregunta".
 */

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const PISO = -1.75;

export const PreguntaGigante: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {momento, duracion} = useEscena();
	const t = frame / fps;

	const fCuestiona = momento('cuestioná');
	const fIdeas = momento('ideas');
	const fPregunta = momento('pregunta');

	const senala = interpolate(frame, [fCuestiona - 8, fCuestiona + 2], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
	const chispa = interpolate(frame, [fCuestiona, fCuestiona + 5, fCuestiona + 16], [0, 0.45, 0.15], clamp);
	const ideas = interpolate(frame, [fIdeas, fIdeas + 6, fIdeas + 18], [0.15, 0.5, 0.25], clamp);
	const enciende = interpolate(frame, [fPregunta - 2, fPregunta + 10], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	const luz = Math.max(chispa, frame >= fIdeas ? ideas : 0, enciende);

	const sacudon = temblor(t, 0.5);
	const k = Easing.inOut(Easing.cubic)(frame / duracion);
	const posicion: V3 = [0.35 - 0.3 * k + sacudon[0], 0.35 + sacudon[1], 6.5 - 0.9 * k];

	return (
		<Escenario3D
			fondo={`radial-gradient(circle at 62% 34%, ${luz > 0.5 ? '#5C4BB5' : '#3D348B'} 0%, #241E5C 40%, #120E36 74%, #070516 100%)`}
			colorContraluz="#FFD23F"
		>
			<Camara posicion={posicion} mirarA={[0.1, 0.1, 0]} />

			<mesh position={[0, PISO - 0.06, 0]}>
				<cylinderGeometry args={[2.4, 2.3, 0.12, 48]} />
				<meshStandardMaterial color="#5E60CE" roughness={0.8} />
			</mesh>

			<Einstein
				t={t}
				mezcla={[
					{animacion: 'reposo', peso: 1 - senala},
					{animacion: 'señalar', peso: senala},
				]}
				position={[-0.7, PISO, 0.4]}
				rotation={[0, 0.3, 0]}
			/>

			<SignoPregunta t={t} luz={luz} position={[0.75, 0.85, -0.3]} rotation={[0, -0.25 + 0.15 * Math.sin(t * 0.7), 0.05 * Math.sin(t * 1.1)]} scale={1.35 + 0.08 * enciende} />

			<Destellos t={t} cantidad={50 + Math.round(30 * enciende)} rango={[7, 7, 4]} centro={[0.4, 0.8, -1.5]} tamano={0.045} semilla="pregunta" colores={['#FFFFFF', '#FFD23F', '#FFF3B0']} />
		</Escenario3D>
	);
};
