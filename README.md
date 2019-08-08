# Podcast to Sanity

This CLI lets you import podcasts into Sanity via their RSS-feed.

## Installation

`npm install -g podcast-to-sanity`

## Requirements

Requires node.js version >= 7.6

## Usage

Install the CLI tool (see Installation above).

Have your Sanity project ID, dataset name and a write token ready.

Run `podcast-to-sanity` in your terminal and follow the instructions.

Deploy the [podcast starter from sanity.io/create](https://sanity.io/create?template=sanity-io%2Fsanity-template-podcast-studio) or run `sanity install podcast` in your Sanity project folder to view the content in the studio, or [copy these schema files](https://github.com/kmelve/sanity-plugin-podcast/blob/master/src/podcast.js) if you want to tweak them.

You can also check out the [sanity podcast server](https://github.com/kmelve/sanity-podcast-server) if you want to try out the RSS-feed from your data.

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
    --fromCreate Ensures compability with the podcast starter from sanity.io/create
    --help, -h Output this help text

  Examples
    $ podcast-to-sanity --keep-file-location
    # Imports all metadata and content, but not file assets
```

## Caveats

Podcast RSS feeds aren't very standardized. Your milage may vary.

## License

MIT-licensed. See LICENSE.
