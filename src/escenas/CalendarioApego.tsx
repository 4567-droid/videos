import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {ZonaBrillo} from '../componentes/Amor';
import {Calendario} from '../componentes/Calendario';
import {Camara, proyectar, temblor} from '../componentes/Camara';
import {LucesNoche} from '../componentes/Dormir';
import {Destellos} from '../componentes/Efectos';
import {Escenario3D} from '../componentes/Escenario3D';
import {Etiqueta} from '../componentes/Etiqueta';
import {CerebroConCara} from '../componentes/Interruptor';
import type {V3} from '../componentes/utilidades3d';
import {useEscena} from '../lib/escena';

/**
 * "Y hay una buena noticia: cuantos más días pasaban, menos se activaba la zona del apego."
 * Arriba, el cerebro con una luz rosa adentro (la zona del apego); abajo, un calendario que pasa
 * días (1 → 60). Con cada día la luz baja de intensidad y el cerebro se ve más tranquilo.
 */

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const POS_CEREBRO: V3 = [0, 1.62, -0.4];
const ROT_CEREBRO: V3 = [0.12, 0.25, 0];
const ESC_CEREBRO = 0.5;
const ZONA: V3 = [0.05, -0.28, 0.3];
const DIAS = [1, 7, 15, 30, 45, 60];

export const CalendarioApego: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const {momento, duracion} = useEscena();
	const t = frame / fps;

	const fBuena = momento('buena');
	const fCuantos = momento('cuantos');
	const fApego = momento('apego');

	const buena = spring({frame: frame - fBuena, fps, config: {damping: 14}});
	const calendario = spring({frame: frame - fCuantos + 14, fps, config: {damping: 13, stiffness: 110}});
	const avance = interpolate(frame, [fCuantos, fApego + 8], [0, DIAS.length - 1], {...clamp, easing: Easing.inOut(Easing.sin)});
	const intensidad = 1.25 - 1.05 * (avance / (DIAS.length - 1));
	const etiqueta = spring({frame: frame - fApego, fps, config: {damping: 12, stiffness: 140}});

	const k = frame / Math.max(1, duracion);
	const sacudon = temblor(t, 0.3);
	const posicion: V3 = [0.3 - 0.2 * k + sacudon[0], 1.3 + sacudon[1], 4.4 - 0.35 * k];
	const mirarA: V3 = [0, 1.12, 0];
	const zonaMundo = new THREE.Vector3(...ZONA).multiplyScalar(ESC_CEREBRO).applyEuler(new THREE.Euler(...ROT_CEREBRO)).add(new THREE.Vector3(...POS_CEREBRO));
	const pZona = proyectar([zonaMundo.x, zonaMundo.y, zonaMundo.z], posicion, mirarA, width, height);

	return (
		<Escenario3D
			fondo="radial-gradient(circle at 50% 40%, #6B4C9E 0%, #45317E 55%, #20144A 100%)"
			luces={false}
			overlay={
				<Etiqueta x={Math.min(880, pZona.x + 300)} y={pZona.y + 10} texto="APEGO" aparicion={etiqueta} fondo="#FF8FAB" color="#FFFFFF" tamano={44} anclaje="centro" />
			}
		>
			<Camara posicion={posicion} mirarA={mirarA} />
			<LucesNoche luz={0.6 + 0.2 * buena} />
			<mesh rotation={[-Math.PI / 2, 0, 0]}>
				<circleGeometry args={[5, 48]} />
				<meshStandardMaterial color="#45317E" roughness={0.95} />
			</mesh>

			<group position={[POS_CEREBRO[0], POS_CEREBRO[1] + 0.03 * Math.sin(t * 1.3), POS_CEREBRO[2]]} rotation={ROT_CEREBRO} scale={ESC_CEREBRO}>
				<CerebroConCara t={t} abiertos={1.0 - 0.2 * (1 - intensidad)} mirar={[0, -0.5]} brillo={0.15 + 0.35 * intensidad} boca={buena > 0.5 ? 'sonrisa' : 'nada'} />
				<ZonaBrillo color="#FF5C8A" intensidad={Math.max(0.08, intensidad) * (0.85 + 0.15 * Math.sin(t * 4))} escala={0.8 + 0.6 * intensidad} position={ZONA} />
			</group>

			{calendario > 0.01 ? (
				<Calendario dias={DIAS} avance={avance} position={[0, 0.55 - 0.4 * (1 - calendario), 0.3]} rotation={[-0.05, -0.08, 0]} scale={0.55 * calendario} />
			) : null}

			{buena > 0.01 ? (
				<Destellos t={t} cantidad={40} rango={[3, 2.5, 1.5]} centro={[0, 1.6, -0.3]} tamano={0.035 * buena} semilla="buena-noticia" colores={['#FFFFFF', '#FFD23F', '#FFD6E0']} />
			) : null}
			<Destellos t={t} cantidad={26} rango={[5, 3, 2]} centro={[0, 1.8, -1.2]} tamano={0.022} semilla="apego" colores={['#FFFFFF', '#D6C9FF']} opacidad={0.5} />
		</Escenario3D>
	);
};
