var app = angular.module('myApp', []);
app.controller('myCtrl', function($scope, $http,Services) {

    $scope.cases = {};
    $scope.loader = false;
    angular.element(document).ready(function() {

        init();

    });

    $scope.refreshStats = async function(){
        $scope.loader = true;
        try{
            let response = await Services.getRapidPakistanCases();
            if(response.status == 200)
                $scope.cases = response.data.response[0];
            console.log($scope.cases);
            $scope.loader = false;
            $scope.$apply();
           }catch(error){
            $scope.loader = false;
               console.log(error);
           }
    }

       async function init(){
        $scope.loader = true;
           try{
            let response = await Services.getRapidPakistanCases();
            if(response.status == 200)
            $scope.cases = response.data.response[0];
            console.log($scope.cases);
            $scope.loader = false;
            $scope.$apply();
           }catch(error){
            $scope.loader = false;
               console.log(error);
           }
        }

//   $http.get("welcome.htm")
//   .then(function(response) {
//       $scope.myWelcome = response.data;
//   });
});