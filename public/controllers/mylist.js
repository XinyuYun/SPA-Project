angular.module('MyApp')
  .controller('Mylist', function($scope, $http, $rootScope, List) {
/*    $scope.alphabet = ['0-9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
      'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
      'Y', 'Z'];
    $scope.genres = ['Action', 'Adventure', 'Animation', 'Children', 'Comedy',
      'Crime', 'Documentary', 'Drama', 'Family', 'Fantasy', 'Food',
      'Home and Garden', 'Horror', 'Mini-Series', 'Mystery', 'News', 'Reality',
      'Romance', 'Sci-Fi', 'Sport', 'Suspense', 'Talk Show', 'Thriller',
      'Travel'];
     
*/  
		$scope.Title = 'My List';
		List.query({owner: $rootScope.currentUser._id}, function(movies){
				$scope.myMovies = movies;
				console.log(movies);
//    c	nsole.log($scope.myMovies);
 
			});

/*    $scope.filterByGenre = function(genre) {
      $scope.shows = List.query({ genre: genre });
      $scope.Title = genre;
    };
    $scope.filterByAlphabet = function(char) {
      $scope.shows = List.query({ alphabet: char });
      $scope.Title = char;
    };
*/  }); 