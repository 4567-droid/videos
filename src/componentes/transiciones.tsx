import {linearTiming} from '@remotion/transitions';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';
import React from 'react';
import {AbsoluteFill, Easing} from 'remotion';
import {TRANSICION} from '../lib/linea-de-tiempo';

export type TipoTransicion = 'zoom' | 'deslizar' | 'fundido' | 'borrar';

type PropsPresentacion = {tipo: TipoTransicion};

const Presentacion: React.FC<TransitionPresentationComponentProps<PropsPresentacion>> = ({
	children,
	presentationDirection,
	presentationProgress: p,
	passedProps,
}) => {
	const entrando = presentationDirection === 'entering';
	if (passedProps.tipo === 'borrar') {
		// pizarra: un borrador pasa de izquierda a derecha y detrás queda la escena nueva (que se dibuja sola)
		if (!entrando) return <AbsoluteFill>{children}</AbsoluteFill>;
		const x = -12 + 124 * p; // borde del borrado, en % del ancho
		const puntos: string[] = [];
		for (let i = 0; i <= 12; i++) {
			const y = (i / 12) * 100;
			puntos.push(`${(x + 4 * Math.sin(i * 1.9 + p * 9)).toFixed(2)}% ${y}%`);
		}
		const clip = `polygon(0% 0%, ${puntos.join(', ')}, 0% 100%)`;
		const yBorrador = 50 + 30 * Math.sin(p * Math.PI * 5);
		return (
			<AbsoluteFill>
				<AbsoluteFill style={{clipPath: clip}}>{children}</AbsoluteFill>
				<div
					style={{
						position: 'absolute',
						left: `calc(${x}% - 70px)`,
						top: `calc(${yBorrador}% - 120px)`,
						width: 140,
						height: 240,
						transform: `rotate(${8 * Math.sin(p * 20)}deg)`,
						filter: 'drop-shadow(0 10px 14px rgba(0,0,0,0.25))',
					}}
				>
					<div style={{position: 'absolute', inset: '0 0 60px 0', background: '#3A86FF', borderRadius: '22px 22px 8px 8px'}} />
					<div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 64, background: '#4A4E69', borderRadius: '6px 6px 16px 16px'}} />
				</div>
			</AbsoluteFill>
		);
	}
	let style: React.CSSProperties;
	if (passedProps.tipo === 'deslizar') {
		style = entrando
			? {transform: `translateY(${(1 - p) * 30}%) scale(${1.06 - 0.06 * p})`, opacity: Math.min(1, p * 1.8)}
			: {transform: `translateY(${-p * 10}%) scale(${1 - 0.05 * p})`};
	} else if (passedProps.tipo === 'fundido') {
		style = entrando ? {opacity: p} : {};
	} else {
		// zoom: la escena nueva llega desde un acercamiento mientras la vieja se aleja
		style = entrando
			? {transform: `scale(${1.18 - 0.18 * p})`, opacity: p}
			: {transform: `scale(${1 + 0.12 * p})`};
	}
	return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

export const transicion = (tipo: TipoTransicion = 'zoom'): TransitionPresentation<PropsPresentacion> => ({
	component: Presentacion,
	props: {tipo},
});

export const tiempoTransicion = () =>
	linearTiming({durationInFrames: TRANSICION, easing: Easing.inOut(Easing.cubic)});
