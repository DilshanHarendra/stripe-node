require('dotenv').config()
const express = require('express')
const app = express()
const cors= require('cors')
const bodyParser = require('body-parser')
const {response} = require("express");
app.use(cors())
app.use(bodyParser())
app.use(express.static(`${__dirname}/public`))
const stripe =require("stripe")(process.env.STRIPE_KEY)
const port =8000

// This is your Stripe CLI webhook secret for testing your endpoint locally.
const endpointSecret = "whsec_93a109d78a298a6e27db80b377367b817715238c12e240e549c72993662aa024";

const PRICE_IDS={
    ONETIME:'price_1L7jhYKfS07LkwswD62k0sqt',
    MONTHLY:'price_1L7jhYKfS07LkwswrdKNjYMi',
    YEARLY:'price_1L7jhYKfS07Lkwswax1J90ME'
}
const  PERMISSIONS= {
    "ONETIME":[
        {
            "listings": 3,
            "discount": 0,
            "coupon": null
        },
        {
            "listings": 6,
            "discount": 8.33,
            "coupon": "F00xloU1"
        },
        {
            "listings": 50,
            "discount": 16.67,
            "coupon": "rhu2zdUM"
        },
        {
            "listings": 1000,
            "discount": 25,
            "coupon": "Mm1TChHM"
        }
    ],
    "MONTHLY": [
        {
            "listings": 5,
            "discount": 0,
            "coupon": null
        },
        {
            "listings": 20,
            "discount": 10,
            "coupon": "Q7Z9leK5"
        },
        {
            "listings": 100,
            "discount": 20,
            "coupon": "M9urjnPI"
        },
        {
            "listings": 1000,
            "discount": 30,
            "coupon": "smRDBMKX"
        }
    ],
    "YEARLY": [
        {
            "listings": 5,
            "discount": 8.33,
            "coupon": "aJ5XmuAT"
        },
        {
            "listings": 20,
            "discount": 26.72,
            "coupon": "qWNWcLgH"
        },
        {
            "listings": 100,
            "discount": 20,
            "coupon": "os9NyQXc"
        },
        {
            "listings": 1000,
            "discount": 35.83,
            "coupon": "i7WZuMXb"
        }
    ]
}



app.get('/',(req, res) => {
    res.sendFile('index.html')
})

app.post("/product",(req,res)=>{
    let productData={
       // "id": "prod_LiHvCbwIEq59lT",
        name: "Frock Red Black",
        default_price_data:{
            unit_amount: 100,
            currency: 'usd',
          //  recurring: {interval: 'month'},

        },
       // "active": true,
        description: "This is a test product. This is a red color frock u can buy this.",
        images: [
            "https://images.unsplash.com/photo-1545912452-8aea7e25a3d3?crop=entropy&cs=tinysrgb&fm=jpg&ixlib=rb-1.2.1&q=60&raw_url=true&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTJ8fGdpcmx8ZW58MHx8MHx8&auto=format&fit=crop&w=800",
            "https://images.unsplash.com/photo-1531927557220-a9e23c1e4794?crop=entropy&cs=tinysrgb&fm=jpg&ixlib=rb-1.2.1&q=60&raw_url=true&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTZ8fGdpcmx8ZW58MHx8MHx8&auto=format&fit=crop&w=800"
        ],
        package_dimensions: {
            height:2.00,
            width:20.00,
            length:12.00,
            weight:50.00
        },
        shippable: true,
       // "statement_descriptor": null,
        tax_code: "txcd_00000000",
        unit_label: "Pcs",
        url: "http://localhost:8000/product/1",
       // object: "product",
       // metadata: {},
    }

    stripe.products.create(productData).then(response=>{
        res.status(200).send(response)
    }).catch(err=>res.status(400).send(err))

})



app.post("/create-checkout-session", async (req, res) => {
    try {
        const {freq, qty}= req.body

       /*
       #NOTE
       freq can be ONE, MONTHLY, YEARLY
       */



        let sessionObj= {
            payment_method_types: ["card"],
            metadata: {
                            qty:qty,
                            interval:freq,
                        },
            mode: freq=='ONETIME'?'payment':'subscription',
            success_url: `http://localhost:${port}/success.html`,
            cancel_url: `http://localhost:${port}/cancel.html`,
        }

        const priceID = PRICE_IDS[freq]



        if (priceID==""){
            throw "Missing Price id"
        }

        let permissions  = PERMISSIONS[freq]
        permissions= permissions.sort((a,b)=>a.listings>b.listings?1:-1)
        let coupon=null

        const line_item={  // create line items
            price:priceID,
            quantity:qty,
        }
        sessionObj={  // add items
            ...sessionObj,
            line_items: [line_item],
        }
        for (let i = 0; i < permissions.length; i++) {  // find coupon
            if (permissions[i].listings>=qty){
                coupon=permissions[i].coupon
                break
            }
        }

        if (coupon){
            sessionObj={
                ...sessionObj,
                discounts: [{
                    coupon: coupon,
                }],
            }
        }

        const session = await stripe.checkout.sessions.create(sessionObj)
        res.json({ url: session.url })
        //res.send(req.body)
    } catch (e) {
        res.status(400).json({ error: e })
    }
})


app.get('/price',(req, res) => {
    stripe.prices.retrieve(
        'price_1L7EpmDm5VBUQrEuVMOpddZY'
    ).then(response=>res.json({data:response}))
        .catch(err=>res.json({data:err}))
})

app.get('/billing/:id',async (req, res) => {
    console.log(req.params.id)
    const session = await stripe.billingPortal.sessions.create({
        customer: req.params.id||'',
        return_url: `http://localhost:${port}/index.html`,
        }
    )
    res.json({ data: session })
})
/*
onetime->onetime   // checkout api
onetime->subscription // checkout api
subscription->subscription //
subscription->onetime
* */

app.post("/change-subscription", async (req, res) => {
    try {
        const {freq, qty}= req.body
        // TODO : get currentSubscription


        // TODO :



        const subscriptionID="sub_1LAe2BKfS07LkwswpSMFGVPo"
        const subscriptionData = await stripe.subscriptions.retrieve(subscriptionID);
        console.log(subscriptionData)
        console.log(subscriptionData.items.data)
        const priceID=PRICE_IDS[freq]
        let permissions  = PERMISSIONS[freq]
        permissions= permissions.sort((a,b)=>a.listings>b.listings?1:-1)
        let coupon=null
        let sessionObj={
            proration_behavior: 'always_invoice',
            metadata:{

            }
        }

        let product={
            quantity:qty,
            id: subscriptionData.items.data[0].id,
            price: priceID,
        }
        sessionObj={
            ...sessionObj,
            items:[product],
        }
        for (let i = 0; i < permissions.length; i++) {  // find coupon
            if (permissions[i].listings>=qty){
                coupon=permissions[i].coupon
                break
            }
        }

        if (coupon){
            sessionObj={
                ...sessionObj,
                coupon: coupon,
            }
        }


        const newSubscription = await stripe.subscriptions.update(
            subscriptionID,
            sessionObj
        );

        res.status(200).send(newSubscription)

    }catch (e){
        res.status(400).json({ error: e })
    }
})



app.post('/webhook', express.raw({type: 'application/json'}), (request, response) => {
    const sig = request.headers['stripe-signature'];

    let event;

    try {
        event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    } catch (err) {
        response.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    console.log(event)
    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            // Then define and call a function to handle the event payment_intent.succeeded
            break;
        // ... handle other event types
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    response.send();
});


app.get('/clock',(req,res)=>{

})



app.listen(port,()=>console.log(`running on http://localhost:${port}`))

