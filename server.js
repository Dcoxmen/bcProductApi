const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const axios = require('axios');
const routes = require('./routes');

const app = express();
const port = 4000;

const clientId = 'clientid';
const storeHash = 'storehash';
const accessToken = 'accesstoken';

const typeDefs = gql`
type Query {
  products(
    search: String
    brand_id: ID
    custom_fields: [String]
    custom_fields_name: [String]
    custom_fields_value:[String]
    sku: String
  ): [Product!]
}


type Product {
  id: ID!
  name: String!
  price: Float
  brand_id: ID
  custom_fields:[CustomField]
  sku: String
  images: [ProductImage]
}

type ProductImage {
  url: String
  thumbnail_url: String
}
type CustomField {
  id: ID
  name: String
  value: String
}

`;

const resolvers = {
  Query: {
    products: async (_, { search, brand_id, custom_fields, custom_fields_name, custom_fields_value, sku }, { headers }) => {
      const queries = {};
      if (search) queries.keyword = search;
      if (brand_id) queries.brand_id = brand_id;
      if (custom_fields) queries.custom_fields = custom_fields.join(',');
      if (sku) queries.sku = sku;

      try {
        // Make the initial API call to retrieve the list of products
        const response = await axios({
          method: 'get',
          url: `https://api.bigcommerce.com/stores/${storeHash}/v3/catalog/products?include=custom_fields`,
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-Client': clientId,
            'X-Auth-Token': accessToken,
            ...headers
          },
          params: queries
        });

        let products = response.data.data;
        
        // filter the products based on custom_fields_value, custom_fields_name and custom_fields
        if (custom_fields_name || custom_fields_value ) {
          products = products.filter(product => {
            for (const customField of product.custom_fields) {
              if ((custom_fields_value && custom_fields_value.includes(customField.value))
             || (custom_fields_name && custom_fields_name.includes(customField.name))  ) {
                return true;
              }
            }
            return false;
          });
        }

        // Add the custom_fields data to each product
        const promises = products.map(async (product) => {
          product.custom_fields = product.custom_fields.map(customField => {
            return {
              id: customField.id,
              name: customField.name,
              value: customField.value
            };
          });
          // Make an additional API call to retrieve the images for each product
          const images = await axios({
            method: 'get',
            url: `https://api.bigcommerce.com/stores/${storeHash}/v3/catalog/products/${product.id}/images`,
            headers: {
              'Content-Type': 'application/json',
              'X-Auth-Client': clientId,
              'X-Auth-Token': accessToken,
              ...headers
            }
          });
          product.images = images.data.data.map(image => {
            return {
              url: image.url_standard,
              thumbnail_url: image.url_thumbnail
            };
          });
        });
        await Promise.all(promises);
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
