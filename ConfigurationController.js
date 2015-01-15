
app.service('ConfigurationService', function() {
	doubleClickAdd = false;
});


app.controller('ConfigurationController', function($scope, ConfigurationService) {
	$scope.toggleAdd = function() {
		ConfigurationService.doubleClickAdd = !$scope.doubleClickAdd;
    }
});