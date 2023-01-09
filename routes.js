const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/', (req, res) => {
 
  const query = `
  query{
    products {
      id
      name
      price
      brand_id
      categories
      sku
      images
    }

  }
  `;
    

  axios.post('/graphql', { query })
    .then(result => {
      const products = result.data.data.products;
      res.send(`<h1>Product List</h1><ul>${products.map(product => `<li>${product.name}</li>`).join('')}</ul>`);
    })
    .catch(error => {
      console.error(error);
      res.send(error);
    });


});

module.exports = router;
