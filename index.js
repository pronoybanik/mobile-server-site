const express = require('express');
const cors = require('cors')
const app = express();
const jwt = require('jsonwebtoken')
require('dotenv').config();
const port = process.env.POST || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const stripe = require("stripe")(process.env.STRIPE_ID);


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
        const bookingCollection = client.db('mobileSite').collection('orders');
        const userCollection = client.db('mobileSite').collection('user');
        const addProductsCollection = client.db('mobileSite').collection('addProducts');
        const addProductsListCollection = client.db('mobileSite').collection('addProductsList');
        const paymentsCollection = client.db('mobileSite').collection('payments');



        app.get('/categories', async (req, res) => {
            const query = {}
            const result = await productCategoriesCollection.find(query).toArray()
            // console.log(result);
            res.send(result);

        });

        // Our secondHand Product

        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { category_id: id }
            const products = await productCollection.find(query).toArray()
            // console.log(products);
            res.send(products);

        });

        // selling products 
        app.get('/addProducts/:products', async (req, res) => {
            const product = req.params.products;
            const query = { product: product }
            const products = await addProductsCollection.find(query).toArray()
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
            const result = await bookingCollection.insertOne(id);
            res.send(result)
        });

        // booking id 

        app.get('/booking/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const booking = await bookingCollection.findOne(query)
            res.send(booking)
        })

        // product GET API

        app.get('/booking', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodeEmail = req.decoded.email;

            if (email !== decodeEmail) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const query = { email: email }
            const orders = await bookingCollection.find(query).toArray()
            res.send(orders)

        });

        // products delate id
        app.delete('/booking/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const bookingId = await bookingCollection.deleteOne(query)
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

        // seller create system 
        app.get('/user/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await userCollection.findOne(query)
            res.send({ isSeller: user?.Role === 'Seller' })

        })

        // all seller email

        app.get('/seller', async (req, res) => {
            // const Role = req.query.Role
            const query = { Role: 'Seller' }
            const result = await userCollection.find(query).toArray()
            res.send(result)
        })

        // all byers email 
        app.get('/buyer', async (req, res) => {
            const query = { Role: 'Buyer' }
            const result = await userCollection.find(query).toArray()
            res.send(result)
        })

        // all user id name 
        app.delete('/user/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const user = await userCollection.deleteOne(query)
            res.send(user)
        });


        // add products item data save 
        app.post('/addProducts', async (req, res) => {
            const id = req.body;
            const result = await addProductsCollection.insertOne(id);
            res.send(result)
        });


        // selling products delete 

        app.delete('/addProducts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const productId = await addProductsCollection.deleteOne(query)
            res.send(productId)
        });


        // home page selling card
        app.get('/ProductsDetail', async (req, res) => {
            const query = {}
            const result = await addProductsListCollection.find(query).toArray()
            res.send(result);

        });

        // payments system;
        app.post("/create-payment-intent", async (req, res) => {
            const booking = req.body;
            console.log(booking);
            const price = booking.price;
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            })
        });

        // payment info store
        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            const id = payment.bookingId;
            const filter = { _id: ObjectId(id) }
            const updateDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.paymentIntent
                }
            }
            const updateResult = await bookingCollection.updateOne(filter, updateDoc)
            res.send(updateResult);
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
