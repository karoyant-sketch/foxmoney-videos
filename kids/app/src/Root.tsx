import React from 'react';
import {Composition} from 'remotion';
import data from './data.json';
import {Story} from './Story';
import {Thumbnail} from './Thumbnail';

export const Root: React.FC = () => (
  <>
    <Composition id="Story" component={Story} durationInFrames={(data as any).total} fps={30} width={1920} height={1080} />
    <Composition id="Thumbnail" component={Thumbnail} durationInFrames={1} fps={30} width={1280} height={720} />
  </>
);
