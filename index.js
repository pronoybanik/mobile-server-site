const express = require('express');
const cors = require('cors')
const app = express();
const jwt = require('jsonwebtoken')
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
        const ordersCollection = client.db('mobileSite').collection('orders');
        const userCollection = client.db('mobileSite').collection('user');


        app.get('/categories', async (req, res) => {
            const query = {}
            const result = await productCategoriesCollection.find(query).toArray()
            // console.log(result);
            res.send(result)

        });

        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { category_id: id }
            const products = await productCollection.find(query).toArray()
            // console.log(products);
            res.send(products)

        });

        app.get('/productsDetails/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const products = await productCollection.findOne(query)
            res.send(products)
        });

        // product post API

        app.post('/booking', async (req, res) => {
            const id = req.body;
            const result = await ordersCollection.insertOne(id);
            res.send(result)
        });
 
        // product GET API

        app.get('/booking', async (req, res) => {
            const query = {}
            const orders = await ordersCollection.find(query).toArray()
            res.send(orders)

        });

        app.delete('/booking/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const bookingId = await ordersCollection.deleteOne(query)
            res.send(bookingId)
        });

        // jwt token create

        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            // console.log(email);
            const query = { email: email }
            const user = await userCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '24h' })
                return res.send({ accessToken: token })
            }
            // console.log(user);
            res.status(403).send({ accessToken: '' })
        })

        // add all user 
        app.post('/user', async (req, res) => {
            const id = req.body;
            const users = await userCollection.insertOne(id);
            res.send(users);
        });






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
