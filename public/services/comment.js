angular.module('MyApp')
  .factory('Comment', function($http) {
    return {
      addComment: function(show) {
        return $http.post('/api/comment', 
        									{ showId: show._id, 
        										comment:show.comments.comment, 
        										isPublic:show.comments.isPublic, 
        										publisher:show.comments.publisher});
      }
    };
  });
  