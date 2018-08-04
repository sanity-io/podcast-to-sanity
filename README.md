# Podcast to Sanity

This CLI lets you import podcasts into Sanity via their RSS-feed.

## Installation

npm install -g podcast-to-sanity

## Requirements

Requires node.js version >= 7.6

## Usage

Install the CLI tool (see Installation above)

Install the Sanity CLI tool (if not already done) and log in

npm install -g @sanity/cli && sanity login

## Documentation

```bash
  Usage
    $ sanity-to-podcast

  Options
    --rssFeed, -r  Include a rss feed
    --projectId, -p Sanity.io project ID
    --dataset, -d Sanity.io dataset
    --token, -t Sanity token with write access
    --keep-file-location, -k Import audio file urls and not files to Sanity
    --help, -h Output this help text

  Examples
    $ podcast-to-sanity --keep-file-location
    # Imports all metadata and content, but not file assets
```

## Caveats

Podcast RSS feeds aren't very standardized. Your milage may vary.

## License

MIT-licensed. See LICENSE.
