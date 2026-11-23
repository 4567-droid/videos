import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {Abeja} from '../componentes/Abeja';
import {Camara, proyectar, temblor} from '../componentes/Camara';
import {Destellos} from '../componentes/Efectos';
import {Escenario3D} from '../componentes/Escenario3D';
import {FotoCara, GotaAzucar, Tilde} from '../componentes/Experimento';
import type {V3} from '../componentes/utilidades3d';
import {FUENTE} from '../lib/fuente';
import {useEscena} from '../lib/escena';

/**
 * "Pero en un experimento, les mostraron fotos de caras humanas, y les daban azúcar
 * cuando elegían la correcta."
 * Mesa de laboratorio con dos fotos de caras. Aparece una gota de azúcar brillando
 * bajo la foto correcta; la abeja duda, elige esa y aparece el tilde verde.
 */

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const mezclar = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

const MESA_Y = -1.0;

/** Matraz de laboratorio con líquido burbujeante (decorado de la mesa). */
const Matraz: React.FC<{position: V3; t: number}> = ({position, t}) => (
	<group position={position}>
		<mesh position={[0, 0.17, 0]}>
			<cylinderGeometry args={[0.13, 0.33, 0.3, 32]} />
			<meshStandardMaterial color="#FF5DA2" emissive="#C9184A" emissiveIntensity={0.25} roughness={0.3} />
		</mesh>
		<mesh position={[0, 0.3, 0]}>
			<cylinderGeometry args={[0.11, 0.37, 0.6, 32, 1, true]} />
			<meshStandardMaterial color="#E0FBFF" transparent opacity={0.3} roughness={0.05} depthWrite={false} side={THREE.DoubleSide} />
		</mesh>
		<mesh position={[0, 0.72, 0]}>
			<cylinderGeometry args={[0.1, 0.1, 0.26, 24, 1, true]} />
			<meshStandardMaterial color="#E0FBFF" transparent opacity={0.3} roughness={0.05} depthWrite={false} side={THREE.DoubleSide} />
		</mesh>
		{[0, 1, 2].map((i) => {
			const k = (t * 0.7 + i / 3) % 1;
			return (
				<mesh key={i} position={[0.04 * Math.sin(i * 2.1 + t * 3), 0.3 + k * 0.7, 0.02]} scale={0.035 + 0.02 * k}>
					<sphereGeometry args={[1, 10, 8]} />
					<meshStandardMaterial color="#FFC8DD" transparent opacity={1 - k} />
				</mesh>
			);
		})}
	</group>
);
const FOTO_A: V3 = [-0.74, 0.52, 0];
const FOTO_B: V3 = [0.74, 0.52, 0];
const GOTA: V3 = [-0.74, MESA_Y + 0.06, 0.55];

export const ExperimentoCaras: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const {momento} = useEscena();
	const t = frame / fps;

	const fMostraron = momento('mostraron');
	const fAzucar = momento('azúcar');
	const fElegian = momento('elegían');
	const fCorrecta = momento('correcta');

	const fotoA = spring({frame: frame - fMostraron, fps, config: {damping: 11, stiffness: 120}});
	const fotoB = spring({frame: frame - fMostraron - 6, fps, config: {damping: 11, stiffness: 120}});
	const gota = spring({frame: frame - fAzucar + 2, fps, config: {damping: 9, stiffness: 140}});
	const destello = interpolate(frame, [fCorrecta, fCorrecta + 5, fCorrecta + 22], [0, 1, 0.3], clamp);
	const acierto = spring({frame: frame - fCorrecta, fps, config: {damping: 12}});
	const tilde = spring({frame: frame - fCorrecta - 2, fps, config: {damping: 9, stiffness: 170}});

	// la abeja: espera en el medio, mira una foto y la otra, y vuela a la correcta
	const vuelo = interpolate(frame, [fElegian - 4, fCorrecta + 2], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
	const inicio: V3 = [0, -0.35, 1.15];
	const destino: V3 = [GOTA[0] + 0.12, GOTA[1] + 0.75, GOTA[2] + 0.35];
	const arco = Math.sin(vuelo * Math.PI) * 0.45;
	const p = mezclar(inicio, destino, vuelo);
	const posAbeja: V3 = [p[0], p[1] + arco + 0.05 * Math.sin(t * 6.5), p[2]];
	const dudando = interpolate(frame, [fMostraron + 6, fElegian - 4], [0, 1], clamp) * (1 - vuelo);
	const miraLados = Math.sin((frame - fMostraron) / 9) * dudando;
	const festejo = interpolate(frame, [fCorrecta, fCorrecta + 8], [0, 1], clamp);

	// cámara
	const sacudon = temblor(t, 0.6);
	const avance = interpolate(frame, [0, fMostraron + 10], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	const final = interpolate(frame, [fElegian, fCorrecta + 10], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
	const base = mezclar(mezclar([0.9, 0.9, 5.2], [0.35, 0.35, 6.9], avance), [-0.25, 0.25, 6.3], final);
	const posicion: V3 = [base[0] + sacudon[0], base[1] + sacudon[1], base[2]];
	const mirarA: V3 = [-0.12 * final, 0.05, 0];

	const pTilde = proyectar([FOTO_A[0], FOTO_A[1] + 0.92, FOTO_A[2] + 0.1], posicion, mirarA, width, height);
	const pAzucar = proyectar([GOTA[0], GOTA[1] + 0.75, GOTA[2]], posicion, mirarA, width, height);
	const etiquetaAzucar = gota * (1 - interpolate(frame, [fElegian, fElegian + 8], [0, 1], clamp));

	return (
		<Escenario3D
			fondo="radial-gradient(circle at 50% 38%, #D8FFF1 0%, #72EFDD 32%, #00A6A6 64%, #073B4C 100%)"
			colorContraluz="#FFF3B0"
			overlay={
				<>
					{etiquetaAzucar > 0.01 ? (
						<div
							style={{
								position: 'absolute',
								left: pAzucar.x,
								top: pAzucar.y,
								transform: `translate(-50%, -100%) scale(${etiquetaAzucar})`,
								transformOrigin: '50% 100%',
								padding: '12px 28px',
								borderRadius: 999,
								background: '#FFB703',
								color: '#5A2A00',
								fontFamily: FUENTE,
								fontWeight: 900,
								fontSize: 44,
								letterSpacing: '0.04em',
								boxShadow: '0 8px 0 rgba(0,0,0,0.2)',
							}}
						>
							AZÚCAR
						</div>
					) : null}
					<Tilde x={pTilde.x} y={pTilde.y} aparicion={tilde} tamano={160} />
				</>
			}
		>
			<Camara posicion={posicion} mirarA={mirarA} />

			{/* mesa */}
			<mesh position={[0, MESA_Y - 0.12, 0.2]}>
				<boxGeometry args={[4.2, 0.24, 2.2]} />
				<meshStandardMaterial color="#F1FAEE" roughness={0.6} />
			</mesh>
			<mesh position={[0, MESA_Y - 0.6, 0.2]}>
				<boxGeometry args={[4.0, 0.8, 2.0]} />
				<meshStandardMaterial color="#A8DADC" roughness={0.7} />
			</mesh>

			{/* fotos en atriles */}
			{[
				{pos: FOTO_A, k: fotoA, variante: 'a' as const, ok: acierto},
				{pos: FOTO_B, k: fotoB, variante: 'b' as const, ok: 0},
			].map(({pos, k, variante, ok}) => (
				<group key={variante} position={pos}>
					<mesh position={[0, (MESA_Y - pos[1]) / 2 - 0.4, -0.08]} scale={[1, Math.max(0.001, k), 1]}>
						<cylinderGeometry args={[0.035, 0.035, pos[1] - MESA_Y - 0.8, 10]} />
						<meshStandardMaterial color="#6C757D" metalness={0.5} roughness={0.35} />
					</mesh>
					<FotoCara variante={variante} scale={0.98 * k} rotation={[0, (1 - k) * 1.2, 0]} acierto={ok} />
				</group>
			))}

			<GotaAzucar t={t} aparicion={gota} destello={destello} position={GOTA} scale={0.85} />
			<Matraz position={[1.12, MESA_Y, 0.55]} t={t} />

			<Abeja
				t={t}
				position={posAbeja}
				rotation={[0.1, -0.5 * vuelo + 0.25 * miraLados + 0.5 * festejo, -0.2 * Math.sin(vuelo * Math.PI)]}
				scale={0.42}
				mirada={[(-0.8 * miraLados) + (-0.6 * vuelo * (1 - festejo)), 0.2 * dudando - 0.3 * vuelo * (1 - festejo)]}
				saludo={festejo}
				parpadeo={interpolate(frame, [30, 33, 36], [0, 1, 0], clamp)}
			/>

			<Destellos t={t} cantidad={36} rango={[6, 6, 3]} centro={[0, 0.6, -1.6]} tamano={0.035} semilla="experimento" colores={['#FFFFFF', '#FFF3B0', '#B9FBC0']} />
		</Escenario3D>
	);
};
