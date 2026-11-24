import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camara, temblor} from '../componentes/Camara';
import {Contador} from '../componentes/Contador';
import {Cama, Durmiente, Habitacion, LucesNoche} from '../componentes/Dormir';
import {Destellos} from '../componentes/Efectos';
import {Escenario3D} from '../componentes/Escenario3D';
import {Etiqueta} from '../componentes/Etiqueta';
import {Tilde} from '../componentes/Experimento';
import {Reloj3D} from '../componentes/Reloj';
import type {V3} from '../componentes/utilidades3d';
import {useEscena} from '../lib/escena';

/**
 * "Dura segundos o un par de minutos, y no es peligroso."
 * Un reloj avanza (el cronómetro llega a 2:00) mientras el muñeco se relaja: brazos y
 * piernas recuperan el color, respira hondo y sonríe. Aparece "No es peligroso" con un tilde.
 */

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const BOCA: V3 = [0, 0.48, -0.67];

const formatear = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export const RelojRespira: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {momento, duracion} = useEscena();
	const t = frame / fps;

	const fDura = momento('dura');
	const fSegundos = momento('segundos', {fin: true});
	const fMinutos = momento('minutos', {fin: true});
	const fNo = momento('no');
	const fPeligroso = momento('peligroso', {fin: true});

	// cronómetro: primero segundos y después rápido hasta 2 minutos
	const segundos = interpolate(frame, [fDura, fSegundos + 4, fMinutos + 12], [0, 12, 120], {...clamp, easing: Easing.in(Easing.quad)});
	const reloj = spring({frame: frame + 4, fps, config: {damping: 12, stiffness: 120}});
	const contador = spring({frame: frame - fDura, fps, config: {damping: 13}});
	const llego = spring({frame: frame - fMinutos - 12, fps, config: {damping: 9, stiffness: 160}});

	// el cuerpo se relaja
	const relaja = interpolate(frame, [fMinutos - 14, fMinutos + 16], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
	const cierra = interpolate(frame, [fNo - 4, fPeligroso], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
	const abiertos = cierra > 0.5 ? 0 : 1.25 - 0.6 * relaja - 0.65 * cierra * 2;
	const seguro = spring({frame: frame - fNo + 2, fps, config: {damping: 11, stiffness: 150}});

	const k = frame / duracion;
	const sacudon = temblor(t, 0.5 * (1 - relaja) + 0.2);
	const posicion: V3 = [0.25 + 0.07 * k + sacudon[0], 2.6 + 0.1 * k + sacudon[1], 3.8 + 0.25 * k];
	const mirarA: V3 = [0, 0.8, -0.5];

	// soplidos de respiración (cada 2,2 s)
	const ciclo = (t * 0.45 + 0.3) % 1;

	return (
		<Escenario3D
			fondo="radial-gradient(circle at 50% 35%, #3B2A8F 0%, #1E1660 55%, #0A0826 100%)"
			luces={false}
			overlay={
				<>
					<Contador valor={0} texto={formatear(segundos)} color="#4CC9F0" aparicion={contador} pop={llego} top={1320} />
					<Etiqueta x={600} y={1580} texto="NO ES PELIGROSO" aparicion={seguro} fondo="#22C55E" color="#FFFFFF" tamano={50} anclaje="centro" />
					<Tilde x={232} y={1580} aparicion={seguro} tamano={124} />
				</>
			}
		>
			<Camara posicion={posicion} mirarA={mirarA} />
			<LucesNoche luz={0.25 * relaja} />
			<Habitacion t={t} />
			<Cama />
			<Durmiente
				t={t}
				abiertos={Math.max(0, abiertos)}
				mirar={[0.2 * Math.sin(t * 1.5) * (1 - relaja), 0.1]}
				cejas={-1 + 2 * relaja}
				boca={relaja > 0.6 ? 'sonrisa' : 'o'}
				abrirBoca={0.3}
				apagado={1 - relaja}
				respira={0.3 + 1.3 * relaja}
				temblor={0.4 * (1 - relaja)}
			/>
			{/* soplidos al respirar */}
			{relaja > 0.3
				? [0, 1].map((i) => {
						const c = (ciclo + i * 0.12) % 1;
						return (
							<mesh key={i} position={[BOCA[0] + 0.05 * i, BOCA[1] + 0.15 + c * 0.5, BOCA[2] + 0.1 + c * 0.2]} scale={0.05 + 0.09 * c}>
								<sphereGeometry args={[1, 12, 8]} />
								<meshBasicMaterial color="#DDE4FF" transparent opacity={0.45 * (1 - c) * relaja} depthWrite={false} toneMapped={false} />
							</mesh>
						);
					})
				: null}
			<Reloj3D
				hora={3 + segundos / 60}
				t={t}
				color="#4CC9F0"
				brillo={llego}
				position={[0, 1.22 + 0.03 * Math.sin(t * 1.4), -1.0]}
				rotation={[0.25, 0.12 * Math.sin(t * 0.8), 0.05 * Math.sin(t * 1.1)]}
				scale={0.34 * reloj}
			/>
			<Destellos t={t} cantidad={30} rango={[4, 2.5, 2]} centro={[0, 1.4, -1.1]} tamano={0.025} semilla="reloj-respira" colores={['#FFFFFF', '#B8C4FF', '#FFD23F']} opacidad={0.6} />
		</Escenario3D>
	);
};
