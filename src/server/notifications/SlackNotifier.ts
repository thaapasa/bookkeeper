import fetch from 'node-fetch';

import { FetchClient } from 'shared/net';
import { config } from 'server/Config';
import { logger } from 'server/Logger';

const log = logger.child({ category: 'slack' });

export class SlackNotifier {
  private client?: FetchClient;
  constructor(webhookUrl?: string) {
    this.client = webhookUrl ? new FetchClient(fetch, webhookUrl, log) : undefined;
  }

  async sendNotification(text: string) {
    log.info(`${this.prefix} ${text}`);
    await this.client?.post('', { text });
  }

  get prefix() {
    return this.client ? '🔊' : '🔇';
  }
}

export const slackNotifier = new SlackNotifier(config.webhookUrl);
