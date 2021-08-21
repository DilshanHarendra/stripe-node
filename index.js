const express = require('express')
const app = express()




app.get('/',(req, res) => {
    res.send({message:"hello"})
})


app.listen(8000,()=>console.log("running on 8000"))
