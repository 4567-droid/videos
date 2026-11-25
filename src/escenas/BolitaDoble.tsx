import React from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camara} from '../componentes/Camara';
import {Resplandor} from '../componentes/Efectos';
import {Bolita, EscenarioMisterio, TURQUESA} from '../componentes/Misterio';
import {useEscena} from '../lib/escena';
import {camaraPlanos} from '../lib/planos';

/**
 * "Y acá viene lo raro. En el mundo cuántico, un átomo puede estar en dos estados a la vez, hasta
 * que se lo mide. Eso se llama superposición."
 * Una bolita blanca se desdobla en dos (azul y roja) que vibran a la vez, unidas por un brillo.
 * Con "mide" pasa un anillo de medición y quedan en una sola (fogonazo); con "superposición"
 * vuelven a desdoblarse, superpuestas, con un aro de luz alrededor.
 */
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const AZUL = '#3D8BFF';
const ROJO = '#FF3D6E';

export const BolitaDoble: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {momento, duracion} = useEscena();
	const t = frame / fps;
	const fCuantico = momento('cuántico');
	const fDos = momento('dos estados');
	const fMide = momento('mide');
	const fSuper = momento('superposición');
	const fEso = momento('eso se llama');

	const suave = Easing.inOut(Easing.cubic);
	// separación: 0 = una bolita, 1 = dos bolitas
	const separar =
		interpolate(frame, [fDos - 6, fDos + 10], [0, 1], {...clamp, easing: suave}) -
		interpolate(frame, [fMide - 2, fMide + 6], [0, 1], {...clamp, easing: suave}) +
		interpolate(frame, [fEso, fSuper + 6], [0, 0.55], {...clamp, easing: suave});
	const medido = interpolate(frame, [fMide - 2, fMide + 6, fEso - 4, fEso + 4], [0, 1, 1, 0], clamp);
	const anillo = interpolate(frame, [fMide - 14, fMide + 4], [0, 1], clamp);
	const flash = interpolate(frame, [fMide + 2, fMide + 5, fMide + 16], [0, 1, 0], clamp);
	const halo = interpolate(frame, [fSuper - 4, fSuper + 10], [0, 1], clamp);
	const vibra = separar > 0.05 ? 0.035 : 0.006;
	const jx = vibra * Math.sin(t * 61);
	const jy = vibra * Math.cos(t * 47);
	const centro: [number, number, number] = [0, 1.6, 0];
	const dx = 0.62 * separar;
	const entrada = interpolate(frame, [0, 14], [0, 1], {...clamp, easing: Easing.out(Easing.back(2))});

	const {posicion, mirarA, fov} = camaraPlanos(frame, fps, [
		{desde: 0, pos: [1.2, 2.0, 4.4], mira: centro, deriva: [-0.3, 0, -0.12]},
		{desde: fCuantico - 3, pos: [-1.6, 1.3, 3.4], mira: centro, deriva: [0.35, 0.05, -0.05]},
		{desde: fDos - 2, pos: [0, 1.85, 4.5], mira: centro, deriva: [0, 0, -0.18]},
		{desde: fMide - 8, pos: [0.4, 3.2, 2.4], mira: centro, deriva: [-0.1, -0.15, -0.1], llegada: 8},
		{desde: fEso - 2, pos: [-1.2, 1.5, 4.0], mira: centro, deriva: [0.3, 0.02, -0.14]},
		{desde: duracion + 1, pos: [0, 0, 0], mira: [0, 0, 0]},
	]);

	return (
		<EscenarioMisterio t={t} luzPiso={0.8}>
			<Camara posicion={posicion} mirarA={mirarA} fov={fov} />
			<group position={centro} scale={entrada}>
				{separar < 0.08 && medido < 0.5 ? (
					<Bolita color="#F4F0FF" radio={0.36} position={[jx, jy, 0]} />
				) : medido > 0.5 && separar < 0.08 ? (
					<Bolita color={AZUL} radio={0.36} brillo={1 + flash} position={[jx, jy, 0]} />
				) : (
					<>
						<Bolita color={AZUL} radio={0.34} opacidad={separar < 0.6 ? 0.8 : 1} position={[-dx + jx, jy, 0]} />
						<Bolita color={ROJO} radio={0.34} opacidad={separar < 0.6 ? 0.8 : 1} position={[dx - jy, -jx, 0.02]} />
						{/* el brillo que las une */}
						<mesh rotation={[0, 0, Math.PI / 2]}>
							<cylinderGeometry args={[0.035, 0.035, 2 * dx, 8]} />
							<meshBasicMaterial color="#E9DBFF" transparent opacity={0.6} toneMapped={false} />
						</mesh>
						<Resplandor color="#C9A7FF" escala={1.5 + 1.2 * separar} opacidad={0.35} />
					</>
				)}
				{/* anillo de medición que baja */}
				{anillo > 0.01 && anillo < 0.999 ? (
					<mesh position={[0, 1.4 - 1.4 * anillo, 0]} rotation={[Math.PI / 2, 0, 0]}>
						<torusGeometry args={[0.75, 0.025, 8, 64]} />
						<meshBasicMaterial color={TURQUESA} toneMapped={false} />
					</mesh>
				) : null}
				{flash > 0.01 ? <Resplandor color="#FFFFFF" escala={3.5 * flash + 0.5} opacidad={flash} /> : null}
				{/* aro de la superposición */}
				{halo > 0.01 ? (
					<group rotation={[0.35, t * 0.8, 0]}>
						<mesh rotation={[Math.PI / 2, 0, 0]} scale={0.6 + 0.4 * halo}>
							<torusGeometry args={[1.25, 0.02, 8, 96]} />
							<meshBasicMaterial color="#FFD23F" transparent opacity={halo} toneMapped={false} />
						</mesh>
					</group>
				) : null}
			</group>
			{/* pedestal */}
			<mesh position={[0, 0.35, 0]}>
				<cylinderGeometry args={[0.5, 0.65, 0.7, 6]} />
				<meshStandardMaterial color="#3A2A6E" roughness={0.6} />
			</mesh>
			<mesh position={[0, 0.72, 0]}>
				<cylinderGeometry args={[0.55, 0.55, 0.05, 6]} />
				<meshBasicMaterial color={TURQUESA} toneMapped={false} />
			</mesh>
		</EscenarioMisterio>
	);
};
