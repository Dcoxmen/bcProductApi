const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const request = require('request');
const axios = require('axios');
const routes = require('./routes');

const app = express();
const port = 4000;

const clientId = 'Client here';
const storeHash = 'Store hash';
const accessToken = 'rmw835hec1nturvs9784ffetp0rkr4u';

const typeDefs = gql`
type Query {
  products: [Product!]
}

type Product {
  id: ID!
  name: String!
  price: Float
  brand_id: ID
  categories: [Int]
  sku: String
  images: [String]
}

`;

const resolvers = {
  Query: {
    products: (_, __, { headers }) => {
      // Set the options for the request
      const options = {
        url: `https://api.bigcommerce.com/stores/${storeHash}/v3/catalog/products`,
        headers: headers, 
      }


      return new Promise((resolve, reject) => {
        request(options,(error, response, body) => {
          if (!error && response.statusCode == 200) {
            const products = JSON.parse(body).data;
            resolve(products);
          } else {
            reject(error);
          }
        });
      });
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
