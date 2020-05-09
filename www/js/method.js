app.factory("Services", function ($http, $q) {
    var header = '';
    return {
        getPakistanCases: function () {
            var deferred = $q.defer();
            $http({
                method: "GET",
                url: "https://fathomless-woodland-40824.herokuapp.com/",
                headers: { "Content-Type": "application/json" }
            }).then(function (response) {
                deferred.resolve(response);
            }).catch(function (response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },
        getRapidPakistanCases: function () {
            var deferred = $q.defer();
            $http({
                method: "GET",
                url: "https://fathomless-woodland-40824.herokuapp.com/pakistan",
                headers: { "Content-Type": "application/json" }
            }).then(function (response) {
                deferred.resolve(response);
            }).catch(function (response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },
            }
});