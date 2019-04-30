const Parser = require('rss-parser');

const parser = new Parser({
  customFields: {
    feed: [
      ['itunes:category', 'category', { keepArray: true }],
      ['itunes:type', 'type'],
    ],
    item: [
      ['itunes:episodeType', 'episodeType'], 'itunes:explicit', 'itunes:keywords',
    ],
  },
});

module.exports = parser
