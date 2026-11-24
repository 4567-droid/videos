import React, {useEffect, useMemo} from 'react';
import * as THREE from 'three';
import {FUENTE} from '../lib/fuente';
import {Cerebro} from './Cerebro';
import {cajaRedondeada} from './Dormir';
import {Resplandor} from './Efectos';
import {useTexturaCanvas} from './texturas';
import {limitar, type V3} from './utilidades3d';

/**
 * Piezas de la serie "noche": cerebro con cara (ojos, boca), interruptor ON/OFF,
 * cable con pulsos de energía, nube de sueño y megáfono.
 */

const ESFERA = new THREE.SphereGeometry(1, 18, 12);

/** Cerebro con ojos grandes y boca. `abiertos`: 0 cerrados, 1 abiertos, hasta 1.3 bien abiertos. */
export const CerebroConCara: React.FC<{
	t: number;
	brillo?: number;
	abiertos?: number;
	mirar?: [number, number];
	boca?: 'nada' | 'sonrisa' | 'grito';
	abrirBoca?: number;
	position?: V3;
	rotation?: V3;
	scale?: number;
}> = ({t, brillo = 0, abiertos = 1, mirar = [0, 0], boca = 'nada', abrirBoca = 1, position, rotation, scale = 1}) => {
	const ojo = Math.max(0, abiertos);
	const grande = Math.max(0, ojo - 1);
	return (
		<group position={position} rotation={rotation} scale={scale}>
			<Cerebro brillo={brillo} />
			{[-1, 1].map((lado) => (
				<group key={lado} position={[lado * 0.3, 0.04, 0.9]}>
					{ojo < 0.18 ? (
						<mesh position={[0, 0, 0.1]} rotation={[0, 0, Math.PI]}>
							<torusGeometry args={[0.13, 0.032, 6, 16, Math.PI]} />
							<meshBasicMaterial color="#3A0D2E" />
						</mesh>
					) : (
						<>
							<mesh geometry={ESFERA} scale={[0.2 * (1 + 0.15 * grande), 0.2 * Math.min(1, ojo) * (1 + 0.15 * grande), 0.11]}>
								<meshBasicMaterial color="#FFFFFF" />
							</mesh>
							<mesh
								geometry={ESFERA}
								position={[mirar[0] * 0.07, mirar[1] * 0.06 * Math.min(1, ojo), 0.1]}
								scale={[0.095 * (1 - 0.2 * grande), 0.095 * Math.min(1, ojo) * (1 - 0.2 * grande), 0.04]}
							>
								<meshBasicMaterial color="#1B1B2F" />
							</mesh>
							<mesh geometry={ESFERA} position={[mirar[0] * 0.07 + 0.03, mirar[1] * 0.06 + 0.035, 0.13]} scale={0.026 * Math.min(1, ojo)}>
								<meshBasicMaterial color="#FFFFFF" />
							</mesh>
						</>
					)}
				</group>
			))}
			{boca === 'sonrisa' ? (
				<mesh position={[0, -0.24, 0.98]} rotation={[0.2, 0, Math.PI]}>
					<torusGeometry args={[0.15, 0.035, 6, 18, Math.PI]} />
					<meshBasicMaterial color="#6E1F33" />
				</mesh>
			) : boca === 'grito' ? (
				<group position={[0, -0.3, 0.94]}>
					<mesh geometry={ESFERA} scale={[0.17, 0.08 + 0.12 * limitar(abrirBoca), 0.05]}>
						<meshBasicMaterial color="#5A1428" />
					</mesh>
					<mesh geometry={ESFERA} position={[0, -0.05 * limitar(abrirBoca), 0.02]} scale={[0.09, 0.045, 0.04]}>
						<meshBasicMaterial color="#FF7B9C" />
					</mesh>
				</group>
			) : null}
			{/* brillito para que se lea el volumen */}
			<Resplandor color="#FF9EBB" escala={2.6 + 0.4 * Math.sin(t * 2)} opacidad={0.12 + 0.25 * brillo} position={[0, 0, -0.4]} />
		</group>
	);
};

const dibujarTexto = (texto: string) => (ctx: CanvasRenderingContext2D) => {
	ctx.clearRect(0, 0, 256, 128);
	ctx.fillStyle = '#FFFFFF';
	ctx.font = `900 96px ${FUENTE}`;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText(texto, 128, 70);
};

/** Interruptor de palanca con carteles ON / OFF. `estado`: 1 = ON, 0 = OFF. */
export const Interruptor: React.FC<{estado: number; t: number; position?: V3; rotation?: V3; scale?: number}> = ({
	estado,
	t,
	position,
	rotation,
	scale = 1,
}) => {
	const texOn = useTexturaCanvas('texto-on', 256, 128, dibujarTexto('ON'), true);
	const texOff = useTexturaCanvas('texto-off', 256, 128, dibujarTexto('OFF'), true);
	const k = limitar(estado);
	const encendido = k > 0.5;
	const titila = 0.75 + 0.25 * Math.sin(t * 9);
	return (
		<group position={position} rotation={rotation} scale={scale}>
			<mesh geometry={cajaRedondeada(0.86, 1.0, 0.12, 0.05)}>
				<meshStandardMaterial color="#F4F2FF" roughness={0.5} />
			</mesh>
			{/* ranura y palanca */}
			<mesh position={[-0.17, 0, 0.061]}>
				<planeGeometry args={[0.13, 0.56]} />
				<meshBasicMaterial color="#2B2D42" />
			</mesh>
			<group position={[-0.17, 0, 0.06]} rotation={[2.55 + (0.6 - 2.55) * k, 0, 0]}>
				<mesh position={[0, 0.17, 0]}>
					<cylinderGeometry args={[0.045, 0.06, 0.34, 12]} />
					<meshStandardMaterial color="#ADB5BD" metalness={0.6} roughness={0.3} />
				</mesh>
				<mesh geometry={ESFERA} position={[0, 0.36, 0]} scale={0.095}>
					<meshStandardMaterial color="#FFD23F" emissive="#FFB703" emissiveIntensity={0.25} roughness={0.35} />
				</mesh>
			</group>
			{/* carteles: el activo se enciende */}
			{texOn ? (
				<mesh position={[0.2, 0.24, 0.062]}>
					<planeGeometry args={[0.4, 0.2]} />
					<meshBasicMaterial map={texOn} color={encendido ? '#2EE59D' : '#8A8FA8'} transparent toneMapped={false} />
				</mesh>
			) : null}
			{texOff ? (
				<mesh position={[0.2, -0.24, 0.062]}>
					<planeGeometry args={[0.4, 0.2]} />
					<meshBasicMaterial map={texOff} color={encendido ? '#8A8FA8' : '#FF3B5C'} transparent toneMapped={false} />
				</mesh>
			) : null}
			<Resplandor
				color={encendido ? '#2EE59D' : '#FF3B5C'}
				escala={0.8}
				opacidad={(encendido ? 0.55 : 0.6 * titila) * (0.4 + 0.6 * Math.abs(2 * k - 1))}
				position={[0.2, encendido ? 0.24 : -0.24, 0.1]}
			/>
		</group>
	);
};

/** Cable (tubo por varios puntos) con pulsos de energía que viajan cuando `energia` > 0. */
export const Cable: React.FC<{puntos: V3[]; t: number; energia?: number; colorEnergia?: string; radio?: number}> = ({
	puntos,
	t,
	energia = 1,
	colorEnergia = '#2EE59D',
	radio = 0.035,
}) => {
	const clave = JSON.stringify(puntos);
	const {curva, geo} = useMemo(() => {
		const c = new THREE.CatmullRomCurve3(puntos.map((p) => new THREE.Vector3(...p)));
		return {curva: c, geo: new THREE.TubeGeometry(c, 64, radio, 8, false)};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [clave, radio]);
	useEffect(() => () => geo.dispose(), [geo]);
	return (
		<group>
			<mesh geometry={geo}>
				<meshStandardMaterial color="#3B3F63" emissive={colorEnergia} emissiveIntensity={0.35 * energia} roughness={0.5} />
			</mesh>
			{energia > 0.02
				? [0, 1, 2, 3].map((i) => {
						const p = curva.getPointAt((t * 0.7 + i / 4) % 1);
						return (
							<group key={i} position={[p.x, p.y, p.z]}>
								<mesh geometry={ESFERA} scale={radio * 1.9 * energia}>
									<meshBasicMaterial color={colorEnergia} toneMapped={false} />
								</mesh>
								<Resplandor color={colorEnergia} escala={0.35 * energia} opacidad={0.7 * energia} />
							</group>
						);
					})
				: null}
		</group>
	);
};

const BOLAS_NUBE: [number, number, number][] = [
	[0, 0, 0.55],
	[-0.55, -0.1, 0.42],
	[0.56, -0.08, 0.45],
	[-0.26, 0.33, 0.42],
	[0.3, 0.36, 0.4],
	[-0.88, -0.22, 0.3],
	[0.9, -0.2, 0.3],
];

/** Nube de pensamiento/sueño con burbujitas hacia `cola` (dirección) y contenido adelante (children). */
export const NubeSueno: React.FC<{
	aparicion: number;
	cola?: [number, number];
	position?: V3;
	scale?: number;
	children?: React.ReactNode;
}> = ({aparicion, cola = [-1, -1], position, scale = 1, children}) => {
	const a = limitar(aparicion);
	if (a < 0.01) return null;
	const n = Math.hypot(cola[0], cola[1]) || 1;
	const d = [cola[0] / n, cola[1] / n];
	return (
		<group position={position} scale={scale * (0.3 + 0.7 * a)}>
			{BOLAS_NUBE.map(([x, y, r], i) => (
				<mesh key={i} geometry={ESFERA} position={[x, y, -0.05]} scale={[r, r * 0.92, r * 0.3]}>
					<meshStandardMaterial color="#F1ECFF" emissive="#A28BFF" emissiveIntensity={0.3} roughness={0.9} transparent opacity={0.96 * a} />
				</mesh>
			))}
			{[0, 1, 2].map((i) => {
				const dist = 0.95 + i * 0.32;
				const r = 0.15 - i * 0.04;
				return (
					<mesh key={`b${i}`} geometry={ESFERA} position={[d[0] * dist * 1.1, d[1] * dist * 0.9, 0]} scale={[r, r, r * 0.4]}>
						<meshStandardMaterial color="#F1ECFF" emissive="#A28BFF" emissiveIntensity={0.3} roughness={0.9} transparent opacity={0.96 * a} />
					</mesh>
				);
			})}
			<group position={[0, 0, 0.25]}>{children}</group>
		</group>
	);
};

/** Megáfono: la boca abre hacia +Z. */
export const Megafono: React.FC<{brillo?: number; position?: V3; rotation?: V3; scale?: number}> = ({brillo = 0, position, rotation, scale = 1}) => (
	<group position={position} rotation={rotation} scale={scale}>
		<mesh rotation={[-Math.PI / 2, 0, 0]}>
			<cylinderGeometry args={[0.1, 0.38, 0.6, 24, 1, true]} />
			<meshStandardMaterial color="#FF5DA2" emissive="#FF5DA2" emissiveIntensity={0.15} roughness={0.4} side={THREE.DoubleSide} />
		</mesh>
		<mesh position={[0, 0, 0.3]}>
			<torusGeometry args={[0.38, 0.035, 8, 32]} />
			<meshStandardMaterial color="#FFFFFF" roughness={0.4} />
		</mesh>
		<mesh position={[0, 0, -0.38]} rotation={[Math.PI / 2, 0, 0]}>
			<cylinderGeometry args={[0.12, 0.1, 0.18, 16]} />
			<meshStandardMaterial color="#2B2D42" roughness={0.5} />
		</mesh>
		<mesh position={[0, -0.2, -0.14]} rotation={[0.25, 0, 0]}>
			<boxGeometry args={[0.08, 0.3, 0.1]} />
			<meshStandardMaterial color="#2B2D42" roughness={0.5} />
		</mesh>
		{brillo > 0.01 ? <Resplandor color="#FFD23F" escala={1.4 * brillo} opacidad={0.6 * brillo} position={[0, 0, 0.35]} /> : null}
	</group>
);
