const meow = require('meow');
const cli = meow(`
  Usage
    $ sanity-to-podcast

  Options
    --rssFeed, -r  Include a rss feed
    --projectId, -p Sanity.io project ID
    --dataset, -d Sanity.io dataset
    --token, -t Sanity token with write access
    --keep-file-location, -k Import audio file urls and not files to Sanity
    --missing, -m only add missing episodes
    --help, -h Output this help text

  Examples
    $ podcast-to-sanity --keep-file-location
    # Imports all metadata and content, but not file assets
`, {
  flags: {
    rssFeed: {
      type: 'string',
      alias: 'r',
    },
    projectId: {
      type: 'string',
      alias: 'p',
    },
    dataset: {
      type: 'string',
      alias: 'd',
    },
    token: {
      type: 'string',
      alias: 't',
    },
    getFiles: {
      type: 'boolean',
      alias: 'k',
    },
    missing: {
      type: 'boolean',
      alias: 'm',
    },
    help: {
      type: 'boolean',
      alias: 'h',
    },
  },
});

module.exports = cli;
