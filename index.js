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


const storeItems = new Map([
    [1, { priceInCents: 10000, name: "Learn React Today" }],
    [2, { priceInCents: 20000, name: "Learn CSS Today" }],
])




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
        const {freq, packageName, qty}= req.body

       /*
       #NOTE
       freq can be ONE, MONTHLY, YEARLY
       packageName can be BASIC, STANDARD , CUSTOM
       */

        const priceIds={
            ONETIME:'price_1L7jhYKfS07LkwswD62k0sqt',
            MONTHLY:'price_1L7jhYKfS07LkwswrdKNjYMi',
            YEARLY:'price_1L7jhYKfS07Lkwswax1J90ME'
        }
        const coupons={
            ONETIME_PKG_2:'F00xloU1',
            ONETIME_PKG_3_V1:'rhu2zdUM',
            ONETIME_PKG_3_V2:'Mm1TChHM',
            SUBSCRIPTION_PKG_2_MONTHLY:'Q7Z9leK5',
            SUBSCRIPTION_PKG_3_V1_MONTHLY:'M9urjnPI',
            SUBSCRIPTION_PKG_3_V2_MONTHLY:'smRDBMKX',
            SUBSCRIPTION_PKG_1_YEARLY:'aJ5XmuAT',
            SUBSCRIPTION_PKG_2_YEARLY:'qWNWcLgH',
            SUBSCRIPTION_PKG_3_V1_YEARLY:'os9NyQXc',
            SUBSCRIPTION_PKG_3_V2_YEARLY:'i7WZuMXb'
        }
        const getQty=()=>{
            switch (packageName){
                case 'BASIC':{
                    if (freq=='ONE'){
                        return 3
                    }else{
                        return 5
                    }
                }
                case 'STANDARD':{
                    if (freq=='ONE'){
                        return 6
                    }else{
                        return 20
                    }
                }
                default : return qty
            }
        }
        let sessionObj= {
            payment_method_types: ["card"],
            mode: freq=='ONE'?'payment':'subscription',
            success_url: `${process.env.CLIENT_URL}/success.html`,
            cancel_url: `${process.env.CLIENT_URL}/cancel.html`,
        }



        if (freq=='ONE'){
            const line_item={
                price:priceIds.ONETIME,
                quantity:getQty(),
            }

            if (packageName=='CUSTOM'){
                if (qty<7){
                   throw "Quantity must grater than 7"
                }
                let discount = coupons.ONETIME_PKG_3_V1
                if (qty>50){
                    discount=coupons.ONETIME_PKG_3_V2
                }
                sessionObj={
                    ...sessionObj,
                    line_items: [line_item],
                    discounts: [{
                        coupon: discount,
                    }],
                }

            }else if(packageName=='STANDARD') {
                sessionObj={
                    ...sessionObj,
                    line_items: [line_item],
                    discounts: [{
                        coupon: coupons.ONETIME_PKG_2,
                    }],
                }
            }else{
                sessionObj={
                    ...sessionObj,
                    line_items: [line_item],
                }

            }

        }else if (freq=='MONTHLY'){
            const line_item={
                price:priceIds.MONTHLY,
                quantity:getQty(),
            }
            let discount = coupons.SUBSCRIPTION_PKG_2_MONTHLY
            if(packageName=='CUSTOM'){
                if (qty<21){
                    throw "Quantity must grater than 21"
                }
                if (qty<101){
                    discount=coupons.SUBSCRIPTION_PKG_3_V1_MONTHLY
                }else {
                    discount=coupons.SUBSCRIPTION_PKG_3_V2_MONTHLY
                }
                sessionObj={
                    ...sessionObj,
                    line_items: [line_item],
                    discounts: [{
                        coupon: discount,
                    }],
                }
            }else if(packageName=='STANDARD') {
                sessionObj={
                    ...sessionObj,
                    line_items: [line_item],
                    discounts: [{
                        coupon: coupons.SUBSCRIPTION_PKG_2_MONTHLY,
                    }],
                }
            }else{
                sessionObj={
                    ...sessionObj,
                    line_items: [line_item],
                }
            }

        }else if (freq=='YEARLY'){
            const line_item={
                price:priceIds.YEARLY,
                quantity:getQty()*12,
            }
            let discount = coupons.SUBSCRIPTION_PKG_1_YEARLY
            if(packageName=='CUSTOM'){
                if (qty<21){
                    throw "Quantity must grater than 21"
                }
                if (qty<101){
                    discount=coupons.SUBSCRIPTION_PKG_3_V1_YEARLY
                }else {
                    discount=coupons.SUBSCRIPTION_PKG_3_V2_YEARLY
                }
            }else if(packageName=='STANDARD') {
                discount=coupons.SUBSCRIPTION_PKG_2_YEARLY
            }
            sessionObj={
                ...sessionObj,
                line_items: [line_item],
                discounts: [{
                    coupon: discount,
                }],
            }

        }else {
            throw 'freq must be ONE, MONTHLY, YEARLY'
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
        'price_1L5CwFDm5VBUQrEut5cxyHmi'
    ).then(response=>res.json({data:response}))
        .catch(err=>res.json({data:err}))
})


app.listen(8000,()=>console.log("running on http://localhost:8000"))
