require('dotenv').config()
const sanityClient = require('@sanity/client');

const client = ({ projectId = process.env.PROJECT_ID, dataset = 'production', token = process.env.SANITY_TOKEN }) => projectId && sanityClient({ projectId, dataset, token });

module.exports = client;
