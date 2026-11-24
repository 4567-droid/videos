import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camara, temblor} from '../componentes/Camara';
import {Cama, Durmiente, Habitacion, LucesNoche} from '../componentes/Dormir';
import {Destellos} from '../componentes/Efectos';
import {Escenario3D} from '../componentes/Escenario3D';
import type {V3} from '../componentes/utilidades3d';
import {useEscena} from '../lib/escena';

/**
 * "¿Alguna vez despertaste y no pudiste moverte?"
 * Primer plano de la cara dormida: los ojos se abren de par en par. La cámara se aleja
 * y muestra el cuerpo rígido en la cama: tiembla apenas, como si quisiera moverse y no pudiera.
 */

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const mezclar = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

export const DespertarRigido: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {momento} = useEscena();
	const t = frame / fps;

	const fDesperto = momento('despertaste');
	const fNo = momento('no');
	const fMoverte = momento('moverte');

	// ojos: cerrados → se abren de golpe (con rebote) → bien abiertos
	const abre = spring({frame: frame - fDesperto - 2, fps, config: {damping: 9, stiffness: 220}});
	const abiertos = 1.32 * abre;
	// pupilas que van de un lado a otro (quiere moverse y no puede)
	const busca = interpolate(frame, [fNo - 4, fNo + 4], [0, 1], clamp);
	const mirar: [number, number] = [busca * Math.sin((frame - fNo) * 0.32) * 0.9, 0.15 * busca];
	const rigido = interpolate(frame, [fNo, fNo + 6], [0, 1], clamp);
	const marcas = interpolate(frame, [fMoverte - 4, fMoverte + 4], [0, 1], clamp);

	// cámara: primer plano de la cara → plano medio de la cama
	const aleja = interpolate(frame, [fDesperto + 6, fDesperto + 52], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
	const sacudon = temblor(t, 0.6 + 1.2 * rigido);
	const base = mezclar([0.08, 1.45, -0.2], [0.45, 2.15, 2.75], aleja);
	const posicion: V3 = [base[0] + sacudon[0], base[1] + sacudon[1], base[2]];
	const mirarA = mezclar([0, 0.5, -0.82], [0.05, 0.3, -0.38], aleja);

	return (
		<Escenario3D fondo="radial-gradient(circle at 50% 35%, #3B2A8F 0%, #1E1660 55%, #0A0826 100%)" luces={false}>
			<Camara posicion={posicion} mirarA={mirarA} />
			<LucesNoche />
			<Habitacion t={t} mesa={false} />
			<Cama />
			<Durmiente
				t={t}
				abiertos={abiertos}
				mirar={mirar}
				cejas={-abre}
				boca={abre > 0.3 ? 'o' : 'linea'}
				abrirBoca={0.35 + 0.25 * abre}
				respira={0.6 * (1 - rigido)}
				temblor={rigido}
				manta={-0.5}
			/>
			{/* marquitas de tensión al lado de las manos (cuerpo rígido) */}
			{marcas > 0.01
				? [-1, 1].map((lado) =>
						[0, 1, 2].map((i) => {
							const ang = -0.6 + i * 0.6;
							const parpadeo = 0.5 + 0.5 * Math.sin(t * 22 + i * 2 + lado);
							return (
								<mesh
									key={`${lado}-${i}`}
									position={[lado * (0.55 + 0.05 * Math.cos(ang)), 0.22 + 0.1 * Math.sin(ang), 0.1 + 0.06 * i]}
									rotation={[-Math.PI / 2, 0, lado * ang]}
									scale={marcas}
								>
									<planeGeometry args={[0.14, 0.03]} />
									<meshBasicMaterial color="#FFFFFF" transparent opacity={0.9 * parpadeo} toneMapped={false} depthWrite={false} />
								</mesh>
							);
						}),
					)
				: null}
			<Destellos t={t} cantidad={36} rango={[5, 3, 3]} centro={[0, 1.6, -1.0]} tamano={0.03} semilla="despertar" colores={['#FFFFFF', '#B8C4FF', '#FFD23F']} opacidad={0.7} />
		</Escenario3D>
	);
};
