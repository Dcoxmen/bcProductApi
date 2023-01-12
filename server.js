const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const request = require('request');
const axios = require('axios');
const routes = require('./routes');

const app = express();
const port = 4000;

const clientId = '3mt7gi7jswdubvsppfapvm4x0gmsf7t';
const storeHash = '4ccc5gfp0c';
const accessToken = 'rmw835hec1nturvs9784ffetp0rkr4u';

const typeDefs = gql`
type Query {
  products(
    search: String
    brand_id: ID
    category_ids: [Int]
    sku: String
  ): [Product!]
}

type Product {
  id: ID!
  name: String!
  price: Float
  brand_id: ID
  category_ids: [Int]
  sku: String
  images: [ProductImage]
}

type ProductImage {
  url: String
  thumbnail_url: String
}

`;

const resolvers = {
  Query: {
    products: async (_, { search, brand_id, categories, sku }, { headers }) => {

      const queries = {}
      if (search) queries.keyword = search
      if (brand_id) queries.brand_id = brand_id
      if (category_ids) queries.filter = `categories:in:${category_ids.join(',')}`
      if (sku) queries.sku = sku

      try {
        const response = await axios({
          method: 'get',
          url: `https://api.bigcommerce.com/stores/${storeHash}/v3/catalog/products?include=images`,
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-Client': clientId,
            'X-Auth-Token': accessToken,
            ...headers
          },
          params: queries
        });

        const products = response.data.data;
        products.forEach(product => {
          product.images = product.images.map(image => {
            return {
              url: image.url_zoom,
              thumbnail_url: image.url_thumbnail
            };
          });
        });

        return products;
      } catch (error) {
        throw new Error(error);
      }
    }
  }
};

async function startServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => ({
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Client': clientId,
        'X-Auth-Token': accessToken
      }
    })
  })
  await server.start();
  server.applyMiddleware({ app });
}
startServer();



app.use('/', routes);

app.listen(port, () => {
  console.log(`Server listening at ${port}`);
});
