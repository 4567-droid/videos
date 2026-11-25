import React, {useMemo} from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {Camara} from '../componentes/Camara';
import {Resplandor} from '../componentes/Efectos';
import {Atomo, CajaMisterio, EscenarioMisterio, Moneda, TURQUESA} from '../componentes/Misterio';
import {Reloj3D} from '../componentes/Reloj';
import {useEscena} from '../lib/escena';
import {camaraPlanos} from '../lib/planos';

/**
 * "El átomo tiene el cincuenta por ciento de probabilidades de desintegrarse en una hora.
 * No sabés qué pasó… hasta abrir la caja."
 * Una moneda gira en el aire sin caer nunca (de un lado el gato despierto, del otro dormido) y un
 * reloj marca una hora: el aro de luz se completa. Al final la cámara vuelve a la caja cerrada.
 */
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Aro de progreso (arco que crece con `k` de 0 a 1). */
const AroProgreso: React.FC<{k: number; radio: number}> = ({k, radio}) => {
	const geo = useMemo(() => new THREE.TorusGeometry(radio, 0.06, 8, 96, Math.max(0.001, k) * Math.PI * 2), [k, radio]);
	return (
		<mesh geometry={geo} rotation={[0, 0, Math.PI / 2]} scale={[-1, 1, 1]}>
			<meshBasicMaterial color={TURQUESA} toneMapped={false} />
		</mesh>
	);
};

export const RelojMoneda: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {momento, duracion} = useEscena();
	const t = frame / fps;
	const fCincuenta = momento('cincuenta');
	const fHora = momento('hora');
	const fSabes = momento('no sabés');
	const fAbrir = momento('hasta abrir');

	const hora = interpolate(frame, [fHora - 10, fSabes + 6], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
	const giro = t * 9 + 3 * Math.sin(t * 1.3);
	// la moneda sube, gira y nunca cae
	const yMoneda = 1.9 + 0.12 * Math.sin(t * 2.1);

	const {posicion, mirarA, fov} = camaraPlanos(frame, fps, [
		{desde: 0, pos: [1.4, 1.6, 3.6], mira: [0.2, 1.7, 0], deriva: [-0.25, 0.05, -0.1]},
		{desde: fCincuenta - 2, pos: [-0.2, 2.0, 2.7], mira: [0.35, 1.9, 0], deriva: [0.1, 0, -0.08]},
		{desde: fHora - 4, pos: [-2.4, 2.1, 3.4], mira: [-1.15, 2.0, -0.6], deriva: [0.12, 0, -0.1]},
		{desde: fSabes - 3, pos: [0.4, 2.6, 6.8], mira: [0, 1.3, 0], deriva: [0, -0.1, -0.35]},
		{desde: fAbrir - 2, pos: [0.15, 1.35, 3.0], mira: [0, 1.0, 0.4], deriva: [0, 0, -0.3], llegada: 10},
		{desde: duracion + 1, pos: [0, 0, 0], mira: [0, 0, 0]},
	]);
	const tapa = interpolate(frame, [fAbrir + 4, fAbrir + 16], [0, 0.08], clamp);

	return (
		<EscenarioMisterio t={t}>
			<Camara posicion={posicion} mirarA={mirarA} fov={fov} />
			<CajaMisterio t={t} temblor={0.3 + 0.5 * tapa * 10} abrir={tapa} brilloSigno={0.7} position={[0, 0, -0.6]} scale={0.8} />
			{/* el átomo que decide todo, flotando sobre la caja */}
			<Atomo t={t} position={[0.0, 1.55, -0.6]} scale={0.32} brillo={0.7 + 0.3 * Math.sin(t * 6)} />
			{/* la moneda */}
			<group position={[0.45, yMoneda, 0.1]}>
				<Resplandor color="#FFD23F" escala={2.2} opacidad={0.3} />
				<Moneda t={t} giro={giro} rotation={[0.15 * Math.sin(t), 0, 0.12]} scale={0.75} />
				{/* rayitas de giro */}
				{[0, 1, 2].map((i) => {
					const a = t * 9 + (i * Math.PI * 2) / 3;
					return (
						<mesh key={i} position={[Math.cos(a) * 0.62, 0.05 * i - 0.05, Math.sin(a) * 0.62]} rotation={[0, -a, 0]}>
							<boxGeometry args={[0.3, 0.015, 0.015]} />
							<meshBasicMaterial color="#FFF3B0" transparent opacity={0.6} toneMapped={false} />
						</mesh>
					);
				})}
			</group>
			{/* el reloj de una hora */}
			<group position={[-1.15, 2.05, -0.6]} rotation={[0, 0.35, 0]}>
				<Reloj3D hora={12 + hora} t={t} color="#6A4BC4" scale={0.5} />
				<group position={[0, 0, 0.12]}>
					<AroProgreso k={hora} radio={0.62} />
				</group>
				{hora > 0.98 ? <Resplandor color={TURQUESA} escala={2} opacidad={0.4} /> : null}
			</group>
		</EscenarioMisterio>
	);
};
