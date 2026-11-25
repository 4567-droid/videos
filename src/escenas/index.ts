import type React from 'react';
import {AbejaEnojada} from './AbejaEnojada';
import {AbejaGancho} from './AbejaGancho';
import {BombaSangre} from './BombaSangre';
import {CaraEnFlor} from './CaraEnFlor';
import {CerebrosComparados} from './CerebrosComparados';
import {CierreSeguime} from './CierreSeguime';
import {BalanzaAbstinencia} from './BalanzaAbstinencia';
import {Chispazo} from './Chispazo';
import {CulpaTachada} from './CulpaTachada';
import {DopaminaGanas} from './DopaminaGanas';
import {DosCerebros} from './DosCerebros';
import {GraficoSubida} from './GraficoSubida';
import {LlavesPerdidas} from './LlavesPerdidas';
import {Linea141} from './Linea141';
import {LuzApagada} from './LuzApagada';
import {OlaCalendario} from './OlaCalendario';
import {PizarraSeguime} from './PizarraSeguime';
import {PreguntaPalito} from './PreguntaPalito';
import {SenalesCircuito} from './SenalesCircuito';
import {TresCaminos} from './TresCaminos';
import {TropiezoCamino} from './TropiezoCamino';
import {AmanecerCalma} from './AmanecerCalma';
import {CalendarioApego} from './CalendarioApego';
import {CerebroEscaner} from './CerebroEscaner';
import {EscribileNo} from './EscribileNo';
import {FotoRecompensa} from './FotoRecompensa';
import {FrascoVacio} from './FrascoVacio';
import {GloboSoltar} from './GloboSoltar';
import {PedidosHabituales} from './PedidosHabituales';
import {VentanaNoche} from './VentanaNoche';
import {CerebroDespierto} from './CerebroDespierto';
import {CerebroInterruptor} from './CerebroInterruptor';
import {CincoMinutitos} from './CincoMinutitos';
import {DespertarRigido} from './DespertarRigido';
import {HabitacionSombras} from './HabitacionSombras';
import {MultitudIluminada} from './MultitudIluminada';
import {RelojRespira} from './RelojRespira';
import {SombraAbrigo} from './SombraAbrigo';
import {CorazonLatiendo} from './CorazonLatiendo';
import {CorredorPulso} from './CorredorPulso';
import {EclipseLuz} from './EclipseLuz';
import {EinsteinPizarron} from './EinsteinPizarron';
import {ExperimentoCaras} from './ExperimentoCaras';
import {GrillaGravedad} from './GrillaGravedad';
import {JardinConOjos} from './JardinConOjos';
import {LlegarTarde} from './LlegarTarde';
import {MemoriaDias} from './MemoriaDias';
import {NaveRelojes} from './NaveRelojes';
import {PreguntaGigante} from './PreguntaGigante';
import {RelojLoco} from './RelojLoco';
import {SateliteGPS} from './SateliteGPS';
import {VidaEntera} from './VidaEntera';
import {MaratonCama} from './MaratonCama';
import {SolLunaEspaldas} from './SolLunaEspaldas';
import {SuprarrenalesDespertador} from './SuprarrenalesDespertador';
import {MontanaRusaCortisol} from './MontanaRusaCortisol';
import {PerroMailJefe} from './PerroMailJefe';
import {CortisolSirena} from './CortisolSirena';
import {MelatoninaMegafono} from './MelatoninaMegafono';
import {PantallaMelatonina} from './PantallaMelatonina';
import {RelojMareado} from './RelojMareado';
import {HabitosCulpable} from './HabitosCulpable';
import {RelojSuizoCelular} from './RelojSuizoCelular';
import {AbrazoReloj} from './AbrazoReloj';
import {CajaTiembla} from './CajaTiembla';
import {RendijaVioleta} from './RendijaVioleta';
import {SchrodingerPizarron} from './SchrodingerPizarron';
import {RelojMoneda} from './RelojMoneda';
import {BolitaDoble} from './BolitaDoble';
import {HiloGatos} from './HiloGatos';
import {CientificoEnSerio} from './CientificoEnSerio';
import {LluviaChispas} from './LluviaChispas';
import {MoleculaFrontera} from './MoleculaFrontera';
import {GatoPlato} from './GatoPlato';
import {LupaFrase} from './LupaFrase';

/**
 * Registro de escenas: el campo "componente" de data/video.json
 * tiene que coincidir con una clave de este objeto.
 * Si no existe, se usa EscenaGenerica (formas flotando) como reemplazo.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ESCENAS: Record<string, React.FC<any>> = {
	// reel: el corazón late 100 mil veces por día
	CorazonLatiendo,
	CorredorPulso,
	BombaSangre,
	VidaEntera,
	// reel: las abejas reconocen caras humanas
	AbejaGancho,
	CerebrosComparados,
	ExperimentoCaras,
	MemoriaDias,
	CaraEnFlor,
	JardinConOjos,
	AbejaEnojada,
	// reel: la teoría de la relatividad
	RelojLoco,
	EinsteinPizarron,
	NaveRelojes,
	GrillaGravedad,
	EclipseLuz,
	SateliteGPS,
	LlegarTarde,
	PreguntaGigante,
	// reel: la parálisis del sueño
	DespertarRigido,
	MultitudIluminada,
	CerebroInterruptor,
	CerebroDespierto,
	HabitacionSombras,
	RelojRespira,
	CincoMinutitos,
	SombraAbrigo,
	// reel: por qué cuesta tanto dejar un amor
	VentanaNoche,
	CerebroEscaner,
	FotoRecompensa,
	FrascoVacio,
	PedidosHabituales,
	CalendarioApego,
	GloboSoltar,
	EscribileNo,
	AmanecerCalma,
	// reel (pizarra): la dopamina y por qué cuesta dejar una droga
	PreguntaPalito,
	DopaminaGanas,
	TresCaminos,
	GraficoSubida,
	LuzApagada,
	SenalesCircuito,
	BalanzaAbstinencia,
	OlaCalendario,
	DosCerebros,
	Chispazo,
	CulpaTachada,
	LlavesPerdidas,
	TropiezoCamino,
	Linea141,
	PizarraSeguime,
	// reel (pizarra): cortisol y melatonina, el equipo que maneja tu reloj
	MaratonCama,
	SolLunaEspaldas,
	SuprarrenalesDespertador,
	MontanaRusaCortisol,
	PerroMailJefe,
	CortisolSirena,
	MelatoninaMegafono,
	PantallaMelatonina,
	RelojMareado,
	HabitosCulpable,
	RelojSuizoCelular,
	AbrazoReloj,
	// reel: el gato de Schrödinger (misterio 3D)
	CajaTiembla,
	RendijaVioleta,
	SchrodingerPizarron,
	RelojMoneda,
	BolitaDoble,
	HiloGatos,
	CientificoEnSerio,
	LluviaChispas,
	MoleculaFrontera,
	GatoPlato,
	LupaFrase,
	// cierre fijo de todos los reels ("Seguime para más datos que no sabías.")
	CierreSeguime,
};
