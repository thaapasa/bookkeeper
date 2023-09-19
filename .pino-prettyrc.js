const { colorizerFactory } = require('pino-pretty');
const colorizer = colorizerFactory(true);

module.exports = {
  colorize: true,
  ignore: 'timeMs,traceId,hostname',
  messageFormat: (log, _messageKey, _levelLabel) => {
    const parts = []
    if (log.traceId) {
      parts.push(colorizer.greyMessage(`[${log.traceId}]`))
    }
    parts.push(log.msg)
    if (log.timeMs) {
      parts.push(colorizer.greyMessage(`(+${log.timeMs}ms)`))
    }
    return parts.join(" ")
  },
  customPrettifiers: {
  }
}
