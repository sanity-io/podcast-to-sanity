const joinCategories = require('../joinCategories')

test('Data structure from RSS xml to output as joined strings', () => {
  const rssCategories = [
    {
      "$": {
        "text": "Technology"
      }
    },
    {
      "$": {
        "text": "Technology"
      },
      "itunes:category": [
        {
          "$": {
            "text": "Tech News"
          }
        }
      ]
    },
    {
      "$": {
        "text": "Business"
      },
      "itunes:category": [
        {
          "$": {
            "text": "Careers"
          }
        }
      ]
    }
  ]
  const sanityCategories = {
    firstCategory: "Technology",
    secondCategory: "Technology > Tech News",
    tertiaryCategory: "Business > Careers"
  }

  expect(joinCategories(rssCategories, 0)).toBe(sanityCategories.firstCategory)
  expect(joinCategories(rssCategories, 1)).toBe(sanityCategories.secondCategory)
  expect(joinCategories(rssCategories, 2)).toBe(sanityCategories.tertiaryCategory)
})
