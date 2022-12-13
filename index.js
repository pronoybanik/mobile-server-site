const express = require('express');
const cors = require('cors')
const app = express();
require('dotenv').config();
const port = process.env.POST || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.lijbrwd.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const productCategoriesCollection = client.db('mobileSite').collection('productCategories');
        const productCollection = client.db('mobileSite').collection('products');


        app.get('/categories', async (req, res) => {
            const query = {}
            const result = await productCategoriesCollection.find(query).toArray()
            // console.log(result);
            res.send(result)

        })

        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { category_id: id }
            const products = await productCollection.find(query).toArray()
            // console.log(products);
            res.send(products)

        })

        app.get('/productsDetails/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) } 
            const products = await productCollection.findOne(query)
            res.send(products)
        })


    }
    finally {

    }

}

run().catch(err => console.log(err))




app.get('/', (req, res) => {
    res.send('Phone server running');
});

app.listen(port, () => {
    console.log(`phone server ${port}`);
});
