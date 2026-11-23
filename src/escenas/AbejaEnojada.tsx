import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Abeja} from '../componentes/Abeja';
import {Camara, temblor} from '../componentes/Camara';
import {Destellos, SombraSuave} from '../componentes/Efectos';
import {Escenario3D} from '../componentes/Escenario3D';
import {Repelente} from '../componentes/Repelente';
import type {V3} from '../componentes/utilidades3d';
import {useEscena} from '../lib/escena';

/**
 * "Así que si una abeja te da vueltas, tranquilo. Solo te reconoció... y sigue enojada
 * por el repelente."
 * La abeja da vueltas frente a cámara, se frena, saluda (te reconoció) y en "enojada"
 * aterriza, frunce el ceño y se cruza de brazos, golpeando el pie. La cámara baja y
 * muestra la lata de repelente tirada en el piso.
 */

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const suave = Easing.inOut(Easing.cubic);
const mezclar = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

const PISO = -1.0;
const ESCALA = 0.62;
const POS_LATA: V3 = [0.82, PISO + 0.28 * 0.85, 0.5];

export const AbejaEnojada: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {momento} = useEscena();
	const t = frame / fps;

	const fTranquilo = momento('tranquilo');
	const fSolo = momento('solo');
	const fSigue = momento('sigue');
	const fEnojada = momento('enojada');
	const fRepelente = momento('repelente');

	// 1) vueltas frente a cámara (se frenan en "tranquilo")
	const frenar = interpolate(frame, [fTranquilo - 6, fTranquilo + 14], [0, 1], {...clamp, easing: suave});
	const ang = 2.7 * t - 0.8 * Math.max(0, t - fTranquilo / fps) * frenar;
	const radio = 1.05 * (1 - frenar);
	const vueltas: V3 = [Math.cos(ang) * radio, 0.45 + Math.sin(ang) * radio * 0.75, 0.35 * Math.sin(ang) * (1 - frenar)];
	// 2) aterriza en "enojada"
	const aterriza = interpolate(frame, [fSigue - 2, fEnojada + 6], [0, 1], {...clamp, easing: suave});
	const enElPiso: V3 = [-0.15, PISO + 0.85 * ESCALA, 0.2];
	const p = mezclar(vueltas, enElPiso, aterriza);
	const posAbeja: V3 = [p[0], p[1] + 0.05 * Math.sin(t * 6.5) * (1 - aterriza), p[2]];

	// expresiones
	const reconoce = interpolate(frame, [fSolo, fSolo + 8, fSigue - 2, fSigue + 4], [0, 1, 1, 0], clamp);
	const enojo = interpolate(frame, [fSigue, fEnojada + 2], [0, 1], {...clamp, easing: suave});
	const cruzar = interpolate(frame, [fEnojada - 2, fEnojada + 10], [0, 1], {...clamp, easing: suave});
	const golpeteo = interpolate(frame, [fEnojada + 8, fEnojada + 14], [0, 1], clamp);
	const miraLata = interpolate(frame, [fRepelente - 2, fRepelente + 6, fRepelente + 22, fRepelente + 30], [0, 1, 1, 0], clamp);
	const vena = spring({frame: frame - fEnojada - 4, fps, config: {damping: 8, stiffness: 200}});
	const lata = spring({frame: frame - fRepelente + 10, fps, config: {damping: 11, stiffness: 120}});

	// cámara: plano medio → baja y se abre para mostrar el piso y la lata
	const bajar = interpolate(frame, [fSigue, fRepelente + 6], [0, 1], {...clamp, easing: suave});
	const sacudon = temblor(t, 0.7 + 0.8 * vena * (1 - bajar * 0.5));
	const base = mezclar([0.1, 0.5, 4.3], [0.5, 0.02, 5.0], bajar);
	const posicion: V3 = [base[0] + sacudon[0], base[1] + sacudon[1], base[2]];
	const mirarA = mezclar([0, 0.35, 0], [0.3, -0.42, 0], bajar);

	return (
		<Escenario3D
			fondo="radial-gradient(circle at 50% 38%, #FFD6E0 0%, #FF85A1 34%, #C9184A 66%, #4A0D2B 100%)"
			colorContraluz="#FFE58A"
		>
			<Camara posicion={posicion} mirarA={mirarA} />

			{/* piso: tarima de pasto */}
			<mesh position={[0, PISO - 0.12, 0]}>
				<cylinderGeometry args={[2.6, 2.5, 0.24, 64]} />
				<meshStandardMaterial color="#74C69D" roughness={0.9} />
			</mesh>
			<SombraSuave radio={0.45 + 0.2 * aterriza} opacidad={0.3 + 0.7 * aterriza} position={[posAbeja[0], PISO + 0.005, posAbeja[2]]} />

			{/* estela de puntitos mientras da vueltas */}
			{new Array(10).fill(0).map((_, i) => {
				const a = ang - (i + 1) * 0.22;
				const k = (1 - i / 10) * (1 - frenar);
				return k > 0.02 ? (
					<mesh key={i} position={[Math.cos(a) * radio, 0.45 + Math.sin(a) * radio * 0.75, 0.35 * Math.sin(a) - 0.1]} scale={0.035 * k}>
						<sphereGeometry args={[1, 8, 6]} />
						<meshBasicMaterial color="#FFF3B0" toneMapped={false} />
					</mesh>
				) : null;
			})}

			<Abeja
				t={t}
				position={posAbeja}
				rotation={[0.08, -0.35 * miraLata, -0.3 * Math.cos(ang) * (1 - frenar)]}
				scale={ESCALA}
				aleteo={1 - aterriza}
				enojo={enojo}
				sorpresa={0}
				saludo={reconoce * (1 - cruzar)}
				brazosCruzados={cruzar}
				golpeteo={golpeteo}
				mirada={[0.8 * miraLata, -0.5 * miraLata + 0.15 * reconoce]}
				parpadeo={interpolate(frame, [fTranquilo + 4, fTranquilo + 7, fTranquilo + 10], [0, 1, 0], clamp)}
			/>

			{/* venita de enojo (estilo historieta) */}
			{vena > 0.01 ? (
				<group position={[posAbeja[0] + 0.42 * ESCALA * 1.3, posAbeja[1] + 1.12 * ESCALA, posAbeja[2] + 0.35]} scale={0.12 * vena * (1 + 0.12 * Math.sin(t * 14))}>
					{[0, 1, 2, 3].map((i) => (
						<group key={i} rotation={[0, 0, (i * Math.PI) / 2]}>
							<mesh position={[0.55, 0.55, 0]} rotation={[0, 0, Math.PI]}>
								<torusGeometry args={[0.36, 0.12, 8, 16, Math.PI / 2]} />
								<meshBasicMaterial color="#EF233C" toneMapped={false} />
							</mesh>
						</group>
					))}
				</group>
			) : null}

			{/* humito que sale de la cabeza */}
			{enojo > 0.5
				? [0, 1].map((i) => {
						const k = (t * 0.8 + i * 0.5) % 1;
						return (
							<mesh key={i} position={[posAbeja[0] - 0.2 + i * 0.4, posAbeja[1] + (1.0 + k * 0.6) * ESCALA, posAbeja[2]]} scale={(0.06 + k * 0.1) * enojo}>
								<sphereGeometry args={[1, 12, 8]} />
								<meshStandardMaterial color="#FFFFFF" transparent opacity={(1 - k) * 0.7} depthWrite={false} />
							</mesh>
						);
					})
				: null}

			{/* la lata de repelente, tirada en el piso */}
			<group position={POS_LATA} scale={lata}>
				<Repelente t={t} nube={interpolate(frame, [fRepelente, fRepelente + 10], [0, 1], clamp)} rotation={[0, -0.25, -Math.PI / 2]} scale={0.85} />
			</group>
			<SombraSuave radio={0.6 * lata} opacidad={0.6} position={[POS_LATA[0], PISO + 0.005, POS_LATA[2]]} />

			<Destellos t={t} cantidad={40} rango={[7, 7, 3]} centro={[0, 0.6, -1.8]} tamano={0.04} semilla="enojada" colores={['#FFFFFF', '#FFE58A', '#FFC8DD']} />
		</Escenario3D>
	);
};
