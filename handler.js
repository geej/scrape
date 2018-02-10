'use strict';

const https = require('https');
const cheerio = require('cheerio');

const titleTags = [
  { property: 'property', value: 'og:title' },
  { property: 'name', value: 'twitter:title' },
  { property: 'itemprop', value: 'name' },
];

const descriptionTags = [
  { property: 'property', value: 'og:description' },
  { property: 'name', value: 'twitter:description' },
  { property: 'itemprop', value: 'description' },
  { property: 'name', value: 'description' }
]

const imageTags = [
  { property: 'property', value: 'og:image' },
  { property: 'name', value: 'twitter:image:src' },
  { property: 'itemprop', value: 'image' },
];

const getAttributeFromTag = ($el, matchingAttrs) => {
  if (matchingAttrs.find(({ property, value }) => $el.attr(property) === value)) {
    return $el.attr('content');
  }
}
module.exports.scrape = (event, context, callback) => {
  const url = event.queryStringParameters && event.queryStringParameters.url;

  if (!url) {
    callback(null, {
      statusCode: 400,
      body: JSON.stringify({
        message: 'url is a required GET parameter.'
      })
    });
  }

  https.get(url, (res) => {
    if (res.statusCode !== 200) {
      callback(new Error('Got non-200 status code'));
      return;
    }

    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const $ = cheerio.load(data);

      let title = null;
      let description = null;
      let image = null;

      $('meta').each((i, el) => {
        title = title || getAttributeFromTag($(el), titleTags);
        description = description || getAttributeFromTag($(el), descriptionTags);
        image = image || getAttributeFromTag($(el), imageTags);
      });

      title = title || $('title').text();

      callback(null, {
        statusCode: 200,
        body: JSON.stringify({
          title,
          description,
          image
        })
      });
    })
  }).on('error', err => callback(err));
};
