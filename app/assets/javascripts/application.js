//= require axios
//= require react
//= require react_ujs
//= require components
//= require jquery
//= require jquery_ujs
//= require react-autocomplete
//= require materialize
//= require moment
//= require materialize/extras/nouislider

$(document).ready(function() {
  if ($('.pagination').length) {
    $(window).scroll(function() {
      var url = $('.pagination .next_page').attr('href');
      if (url && $(window).scrollTop() > $(document).height() - $(window).height() - 50) {
        $('.pagination').text("Please Wait...");
        console.log(url, "PAGE URL")
          $.get(`http://localhost:3000${url}`, 'script') 
          return false;
      }
    });
    return $(window).scroll();
  }
});
