import fetch from 'node-fetch';

import { FetchClient } from 'shared/net';
import { config } from 'server/Config';
import { logger } from 'server/Logger';

import { SlackMessageData } from './SlackTypes';

const log = logger.child({ category: 'slack' });

interface TextBlock {
  text: string;
}

export class SlackNotifier {
  private client?: FetchClient;
  constructor(webhookUrl?: string) {
    this.client = webhookUrl ? new FetchClient(fetch, webhookUrl, log) : undefined;
  }

  async sendNotification(text: string) {
    log.info(`${this.prefix} ${text}`);
    await this.sendData({ text });
  }

  async sendMessage(blocks: TextBlock[]) {
    log.info(`${this.prefix} ${blocks[0]?.text}`);
    await this.sendData({
      blocks: blocks.map(b => ({ type: 'section', text: { type: 'mrkdwn', text: b.text } })),
    });
  }

  private async sendData(data: SlackMessageData) {
    await this.client?.post('', data);
  }

  get prefix() {
    return this.client ? '🔊' : '🔇';
  }
}

export const slackNotifier = new SlackNotifier(config.webhookUrl);
