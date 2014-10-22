app.directive("ngFileSelect",function(){    
  return {
    link: function($scope,el){          
      el.bind("change", function(e){          
        $scope.file = (e.srcElement || e.target).files[0];
        $scope.getFile();
      });          
    }        
  }
});

app.controller('UploadController', function($scope, $rootScope, $http, FormationService, CanvasService, fileReader) {
  $scope.getFile = function () {
    $scope.progress = 0;
    fileReader.readAsText($scope.file, $scope).then(function(result) {
        $scope.importFormations(JSON.parse(result));
     });
  };

  $scope.$on("fileProgress", function(e, progress) {
      $scope.progress = progress.loaded / progress.total;
  });

  $scope.importFormations = function(file) {
    FormationService.formationList = file.formationList;
    FormationService.positionInfo = file.positionInfo;
    FormationService._positionCounter = file.positionInfo.length;
    $rootScope.selectFormation(FormationService.formationList.length-1);
  };

  $scope.exportFormations = function() {
    var jsonObj = {}
    jsonObj.formationList = FormationService.formationList;
    jsonObj.positionInfo = FormationService.positionInfo;
    JSON.stringify(jsonObj);
    $http.post('/export',jsonObj).success(function(data, status, headers) {
       var element = angular.element('<a/>');
       element.attr({
           href: '/export',
           target: '_blank',
           download: 'formations.json'
       })[0].click();
    });
  };

  $scope.downloadVideo = function() {
    var jsonObj = {}
    jsonObj.formationList = FormationService.formationList;
    jsonObj.positionInfo = FormationService.positionInfo;
    JSON.stringify(jsonObj);
    $http.post('/exportVideo',jsonObj).success(function(data, status, headers) {
       var element = angular.element('<a/>');
       element.attr({
           href: '/exportVideo',
           target: '_blank',
           download: 'formations.mp4'
       })[0].click();
    });
  };
});

(function (module) {
     
    var fileReader = function ($q, $log) {
 
        var onLoad = function(reader, deferred, scope) {
            return function () {
                scope.$apply(function () {
                    deferred.resolve(reader.result);
                });
            };
        };
 
        var onError = function (reader, deferred, scope) {
            return function () {
                scope.$apply(function () {
                    deferred.reject(reader.result);
                });
            };
        };
 
        var onProgress = function(reader, scope) {
            return function (event) {
                scope.$broadcast("fileProgress",
                    {
                        total: event.total,
                        loaded: event.loaded
                    });
            };
        };
 
        var getReader = function(deferred, scope) {
            var reader = new FileReader();
            reader.onload = onLoad(reader, deferred, scope);
            reader.onerror = onError(reader, deferred, scope);
            reader.onprogress = onProgress(reader, scope);
            return reader;
        };
 
        var readAsText = function (file, scope) {
            var deferred = $q.defer();
             
            var reader = getReader(deferred, scope);         
            reader.readAsText(file);
             
            return deferred.promise;
        };
 
        return {
            readAsText: readAsText  
        };
    };
 
    module.factory("fileReader",
                   ["$q", "$log", fileReader]);
 
}(angular.module("app")));

