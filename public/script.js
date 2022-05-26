document.getElementById("checkout").addEventListener("click", () => {

  // const item= {
  //   items: [
  //     { id: 1, quantity: 3 },
  //     { id: 2, quantity: 1 },
  //   ],
  // }
    let qty= document.getElementById('number').value
  axios.post("/create-checkout-session",{qty},{
      headers: {
        "Content-Type": "application/json",
      }
      }).then((res) => {
      window.location = res.data.url
    })
    .catch(e => {
      console.error(e.error)
    })
})

document.getElementById("create-product").addEventListener("click",()=>{
  axios.post('product').then(res=>{
    console.log(res.data)
  }).catch(err=>console.error(err))
})
