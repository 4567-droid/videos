import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camara, temblor} from '../componentes/Camara';
import {Pizarron} from '../componentes/Ciencia';
import {Destellos} from '../componentes/Efectos';
import {Einstein} from '../componentes/Einstein';
import {Escenario3D} from '../componentes/Escenario3D';
import {Reloj3D} from '../componentes/Reloj';
import type {V3} from '../componentes/utilidades3d';
import {useEscena} from '../lib/escena';

/**
 * "En 1905, Albert Einstein propuso que el tiempo y el espacio no son fijos:
 * dependen de qué tan rápido te movés."
 * Einstein escribe en el pizarrón (1905, E = mc²), saluda, y señala un reloj que se estira como goma.
 */

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const suave = Easing.inOut(Easing.cubic);
const PISO = -1.3;

export const EinsteinPizarron: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {momento, duracion} = useEscena();
	const t = frame / fps;

	const fAlbert = momento('Albert');
	const fPropuso = momento('propuso');
	const fTiempo = momento('tiempo');
	const fFijos = momento('fijos');
	const fDependen = momento('dependen');

	const revelar = interpolate(frame, [4, fAlbert], [0, 1], {...clamp, easing: Easing.out(Easing.quad)});
	// poses: escribe → saluda → señala el reloj
	const escribe = interpolate(frame, [0, fAlbert - 4, fAlbert + 4], [1, 1, 0], clamp);
	const saluda = interpolate(frame, [fAlbert - 4, fAlbert + 4, fPropuso + 4, fTiempo], [0, 1, 1, 0], clamp);
	const senala = interpolate(frame, [fPropuso + 4, fTiempo, fDependen + 10, fDependen + 22], [0, 1, 1, 0.4], clamp);
	const reposo = Math.max(0, 1 - escribe - saluda - senala);
	const giro = 0.75 * escribe + 0.15 * (1 - escribe);

	const reloj = spring({frame: frame - fTiempo + 4, fps, config: {damping: 11, stiffness: 120}});
	const estirar = interpolate(frame, [fFijos - 4, fFijos + 8], [0, 1], {...clamp, easing: suave}) * (0.55 + 0.45 * Math.sin(t * 5.5));
	const velocidad = interpolate(frame, [fDependen, fDependen + 10], [0, 1], clamp);

	const sacudon = temblor(t, 0.6);
	const k = frame / duracion;
	const posicion: V3 = [0.35 - 0.5 * k + sacudon[0], 0.55 + sacudon[1], 6.6 - 0.5 * k];

	return (
		<Escenario3D
			fondo="radial-gradient(circle at 50% 38%, #FFE8D6 0%, #FFB4A2 38%, #E07A5F 70%, #6D2E46 100%)"
			colorContraluz="#FFF3B0"
		>
			<Camara posicion={posicion} mirarA={[0.05, 0.2, -0.3]} />

			{/* piso de aula */}
			<mesh position={[0, PISO - 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
				<circleGeometry args={[4.5, 48]} />
				<meshStandardMaterial color="#F2CC8F" roughness={0.85} />
			</mesh>

			<Pizarron revelar={revelar} position={[0.3, 0.55, -1.3]} />

			<Einstein
				t={t}
				mezcla={[
					{animacion: 'escribir', peso: escribe},
					{animacion: 'saludar', peso: saluda},
					{animacion: 'señalar', peso: senala},
					{animacion: 'reposo', peso: reposo},
				]}
				position={[-0.85, PISO, 0.35]}
				rotation={[0, giro, 0]}
			/>

			{/* el reloj que se estira (tiempo elástico) */}
			<group position={[0.72, 0.62, 0.7]} scale={0.4 * reloj}>
				<Reloj3D hora={2 + t * (0.3 + 1.6 * velocidad)} t={t} estirar={estirar} color="#3A86FF" />
				{velocidad > 0.01
					? [0, 1, 2, 3, 4].map((i) => {
							const d = (t * 2.2 + i / 5) % 1;
							return (
								<mesh key={i} position={[-1.6 - d * 2.4, -0.9 + i * 0.45, 0]} scale={[0.9 * (1 - d), 1, 1]}>
									<boxGeometry args={[1, 0.05, 0.05]} />
									<meshBasicMaterial color="#FFFFFF" transparent opacity={0.7 * velocidad * (1 - d)} toneMapped={false} />
								</mesh>
							);
						})
					: null}
			</group>

			<Destellos t={t} cantidad={40} rango={[7, 6, 3]} centro={[0, 1.2, -2.2]} tamano={0.04} semilla="pizarron" colores={['#FFFFFF', '#FFF3B0', '#FFD6A5']} />
		</Escenario3D>
	);
};
