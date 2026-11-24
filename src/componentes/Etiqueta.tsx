import React from 'react';
import {FUENTE} from '../lib/fuente';

/**
 * Etiqueta tipo "pastilla" en HTML, ubicada en píxeles (usar proyectar() para anclarla a un objeto 3D).
 * `anclaje` "arriba": la pastilla queda arriba del punto; "centro": centrada en el punto.
 */
export const Etiqueta: React.FC<{
	x: number;
	y: number;
	texto: string;
	aparicion: number;
	fondo?: string;
	color?: string;
	tamano?: number;
	anclaje?: 'arriba' | 'centro';
}> = ({x, y, texto, aparicion, fondo = '#FFFFFF', color = '#2B2D42', tamano = 46, anclaje = 'arriba'}) =>
	aparicion > 0.01 ? (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				transform: `translate(-50%, ${anclaje === 'arriba' ? '-100%' : '-50%'}) scale(${aparicion})`,
				transformOrigin: anclaje === 'arriba' ? '50% 100%' : '50% 50%',
				opacity: Math.min(1, aparicion * 1.5),
				padding: `${Math.round(tamano * 0.28)}px ${Math.round(tamano * 0.62)}px`,
				borderRadius: 999,
				background: fondo,
				color,
				fontFamily: FUENTE,
				fontWeight: 900,
				fontSize: tamano,
				letterSpacing: '0.02em',
				whiteSpace: 'nowrap',
				boxShadow: '0 8px 0 rgba(0,0,0,0.22), 0 12px 30px rgba(0,0,0,0.25)',
			}}
		>
			{texto}
		</div>
	) : null;
