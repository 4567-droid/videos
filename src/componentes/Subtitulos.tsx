import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {AMARILLO} from '../lib/colores';
import {FUENTE} from '../lib/fuente';
import type {GrupoSubtitulo} from '../lib/subtitulos';

/** Contorno negro hecho con sombras en círculo + sombra proyectada. */
const contorno = (radio: number, pasos = 16) =>
	new Array(pasos)
		.fill(0)
		.map((_, i) => {
			const a = (i / pasos) * Math.PI * 2;
			return `${(Math.cos(a) * radio).toFixed(1)}px ${(Math.sin(a) * radio).toFixed(1)}px 0 #000`;
		})
		.join(', ');

const SOMBRA = `${contorno(6)}, 0 11px 0 #000, 0 16px 34px rgba(0,0,0,0.65)`;

export const ESTILO_SUBTITULOS = {
	top: 250,
	tamano: 106,
	ancho: 960,
	/**
	 * "grupo": se ven las 3 palabras y la que se está diciendo se pinta de amarillo.
	 * "revelar": cada palabra aparece recién cuando se dice.
	 */
	modo: 'grupo' as 'grupo' | 'revelar',
};

/**
 * Subtítulos de 3 palabras por vez, palabra por palabra.
 * La palabra que se está diciendo va en amarillo.
 */
export const Subtitulos: React.FC<{grupos: GrupoSubtitulo[]}> = ({grupos}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const grupo = grupos.find((g) => frame >= g.inicio && frame < g.fin);
	if (!grupo) return null;

	let activa = -1;
	grupo.palabras.forEach((p, i) => {
		if (frame >= p.inicio) activa = i;
	});

	return (
		<AbsoluteFill style={{alignItems: 'center', paddingTop: ESTILO_SUBTITULOS.top, pointerEvents: 'none'}}>
			<div
				style={{
					width: ESTILO_SUBTITULOS.ancho,
					display: 'flex',
					flexWrap: 'wrap',
					justifyContent: 'center',
					alignItems: 'baseline',
					columnGap: 38,
					rowGap: 4,
				}}
			>
				{grupo.palabras.map((p, i) => {
					const dicha = frame >= p.inicio;
					const esActiva = i === activa;
					const revelar = ESTILO_SUBTITULOS.modo === 'revelar';
					// entrada del grupo completo (o de cada palabra en modo "revelar")
					const entrada = spring({
						frame: frame - (revelar ? p.inicio : grupo.inicio),
						fps,
						config: {damping: 13, stiffness: 260, mass: 0.55},
					});
					// "golpecito" cuando la palabra pasa a ser la activa
					const golpe = esActiva
						? spring({frame: frame - p.inicio, fps, config: {damping: 9, stiffness: 320, mass: 0.45}})
						: 0;
					const visible = revelar ? dicha : true;
					const escala = interpolate(entrada, [0, 1], [0.6, 1]) * (1 + 0.07 * golpe);
					return (
						<span
							key={`${grupo.inicio}-${i}`}
							style={{
								display: 'inline-block',
								fontFamily: FUENTE,
								fontWeight: 900,
								fontSize: ESTILO_SUBTITULOS.tamano,
								lineHeight: 1.08,
								letterSpacing: '-0.02em',
								textTransform: 'uppercase',
								color: esActiva ? AMARILLO : '#FFFFFF',
								textShadow: SOMBRA,
								opacity: visible ? Math.min(1, entrada * 1.6) : 0,
								transform: `translateY(${(1 - entrada) * 26}px) scale(${escala})`,
								whiteSpace: 'nowrap',
							}}
						>
							{p.texto}
						</span>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};
