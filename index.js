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
            ONE:{
                BASIC:'price_1L2gJyKfS07LkwswsaYE7z5j',
                STANDARD:'price_1L2gLnKfS07LkwswM0ERACcW',
                CUSTOM:'price_1L4ACkKfS07LkwswvstDfjy7'
            },
            MONTHLY:{
                BASIC:'price_1L3lt7KfS07LkwswBmf5NzYg',
                STANDARD:'price_1L3luIKfS07Lkwswh6ldcYAB' ,
                CUSTOM:'price_1L4AAhKfS07LkwswYLRwiH1r'
            },
            YEARLY:{
                BASIC:'price_1L3m7DKfS07LkwswulkrJUAz',
                STANDARD:'price_1L3m87KfS07Lkwsw4orzSelc' ,
                CUSTOM:'price_1L4AAhKfS07Lkwswy9qjq950'
            }
        }
        const coupons={
            ONE_MONTH:'d8IAwI9T',
            TEN_PERCENTAGE:'G8zr8Z0j',
            TWENTY_PERCENTAGE:'5pF3hQ8F'
        }
        let sessionObj=
        {
            payment_method_types: ["card"],
            mode: freq=='ONE'?'payment':'subscription',
            success_url: `${process.env.CLIENT_URL}/success.html`,
            cancel_url: `${process.env.CLIENT_URL}/cancel.html`,
        }



        if (freq=='ONE'){

            if (packageName=='CUSTOM'){

                let discount = coupons.TEN_PERCENTAGE
                if (qty>50){
                    discount=coupons.TWENTY_PERCENTAGE
                }
                const line_item={
                    price:priceIds[freq][packageName],
                    quantity: qty||1,
                }
                sessionObj={
                    ...sessionObj,
                    line_items: [line_item],
                    discounts: [{
                        coupon: discount,
                    }],
                }

            }else{
                let line_item={
                    price:priceIds[freq][packageName],
                    quantity:qty||1
                }
                sessionObj={
                    ...sessionObj,
                    line_items: [line_item],
                }

            }

        } else{
            let discounts=[]

            if (packageName=='CUSTOM'){
                if (qty<101){
                    discounts.push({
                        coupon: coupons.TEN_PERCENTAGE,
                    })
                }else {
                    discounts.push({
                        coupon: coupons.TWENTY_PERCENTAGE,
                    })
                }
            }else {
                if (freq=='YEARLY'){
                    discounts.push({
                        coupon: coupons.ONE_MONTH,
                    })
                }
            }

            const line_item={
                price:priceIds[freq][packageName],
                quantity:qty||1
            }

            sessionObj={
                ...sessionObj,
                line_items: [line_item],
                discounts: discounts,
            }
        }


        const session = await stripe.checkout.sessions.create(sessionObj)
        res.json({ url: session.url })
        //res.send(req.body)
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

app.get('/',(req, res) => {
    res.send({message:"hello"})
})


app.listen(8000,()=>console.log("running on http://localhost:8000"))
