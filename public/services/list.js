angular.module('MyApp')
  .factory('List', function($resource) {
    return $resource('/api/mylist/:owner'); 
  });
  