/**
 * 1. Prompt user for RSS feed
 * 2. Prompt user for Sanity Project ID
 * 3. Prompt user for token
 * 4. Confirm
 * 5. Download schemas and files
 * 5. Check if podcast allready is in iTunes? By setting id?
 * 6. Upload them to Sanity
 * 7. Check if Sanity has plugins installed?
 * 8. CaT: Sanity Podcast Server?
 */

const chalk = require('chalk');
const { prompt } = require('inquirer');
const isUrl = require('is-url');
const Parser = require('rss-parser');
const uuid = require('@sanity/uuid');
const sanityClient = require('@sanity/client');
const sanityImport = require('@sanity/import');
const { client, categories: iTunesCategories, onProgress, htmlToBlocks } = require('./lib');

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

const { log } = console;

async function parsePodcast({
  feedUrl,
  title,
  description,
  link,
  itunes: {
    image,
    owner,
    author,
    subtitle,
    summary,
    explicit
  } = {},
  category,
  language,
  guid,
  type,
}) {
  const joinCategories = (categoryList, pos) => {
    if (!categoryList[pos]['itunes:category']) {
      return categoryList[pos].$.text;
    }
    return `${categoryList[pos].$.text} > ${categoryList[pos]['itunes:category'][0].$.text}`;
  };

  const categories = {
    firstCategory: joinCategories(category, 0),
    secondCategory: joinCategories(category, 1),
    tertiaryCategory: joinCategories(category, 2),
  };

  let promptedCategories = { ...categories };
  if (!categories.firstCategory) {
    promptedCategories = await prompt([
      {
        type: 'list',
        message: chalk.yellow('What is the first category this podcast belongs to?'),
        name: 'firstCategory',
        choices: iTunesCategories,
      },
      {
        type: 'list',
        message: chalk.yellow('What is the second category this podcast belongs to?'),
        name: 'secondCategory',
        choices: [{ value: 'None' }, ...iTunesCategories],
      },
      {
        type: 'list',
        message: chalk.yellow('What is the tertiary category this podcast belongs to?'),
        name: 'tertiaryCategory',
        choices: [{ value: 'None' }, ...iTunesCategories],
      },
    ]);
  }
  const payload = {
    _id: guid || uuid(),
    _type: 'podcast',
    title,
    subtitle,
    link,
    description,
    coverArt: {
      _sanityAsset: `image@${image}`,
    },
    language,
    copyright: owner.name,
    explicit: (explicit === 'yes' && explicit !== 'clean'),
    itunes: {
      author,
      owner: {
        email: owner.email,
        name: owner.name,
      },
      url: url || feedUrl,
      type,
      categories: {
        ...promptedCategories,
      },
    },
  };
  return payload;
}

function parseEpisode(
  {
    getFiles,
    title,
    link,
    pubDate,
    summary,
    'content:encoded': contentEncoded,
    description,
    enclosure: {
      url,
    } = {},
    itunes: {
      subtitle,
      explicit,
      duration,
      image,
    },
    content,
    contentSnippet,
  },
  podcastId,
) {
  const preparedEpisode = {
    _type: 'episode',
    schedule: {
      publish: new Date(pubDate).toISOString(),
    },
    podcast: [{
      _ref: podcastId,
      _type: 'reference',
      _weak: true,
      _key: uuid(),
    }],
    duration,
    title,
    subtitle,
    explicit: (explicit === 'yes' && explicit !== 'clean'),
    summary: summary || contentSnippet,
    description: htmlToBlocks(content),
  };
  if (getFiles && url) {
    preparedEpisode.file = { _sanityAsset: `file@${url}` }; // eslint-disable-line no-underscore-dangle
  }
  if (!getFiles) {
    preparedEpisode.fileUrl = url;
  }
  if (image) {
    preparedEpisode.coverArt = { _sanityAsset: `image@${image}` }; // eslint-disable-line no-underscore-dangle
  }
  return preparedEpisode;
}


async function main() {
  await log(chalk.red('Welcome to Podcast to Sanity importer!'));

  const answers = await prompt([
    {
      type: 'input',
      message: chalk.yellow('What is the RSS feed to your podcast?'),
      name: 'rssFeed',
      validate: value => (isUrl(value) ? true : chalk.red('This needs to be a valid URL')),
    },
    {
      type: 'input',
      message: chalk.green('What is your Sanity Project ID?'),
      name: 'projectId',
      validate: value => (value.length === 8 ? true : chalk.red('It needs to be 8 characters')),
    },
    {
      type: 'input',
      message: chalk.green('What is your Sanity Dataset?'),
      name: 'sanityDataset',
      default: 'production',
    },
    {
      type: 'input',
      message: chalk.green('You need a token that gives you write access to Sanity'),
      name: 'sanityToken',
      validate: value => (value.length ? true : chalk.red('You need to make a token. https://www.sanity.io/docs/access-control')),

    },
    {
      type: 'confirm',
      message: chalk.green('Do you want to import the audio files to Sanity (y), or keep the original location (n)?'),
      name: 'getFiles',
    },
    {
      type: 'confirm',
      message: chalk.yellow('Are you sure you want to do this?'),
      name: 'confirm',
      validate(value) {
        let done = this.async();

        console.log(value);
        if (!value) {
          console.log('Maybe another time!');
          process.kill(process.pid, 'SIGINT');
          done(null, true);
        }
      },
    },
  ]);
  if (!answers.confirm) {
    console.log('Maybe another time!');
    return process.kill(process.pid, 'SIGINT');
  }
  const result = await importer(answers);
  console.log(result);
}


async function importer({
  rssFeed, projectId, sanityToken, sanityDataset, getFiles, client
}) {

  const rssData = await parser.parseURL(rssFeed).catch(console.error);
  /* log(JSON.stringify(rssData, null, 2));
  return process.exit(0); */
  const preparedPodcast = await parsePodcast(rssData);
  const preparedEpisode = rssData.items.map(episode => parseEpisode({ getFiles, ...episode }, preparedPodcast._id));
  log(JSON.stringify({preparedPodcast, preparedEpisode}, null, 2))
  return process.kill(process.pid, 'SIGINT');
  const result = await sanityImport([preparedPodcast, ...preparedEpisode], { client, operation: 'createOrReplace', onProgress }).catch(({ message }) => console.error('Import failed: %s', message));
  if (result) {
    console.log('Imported %d documents', result);
  }
}

// main();
importer({
  rssFeed: 'http://localhost:4444/saastr.rss',
  projectId: 'j4iakyct',
  sanityDataset: 'production',
  sanityToken: 'skfyBRlPskah4gY15uMvTe6Y9b6ho8Izjz9PMYGjCYWsGIKYw7GWGY58fZiDzyEw2iXWlw856obfhXFhWPRPKGnt6hIBn6Ys5UWuMrZENt6igBgfTDp1pViPzweWTCTTr6quPow4Jbz40VezOhVxHtSWKCNFxQBQC23hajy5ikvMKUXjIWFQ',
});

