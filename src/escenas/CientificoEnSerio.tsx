import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camara} from '../componentes/Camara';
import {ALTO_CAJA, CajaMisterio, Cartel3D, EscenarioMisterio, GatosSuperpuestos, Schrodinger, TURQUESA} from '../componentes/Misterio';
import type {V3} from '../componentes/utilidades3d';
import {FUENTE} from '../lib/fuente';
import {useEscena} from '../lib/escena';
import {camaraPlanos} from '../lib/planos';

/**
 * "Pero acá está el giro: Schrödinger no creía eso. Lo propuso como una crítica, para mostrar lo
 * ridículo que sonaba llevar esa idea hasta un gato."
 * Un foco ilumina a Schrödinger, que se agarra la cabeza y niega. Sobre la caja salta un cartel
 * "¿EN SERIO?" y al final se asoman los dos gatos translúcidos, como diciendo "¿y nosotros qué?".
 */
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const dibujarCartel = (ctx: CanvasRenderingContext2D) => {
	const W = ctx.canvas.width;
	const H = ctx.canvas.height;
	ctx.fillStyle = '#FFF4D6';
	ctx.fillRect(0, 0, W, H);
	ctx.fillStyle = '#E63E6D';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.font = `900 ${Math.round(H * 0.5)}px ${FUENTE}`;
	ctx.fillText('¿EN SERIO?', W / 2, H * 0.54);
};

// manos en la cabeza (coordenadas del torso; la cabeza está en [0, 0.77, 0])
const MANOS_CABEZA = {
	izq: {codo: [-0.42, 0.72, 0.12] as V3, mano: [-0.19, 0.92, 0.08] as V3},
	der: {codo: [0.42, 0.72, 0.12] as V3, mano: [0.19, 0.92, 0.08] as V3},
};

export const CientificoEnSerio: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {momento, duracion} = useEscena();
	const t = frame / fps;
	const fSchrodinger = momento('Schrödinger');
	const fCritica = momento('crítica');
	const fRidiculo = momento('ridículo');
	const fGato = momento('gato');

	const foco = interpolate(frame, [0, 10], [0, 1], clamp);
	const manos = interpolate(frame, [fSchrodinger + 6, fSchrodinger + 14], [0, 1], clamp);
	const niega = manos * 0.35 * Math.sin(t * 9) * interpolate(frame, [fCritica - 4, fCritica + 6], [1, 0.3], clamp);
	const cartel = spring({frame: frame - fCritica + 2, fps, config: {damping: 9, stiffness: 160}});
	const gatos = spring({frame: frame - fGato + 8, fps, config: {damping: 13}});

	const {posicion, mirarA, fov} = camaraPlanos(frame, fps, [
		{desde: 0, pos: [-0.5, 0.75, 3.4], mira: [-1.1, 1.45, 0], deriva: [-0.15, 0.03, -0.12]},
		{desde: fSchrodinger - 2, pos: [-1.6, 1.75, 2.6], mira: [-1.15, 1.55, 0], deriva: [0.12, 0, -0.06]},
		{desde: fCritica - 4, pos: [1.6, 2.1, 4.4], mira: [0.95, 1.65, 0], deriva: [-0.12, 0, -0.15], llegada: 10},
		{desde: fRidiculo - 4, pos: [-0.2, 2.0, 6.4], mira: [0, 1.35, 0], deriva: [0.1, -0.03, -0.35]},
		{desde: duracion + 1, pos: [0, 0, 0], mira: [0, 0, 0]},
	]);

	return (
		<EscenarioMisterio t={t} luzPiso={0.6}>
			<Camara posicion={posicion} mirarA={mirarA} fov={fov} />
			{/* foco cenital sobre Schrödinger */}
			<pointLight position={[-0.9, 2.4, 2.4]} intensity={9 * foco} distance={7} color="#FFF1D6" />
			<mesh position={[-1.2, 2.5, 0]}>
				<coneGeometry args={[1.05, 5, 32, 1, true]} />
				<meshBasicMaterial color="#FFF3D6" transparent opacity={0.07 * foco} depthWrite={false} toneMapped={false} fog={false} side={2} />
			</mesh>
			<Schrodinger
				t={t}
				animacion="reposo"
				expresion="preocupada"
				brazos={manos > 0.5 ? MANOS_CABEZA : undefined}
				giroCabeza={[0.08 * manos, niega, 0]}
				position={[-1.2, 0, 0]}
				rotation={[0, 0.35, 0]}
			/>
			<CajaMisterio t={t} temblor={0.2} brilloSigno={0.7} position={[1.0, 0, -0.4]} rotation={[0, -0.3, 0]} scale={0.85}>
				{gatos > 0.01 ? <GatosSuperpuestos t={t} opacidad={0.8 * gatos} position={[0, ALTO_CAJA - 0.75 + 0.35 * gatos, -0.1]} scale={0.7} /> : null}
				{cartel > 0.01 ? (
					<Cartel3D
						clave="cartel-en-serio"
						dibujar={dibujarCartel}
						ancho={1.7}
						alto={0.55}
						palo={0.55}
						position={[0, ALTO_CAJA + 0.95 * cartel + 0.1, 0.55]}
						rotation={[0, 0, 0.08 * Math.sin(t * 3)]}
						scale={cartel}
					/>
				) : null}
			</CajaMisterio>
			<pointLight position={[1.0, 2.6, 1.2]} color={TURQUESA} intensity={3 * cartel} distance={4} />
		</EscenarioMisterio>
	);
};
