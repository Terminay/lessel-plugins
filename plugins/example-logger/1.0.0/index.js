// ============================================================================
// lessel Example Plugin — Logger
// Logs all matched messages with a custom prefix.
// ============================================================================

module.exports = {
  name: 'example-logger',
  schema: '*',
  async execute(event, context) {
    context.log('info', `[example-logger] Message received on ${event.platform}`, {
      schema: event.schemaName,
      content: event.payload.content || '(no content)',
      author: event.payload.author || 'unknown',
      channel: event.payload.channel || 'unknown',
    });
  },
  async onStart(context) {
    context.log('info', '[example-logger] Plugin started!');
  },
};