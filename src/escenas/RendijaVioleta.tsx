import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camara} from '../componentes/Camara';
import {SignoPregunta} from '../componentes/Ciencia';
import {Resplandor} from '../componentes/Efectos';
import {ALTO_CAJA, CajaMisterio, EscenarioMisterio, FONDO_CAJA, LILA, TURQUESA} from '../componentes/Misterio';
import {useEscena} from '../lib/escena';
import {camaraPlanos} from '../lib/planos';

/**
 * "Hoy te cuento por qué mucha gente no entendió lo que quiso decir. Y ojo con la última parte:
 * ahí se pone raro de verdad."
 * La cámara se acerca a la caja; a su alrededor giran signos de pregunta (la confusión). Con
 * "Y ojo" la tapa se abre apenas: sale una rendija de luz violeta y adentro se encienden dos ojos.
 */
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const RendijaVioleta: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {momento, duracion} = useEscena();
	const t = frame / fps;
	const fGente = momento('mucha gente');
	const fOjo = momento('ojo');
	const fRaro = momento('raro');

	const preguntas = interpolate(frame, [fGente - 6, fGente + 14, fOjo - 6, fOjo + 6], [0, 1, 1, 0], clamp);
	const abrir = interpolate(frame, [fOjo - 2, fOjo + 12, fRaro - 4, fRaro + 8], [0, 0.17, 0.17, 0.3], clamp);
	const luz = interpolate(frame, [fOjo - 2, fOjo + 12, fRaro, fRaro + 10], [0, 0.6, 0.6, 1], clamp);
	const ojos = interpolate(frame, [fOjo + 14, fOjo + 22], [0, 1], clamp);
	// parpadeo de los ojos que espían
	const parpadeo = Math.abs(Math.sin(t * 1.9)) > 0.97 ? 0.15 : 1;

	const {posicion, mirarA, fov} = camaraPlanos(frame, fps, [
		{desde: 0, pos: [-1.6, 2.4, 8.2], mira: [0, 0.9, 0], deriva: [0.35, -0.12, -0.75]},
		{desde: fOjo - 3, pos: [0.6, 1.55, 3.4], mira: [0, 1.3, 0.3], deriva: [-0.1, 0, -0.18]},
		{desde: fRaro - 4, pos: [0.15, 1.42, 2.55], mira: [0, 1.3, 0.4], deriva: [0, 0, -0.25], llegada: 12},
		{desde: duracion + 1, pos: [0, 0, 0], mira: [0, 0, 0]},
	]);

	return (
		<EscenarioMisterio t={t}>
			<Camara posicion={posicion} mirarA={mirarA} fov={fov} />
			<CajaMisterio t={t} temblor={0.25} abrir={abrir} luzInterior={luz} brilloSigno={0.6 + 0.25 * Math.sin(t * 3)}>
				{/* dos ojos que espían desde la rendija */}
				{ojos > 0.01
					? [-1, 1].map((lado) => (
							<group key={lado} position={[lado * 0.17, ALTO_CAJA + 0.06, FONDO_CAJA / 2 - 0.12]} scale={[1, ojos * parpadeo, 1]}>
								<mesh scale={[0.07, 0.05, 0.02]}>
									<sphereGeometry args={[1, 16, 12]} />
									<meshBasicMaterial color={TURQUESA} toneMapped={false} />
								</mesh>
								<mesh position={[0, 0, 0.015]} scale={[0.02, 0.045, 0.01]}>
									<sphereGeometry args={[1, 12, 8]} />
									<meshBasicMaterial color="#120A2E" toneMapped={false} />
								</mesh>
								<Resplandor color={TURQUESA} escala={0.35} opacidad={0.8} />
							</group>
						))
					: null}
			</CajaMisterio>
			{/* la confusión: signos de pregunta girando alrededor */}
			{preguntas > 0.01
				? new Array(7).fill(0).map((_, i) => {
						const a = t * 0.7 + (i / 7) * Math.PI * 2;
						const r = 1.9 + 0.2 * Math.sin(t * 2 + i);
						return (
							<SignoPregunta
								key={i}
								t={t}
								luz={0.4}
								color={i % 2 ? '#9FFFF0' : '#E2CCFF'}
								emisivo={i % 2 ? '#1FE0C4' : '#8B5CF6'}
								halo={i % 2 ? TURQUESA : LILA}
								position={[Math.cos(a) * r, 1.1 + 0.6 * Math.sin(a * 2 + i), Math.sin(a) * r * 0.8]}
								rotation={[0, -a, 0.3 * Math.sin(t * 3 + i)]}
								scale={0.32 * preguntas}
							/>
						);
					})
				: null}
		</EscenarioMisterio>
	);
};
