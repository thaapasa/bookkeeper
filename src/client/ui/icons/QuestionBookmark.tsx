import * as React from 'react';

import { colorScheme } from '../Colors';

export const QuestionBookmark: React.FC<{ size: number; title: string }> = ({ size: height, title }) => {
  const color = colorScheme.secondary.light;
  const questionColor = colorScheme.secondary.dark;
  const width = (height * 14.0) / 18;
  return (
    <svg width={width + 'px'} height={height + 'px'} viewBox="0 0 14 18">
      <title>{title}</title>
      <path d="M14,2 L14,18 L7,15 L0,18 L0.006875,7 L0,7 L0,0 L14,0 L14,2 Z" fill={color} />
      <path
        d="M6.25,12 L7.75,12 L7.75,10.5 L6.25,10.5 L6.25,12 Z M7,3 C5.3425,3 4,4.3425 4,6 L5.5,6 C5.5,5.175 6.175,4.5 7,4.5 C7.825,4.5 8.5,5.175 8.5,6 C8.5,7.5 6.25,7.3125 6.25,9.75 L7.75,9.75 C7.75,8.0625 10,7.875 10,6 C10,4.3425 8.6575,3 7,3 Z"
        fill={questionColor}
      />
    </svg>
  );
};
