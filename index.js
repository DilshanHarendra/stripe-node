require('dotenv').config()
const express = require('express')
const app = express()
const cors= require('cors')
const bodyParser = require('body-parser')
app.use(cors())
app.use(bodyParser())
app.use(express.static(`${__dirname}/public`))
const stripe =require("stripe")(process.env.STRIPE_KEY)


const storeItems = new Map([
    [1, { priceInCents: 10000, name: "Learn React Today" }],
    [2, { priceInCents: 20000, name: "Learn CSS Today" }],
])

console.log(storeItems)


app.get('/',(req, res) => {
    res.sendFile('index.html')
})

app.post("/create-checkout-session", async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            line_items: req.body.items.map(item => {
                const storeItem = storeItems.get(item.id)
                return {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: storeItem.name,
                        },
                        unit_amount: storeItem.priceInCents,
                    },
                    quantity: item.quantity,
                }
            }),
            success_url: `${process.env.CLIENT_URL}/success.html`,
            cancel_url: `${process.env.CLIENT_URL}/cancel.html`,
        })
        res.json({ url: session.url })
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

app.get('/',(req, res) => {
    res.send({message:"hello"})
})


app.listen(8000,()=>console.log("running on 8000"))
