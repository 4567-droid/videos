import React, {useMemo} from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {Camara, proyectar, temblor} from '../componentes/Camara';
import {Cama, Durmiente, Habitacion, LucesNoche} from '../componentes/Dormir';
import {Destellos} from '../componentes/Efectos';
import {Escenario3D} from '../componentes/Escenario3D';
import {CerebroConCara, Megafono} from '../componentes/Interruptor';
import type {V3} from '../componentes/utilidades3d';
import {FUENTE} from '../lib/fuente';
import {useEscena} from '../lib/escena';

/**
 * "Tu cerebro: “Ya desperté”. Tu cuerpo: “Cinco minutitos más”."  (cierre gracioso)
 * El cerebro, bien despierto, grita con un megáfono: ondas de sonido y la cama vibra.
 * El cuerpo, con antifaz y abrazado a una almohada, ni se mueve: ronca y suelta "Zzz".
 * Al final al cerebro le cae una gota de sudor.
 */

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const mezclar = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

const POS_CEREBRO: V3 = [-0.5, 1.3, -0.8];
const ESCALA_CEREBRO = 0.4;
// megáfono en coordenadas del cerebro: sale de la boca hacia abajo a la derecha (hacia el cuerpo)
const BOCA_CEREBRO = new THREE.Vector3(0, -0.36, 1.0);
const DIRECCION = new THREE.Vector3(0.62, -0.58, 0.52).normalize();
const ESCALA_MEGAFONO = 1.25;

export const CincoMinutitos: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const {momento} = useEscena();
	const t = frame / fps;

	const fYa = momento('ya');
	const fDesperte = momento('desperté', {fin: true});
	const fCuerpo = momento('cuerpo');
	const fCinco = momento('cinco');
	const fMas = momento('más', {fin: true});

	const {orientacion, centroMegafono, bocaMegafono} = useMemo(() => {
		const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), DIRECCION);
		const centro = BOCA_CEREBRO.clone().addScaledVector(DIRECCION, 0.42 * ESCALA_MEGAFONO);
		const boca = centro.clone().addScaledVector(DIRECCION, 0.3 * ESCALA_MEGAFONO);
		return {orientacion: q, centroMegafono: centro, bocaMegafono: boca};
	}, []);

	// el cerebro grita
	const grita = interpolate(frame, [fYa - 4, fYa + 2, fDesperte + 4, fDesperte + 12], [0, 1, 1, 0], clamp);
	const ondas = interpolate(frame, [fYa - 2, fYa + 4, fDesperte + 10, fDesperte + 22], [0, 1, 1, 0], clamp);
	const vibra = interpolate(frame, [fYa, fYa + 4, fDesperte + 6, fDesperte + 14], [0, 1, 1, 0], clamp);
	const empuje = spring({frame: frame - fYa + 6, fps, config: {damping: 10, stiffness: 180}});
	// el cuerpo: "cinco minutitos más" → se acurruca con la almohada y los Zzz crecen
	const acurruca = spring({frame: frame - fCinco, fps, config: {damping: 10, stiffness: 120}});
	const ronca = 0.5 + 0.5 * Math.sin(t * 4.2);
	const fastidio = interpolate(frame, [fCinco + 6, fMas], [0, 1], clamp);
	const gota = interpolate(frame, [fCinco + 10, fMas + 26], [0, 1], clamp);

	// cámara: plano del cerebro con el megáfono → se acerca al cuerpo
	const aCuerpo = interpolate(frame, [fCuerpo - 6, fCinco + 6], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
	const sacudon = temblor(t, 0.5 + 1.5 * vibra);
	const base = mezclar([0.9, 2.5, 3.2], [0.85, 2.15, 2.55], aCuerpo);
	const posicion: V3 = [base[0] + sacudon[0], base[1] + sacudon[1], base[2]];
	const mirarA = mezclar([-0.1, 0.85, -0.5], [0.05, 0.62, -0.55], aCuerpo);

	const temblorCama = 0.018 * vibra * Math.sin(t * 60);
	const cabeza = proyectar([0.12, 0.72, -0.86], posicion, mirarA, width, height);

	return (
		<Escenario3D
			fondo="radial-gradient(circle at 50% 35%, #3B2A8F 0%, #1E1660 55%, #0A0826 100%)"
			luces={false}
			overlay={
				<>
					{[0, 1, 2].map((i) => {
						const c = (t * 0.55 + i / 3) % 1;
						const grande = 1 + 0.7 * acurruca;
						return (
							<div
								key={i}
								style={{
									position: 'absolute',
									left: cabeza.x + (40 + 150 * c) * grande,
									top: cabeza.y - (30 + 230 * c) * grande,
									fontFamily: FUENTE,
									fontWeight: 900,
									fontSize: (46 + 40 * c) * grande,
									color: '#FFFFFF',
									opacity: Math.sin(Math.PI * c) * 0.95,
									transform: `rotate(${-12 + 18 * c}deg)`,
									textShadow: '0 0 18px #9B5DE5, 0 5px 0 rgba(0,0,0,0.35)',
								}}
							>
								Z
							</div>
						);
					})}
				</>
			}
		>
			<Camara posicion={posicion} mirarA={mirarA} />
			<LucesNoche luz={0.1} />
			<Habitacion t={t} />
			<group position={[temblorCama, 0, 0]}>
				<Cama />
				<Durmiente
					t={t}
					antifaz
					abrazaAlmohada
					manta={-0.1}
					boca="ronca"
					abrirBoca={0.25 + 0.5 * ronca}
					respira={1}
					rotation={[0, 0.03 * Math.sin(t * 1.3), -0.06 * acurruca]}
					position={[0.02 * acurruca, 0, 0]}
				/>
			</group>

			{/* cerebro con megáfono */}
			<group
				position={[POS_CEREBRO[0], POS_CEREBRO[1] + 0.04 * Math.sin(t * 1.7), POS_CEREBRO[2]]}
				rotation={[0.28, 0.35, 0.05 * Math.sin(t * 1.2)]}
				scale={ESCALA_CEREBRO * (1 + 0.06 * Math.sin(Math.PI * Math.min(1, empuje)) * grita)}
			>
				<CerebroConCara t={t} abiertos={1.25 - 0.75 * fastidio} mirar={[0.5, -0.5]} brillo={0.4 + 0.6 * grita} boca={grita > 0.2 ? 'grito' : 'nada'} abrirBoca={grita} />
				<group position={centroMegafono} quaternion={orientacion}>
					<Megafono brillo={grita} scale={ESCALA_MEGAFONO} />
				</group>
				{/* ondas de sonido */}
				{ondas > 0.01
					? [0, 1, 2].map((i) => {
							const c = (t * 1.8 + i / 3) % 1;
							const p = bocaMegafono.clone().addScaledVector(DIRECCION, 0.15 + 1.6 * c);
							return (
								<mesh key={i} position={p} quaternion={orientacion} scale={0.5 + 0.9 * c}>
									<torusGeometry args={[0.5, 0.05, 6, 32]} />
									<meshBasicMaterial color="#FFD23F" transparent opacity={0.85 * (1 - c) * ondas} toneMapped={false} depthWrite={false} />
								</mesh>
							);
						})
					: null}
				{/* gota de sudor */}
				{gota > 0.01 && gota < 0.99 ? (
					<mesh position={[0.78, 0.45 - 0.5 * gota, 0.55]} scale={[0.09, 0.13, 0.09]}>
						<sphereGeometry args={[1, 14, 10]} />
						<meshStandardMaterial color="#7DF9FF" emissive="#4CC9F0" emissiveIntensity={0.5} roughness={0.2} transparent opacity={Math.min(1, gota * 8) * (1 - gota)} />
					</mesh>
				) : null}
			</group>

			<Destellos t={t} cantidad={30} rango={[4, 2.5, 2]} centro={[0, 1.4, -1.1]} tamano={0.025} semilla="cinco-minutitos" colores={['#FFFFFF', '#B8C4FF', '#FFD23F']} opacidad={0.6} />
		</Escenario3D>
	);
};
