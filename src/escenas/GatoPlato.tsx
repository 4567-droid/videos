import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camara} from '../componentes/Camara';
import {Resplandor} from '../componentes/Efectos';
import {CajaMisterio, EscenarioMisterio, Gato, Plato, TURQUESA} from '../componentes/Misterio';
import {useEscena} from '../lib/escena';
import {camaraPlanos} from '../lib/planos';

/**
 * "Mientras tanto, el gato de verdad está vivo, despierto y pidiendo comida. Ninguna superposición
 * lo detiene."
 * Delante de la caja ignorada (su signo de pregunta se desinfla), el gato golpea el plato vacío
 * con cara de enojo. Con "Ninguna superposición" aparece a su lado una copia translúcida: el gato
 * la mira, maúlla y la copia se desvanece de un "plop".
 */
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const GatoPlato: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {momento, duracion} = useEscena();
	const t = frame / fps;
	const fVivo = momento('vivo');
	const fDespierto = momento('despierto');
	const fComida = momento('comida');
	const fNinguna = momento('ninguna');
	const fDetiene = momento('detiene');

	// golpes al plato: ciclos rápidos desde "despierto" hasta "Ninguna"
	const golpeando = frame > fDespierto - 6 && frame < fNinguna - 2;
	const ciclo = ((frame - fDespierto) % 12) / 12;
	const pata = golpeando ? Math.max(0, Math.sin(ciclo * Math.PI)) * 0.85 : 0;
	const impacto = golpeando && ciclo > 0.92 ? 1 : 0;
	const saltoPlato = golpeando ? 0.05 * Math.max(0, 1 - ciclo * 4) : 0;
	const copia = interpolate(frame, [fNinguna - 2, fNinguna + 8, fDetiene - 2, fDetiene + 3], [0, 0.75, 0.75, 0], clamp);
	const plop = interpolate(frame, [fDetiene - 2, fDetiene + 2, fDetiene + 12], [0, 1, 0], clamp);
	const giraHaciaCopia = interpolate(frame, [fNinguna, fNinguna + 8, fDetiene + 6, fDetiene + 14], [0, 1, 1, 0], clamp);
	const maulla = interpolate(frame, [fComida - 3, fComida + 2, fComida + 12], [0, 1, 0], clamp) + interpolate(frame, [fDetiene - 6, fDetiene - 2, fDetiene + 8], [0, 1, 0], clamp);
	const entra = spring({frame: frame + 8, fps, config: {damping: 14}});

	const {posicion, mirarA, fov} = camaraPlanos(frame, fps, [
		{desde: 0, pos: [-1.2, 2.1, 6.4], mira: [0, 1.0, -0.4], deriva: [0.3, -0.06, -0.35]},
		{desde: fVivo - 2, pos: [1.5, 1.0, 3.3], mira: [0.1, 0.7, 0.7], deriva: [-0.15, 0, -0.06]},
		{desde: fComida - 3, pos: [0.25, 0.55, 2.7], mira: [0.15, 0.5, 0.95], deriva: [0, 0.02, -0.1]},
		{desde: fNinguna - 3, pos: [-0.4, 1.45, 3.4], mira: [-0.1, 0.95, 0.4], deriva: [0.1, 0, -0.18]},
		{desde: duracion + 1, pos: [0, 0, 0], mira: [0, 0, 0]},
	]);

	return (
		<EscenarioMisterio t={t} luzPiso={1.2}>
			<Camara posicion={posicion} mirarA={mirarA} fov={fov} />
			{/* la caja, ignorada */}
			<CajaMisterio t={t} brilloSigno={0.5} desanimo={interpolate(frame, [fVivo, fComida], [0, 1], clamp)} position={[-0.2, 0, -1.6]} rotation={[0, 0.2, 0]} scale={0.9} />
			{/* el gato de verdad */}
			<Gato
				t={t}
				ojos={1}
				cara="enojado"
				maullido={Math.min(1, maulla)}
				pata={pata}
				mirar={[0.15 - 0.15 * giraHaciaCopia + 0.12 * pata, 0.9 * giraHaciaCopia]}
				pupilas={[0.6 * giraHaciaCopia, 0]}
				cola={1.6}
				position={[0.1, 0, 0.1]}
				scale={0.85 * entra}
			/>
			<group position={[0.18, saltoPlato, 0.95]}>
				<Plato scale={0.62} />
				{impacto ? <Resplandor color="#FFFFFF" escala={0.9} opacidad={0.6} position={[0, 0.2, 0]} /> : null}
			</group>
			{/* la copia translúcida que no tiene chance */}
			{copia > 0.01 ? (
				<Gato t={t} echado={1} ojos={0} fantasma={{color: TURQUESA, opacidad: copia}} position={[-1.05, 0, 0.3]} rotation={[0, 0.4, 0]} scale={0.7} />
			) : null}
			{plop > 0.01 ? <Resplandor color={TURQUESA} escala={0.5 + 2.5 * plop} opacidad={plop} position={[-1.05, 0.4, 0.4]} /> : null}
		</EscenarioMisterio>
	);
};
