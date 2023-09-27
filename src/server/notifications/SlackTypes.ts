export interface SlackTextContent {
  text: string;
}

interface SlackMessageBlock {
  type: 'section';
  text: {
    type: 'mrkdwn';
    text: string;
  };
}

export interface SlackBlockContent {
  blocks: SlackMessageBlock[];
}

export type SlackMessageData = SlackTextContent | SlackBlockContent;
