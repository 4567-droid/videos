import {linearTiming} from '@remotion/transitions';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';
import React from 'react';
import {AbsoluteFill, Easing} from 'remotion';
import {TRANSICION} from '../lib/linea-de-tiempo';

export type TipoTransicion = 'zoom' | 'deslizar' | 'fundido';

type PropsPresentacion = {tipo: TipoTransicion};

const Presentacion: React.FC<TransitionPresentationComponentProps<PropsPresentacion>> = ({
	children,
	presentationDirection,
	presentationProgress: p,
	passedProps,
}) => {
	const entrando = presentationDirection === 'entering';
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
