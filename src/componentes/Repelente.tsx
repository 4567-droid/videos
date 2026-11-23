import React from 'react';
import {dibujarEtiquetaRepelente, useTexturaCanvas} from './texturas';
import type {V3} from './utilidades3d';

/**
 * Lata de repelente (aerosol). Por defecto está parada (eje Y); para tirarla en el
 * piso con la etiqueta legible usar rotation={[0, 0, -Math.PI / 2]} (tapa hacia +X).
 */
export const Repelente: React.FC<{
	t: number;
	/** 0..1 nubecita saliendo del pico */
	nube?: number;
	position?: V3;
	rotation?: V3;
	scale?: number;
}> = ({t, nube = 0, position, rotation, scale = 1}) => {
	const etiqueta = useTexturaCanvas('etiqueta-repelente', 1024, 512, dibujarEtiquetaRepelente, true);
	return (
		<group position={position} rotation={rotation} scale={scale}>
			{etiqueta ? (
				<mesh>
					{/* thetaStart = π: el centro de la etiqueta queda mirando a +Z */}
					<cylinderGeometry args={[0.28, 0.28, 0.9, 48, 1, true, Math.PI, Math.PI * 2]} />
					<meshStandardMaterial map={etiqueta} roughness={0.35} metalness={0.05} />
				</mesh>
			) : null}
			<mesh position={[0, -0.45, 0]} rotation={[Math.PI / 2, 0, 0]}>
				<circleGeometry args={[0.28, 40]} />
				<meshStandardMaterial color="#B8C0CC" metalness={0.6} roughness={0.3} />
			</mesh>
			<mesh position={[0, 0.45, 0]}>
				<sphereGeometry args={[0.28, 40, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
				<meshStandardMaterial color="#C9D1DB" metalness={0.65} roughness={0.28} />
			</mesh>
			<mesh position={[0, 0.76, 0]}>
				<cylinderGeometry args={[0.11, 0.13, 0.16, 24]} />
				<meshStandardMaterial color="#FFFFFF" roughness={0.4} />
			</mesh>
			<mesh position={[0.07, 0.8, 0]}>
				<boxGeometry args={[0.1, 0.05, 0.05]} />
				<meshStandardMaterial color="#EF233C" roughness={0.4} />
			</mesh>
			{/* nubecita de spray */}
			{nube > 0.01
				? [0, 1, 2].map((i) => {
						const k = (t * 0.9 + i / 3) % 1;
						return (
							<mesh key={i} position={[0.05 - k * 0.3, 0.9 + k * 0.6, 0]} scale={(0.08 + k * 0.22) * nube}>
								<sphereGeometry args={[1, 14, 10]} />
								<meshStandardMaterial color="#FFFFFF" transparent opacity={(1 - k) * 0.55 * nube} roughness={1} depthWrite={false} />
							</mesh>
						);
					})
				: null}
		</group>
	);
};
