import {TransitionSeries} from '@remotion/transitions';
import React, {Fragment, useMemo} from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig} from 'remotion';
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

export const filtrarVideo = (video: VideoJSON, soloEscena: string | null): VideoJSON =>
	soloEscena ? {...video, escenas: video.escenas.filter((e) => e.id === soloEscena)} : video;

export const Reel: React.FC<PropsReel> = ({video, voz, soloEscena}) => {
	const {fps} = useVideoConfig();
	const linea = useMemo(
		() => calcularLineaDeTiempo(filtrarVideo(video, soloEscena), voz, fps),
		[video, voz, soloEscena, fps],
	);
	const grupos = useMemo(() => calcularGrupos(linea), [linea]);

	return (
		<AbsoluteFill style={{backgroundColor: '#0b0614'}}>
			<TransitionSeries>
				{linea.escenas.map((escena, i) => {
					const Componente = ESCENAS[escena.componente] ?? EscenaGenerica;
					return (
						<Fragment key={escena.id}>
							{i > 0 ? (
								<TransitionSeries.Transition presentation={transicion(escena.transicion)} timing={tiempoTransicion()} />
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

			{/* oscurece apenas la parte de arriba para que los subtítulos se lean siempre */}
			<AbsoluteFill
				style={{
					background:
						'linear-gradient(180deg, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.16) 22%, rgba(0,0,0,0) 36%)',
				}}
			/>
			<Subtitulos grupos={grupos} />

			{linea.escenas.map((escena) =>
				escena.audio ? (
					<Sequence
						key={`voz-${escena.id}`}
						from={escena.inicio + escena.audio.desde}
						durationInFrames={escena.audio.duracion}
						name={`voz ${escena.id}`}
						layout="none"
					>
						<Audio
							src={staticFile(escena.audio.src)}
							playbackRate={escena.audio.velocidad}
							// fundido corto al final para cortar sin "clic"
							volume={(f) => Math.min(1, Math.max(0, (escena.audio!.duracion - f) / 5))}
						/>
					</Sequence>
				) : null,
			)}
		</AbsoluteFill>
	);
};
