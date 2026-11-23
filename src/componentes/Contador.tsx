import React from 'react';
import {FUENTE} from '../lib/fuente';

/** 100000 -> "100.000" */
export const formatearNumero = (n: number) =>
	Math.round(n)
		.toString()
		.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

type Props = {
	valor: number;
	etiqueta?: string;
	color?: string;
	/** 0..1 para animar la entrada */
	aparicion?: number;
	/** 0..1, "golpe" de escala al llegar al valor final */
	pop?: number;
	/** posición vertical en px (desde arriba) */
	top?: number;
	prefijo?: string;
	sufijo?: string;
	/** texto libre en lugar del número */
	texto?: string;
	/** desplazamiento horizontal en px (0 = centrado) */
	desplazamientoX?: number;
};

/** Número grande en pantalla (HTML sobre el 3D) con etiqueta. */
export const Contador: React.FC<Props> = ({
	valor,
	etiqueta,
	color = '#FF2E63',
	aparicion = 1,
	pop = 0,
	top = 1340,
	prefijo = '',
	sufijo = '',
	texto,
	desplazamientoX = 0,
}) => {
	const contenido = texto ?? `${prefijo}${formatearNumero(valor)}${sufijo}`;
	const tamano = Math.min(176, Math.floor(1480 / Math.max(contenido.length, 1)));
	const golpe = 1 + 0.09 * Math.sin(Math.PI * Math.min(1, Math.max(0, pop)));
	const escala = (0.82 + 0.18 * aparicion) * golpe;
	if (aparicion <= 0.001) return null;
	return (
		<div
			style={{
				position: 'absolute',
				top,
				left: 0,
				right: 0,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				opacity: Math.min(1, aparicion * 1.4),
				transform: `translate(${desplazamientoX}px, ${(1 - aparicion) * 50}px) scale(${escala})`,
			}}
		>
			<div
				style={{
					fontFamily: FUENTE,
					fontWeight: 900,
					fontSize: tamano,
					lineHeight: 1,
					color: '#FFFFFF',
					letterSpacing: '-0.03em',
					fontVariantNumeric: 'tabular-nums',
					textShadow: `0 0 34px ${color}, 0 0 12px ${color}, 0 8px 0 rgba(0,0,0,0.45)`,
					whiteSpace: 'nowrap',
				}}
			>
				{contenido}
			</div>
			{etiqueta ? (
				<div
					style={{
						marginTop: 18,
						padding: '12px 30px',
						borderRadius: 999,
						background: color,
						color: '#FFFFFF',
						fontFamily: FUENTE,
						fontWeight: 900,
						fontSize: 42,
						letterSpacing: '0.06em',
						textTransform: 'uppercase',
						boxShadow: '0 8px 0 rgba(0,0,0,0.3), 0 12px 30px rgba(0,0,0,0.35)',
						textShadow: '0 3px 0 rgba(0,0,0,0.25)',
						whiteSpace: 'nowrap',
					}}
				>
					{etiqueta}
				</div>
			) : null}
		</div>
	);
};
