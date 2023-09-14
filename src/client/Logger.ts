import pino from 'pino';

export const logger = pino({
  browser: {
    asObject: true,
    write: (o: any) => {
      if (typeof o !== 'object' || !o) {
        return;
      }
      const { msg, ...rest } = o;
      // eslint-disable-next-line no-console
      console.log(msg, rest);
    },
  },
});
