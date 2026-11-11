import React from 'react';
import {Composition} from 'remotion';
import {Main} from './Main';
import data from './data.json';
import {Gallery} from './Gallery';
import {Thumbnail} from './Thumbnail';

export const Root: React.FC = () => (
  <>
  <Composition id="Main" component={Main} durationInFrames={data.total} fps={30} width={1920} height={1080} />
  <Composition id="Gallery" component={Gallery} durationInFrames={60} fps={30} width={1920} height={1080} />
  <Composition id="Thumbnail" component={Thumbnail} durationInFrames={1} fps={30} width={1280} height={720} />
  </>
);
