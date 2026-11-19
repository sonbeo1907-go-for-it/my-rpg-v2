"use client";
import {useEffect} from 'react';
import {useGame} from '../runtime/game-context';
export function useAcademyMusic(group:string){
 const {tournamentAudio}=useGame();
 // The route owns pause/resume. Changing campaign revision must not restart a track.
 useEffect(()=>{tournamentAudio(group);},[group]);
}
