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

function verifyJWT(req, res, next) {
    // console.log(req.headers.authorization);

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access..')
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })

}

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
            res.send(products);

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

        app.get('/booking', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodeEmail = req.decoded.email;

            if (email !== decodeEmail) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const query = { email: email }
            const orders = await ordersCollection.find(query).toArray()
            res.send(orders)

        });

        // products delate id
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
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10h' })
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

        // admin create system 

        app.get('/user/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await userCollection.findOne(query)
            res.send({ isAdmin: user?.Role === 'admin' })

        })

        app.get('/user/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await userCollection.findOne(query)
            res.send({ isSeller: user?.Role === 'seller' })

        })

        // all user neoa hoyeche

        // app.get('/user', async (req, res) => {
        //     const role = req.query.Role
        //     // console.log(role);
        //     const query = { role: role - 1}
        //     const result = await userCollection.find(query).toArray()
        //     res.send(result)
        // })








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
