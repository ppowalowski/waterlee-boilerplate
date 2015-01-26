
jQuery(document).ready(function() {

  // Select-wrapper for select elements

  jQuery("select").wrap("<div class='select-wrapper'></div>");
  jQuery("select").after("<i class='fa fa-angle-down'></i>");

  //Flexslider

  jQuery(window).load(function() {
    jQuery('.product-flexslider').flexslider({
      animation: "slide",
      slideshow: false,
      maxItems: 2,
      itemWidth: 50
    });
  });

  // Product page / wishlist - quantity increase/decrease
  jQuery(".quantity").append('<i id="add1" class="plus fa fa-plus" />').prepend('<i id="minus1" class="minus fa fa-minus" />');
  jQuery(".quantity .plus").click(function(){
    var currentVal = parseInt(jQuery(this).parent().find(".qty").val());
    if (!currentVal || currentVal=="" || currentVal == "NaN") currentVal = 0;
    jQuery(this).parent().find(".qty").val(currentVal + 1);
  });

  jQuery(".quantity .minus").click(function(){
    var currentVal = parseInt(jQuery(this).parent().find(".qty").val());
    if (currentVal == "NaN") currentVal = 0;
    if (currentVal > 1){
      jQuery(this).parent().find(".qty").val(currentVal - 1);
    }
  });

  //Grid / List view
  jQuery('.view-mode strong.grid').after('<i class="fa fa-th"></i>');
  jQuery('.view-mode strong.list').after('<i class="fa fa-align-justify"></i>');

  jQuery('.view-mode a.list').each(function() {
    if (jQuery(this).text() == 'List')
      jQuery(this).text('');
      jQuery(this).append('<i class="fa fa-align-justify"></i>');
    });

  jQuery('.view-mode a.grid').each(function() {
    if (jQuery(this).text() == 'Grid')
      jQuery(this).text('');
      jQuery(this).append('<i class="fa fa-th"></i>');
  });

  //Top cart
  jQuery(".top--cart").click(function(e) {
    e.stopPropagation();
    jQuery(this).toggleClass('active');
  });
  jQuery(document).click(function() {
    jQuery('.top--cart').removeClass('active');    
  });

});
