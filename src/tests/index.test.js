
const { parsePodcast } = require('../index')
jest.mock('uuid', () => () => '00000000-0000-0000-0000-000000000000');


test('Data structure from rss xml podcast metadata to sanity podcast schema', async () => {
  const rssJson = require('../../mock/syntax.json')
  const preparedPodcastData = {
    "_id": "cec47fea-e9b0-595f-a6b7-cc1454dfe8c2",
    "_type": "podcast",
    "title": "Syntax - Tasty Web Development Treats",
    "subtitle": "",
    "description": "Wes Bos and Scott Tolinski are two full stack web developers who like to break down complex topics and make them easy to understand. ",
    "coverArt": {
      "_sanityAsset": "image@http://static.libsyn.com/p/assets/7/9/0/7/790703531a3c8eca/iTunes_Artwork.png"
    },
    "language": "en",
    "copyright": "Wes Bos",
    "explicit": false,
    "itunes": {
      "author": "Wes Bos & Scott Tolinski - Full Stack JavaScript Web Developers",
      "owner": {
        "email": "wes@wesbos.com",
        "name": "Wes Bos"
      },
      "url": "https://syntax.fm",
      "type": "episodic",
      "categories": {
        "firstCategory": "Technology",
        "secondaryCategory": "Technology > Tech News",
        "tertiaryCategory": "Business > Careers"
      }
    }
  }
  expect(await parsePodcast(rssJson)).toEqual(preparedPodcastData)
})
