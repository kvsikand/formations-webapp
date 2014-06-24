
//Credit for ngBlur and ngFocus to https://github.com/addyosmani/todomvc/blob/master/architecture-examples/angularjs/js/directives/
app.directive('ngBlur', function() {
  return function( scope, elem, attrs ) {
    elem.bind('blur', function() {
      scope.$apply(attrs.ngBlur);
    });
  };
});

app.directive('ngFocus', function( $timeout ) {
  return function( scope, elem, attrs ) {
    scope.$watch(attrs.ngFocus, function( newval ) {
      if ( newval ) {
        $timeout(function() {
          elem[0].focus();
        }, 0, false);
      }
    });
  };
});


app.animation('.entry', function() {
  console.log('creating anim');
  return {
    enter : function(element, done) {
      console.log('animating');
      jQuery(element).css({
        position:'relative',
        left:-10,
        opacity:0
      });
      jQuery(element).animate({
        left:0,
        opacity:1
      }, done);
    },

    leave : function(element, done) {
      jQuery(element).css({
        position:'relative',
        left:0,
        opacity:1
      });
      jQuery(element).animate({
        left:-10,
        opacity:0
      }, done);
    },

    move : function(element, done) {
      jQuery(element).css({
        opacity:0.5
      });
      jQuery(element).animate({
        opacity:1
      }, done);
    }
  };
});