import styled from '@emotion/styled';
import * as React from 'react';

import { MaybePromise } from 'shared/util';

import { ActionButton } from '../component/ActionButton';
import { Text } from '../design/Text';

export const ToolButton: React.FC<{
  title: string;
  action: () => MaybePromise<any>;
  buttonText: string;
}> = ({ title, action, buttonText }) => (
  <>
    <LabelCell>
      <Text>{title}</Text>
    </LabelCell>
    <div>
      <ActionButton onClick={action} variant="contained" color="primary">
        {buttonText}
      </ActionButton>
    </div>
  </>
);

const LabelCell = styled.div`
  display: flex;
  align-items: center;
`;
