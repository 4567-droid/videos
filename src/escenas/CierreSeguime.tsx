import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camara, temblor} from '../componentes/Camara';
import {Lamparita} from '../componentes/Ciencia';
import {Destellos} from '../componentes/Efectos';
import {Escenario3D} from '../componentes/Escenario3D';
import type {V3} from '../componentes/utilidades3d';
import {FUENTE} from '../lib/fuente';
import {useEscena} from '../lib/escena';

/**
 * Cierre fijo de todos los reels: "Seguime para más datos que no sabías."
 * Lamparita amarilla con un signo de pregunta, brillando, y un botón "Seguir"
 * que una manito toca al final. Props opcionales: `boton` (texto del botón) y `fondo` (degradé CSS).
 */

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Manito (cursor) dibujada en SVG. */
const Manito: React.FC<{x: number; y: number; presion: number; opacidad: number}> = ({x, y, presion, opacidad}) => (
	<svg
		width={120}
		height={150}
		viewBox="0 0 48 60"
		style={{position: 'absolute', left: x, top: y, opacity: opacidad, transform: `scale(${1 - 0.15 * presion})`, filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.35))'}}
	>
		<path
			d="M17 4c2.2 0 4 1.8 4 4v15.5l1.6-.4c2-.5 4 .8 4.4 2.8l.2 1.1 1.3-.3c2-.4 3.9.9 4.3 2.9l.2.9 1.1-.2c2.1-.3 4 1.1 4.3 3.2l1.2 9.7C40.6 52 35.4 57 29.2 57H24c-4 0-7.6-2.2-9.5-5.7L6.7 37c-1-1.9-.4-4.3 1.5-5.3 1.7-.9 3.8-.4 5 1.1L13 34V8c0-2.2 1.8-4 4-4z"
			fill="#FFFFFF"
			stroke="#1B1B2F"
			strokeWidth="2.6"
			strokeLinejoin="round"
		/>
	</svg>
);

export const CierreSeguime: React.FC<{boton?: string; fondo?: string}> = ({
	boton = 'Seguir',
	fondo = 'radial-gradient(circle at 50% 40%, #FFF3B0 0%, #FFB703 30%, #FB8500 58%, #7A2E0E 100%)',
}) => {
	const frame = useCurrentFrame();
	const {fps, width} = useVideoConfig();
	const {momento, duracion} = useEscena();
	const t = frame / fps;

	const fSeguime = momento('seguime');
	const fSabias = momento('sabías', {fin: true});

	const lampara = spring({frame: frame + 6, fps, config: {damping: 11, stiffness: 110}});
	const aparicionBoton = spring({frame: frame - fSeguime - 4, fps, config: {damping: 11, stiffness: 140}});
	// la manito llega y toca el botón
	const llega = spring({frame: frame - fSabias + 6, fps, config: {damping: 14, stiffness: 120}});
	const toque = interpolate(frame, [fSabias + 8, fSabias + 12, fSabias + 18], [0, 1, 0], clamp);
	const despues = interpolate(frame, [fSabias + 12, fSabias + 30], [0, 1], clamp);
	const pulso = 1 + 0.04 * Math.sin(t * 7) * (1 - despues);

	const sacudon = temblor(t, 0.5);
	const k = frame / duracion;
	const posicion: V3 = [0.4 * Math.sin(t * 0.6) + sacudon[0], 0.55 + sacudon[1], 7.2 - 0.5 * k];

	const anchoBoton = 470;
	const xBoton = width / 2 - anchoBoton / 2;
	const yBoton = 1330;

	return (
		<Escenario3D
			fondo={fondo}
			colorContraluz="#FFFFFF"
			overlay={
				<>
					{aparicionBoton > 0.01 ? (
						<div
							style={{
								position: 'absolute',
								left: xBoton,
								top: yBoton,
								width: anchoBoton,
								height: 128,
								borderRadius: 999,
								background: '#EF233C',
								border: '6px solid #FFFFFF',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: 18,
								fontFamily: FUENTE,
								fontWeight: 900,
								fontSize: 64,
								color: '#FFFFFF',
								boxShadow: `0 10px 0 #8D0801, 0 0 ${40 + 60 * despues}px rgba(255,214,10,${0.5 + 0.4 * despues})`,
								transform: `scale(${aparicionBoton * pulso * (1 - 0.08 * toque)}) translateY(${6 * toque}px)`,
							}}
						>
							<span style={{fontSize: 74, lineHeight: 1, marginTop: -6}}>+</span>
							{boton}
						</div>
					) : null}
					{llega > 0.01 ? (
						<Manito x={xBoton + anchoBoton * 0.62 + 260 * (1 - llega)} y={yBoton + 50 + 300 * (1 - llega)} presion={toque} opacidad={Math.min(1, llega * 1.4)} />
					) : null}
				</>
			}
		>
			<Camara posicion={posicion} mirarA={[0, 0.35, 0]} />
			<Lamparita t={t} brillo={0.6 + 0.4 * Math.sin(t * 3) * 0.5 + 0.4 * despues} position={[0, 0.8, 0]} rotation={[0, 0.25 * Math.sin(t * 0.9), 0.05 * Math.sin(t * 1.3)]} scale={0.88 * lampara} />
			<Destellos t={t} cantidad={70} rango={[7, 8, 4]} centro={[0, 0.7, -1.5]} tamano={0.05} semilla="seguime" colores={['#FFFFFF', '#FFF3B0', '#FFD23F']} />
		</Escenario3D>
	);
};
