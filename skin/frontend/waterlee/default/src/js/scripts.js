// Select-wrapper for select elements

jQuery(document).ready(function() {
    jQuery("select").wrap("<div class='select-wrapper'></div>");
    jQuery("select").after("<i class='fa fa-angle-down'></i>");
});
