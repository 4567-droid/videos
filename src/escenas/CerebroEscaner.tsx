import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {CorazonRoto, Escaner} from '../componentes/Amor';
import {Camara, temblor} from '../componentes/Camara';
import {cajaRedondeada, LucesNoche} from '../componentes/Dormir';
import {Destellos} from '../componentes/Efectos';
import {Escenario3D} from '../componentes/Escenario3D';
import {CerebroConCara} from '../componentes/Interruptor';
import type {V3} from '../componentes/utilidades3d';
import {useEscena} from '../lib/escena';

/**
 * "Un estudio con resonancia magnética miró el cerebro de personas que acababan de ser
 * rechazadas por su pareja."
 * Un cerebro (algo nervioso) entra en la camilla a un resonador; el escáner lo recorre con
 * una luz celeste. Arriba aparece un corazón que se parte.
 */

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const CENTRO: V3 = [0, 1.15, 0];

export const CerebroEscaner: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {momento, duracion} = useEscena();
	const t = frame / fps;

	const fResonancia = momento('resonancia');
	const fMiro = momento('miró');
	const fPersonas = momento('personas');
	const fRechazadas = momento('rechazadas');
	const fPareja = momento('pareja', {fin: true});

	const entrar = interpolate(frame, [fResonancia - 4, fMiro + 2], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
	const escaneo = interpolate(frame, [fMiro, fMiro + 10, fRechazadas, fPareja + 10], [0, 1, 1, 0.4], clamp);
	const corazon = spring({frame: frame - fPersonas, fps, config: {damping: 13, stiffness: 110}});
	const parte = interpolate(frame, [fRechazadas, fRechazadas + 14], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.6))});
	const triste = interpolate(frame, [fRechazadas, fRechazadas + 12], [0, 1], clamp);

	const k = frame / Math.max(1, duracion);
	const sacudon = temblor(t, 0.3);
	const posicion: V3 = [0.9 - 0.5 * k + sacudon[0], 1.75 + sacudon[1], 5.9 - 0.35 * k];
	const mirarA: V3 = [0, 1.35, 0.2];

	return (
		<Escenario3D
			fondo="radial-gradient(circle at 50% 40%, #39327F 0%, #221C5E 55%, #0E0B2E 100%)"
			luces={false}
			overlay={<CorazonRoto x={540} y={588} tamano={150} aparicion={corazon} separar={parte} />}
		>
			<Camara posicion={posicion} mirarA={mirarA} />
			<LucesNoche luz={0.35} />
			<pointLight position={[0, 1.15, 0.2]} intensity={1.4 * escaneo} distance={1.6} color="#7DF9FF" />
			<mesh rotation={[-Math.PI / 2, 0, 0]}>
				<circleGeometry args={[4, 48]} />
				<meshStandardMaterial color="#2A2468" roughness={0.95} />
			</mesh>
			<Escaner t={t} entrar={entrar} escaneo={escaneo} position={CENTRO} scale={0.6}>
				<mesh position={[0, 0.12, -0.05]} geometry={cajaRedondeada(0.5, 0.1, 0.4, 0.05)}>
					<meshStandardMaterial color="#FFFFFF" roughness={0.9} />
				</mesh>
				<CerebroConCara
					t={t}
					abiertos={1.05 - 0.3 * triste}
					mirar={[0.4 * Math.sin(t * 1.3) * (1 - escaneo), 0.45 - 0.7 * triste]}
					brillo={0.25 + 0.45 * escaneo}
					position={[0, 0.48 + 0.015 * Math.sin(t * 3), 0]}
					rotation={[-0.1, 0.15, 0]}
					scale={0.47}
				/>
			</Escaner>
			<Destellos t={t} cantidad={30} rango={[5, 3, 3]} centro={[0, 2.2, -1]} tamano={0.025} semilla="escaner" colores={['#FFFFFF', '#B8C4FF', '#7DF9FF']} opacidad={0.6} />
		</Escenario3D>
	);
};
