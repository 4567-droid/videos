import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {CorazonChico, Portarretrato, ZonaBrillo} from '../componentes/Amor';
import {Camara, proyectar, temblor} from '../componentes/Camara';
import {LucesNoche} from '../componentes/Dormir';
import {Destellos} from '../componentes/Efectos';
import {Escenario3D} from '../componentes/Escenario3D';
import {Etiqueta} from '../componentes/Etiqueta';
import {CerebroConCara} from '../componentes/Interruptor';
import type {V3} from '../componentes/utilidades3d';
import {useEscena} from '../lib/escena';

/**
 * "Les mostraron fotos de su ex, y se activaron áreas del cerebro ligadas a la recompensa y a los antojos."
 * Un portarretrato con una foto borrosa; el cerebro la mira y se le encienden zonas por dentro
 * (recompensa en dorado, antojos en rosa), con sus carteles.
 */

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const limitarPx = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

const POS_CEREBRO: V3 = [0.3, 1.62, -0.4];
const ROT_CEREBRO: V3 = [0.15, -0.4, 0];
const ESC_CEREBRO = 0.5;
const POS_FOTO: V3 = [-0.28, 0.7, 0.45];
// zonas en coordenadas del cerebro (frente = +Z)
const ZONA_RECOMPENSA: V3 = [0.02, -0.32, 0.25];
const ZONA_ANTOJOS: V3 = [0.2, 0.0, 0.62];
const ZONA_EXTRA: V3 = [-0.22, -0.28, 0.15];

/** Pasa un punto del cerebro a coordenadas del mundo. */
const aMundo = (p: V3): V3 => {
	const v = new THREE.Vector3(...p).multiplyScalar(ESC_CEREBRO).applyEuler(new THREE.Euler(...ROT_CEREBRO));
	return [v.x + POS_CEREBRO[0], v.y + POS_CEREBRO[1], v.z + POS_CEREBRO[2]];
};

export const FotoRecompensa: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const {momento, duracion} = useEscena();
	const t = frame / fps;

	const fFotos = momento('fotos');
	const fActivaron = momento('activaron');
	const fRecompensa = momento('recompensa');
	const fAntojos = momento('antojos');

	const foto = spring({frame: frame - fFotos + 8, fps, config: {damping: 13, stiffness: 110}});
	const enciende = interpolate(frame, [fActivaron, fActivaron + 14], [0, 1], {...clamp, easing: Easing.out(Easing.quad)});
	const pulso = 0.8 + 0.2 * Math.sin(t * 5);
	const recompensa = spring({frame: frame - fRecompensa, fps, config: {damping: 12, stiffness: 140}});
	const antojos = spring({frame: frame - fAntojos, fps, config: {damping: 12, stiffness: 140}});
	const realceR = 1 + 0.5 * interpolate(frame, [fRecompensa, fRecompensa + 6, fRecompensa + 24], [0, 1, 0.3], clamp);
	const realceA = 1 + 0.5 * interpolate(frame, [fAntojos, fAntojos + 6, fAntojos + 24], [0, 1, 0.3], clamp);

	const k = frame / Math.max(1, duracion);
	const sacudon = temblor(t, 0.3);
	const posicion: V3 = [0.5 - 0.1 * k + sacudon[0], 1.5 + sacudon[1], 4.5 - 0.4 * k];
	const mirarA: V3 = [0.05, 1.22, 0];

	const pR = proyectar(aMundo(ZONA_RECOMPENSA), posicion, mirarA, width, height);
	const pA = proyectar(aMundo(ZONA_ANTOJOS), posicion, mirarA, width, height);
	// los carteles van abajo del cerebro, uno debajo del otro (arriba no hay lugar: están los subtítulos)
	const xR = limitarPx(pR.x + 40, 300, 800);
	const yR = limitarPx(pR.y + 140, 600, 1200);

	return (
		<Escenario3D
			fondo="radial-gradient(circle at 50% 40%, #463585 0%, #2A2068 55%, #120C34 100%)"
			luces={false}
			overlay={
				<>
					<Etiqueta x={xR} y={yR} texto="RECOMPENSA" aparicion={recompensa} fondo="#FFD23F" color="#3A2A80" tamano={44} anclaje="centro" />
					<Etiqueta x={limitarPx(pA.x + 80, 300, 820)} y={yR + 100} texto="ANTOJOS" aparicion={antojos} fondo="#FF6B8B" color="#FFFFFF" tamano={44} anclaje="centro" />
				</>
			}
		>
			<Camara posicion={posicion} mirarA={mirarA} />
			<LucesNoche luz={0.4} />
			<mesh rotation={[-Math.PI / 2, 0, 0]}>
				<circleGeometry args={[4, 48]} />
				<meshStandardMaterial color="#2E2370" roughness={0.95} />
			</mesh>

			<Portarretrato position={[POS_FOTO[0], POS_FOTO[1] - 0.3 * (1 - foto), POS_FOTO[2]]} rotation={[-0.05, 0.38, 0.03 * Math.sin(t)]} scale={0.7 * foto} />

			{/* corazoncitos que van de la foto al cerebro */}
			{enciende > 0.01
				? [0, 1, 2].map((i) => {
						const c = (t * 0.45 + i / 3) % 1;
						const a: V3 = [POS_FOTO[0] + 0.15, POS_FOTO[1] + 0.35, POS_FOTO[2]];
						const b = aMundo([0, -0.2, 0.5]);
						return (
							<CorazonChico
								key={i}
								position={[a[0] + (b[0] - a[0]) * c, a[1] + (b[1] - a[1]) * c + 0.12 * Math.sin(c * Math.PI), a[2] + (b[2] - a[2]) * c]}
								rotation={[0, t, 0]}
								scale={0.06 * Math.sin(Math.PI * c) * enciende}
								brillo={0.6}
							/>
						);
					})
				: null}

			<group position={[POS_CEREBRO[0], POS_CEREBRO[1] + 0.03 * Math.sin(t * 1.4), POS_CEREBRO[2]]} rotation={ROT_CEREBRO} scale={ESC_CEREBRO}>
				<CerebroConCara t={t} abiertos={1.0} mirar={[-0.6, -0.55]} brillo={0.2 + 0.5 * enciende} boca={enciende > 0.5 ? 'sonrisa' : 'nada'} />
				<ZonaBrillo color="#FFC93C" intensidad={enciende * pulso * realceR} escala={1.1} position={ZONA_RECOMPENSA} />
				<ZonaBrillo color="#FF5C8A" intensidad={enciende * (0.75 + 0.25 * Math.sin(t * 4 + 1)) * realceA} escala={1.0} position={ZONA_ANTOJOS} />
				<ZonaBrillo color="#FFB36B" intensidad={enciende * 0.7 * pulso} escala={0.7} position={ZONA_EXTRA} />
			</group>
			<Destellos t={t} cantidad={30} rango={[4, 3, 2]} centro={[0, 1.6, -0.8]} tamano={0.025} semilla="foto-ex" colores={['#FFFFFF', '#FFD6E0', '#FFD23F']} opacidad={0.6} />
		</Escenario3D>
	);
};
