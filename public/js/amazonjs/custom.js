



$(document).on('click', '#amz-price-update',function(){
	var price_data = [] ;
	alert('press ok') ;
	$(".pr-row").each(function (index) 
	{
      var marketplace = $(this).find(".marketplace").html();
      var sku = $(this).find(".sku").html();
      var price  = $(this).find(".price-amz input").val() ;
      price_data.push({'marketplace': marketplace, 'price': price,'sku':sku}) ;
    });
    /*alert(price_data[0].price) ;
    alert('done') */;

    $.ajax({
    type: "POST",
    url: "/products/update_amazon_price",
    data: {data:price_data},
    success: function(data){
     
   $('.success_msg').html(data);
   setTimeout(function(){
  $('.success_msg').remove();
}, 5000);
   }
   }); 
})

$(document).on('click', '#amz-quantity-update',function(){
	var quantity_data = [] ;
	alert('press ok') ;
	$(".pr-row").each(function (index) 
	{
      var marketplace = $(this).find(".marketplace").html();
      var sku = $(this).find(".sku").html();
      var quantity  = $(this).find(".quantity-amz input").val() ;
      quantity_data.push({'marketplace': marketplace, 'quantity': quantity,'sku':sku}) ;
    });
    //alert(quantity_data[0].quantity) ;
   /* alert('done') */;

    $.ajax({
    type: "POST",
    url: "/products/update_amazon_qty",
    data: {data:quantity_data},
    success: function(data){
     
    $('.success_msg').html(data);
    setTimeout(function(){
  $('.success_msg').remove();
}, 5000);
   }
   });
})