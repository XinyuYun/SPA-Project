angular.module('MyApp')
  .controller('DetailCtrl', function($scope, $http, $rootScope, $routeParams, Show, Subscription, Comment) {
      Show.get({ _id: $routeParams.id }, function(show) {
        $scope.show = show;
//				$scope.commentsFilter = {$or[{isPublic: true},{comments.publisher: $rootScope.currentUser.name}]};
        $scope.isSubscribed = function() {
          return $scope.show.subscribers.indexOf($rootScope.currentUser._id) !== -1;
        };

        $scope.subscribe = function() {
          Subscription.subscribe(show).success(function() {
            $scope.show.subscribers.push($rootScope.currentUser._id);
          });
        };

        $scope.unsubscribe = function() {
          Subscription.unsubscribe(show).success(function() {
            var index = $scope.show.subscribers.indexOf($rootScope.currentUser._id);
            $scope.show.subscribers.splice(index, 1);
          });
        };

        $scope.addComment = function(){
        		show.comments.comment = $scope.comment;
        		show.comments.isPublic = $scope.ispublic;
        		show.comments.publisher = $rootScope.currentUser.name;
        		Comment.addComment(show).success(function(){
//        			$scope.show.comments.isPublic = show.comments.isPublic;
//        			$scope.show.comments.comment = show.comments.comment;
//        			$scope.show.comments.publisher = show.comments.publisher;
        			$scope.comment = '';
        			$scope.ispublic = false;
//        			$scope.addForm.$setPristine();
        			console.log(show);
        			Show.get({ _id: $routeParams.id },function(show){
        					$scope.show = show;
        				});
//        			$scope.show.comments.push({show.comments.isPublic, show.comments.comment, show.comments.publisher});
        			});
        		
        	};
      });
    });