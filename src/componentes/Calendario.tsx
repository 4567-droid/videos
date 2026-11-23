import React from 'react';
import {dibujarHojaCalendario, useTexturaCanvas} from './texturas';
import type {V3} from './utilidades3d';

const ANCHO_HOJA = 1.1;
const ALTO_HOJA = 1.25;
const BISAGRA = 0.66; // altura del borde superior de las hojas

const HojaCalendario: React.FC<{dia: number; giro: number; z: number}> = ({dia, giro, z}) => {
	const textura = useTexturaCanvas(`calendario-${dia}`, 512, 580, (ctx) => dibujarHojaCalendario(ctx, dia), true);
	// la hoja aparece recién con su textura (el render espera a la fuente) y se oculta al terminar de pasar
	if (!textura || giro <= -Math.PI * 0.98) return null;
	return (
		<group position={[0, BISAGRA, z]} rotation={[giro, 0, 0]}>
			<mesh position={[0, -ALTO_HOJA / 2, 0]}>
				<boxGeometry args={[ANCHO_HOJA, ALTO_HOJA, 0.008]} />
				<meshStandardMaterial color="#F4F4F6" roughness={0.8} />
			</mesh>
			<mesh position={[0, -ALTO_HOJA / 2, 0.0045]}>
				<planeGeometry args={[ANCHO_HOJA, ALTO_HOJA]} />
				<meshBasicMaterial map={textura} toneMapped={false} />
			</mesh>
		</group>
	);
};

/**
 * Calendario de pared con hojas que se dan vuelta hacia arriba.
 * `avance` = 0 muestra el primer día; 1,5 = a mitad de pasar del 2.º al 3.º, etc.
 */
export const Calendario: React.FC<{dias: number[]; avance: number; position?: V3; rotation?: V3; scale?: number}> = ({
	dias,
	avance,
	position,
	rotation,
	scale = 1,
}) => (
	<group position={position} rotation={rotation} scale={scale}>
		{/* respaldo */}
		<mesh position={[0, -0.02, -0.05]}>
			<boxGeometry args={[1.28, 1.5, 0.08]} />
			<meshStandardMaterial color="#3D405B" roughness={0.6} />
		</mesh>
		{/* anillos */}
		{[-0.32, 0.32].map((x) => (
			<mesh key={x} position={[x, 0.7, 0.02]} rotation={[0, Math.PI / 2, 0]}>
				<torusGeometry args={[0.07, 0.02, 8, 20]} />
				<meshStandardMaterial color="#C9CED6" metalness={0.7} roughness={0.25} />
			</mesh>
		))}
		{dias.map((dia, i) => {
			const k = Math.max(0, Math.min(1, avance - i));
			const suave = k * k * (3 - 2 * k);
			return <HojaCalendario key={dia} dia={dia} giro={-Math.PI * suave} z={0.01 + (dias.length - i) * 0.006} />;
		})}
	</group>
);
