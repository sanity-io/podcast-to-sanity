#!/usr/bin/env node
/* eslint-disable no-console */
const { prompt } = require('inquirer');
const chalk = require('chalk');
const isUrl = require('is-url');
const Ora = require('ora');
const Parser = require('rss-parser');
const Rx = require('rxjs');
const sanityClient = require('@sanity/client');
const sanityImport = require('@sanity/import');
const uuid = require('uuid/v5');
const {
  cli, categories: iTunesCategories, joinCategories, htmlToBlocks,
} = require('./lib');
const DEBUG = process.env.DEBUG === "true" || false;

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

const log = (string) => console.log(JSON.stringify(string, null, 2));


async function parsePodcast({
  title,
  description,
  link,
  itunes: {
    image,
    owner,
    author,
    subtitle,
    explicit,
  } = {},
  category,
  language,
  guid,
  type,
}) {

  const categories = {
    firstCategory: joinCategories(category, 0),
    secondaryCategory: joinCategories(category, 1),
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
        name: 'secondaryCategory',
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
  const parsedPodcast = {
    _id: guid || uuid((link || title), uuid.URL),
    _type: 'podcast',
    title,
    subtitle,
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
      type,
      url: link,
      categories: {
        ...promptedCategories,
      },
    },
  };
  return parsedPodcast;
}

function parseEpisode(
  {
    getFiles,
    title,
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
      keywords,
      type,
      season
    } = {},
    content,
    contentSnippet,
  },
  podcastId,
) {
  const preparedEpisode = {
    _id: uuid(`${title} + ${pubDate}`, uuid.URL),
    _type: 'episode',
    schedule: {
      publish: new Date(pubDate).toISOString(),
    },
    podcast: [{
      _ref: podcastId,
      _type: 'reference',
      _weak: true,
      _key: uuid(podcastId, uuid.URL),
    }],
    duration,
    title,
    subtitle,
    itunes: {
      type,
      season
    },
    explicit: (explicit === 'yes' && explicit !== 'clean'),
    summary: summary || contentSnippet,
    content: content ? htmlToBlocks(content) : htmlToBlocks(contentEncoded),
    description: description ? htmlToBlocks(description) : htmlToBlocks(content),
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

async function importer({
  rssFeed, projectId, dataset, token, getFiles, missing
}) {
  const rssData = await parser.parseURL(rssFeed).catch(err => {
    console.log(chalk.red(err));
    return process.kill(process.pid, 'SIGINT');
  });
  if (DEBUG) {
    log({rssData});
  }
  const preparedPodcast = await parsePodcast(rssData);
  if (DEBUG) {
    log({preparedPodcast});
  }
  const preparedEpisode = rssData.items.slice(1,2).map(episode => parseEpisode({ getFiles, ...episode }, preparedPodcast._id)); // eslint-disable-line no-underscore-dangle
  if (DEBUG) {
    log({preparedEpisode});
  }
  const client = sanityClient({
    projectId, dataset, token, useCdn: false,
  });

  const spin = new Ora('Running import').start();
  let currentStep;

  function onProgress(opts) {
    const { step, complete, total, current } = opts;
    if (DEBUG) {
      log({currentStep, opts})
    }
    if (!currentStep) {
      spin.start(step);
    }

    if (spin && (step !== currentStep)) {
      spin.succeed();
      spin.start(step);
    }
    if (spin && total && current) {
      spin.text = `${currentStep}: ${current} / ${total}`;
    }

    if (complete) {
      spin.succeed();
    }
    currentStep = step;
  }
  const operation = missing ? 'createIfNotExists' : 'createOrReplace';
  const result = await sanityImport([preparedPodcast, ...preparedEpisode], { client, operation, onProgress }).catch(({ message }) => {
    spin.fail(`Import failed: ${message}`);
    return process.kill(process.pid, 'SIGINT');
  });

  if (Number.isInteger(result)) {
    spin.succeed(`Imported the podcast and ${result} episodes! 🎉`);
    console.log(chalk.green(`
Run
    $ sanity install podcast
in your Sanity project studio folder to view your podcast and episodes.
    `));
    process.kill(process.pid, 'SIGINT');
  }
  return process.kill(process.pid, 'SIGINT');
}
function handleError (err) {
  console.warn(err);
}


function main() {
  console.log(chalk.red('🎙  Welcome to the podcast to sanity.io importer!\n\n'));
  if (DEBUG) {
    console.log(chalk.red('DEBUG MODE'))
  }
  const prompts = new Rx.Subject();

  let answers = {};

  prompts.next({
    type: 'input',
    message: chalk.yellow('What is the RSS feed to your podcast?'),
    name: 'rssFeed',
    validate: value => (isUrl(value) ? true : chalk.red('This needs to be a valid URL')),
  });

  prompt(prompts).ui.process.subscribe(({ name, answer }) => {
    answers = { ...answers, [name]: answer };
    if (name === 'confirm') {
      prompts.complete();
    }
  }, handleError, () => {
    if (!answers.confirm) {
      console.log('Maybe another time!');
      return process.kill(process.pid, 'SIGINT');
    }
    return importer(answers);
  });

  const {
    rssFeed, projectId, dataset, token, getFiles, missing
  } = cli.flags;

  if (!cli.flags.rssFeed) {
    prompts.next({
      type: 'input',
      message: chalk.yellow('What is the RSS feed to your podcast?'),
      name: 'rssFeed',
      validate: value => (isUrl(value) ? true : chalk.red('This needs to be a valid URL')),
    });
  } else if (cli.flags.rssFeed) {
    answers = { ...answers, rssFeed };
  }
  if (!cli.flags.projectId) {
    prompts.next({
      type: 'input',
      message: chalk.green('What is your Sanity Project ID?'),
      name: 'projectId',
      validate: value => (value.length === 8 ? true : chalk.red('It needs to be 8 characters')),
    });
  } else if (cli.flags.projectId) {
    answers = { ...answers, projectId };
  }
  if (!cli.flags.dataset) {
    prompts.next({
      type: 'input',
      message: chalk.green('What is your Sanity Dataset?'),
      name: 'dataset',
      default: 'production',
    });
  } else if (cli.flags.dataset) {
    answers = { ...answers, dataset };
  }

  if (!cli.flags.token) {
    prompts.next({
      type: 'input',
      message: chalk.green('You need a token that gives you write access to Sanity'),
      name: 'token',
      validate: value => (value.length ? true : chalk.red('You need to make a token. https://www.sanity.io/docs/access-control')),
    });
  } else if (cli.flags.token) {
    answers = { ...answers, token };
  }

  if (!cli.flags.getFiles) {
    prompts.next({
      type: 'confirm',
      message: chalk.green('Do you want to import the audio files to Sanity (y), or keep the original location (n)?'),
      name: 'getFiles',
    });
  } else if (cli.flags.getFiles) {
    answers = { ...answers, getFiles };
  }

  if (!cli.flags.missing) {
    prompts.next({
      type: 'confirm',
      message: chalk.green('Do you want to just add new content (y)?'),
      name: 'missing',
    });
  } else if (cli.flags.missing) {
    answers = { ...answers, missing };
  }

  prompts.next({
    type: 'confirm',
    message: chalk.yellow('Are you sure you want to do this?'),
    name: 'confirm',
  });
}

module.exports = {
  parsePodcast,
  parseEpisode,
  main,
}
