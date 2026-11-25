import {TransitionSeries} from '@remotion/transitions';
import React, {Fragment, useMemo} from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {calcularClaves, golpeDeClaves, PalabrasClave} from './componentes/PalabrasClave';
import {Subtitulos} from './componentes/Subtitulos';
import {tiempoTransicion, transicion} from './componentes/transiciones';
import {ESCENAS} from './escenas';
import {EscenaGenerica} from './escenas/EscenaGenerica';
import {EscenaContext} from './lib/escena';
import {calcularLineaDeTiempo} from './lib/linea-de-tiempo';
import {calcularGrupos} from './lib/subtitulos';
import type {VideoJSON, VozJSON} from './lib/tipos';

export type PropsReel = {
	video: VideoJSON;
	voz: VozJSON;
	/** Si se indica, el video contiene solo esa escena (para previsualizar). */
	soloEscena: string | null;
};

/**
 * Un tramo de la voz de una escena (si hay pausas cómicas, la voz se parte en tramos).
 * Fundido muy corto en los bordes para que los cortes, que caen en silencios, no hagan "clic".
 */
const TramoVoz: React.FC<{src: string; recorte: number; velocidad: number; duracion: number; ultimo: boolean; primero: boolean}> = ({
	src,
	recorte,
	velocidad,
	duracion,
	ultimo,
	primero,
}) => {
	const f = useCurrentFrame();
	const salida = Math.min(1, Math.max(0, (duracion - f) / (ultimo ? 5 : 2)));
	const entrada = primero ? 1 : Math.min(1, (f + 1) / 2);
	return <Audio src={src} trimBefore={recorte > 0 ? recorte : undefined} playbackRate={velocidad} volume={salida * entrada} />;
};

export const filtrarVideo = (video: VideoJSON, soloEscena: string | null): VideoJSON =>
	soloEscena ? {...video, escenas: video.escenas.filter((e) => e.id === soloEscena)} : video;

export const Reel: React.FC<PropsReel> = ({video, voz, soloEscena}) => {
	const {fps} = useVideoConfig();
	const linea = useMemo(
		() => calcularLineaDeTiempo(filtrarVideo(video, soloEscena), voz, fps),
		[video, voz, soloEscena, fps],
	);
	const grupos = useMemo(() => calcularGrupos(linea), [linea]);
	const claves = useMemo(() => calcularClaves(linea), [linea]);
	const pizarra = video.estilo === 'pizarra';
	const frame = useCurrentFrame();
	// cada palabra clave da un pequeño "golpe" de zoom a toda la imagen (no a los subtítulos)
	const golpe = claves.length > 0 ? golpeDeClaves(claves, frame) : 0;

	return (
		<AbsoluteFill style={{backgroundColor: pizarra ? '#FBFBF7' : '#0b0614'}}>
			<AbsoluteFill style={golpe > 0 ? {transform: `scale(${1 + 0.035 * golpe})`} : undefined}>
			<TransitionSeries>
				{linea.escenas.map((escena, i) => {
					const Componente = ESCENAS[escena.componente] ?? EscenaGenerica;
					return (
						<Fragment key={escena.id}>
							{i > 0 ? (
								<TransitionSeries.Transition
									presentation={transicion(escena.transicion)}
									timing={tiempoTransicion(escena.transicion, escena.duracionTransicion)}
								/>
							) : null}
							<TransitionSeries.Sequence durationInFrames={escena.duracion} name={`${escena.id} (${escena.componente})`}>
								<EscenaContext.Provider value={escena}>
									<Componente {...escena.props} />
								</EscenaContext.Provider>
							</TransitionSeries.Sequence>
						</Fragment>
					);
				})}
			</TransitionSeries>
			</AbsoluteFill>

			{/* oscurece apenas la parte de arriba para que los subtítulos se lean siempre (no en la pizarra: van abajo) */}
			{pizarra ? null : (
				<AbsoluteFill
				style={{
					background:
						'linear-gradient(180deg, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.16) 22%, rgba(0,0,0,0) 36%)',
					}}
				/>
			)}
			{claves.length > 0 ? <PalabrasClave claves={claves} /> : null}
			<Subtitulos grupos={grupos} posicion={pizarra ? 'abajo' : 'arriba'} />

			{linea.escenas.flatMap((escena) =>
				(escena.audio?.tramos ?? []).map((tramo, k, tramos) => (
					<Sequence
						key={`voz-${escena.id}-${k}`}
						from={escena.inicio + tramo.desde}
						durationInFrames={tramo.duracion}
						name={`voz ${escena.id}${tramos.length > 1 ? ` (${k + 1}/${tramos.length})` : ''}`}
						layout="none"
					>
						<TramoVoz
							src={staticFile(escena.audio!.src)}
							recorte={tramo.recorte}
							velocidad={escena.audio!.velocidad}
							duracion={tramo.duracion}
							primero={k === 0}
							ultimo={k === tramos.length - 1}
						/>
					</Sequence>
				)),
			)}
		</AbsoluteFill>
	);
};
