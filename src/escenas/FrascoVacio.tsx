import React from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {BrazoCerebro, Frasco} from '../componentes/Amor';
import {Camara, temblor} from '../componentes/Camara';
import {LucesNoche} from '../componentes/Dormir';
import {Destellos} from '../componentes/Efectos';
import {Escenario3D} from '../componentes/Escenario3D';
import {CerebroConCara} from '../componentes/Interruptor';
import type {V3} from '../componentes/utilidades3d';
import {useEscena} from '../lib/escena';

/**
 * "Los investigadores notaron similitudes con lo que pasa con el antojo de una droga."
 * El cerebro estira un brazo y busca adentro de un frasco vacío (con una etiqueta de corazón).
 * Revuelve, saca la mano vacía y pone cara de desilusión.
 */

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const mezclar = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

const POS_CEREBRO: V3 = [-0.32, 1.5, -0.3];
const POS_FRASCO: V3 = [0.28, 0.5, 0.2];
const HOMBRO: V3 = [-0.02, 1.38, -0.16];

export const FrascoVacio: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {momento, duracion} = useEscena();
	const t = frame / fps;

	const fInvestigadores = momento('investigadores');
	const fNotaron = momento('notaron');
	const fAntojo = momento('antojo');
	const fDroga = momento('droga', {fin: true});

	// recorrido de la mano: cerca del cerebro → arriba del frasco → adentro buscando → afuera vacía
	const llega = interpolate(frame, [fInvestigadores - 6, fNotaron], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
	const entra = interpolate(frame, [fNotaron, fNotaron + 12], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
	const sale = interpolate(frame, [fAntojo, fAntojo + 14], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
	const busca = entra * (1 - sale);
	const inicio: V3 = [0.12, 1.32, 0.05];
	const arriba: V3 = [POS_FRASCO[0], 1.28, POS_FRASCO[2]];
	const adentro: V3 = [POS_FRASCO[0] + 0.08 * Math.sin(t * 7) * busca, 0.74, POS_FRASCO[2] + 0.05 * Math.cos(t * 5) * busca];
	const afuera: V3 = [0.42, 1.22, 0.35];
	let mano = mezclar(inicio, arriba, llega);
	mano = mezclar(mano, adentro, entra);
	mano = mezclar(mano, afuera, sale);
	const codo: V3 = [(HOMBRO[0] + mano[0]) / 2 + 0.12, Math.max(HOMBRO[1], mano[1]) + 0.18, (HOMBRO[2] + mano[2]) / 2 + 0.08];
	const cerrar = busca * (0.35 + 0.3 * Math.sin(t * 9));
	const desilusion = interpolate(frame, [fAntojo + 8, fDroga], [0, 1], clamp);
	const polvo = interpolate(frame, [fAntojo + 4, fAntojo + 30], [0, 1], clamp);

	const k = frame / Math.max(1, duracion);
	const sacudon = temblor(t, 0.3);
	const posicion: V3 = [0.5 + 0.15 * k + sacudon[0], 1.45 + sacudon[1], 3.9 - 0.3 * k];
	const mirarA: V3 = [0, 1.05, 0];

	return (
		<Escenario3D fondo="radial-gradient(circle at 50% 40%, #523A8C 0%, #31246E 55%, #160E3A 100%)" luces={false}>
			<Camara posicion={posicion} mirarA={mirarA} />
			<LucesNoche luz={0.45} />
			<mesh rotation={[-Math.PI / 2, 0, 0]}>
				<circleGeometry args={[4, 48]} />
				<meshStandardMaterial color="#33266F" roughness={0.95} />
			</mesh>
			{/* mesita */}
			<mesh position={[POS_FRASCO[0], 0.47, POS_FRASCO[2]]}>
				<cylinderGeometry args={[0.5, 0.5, 0.06, 32]} />
				<meshStandardMaterial color="#B39DDB" roughness={0.6} />
			</mesh>
			<mesh position={[POS_FRASCO[0], 0.23, POS_FRASCO[2]]}>
				<cylinderGeometry args={[0.05, 0.07, 0.46, 12]} />
				<meshStandardMaterial color="#9C86CF" roughness={0.6} />
			</mesh>
			<mesh position={[POS_FRASCO[0], 0.01, POS_FRASCO[2]]}>
				<cylinderGeometry args={[0.25, 0.28, 0.03, 24]} />
				<meshStandardMaterial color="#9C86CF" roughness={0.6} />
			</mesh>
			<Frasco position={POS_FRASCO} posTapa={[-0.62, 0.05, 0.3]} scale={0.55} />

			<group position={[POS_CEREBRO[0], POS_CEREBRO[1] + 0.03 * Math.sin(t * 1.5), POS_CEREBRO[2]]} rotation={[0.2, 0.35, 0]} scale={0.45}>
				<CerebroConCara t={t} abiertos={1.1 - 0.35 * desilusion} mirar={[0.55, -0.7]} brillo={0.3 + 0.3 * busca} boca={desilusion > 0.5 ? 'nada' : 'sonrisa'} />
			</group>
			<BrazoCerebro desde={HOMBRO} codo={codo} mano={mano} cerrar={cerrar} escalaMano={0.85} />

			{/* polvito al sacar la mano vacía */}
			{polvo > 0.01 && polvo < 0.99
				? [0, 1, 2, 3].map((i) => (
						<mesh key={i} position={[POS_FRASCO[0] + 0.12 * Math.cos(i * 1.7), 1.08 + 0.25 * polvo, POS_FRASCO[2] + 0.1 * Math.sin(i * 1.7)]} scale={0.04 + 0.06 * polvo}>
							<sphereGeometry args={[1, 10, 8]} />
							<meshBasicMaterial color="#E9E5FF" transparent opacity={0.5 * (1 - polvo)} depthWrite={false} />
						</mesh>
					))
				: null}
			<Destellos t={t} cantidad={30} rango={[4, 3, 2]} centro={[0, 1.6, -0.8]} tamano={0.025} semilla="frasco" colores={['#FFFFFF', '#D6C9FF', '#FFD23F']} opacidad={0.55} />
		</Escenario3D>
	);
};
