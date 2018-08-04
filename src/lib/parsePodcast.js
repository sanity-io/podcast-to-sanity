const uuid = require('@sanity/uuid');

async function parsePodcast(chalk, {
  title,
  description,
  link,
  url,
  itunes: {
    image,
    owner,
    author,
    subtitle,
    summary,
    explicit,
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
    url,
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
      categories: {
        ...promptedCategories,
      },
    },
  };
  return payload;
}

module.exports = parsePodcast;
