import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Abeja} from '../componentes/Abeja';
import {Camara, temblor} from '../componentes/Camara';
import {Destellos} from '../componentes/Efectos';
import {Escenario3D} from '../componentes/Escenario3D';
import type {V3} from '../componentes/utilidades3d';
import {useEscena} from '../lib/escena';

/**
 * Gancho: "¿Sabías que las abejas pueden reconocer tu cara?"
 * Abeja gigante, de cerca, mirando a cámara. En "reconocer" entrecierra los ojos
 * como analizando; en "cara" abre grandes los ojos y sonríe: ¡te reconoció!
 */

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const AbejaGancho: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {momento, duracion} = useEscena();
	const t = frame / fps;

	const fPueden = momento('pueden');
	const fReconocer = momento('reconocer');
	const fCara = momento('cara');

	// entra ya visible (fotograma 0 = portada) con un pequeño rebote
	const entrada = spring({frame: frame + 8, fps, config: {damping: 12, stiffness: 120}});

	// mira de reojo y vuelve; entrecierra en "reconocer"; sorpresa en "cara"
	const deReojo = interpolate(frame, [fPueden - 4, fPueden + 4, fReconocer - 2, fReconocer + 4], [0, 1, 1, 0], clamp);
	const analiza = interpolate(frame, [fReconocer, fReconocer + 6, fCara - 2, fCara + 3], [0, 1, 1, 0], clamp);
	const sorpresa = interpolate(frame, [fCara - 2, fCara + 4], [0, 1], clamp);
	const parpadeo = Math.max(
		interpolate(frame, [20, 23, 26], [0, 1, 0], clamp),
		0.45 * analiza,
	);

	// cámara: muy cerca, se abre un poco y hace un "zoom de golpe" en "cara"
	const abrir = Easing.inOut(Easing.cubic)(interpolate(frame, [0, duracion], [0, 1], clamp));
	const golpe = spring({frame: frame - fCara + 2, fps, config: {damping: 10, stiffness: 180}});
	const distancia = 2.35 + 1.0 * abrir - 0.35 * golpe;
	const angulo = -0.22 + 0.36 * abrir;
	const sacudon = temblor(t, 0.7);
	const posicion: V3 = [Math.sin(angulo) * distancia + sacudon[0], 0.42 + sacudon[1], Math.cos(angulo) * distancia];

	const flota = 0.04 * Math.sin(t * Math.PI * 2 * 1.1);
	const inclinacion = 0.16 * analiza - 0.05 * Math.sin(t * 1.7);

	return (
		<Escenario3D
			fondo="radial-gradient(circle at 50% 42%, #9BF6FF 0%, #3AB0FF 34%, #2A4BD7 68%, #160D4F 100%)"
			colorContraluz="#FFE58A"
		>
			<Camara posicion={posicion} mirarA={[0, 0.3, 0]} />
			<Abeja
				t={t}
				position={[0, -0.28 + flota, 0]}
				rotation={[0.05, -0.12 * deReojo, inclinacion]}
				scale={0.92 + 0.08 * entrada}
				mirada={[0.9 * deReojo - 0.1 * analiza, 0.1 * sorpresa]}
				parpadeo={parpadeo}
				sorpresa={sorpresa * 0.4}
			/>
			<Destellos t={t} cantidad={50} rango={[5, 6, 3]} centro={[0, 0.3, -1.5]} tamano={0.035} semilla="gancho-abeja" colores={['#FFFFFF', '#FFE58A', '#9BF6FF']} />
		</Escenario3D>
	);
};
