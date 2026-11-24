import React, {useLayoutEffect, useRef} from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {Avatar} from '../componentes/Avatar';
import {Camara, temblor} from '../componentes/Camara';
import {Destellos} from '../componentes/Efectos';
import {Escenario3D} from '../componentes/Escenario3D';
import {RelojDerretido} from '../componentes/Reloj';
import type {V3} from '../componentes/utilidades3d';
import {useEscena} from '../lib/escena';

/**
 * Cierre gracioso: "Así que la próxima vez que llegues tarde, no es tu culpa: es relatividad."
 * Alguien corre con cara de culpa (y gotitas de transpiración) mientras un reloj se derrite.
 */

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Rayas de la vereda que pasan hacia atrás (sensación de correr). */
const Vereda: React.FC<{t: number}> = ({t}) => {
	const ref = useRef<THREE.InstancedMesh>(null);
	useLayoutEffect(() => {
		const m = ref.current;
		if (!m) return;
		const o = new THREE.Object3D();
		for (let i = 0; i < 24; i++) {
			const z = 6 - ((i * 1.4 + t * 6.5) % 33.6);
			o.position.set(i % 2 === 0 ? -1.4 : 1.4, -0.995, z);
			o.updateMatrix();
			m.setMatrixAt(i, o.matrix);
		}
		m.instanceMatrix.needsUpdate = true;
	});
	return (
		<instancedMesh ref={ref} args={[undefined, undefined, 24]} frustumCulled={false}>
			<boxGeometry args={[0.1, 0.01, 0.7]} />
			<meshBasicMaterial color="#FFFFFF" />
		</instancedMesh>
	);
};

export const LlegarTarde: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {momento, duracion} = useEscena();
	const t = frame / fps;

	const fTarde = momento('tarde');
	const fRelatividad = momento('relatividad');

	const derretir = interpolate(frame, [4, fRelatividad + 10], [0.15, 1], clamp);
	const golpe = spring({frame: frame - fRelatividad, fps, config: {damping: 9, stiffness: 160}});
	const apuro = interpolate(frame, [fTarde, fTarde + 8], [0, 1], clamp);

	// gotitas de transpiración que saltan de la cabeza
	const gotas = [0, 1, 2].map((i) => {
		const k = (t * 1.6 + i / 3) % 1;
		const lado = i % 2 === 0 ? -1 : 1;
		return {pos: [lado * (0.22 + k * 0.35), 1.85 + k * 0.25 - k * k * 0.6, 0.15] as V3, s: 0.05 * (1 - k * 0.5), o: 1 - k};
	});

	const sacudon = temblor(t * 1.4, 0.9 + 0.6 * apuro);
	const k = frame / duracion;
	const posicion: V3 = [0.9 - 0.5 * k + sacudon[0], 1.15 + sacudon[1], 4.6 - 0.6 * golpe * 0.5];

	return (
		<Escenario3D
			fondo="radial-gradient(circle at 50% 35%, #FFF3B0 0%, #FFB347 35%, #F25C54 68%, #6A1B4D 100%)"
			colorContraluz="#FFD166"
		>
			<Camara posicion={posicion} mirarA={[0.25, 0.75, 0]} />

			{/* vereda */}
			<mesh position={[0, -1.05, -10]} rotation={[-Math.PI / 2, 0, 0]}>
				<planeGeometry args={[4.4, 40]} />
				<meshStandardMaterial color="#8D99AE" roughness={0.9} />
			</mesh>
			<Vereda t={t} />

			<Avatar
				t={t}
				animacion="correr"
				frecuencia={1 + 0.25 * apuro}
				expresion="preocupada"
				cejas
				position={[0, -1.0, 0.2]}
				rotation={[0, -0.25, 0]}
				colores={{remera: '#3A86FF', pantalon: '#2B2D42', pelo: '#3B2416', zapatillas: '#FFFFFF', piel: '#E8A87C'}}
			/>
			{gotas.map((g, i) => (
				<mesh key={i} position={[g.pos[0], g.pos[1] - 1.0, g.pos[2] + 0.2]} scale={[g.s, g.s * 1.4, g.s]}>
					<sphereGeometry args={[1, 12, 10]} />
					<meshStandardMaterial color="#7DF9FF" transparent opacity={g.o} roughness={0.1} />
				</mesh>
			))}

			<RelojDerretido t={t} derretir={derretir} position={[0.85, 1.65, -0.4]} rotation={[0, -0.3, 0.1]} scale={0.72 * (1 + 0.12 * golpe)} />
			<Destellos t={t} cantidad={40} rango={[7, 6, 3]} centro={[0, 1.5, -2]} tamano={0.045} semilla="tarde" colores={['#FFFFFF', '#FFF3B0', '#FFC8DD']} />
		</Escenario3D>
	);
};
