var app = angular.module('myApp', []);

app.controller('myCtrl', function ($scope, $http) {
    $scope.dataLoaded = false;
    $scope.insights = {};

    $scope.financialStats = {
        taxRevenue: 'Loading...',
        externalDebt: 'Loading...'
    };



    $scope.getData = function () {
        const latitude = 31.5497; // Lahore latitude
        const longitude = 74.3436; // Lahore longitude
        const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=precipitation_sum&timezone=Asia%2FKarachi`;

        $http.get(apiUrl)
            .then(function (response) {
                const rainfall = response.data.daily.precipitation_sum[0];
                $scope.insights.rainfall_today = rainfall + " mm";
                $scope.dataLoaded = true;
            })
            .catch(function (error) {
                console.error("API error:", error);
                $scope.dataLoaded = true;
            });


        function getLatestValidValue(url, callback) {
            $http.get(url).then(function (response) {
                const records = response.data[1];
                if (records && records.length) {
                    const latestValid = records.find(r => r.value !== null);
                    callback(latestValid ? latestValid.value : null);
                } else {
                    callback(null);
                }
            }, function () {
                callback(null);
            });
        }

        // Tax Revenue (current LCU)
        getLatestValidValue("https://api.worldbank.org/v2/country/PK/indicator/GC.TAX.TOTL.CN?format=json&per_page=5", function (val) {
            $scope.financialStats.taxRevenue = val ? val.toLocaleString() + " PKR" : "Not Available";
        });

        // External Debt (USD)
        getLatestValidValue("https://api.worldbank.org/v2/country/PK/indicator/DT.DOD.DECT.CD?format=json&per_page=5", function (val) {
            $scope.financialStats.externalDebt = val ? "$" + val.toLocaleString() : "Not Available";
        });
        // GDP
        getLatestValidValue("https://api.worldbank.org/v2/country/PK/indicator/NY.GDP.MKTP.CD?format=json&per_page=5", function (val) {
            $scope.financialStats.gdp = val ? "$" + val.toLocaleString() : "Not Available";
        });

        // Population
        getLatestValidValue("https://api.worldbank.org/v2/country/PK/indicator/SP.POP.TOTL?format=json&per_page=5", function (val) {
            $scope.financialStats.population = val ? val.toLocaleString() + " people" : "Not Available";
        });

        // Health Expenditure (% of GDP)
        getLatestValidValue("https://api.worldbank.org/v2/country/PK/indicator/SH.XPD.CHEX.GD.ZS?format=json&per_page=5", function (val) {
            $scope.financialStats.healthExp = val ? val.toFixed(2) + " %" : "Not Available";
        });

        // Military Expenditure (% of GDP)
        getLatestValidValue("https://api.worldbank.org/v2/country/PK/indicator/MS.MIL.XPND.GD.ZS?format=json&per_page=5", function (val) {
            $scope.financialStats.militaryExp = val ? val.toFixed(2) + " %" : "Not Available";
        });


    }

    $scope.financialStats = {
        taxRevenue: 'Loading...',
        externalDebt: 'Loading...'
    };


    $scope.getData();
});
