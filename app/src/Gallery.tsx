import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Character} from './characters';
const kinds = ['host','hacker','banker','investor','trader'];
const moods = ['happy','explaining','shocked','worried','thinking','angry'];
export const Gallery: React.FC = () => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{background:'#070b18', display:'grid', gridTemplateColumns:'repeat(6,1fr)', padding:10}}>
    {kinds.map(k => moods.map(m => <div key={k+m} style={{display:'flex',justifyContent:'center'}}><Character c={{kind:k,mood:m}} f={f} talking={m==='explaining'} height={200}/></div>))}
  </AbsoluteFill>;
};
