import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camara} from '../componentes/Camara';
import {ALTO_CAJA, CajaMisterio, EscenarioMisterio, FONDO_CAJA, Gato, LILA, TURQUESA, Zzz3D} from '../componentes/Misterio';
import {useEscena} from '../lib/escena';
import {camaraPlanos} from '../lib/planos';

/**
 * "Un gato que está vivo y muerto al mismo tiempo. Y un genio lo inventó para demostrar que era absurdo."
 * Una caja tiembla en la oscuridad con su signo de pregunta brillante; la tapa se levanta y se
 * asoman dos gatos translúcidos superpuestos: uno despierto (turquesa) y otro dormido (lila, con zzz).
 */
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const CajaTiembla: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {momento, duracion} = useEscena();
	const t = frame / fps;
	const fGato = momento('gato');
	const fVivo = momento('vivo');
	const fGenio = momento('genio');
	const fAbsurdo = momento('absurdo');

	const asoma = spring({frame: frame - fGato - 2, fps, config: {damping: 14, stiffness: 90}});
	const abrir = interpolate(frame, [fGato - 4, fGato + 10], [0.06, 0.72], clamp);
	const sacudon = interpolate(frame, [fAbsurdo, fAbsurdo + 4, fAbsurdo + 16], [0, 1, 0], clamp);
	const temblor = 0.55 + 0.35 * Math.min(1, frame / 30) + 1.2 * sacudon;
	const sorpresa = frame > fAbsurdo;
	const mirar: [number, number] = sorpresa ? [-0.1, 0] : [0.05 * Math.sin(t * 1.7), 0.45 * Math.sin(t * 1.3)];
	const titila = 0.5 + 0.5 * Math.sin(t * 7.3);

	const {posicion, mirarA, fov} = camaraPlanos(frame, fps, [
		{desde: 0, pos: [0.9, 0.85, 6.8], mira: [0, 1.0, 0], deriva: [-0.25, 0.05, -0.55]},
		{desde: fVivo - 2, pos: [-1.0, 1.95, 4.3], mira: [0, 1.55, 0.2], deriva: [0.18, 0, -0.12]},
		{desde: fGenio - 3, pos: [2.6, 2.5, 7.6], mira: [0, 1.0, 0], deriva: [-0.5, -0.06, -0.3]},
		{desde: fAbsurdo - 2, pos: [0.25, 1.6, 4.8], mira: [0, 1.4, 0], deriva: [0, 0, -0.2], llegada: 8},
		{desde: duracion + 1, pos: [0, 0, 0], mira: [0, 0, 0]},
	]);

	return (
		<EscenarioMisterio t={t}>
			<Camara posicion={posicion} mirarA={mirarA} fov={fov} />
			<CajaMisterio t={t} temblor={temblor} abrir={abrir} brilloSigno={0.7 + 0.3 * Math.sin(t * 4)}>
				{/* los dos gatos asomándose (la caja tapa lo que queda adentro) */}
				<Gato
					t={t}
					echado={1}
					ojos={0}
					fantasma={{color: LILA, opacidad: 0.8 * asoma * (0.75 + 0.25 * (1 - titila))}}
					position={[0.28, ALTO_CAJA - 0.26 - 0.6 * (1 - asoma), 0.22]}
					rotation={[0, -0.2, 0]}
					scale={0.78}
				/>
				<Gato
					t={t}
					ojos={1}
					cara={sorpresa ? 'sorpresa' : 'normal'}
					mirar={mirar}
					pupilas={[0.6 * Math.sin(t * 1.3), 0]}
					fantasma={{color: TURQUESA, opacidad: 0.8 * asoma * (0.75 + 0.25 * titila)}}
					position={[-0.12, ALTO_CAJA - 0.62 - 0.9 * (1 - asoma), -0.05]}
					scale={0.78}
				/>
				<Zzz3D t={t} position={[0.45, ALTO_CAJA + 0.35, FONDO_CAJA / 2 - 0.2]} scale={0.75} opacidad={asoma} />
			</CajaMisterio>
		</EscenarioMisterio>
	);
};
