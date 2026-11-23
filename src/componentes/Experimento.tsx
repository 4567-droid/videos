import React from 'react';
import * as THREE from 'three';
import {Resplandor} from './Efectos';
import {dibujarRetrato, useTexturaCanvas} from './texturas';
import type {V3} from './utilidades3d';

/** "Foto" tipo polaroid con un retrato dibujado por código. */
export const FotoCara: React.FC<{
	variante: 'a' | 'b';
	/** 0..1: marco verde brillante (respuesta correcta) */
	acierto?: number;
	position?: V3;
	rotation?: V3;
	scale?: number;
}> = ({variante, acierto = 0, position, rotation, scale = 1}) => {
	const retrato = useTexturaCanvas(`retrato-${variante}`, 512, 640, (ctx) => dibujarRetrato(ctx, variante));
	return (
		<group position={position} rotation={rotation} scale={scale}>
			{acierto > 0.01 ? (
				<mesh position={[0, 0, -0.04]} scale={[1 + 0.06 * acierto, 1 + 0.05 * acierto, 1]}>
					<planeGeometry args={[1.34, 1.74]} />
					<meshBasicMaterial color="#3DDC97" transparent opacity={0.95 * acierto} toneMapped={false} />
				</mesh>
			) : null}
			<mesh>
				<boxGeometry args={[1.2, 1.6, 0.05]} />
				<meshStandardMaterial color="#FFFFFF" roughness={0.55} />
			</mesh>
			{retrato ? (
				<mesh position={[0, 0.075, 0.027]}>
					<planeGeometry args={[1.0, 1.25]} />
					<meshBasicMaterial map={retrato} toneMapped={false} />
				</mesh>
			) : null}
		</group>
	);
};

let geoGota: THREE.LatheGeometry | null = null;
const obtenerGota = () => {
	if (geoGota) return geoGota;
	const puntos: THREE.Vector2[] = [];
	for (let i = 0; i <= 40; i++) {
		const th = Math.PI - (i / 40) * Math.PI; // de abajo hacia la punta
		const r = 0.55 * Math.sin(th) * Math.pow((1 - Math.cos(th)) / 2, 0.85);
		puntos.push(new THREE.Vector2(Math.max(0, r), 0.55 * Math.cos(th)));
	}
	geoGota = new THREE.LatheGeometry(puntos, 48);
	return geoGota;
};

/** Gota de agua con azúcar, dorada y brillante, sobre un platito. */
export const GotaAzucar: React.FC<{
	t: number;
	/** 0..1 aparición */
	aparicion?: number;
	/** 0..1 brillo extra (destello) */
	destello?: number;
	position?: V3;
	scale?: number;
}> = ({t, aparicion = 1, destello = 0, position, scale = 1}) => {
	const k = Math.max(0, aparicion);
	const pulso = 0.5 + 0.5 * Math.sin(t * 5);
	return (
		<group position={position} scale={scale}>
			<mesh position={[0, -0.02, 0]}>
				<cylinderGeometry args={[0.5, 0.42, 0.08, 40]} />
				<meshStandardMaterial color="#E8F7FF" roughness={0.25} />
			</mesh>
			<group scale={k} position={[0, 0.3, 0]}>
				<mesh geometry={obtenerGota()} scale={0.55}>
					<meshStandardMaterial
						color="#FFB703"
						emissive="#FF8F00"
						emissiveIntensity={0.45 + 0.35 * pulso + destello}
						roughness={0.12}
						transparent
						opacity={0.93}
					/>
				</mesh>
				<mesh position={[-0.07, 0.02, 0.17]} scale={[0.035, 0.07, 0.02]}>
					<sphereGeometry args={[1, 12, 8]} />
					<meshBasicMaterial color="#FFFFFF" toneMapped={false} />
				</mesh>
				<Resplandor color="#FFD166" escala={1.4 + 0.5 * pulso + 1.5 * destello} opacidad={0.55 + 0.3 * destello} position={[0, 0, -0.1]} />
				{[0, 1, 2, 3].map((i) => {
					const a = t * 1.6 + (i * Math.PI) / 2;
					const s = 0.06 + 0.05 * Math.max(0, Math.sin(t * 6 + i * 1.7));
					return (
						<group key={i} position={[Math.cos(a) * 0.42, 0.05 + Math.sin(a) * 0.32, 0.15]} scale={s * (1 + destello)}>
							<mesh>
								<boxGeometry args={[1, 0.18, 0.05]} />
								<meshBasicMaterial color="#FFF3B0" toneMapped={false} />
							</mesh>
							<mesh>
								<boxGeometry args={[0.18, 1, 0.05]} />
								<meshBasicMaterial color="#FFF3B0" toneMapped={false} />
							</mesh>
						</group>
					);
				})}
			</group>
		</group>
	);
};

/** Tilde verde (HTML/SVG) que aparece sobre la respuesta correcta. */
export const Tilde: React.FC<{x: number; y: number; aparicion: number; tamano?: number}> = ({x, y, aparicion, tamano = 150}) =>
	aparicion > 0.01 ? (
		<div
			style={{
				position: 'absolute',
				left: x - tamano / 2,
				top: y - tamano / 2,
				width: tamano,
				height: tamano,
				transform: `scale(${aparicion})`,
				opacity: Math.min(1, aparicion * 1.5),
				filter: 'drop-shadow(0 8px 0 rgba(0,0,0,0.25)) drop-shadow(0 10px 22px rgba(0,0,0,0.3))',
			}}
		>
			<svg viewBox="0 0 100 100" width={tamano} height={tamano}>
				<circle cx="50" cy="50" r="45" fill="#22C55E" stroke="#FFFFFF" strokeWidth="7" />
				<path d="M28 52 L44 67 L73 36" fill="none" stroke="#FFFFFF" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
			</svg>
		</div>
	) : null;
